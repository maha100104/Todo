import { Injectable, HttpException, HttpStatus, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../db/db';
import { products, reviews, users } from '../schema/user.schema';
import { count, gt, and, eq, asc, or, like, gte, lte, max, desc } from 'drizzle-orm';

function encodeCursor(id: number): string {
  return Buffer.from(JSON.stringify({ id })).toString('base64');
}

function decodeCursor(cursorStr: string): number {
  try {
    const jsonStr = Buffer.from(cursorStr, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonStr);
    return typeof parsed.id === 'number' ? parsed.id : 0;
  } catch (e) {
    return 0;
  }
}

@Injectable()
export class ProductsService implements OnModuleInit {
  async onModuleInit() {
    try {
      const [countCheck] = await db.select({ value: count() }).from(products);
      if ((countCheck?.value || 0) > 0) {
        console.log('Products table already has data. Skipping seed.');
        return;
      }

      // Seed from DummyJSON
      console.log('Seeding products table from DummyJSON...');
      const response = await fetch('https://dummyjson.com/products?limit=0');
      if (!response.ok) {
        throw new Error('Failed to fetch products from DummyJSON');
      }
      const data = await response.json();
      const items: any[] = data.products || [];

      if (items.length > 0) {
        const productsToInsert = items.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          price: Number(item.price) + 100,
          discountPercentage: Number(item.discountPercentage || 0),
          rating: Number(item.rating || 0),
          stock: Number(item.stock || 0),
          brand: item.brand || null,
          category: item.category,
          thumbnail: item.thumbnail
        }));

        await db.insert(products).values(productsToInsert);
        console.log(`Seeded ${productsToInsert.length} products from DummyJSON successfully!`);
      }
    } catch (error) {
      console.error('Error seeding products:', error);
    }
  }

  async getProducts(
    limitNum: number = 10,
    cursorStr?: string,
    category?: string,
    search?: string,
    minPrice?: number,
    maxPrice?: number,
    showInactive: boolean = false
  ) {
    try {
      // Fallback check to ensure database is seeded
      const [countResult] = await db.select({ value: count() }).from(products);
      const productCount = countResult?.value || 0;
      if (productCount === 0) {
        console.log('Database empty on query, triggering seed...');
        await this.onModuleInit();
      }

      const cursorNum = cursorStr ? decodeCursor(cursorStr) : 0;
      const conditions: any[] = [];

      if (!showInactive) {
        conditions.push(eq(products.isActive, true));
      }

      // Category filter
      if (category && category !== 'all') {
        conditions.push(eq(products.category, category));
      }

      // Search filter
      if (search && search.trim() !== '') {
        const searchPattern = `%${search.trim()}%`;
        conditions.push(
          or(
            like(products.title, searchPattern),
            like(products.brand, searchPattern)
          )
        );
      }

      // Price filter
      if (minPrice !== undefined) {
        conditions.push(gte(products.price, minPrice));
      }
      if (maxPrice !== undefined) {
        conditions.push(lte(products.price, maxPrice));
      }

      // Count total matches for category
      const [totalResult] = await db
        .select({ value: count() })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      const total = totalResult?.value || 0;

      // Query products with cursor-based filtering (id > cursor)
      const queryResults = await db
        .select()
        .from(products)
        .where(
          conditions.length > 0
            ? and(...conditions, gt(products.id, cursorNum))
            : gt(products.id, cursorNum)
        )
        .orderBy(asc(products.id))
        .limit(limitNum);

      const totalPages = Math.ceil(total / limitNum);

      // Precalculate base64 cursors for each page so frontend can jump directly
      const pageCursors: string[] = [encodeCursor(0)];
      for (let i = 1; i < totalPages; i++) {
        const offsetIndex = i * limitNum - 1;
        const [offsetProduct] = await db
          .select({ id: products.id })
          .from(products)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(asc(products.id))
          .limit(1)
          .offset(offsetIndex);
        if (offsetProduct) {
          pageCursors.push(encodeCursor(offsetProduct.id));
        }
      }

      // Determine currentPage based on pageCursors
      let currentPage = 1;
      for (let i = 1; i < pageCursors.length; i++) {
        const pageCursorVal = decodeCursor(pageCursors[i]);
        if (cursorNum >= pageCursorVal) {
          currentPage = i + 1;
        } else {
          break;
        }
      }

      // Set nextCursor to the base64 encoded cursor of the last item in the list
      const lastProduct = queryResults[queryResults.length - 1];
      const nextCursor = lastProduct ? encodeCursor(lastProduct.id) : null;

      return {
        products: queryResults,
        totalCount: total,
        page: currentPage,
        totalPages,
        pageCursors,
        nextCursor,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch products',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getProductById(id: number) {
    try {
      const results = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (results.length === 0) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Fetch real reviews from DB
      const dbReviews = await db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          productId: reviews.productId,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          reviewerName: users.name,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.productId, id))
        .orderBy(desc(reviews.createdAt));

      const formattedDbReviews = dbReviews.map((rev) => ({
        id: rev.id,
        userId: rev.userId,
        reviewerName: rev.reviewerName,
        reviewerAvatar: rev.reviewerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
        rating: rev.rating,
        comment: rev.comment,
        date: rev.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      }));

      // Generate mock reviews
      const mockReviews = this.generateMockReviews(id);

      return {
        product: results[0],
        reviews: [...formattedDbReviews, ...mockReviews]
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to fetch product details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private generateMockReviews(productId: number) {
    const reviewers = [
      { name: 'John Doe', avatar: 'JD' },
      { name: 'Jane Smith', avatar: 'JS' },
      { name: 'Alice Johnson', avatar: 'AJ' },
      { name: 'Bob Wilson', avatar: 'BW' },
      { name: 'Emma Davis', avatar: 'ED' },
      { name: 'Michael Brown', avatar: 'MB' }
    ];

    const comments = [
      'Absolutely love this product! The quality is top notch.',
      'Decent value for the money. Would buy again.',
      'Super fast shipping, but the packaging was slightly damaged.',
      'Exceeded my expectations. Premium feel and design!',
      'Highly recommend it to anyone looking for this kind of product.',
      'Okay product, could be improved in terms of durability.'
    ];

    // Seed reviewers based on product ID to keep them consistent on refreshes
    const reviewCount = 2 + (productId % 3); // 2 to 4 reviews
    const reviewsList: any[] = [];

    for (let i = 0; i < reviewCount; i++) {
      const reviewerIndex = (productId + i) % reviewers.length;
      const commentIndex = (productId * 2 + i) % comments.length;
      const rating = 3 + ((productId + i * 2) % 3); // 3, 4, or 5 stars

      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() - (productId % 10) - i);

      reviewsList.push({
        id: `${productId}-rev-${i}`,
        reviewerName: reviewers[reviewerIndex].name,
        reviewerAvatar: reviewers[reviewerIndex].avatar,
        rating,
        comment: comments[commentIndex],
        date: reviewDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      });
    }

    return reviewsList;
  }

  async createProduct(body: any) {
    const { title, description, price, oldPrice, category, brand, stock, thumbnail, offer } = body;
    if (!title || !description || price === undefined || oldPrice === undefined || !category || !brand || stock === undefined || !thumbnail) {
      throw new BadRequestException('All fields (Name, Description, New Price, Old Price, Category, Brand, Stock, Thumbnail URL) are mandatory');
    }

    const priceNum = Number(price);
    const oldPriceNum = Number(oldPrice);
    const stockNum = Number(stock);

    if (isNaN(priceNum) || priceNum <= 0) {
      throw new BadRequestException('New Price must be a positive number');
    }
    if (isNaN(oldPriceNum) || oldPriceNum <= 0) {
      throw new BadRequestException('Old Price must be a positive number');
    }
    if (oldPriceNum < priceNum) {
      throw new BadRequestException('Old Price must be greater than or equal to New Price');
    }
    if (isNaN(stockNum) || stockNum < 0) {
      throw new BadRequestException('Stock must be a non-negative integer');
    }

    const discountPercentage = oldPriceNum > 0 ? Number((((oldPriceNum - priceNum) / oldPriceNum) * 100).toFixed(2)) : 0;

    const maxIdResult = await db.select({ value: max(products.id) }).from(products);
    const nextId = (maxIdResult[0]?.value ?? 0) + 1;

    await db.insert(products).values({
      id: nextId,
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      discountPercentage,
      rating: 5,
      stock: stockNum,
      brand: brand.trim(),
      category: category.trim().toLowerCase(),
      thumbnail: thumbnail.trim(),
      isActive: true,
      offer: offer ? offer.trim() : null
    });

    return { message: 'Product created successfully', productId: nextId };
  }

  async updateProduct(id: number, body: any) {
    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existing.length === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const { title, description, price, oldPrice, category, brand, stock, thumbnail, isActive, offer } = body;
    if (!title || !description || price === undefined || oldPrice === undefined || !category || !brand || stock === undefined || !thumbnail) {
      throw new BadRequestException('All fields (Name, Description, New Price, Old Price, Category, Brand, Stock, Thumbnail URL) are mandatory');
    }

    const priceNum = Number(price);
    const oldPriceNum = Number(oldPrice);
    const stockNum = Number(stock);

    if (isNaN(priceNum) || priceNum <= 0) {
      throw new BadRequestException('New Price must be a positive number');
    }
    if (isNaN(oldPriceNum) || oldPriceNum <= 0) {
      throw new BadRequestException('Old Price must be a positive number');
    }
    if (oldPriceNum < priceNum) {
      throw new BadRequestException('Old Price must be greater than or equal to New Price');
    }
    if (isNaN(stockNum) || stockNum < 0) {
      throw new BadRequestException('Stock must be a non-negative integer');
    }

    const discountPercentage = oldPriceNum > 0 ? Number((((oldPriceNum - priceNum) / oldPriceNum) * 100).toFixed(2)) : 0;

    await db.update(products)
      .set({
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        discountPercentage,
        stock: stockNum,
        brand: brand.trim(),
        category: category.trim().toLowerCase(),
        thumbnail: thumbnail.trim(),
        isActive: isActive === undefined ? true : !!isActive,
        offer: offer ? offer.trim() : null
      })
      .where(eq(products.id, id));

    return { message: 'Product updated successfully', productId: id };
  }

  async removeProduct(id: number) {
    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existing.length === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await db.update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));

    return { message: 'Product deactivated successfully', productId: id };
  }
}
