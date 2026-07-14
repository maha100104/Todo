import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { StoreLayout } from '../components/StoreLayout';
import { showToast } from '../utils/toast';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes, FaToggleOn, FaToggleOff } from 'react-icons/fa';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  isActive: boolean;
  offer?: string;
}

interface ProductForm {
  title: string;
  description: string;
  price: string;
  oldPrice: string;
  category: string;
  brand: string;
  stock: string;
  thumbnail: string;
  isActive: boolean;
  offer: string;
}

export const AdminProductsPage: React.FC = () => {
  const { user, loading, fetchWithAuth } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageCursors, setPageCursors] = useState<string[]>(['']);
  const limit = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<ProductForm>({
    title: '',
    description: '',
    price: '',
    oldPrice: '',
    category: '',
    brand: '',
    stock: '',
    thumbnail: '',
    isActive: true,
    offer: '',
  });

  // Delete confirmation states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [deletingProductName, setDeletingProductName] = useState('');

  // Search input debouncer
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInputValue);
      setPage(1);
      setPageCursors(['']);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchInputValue]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoadingProducts(true);
    try {
      const cursor = page === 1 ? '' : (pageCursors[page - 1] || '');
      let url = `/products?limit=${limit}&showInactive=true`;
      if (cursor && cursor.trim() !== '') {
        url += `&cursor=${cursor}`;
      }
      if (searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      if (data.pageCursors) {
        setPageCursors(data.pageCursors);
      }
    } catch (err: any) {
      console.error(err);
      showToast.error(err.message || 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user, page, searchQuery]);

  // Route protection
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-app)]">
        <div className="w-6 h-6 border-2 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Helpers
  const handleOpenAddModal = () => {
    setModalType('add');
    setEditingProductId(null);
    setFormValues({
      title: '',
      description: '',
      price: '',
      oldPrice: '',
      category: '',
      brand: '',
      stock: '',
      thumbnail: '',
      isActive: true,
      offer: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setModalType('edit');
    setEditingProductId(product.id);
    
    // Calculate old price from discount percentage
    const disc = product.discountPercentage || 0;
    const oldPriceCalc = disc > 0 ? (product.price / (1 - disc / 100)).toFixed(2) : product.price.toString();

    setFormValues({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      oldPrice: oldPriceCalc,
      category: product.category,
      brand: product.brand || '',
      stock: product.stock.toString(),
      thumbnail: product.thumbnail || '',
      isActive: product.isActive,
      offer: product.offer || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteConfirm = (product: Product) => {
    setDeletingProductId(product.id);
    setDeletingProductName(product.title);
    setIsDeleteConfirmOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleActive = () => {
    setFormValues(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  // Submit operations
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory fields check
    const { title, description, price, oldPrice, category, brand, stock, thumbnail } = formValues;
    if (
      !title.trim() ||
      !description.trim() ||
      !price.trim() ||
      !oldPrice.trim() ||
      !category.trim() ||
      !brand.trim() ||
      !stock.trim() ||
      !thumbnail.trim()
    ) {
      showToast.error('All fields are mandatory. Please fill in all details.');
      return;
    }

    // Number validations
    const priceNum = parseFloat(price);
    const oldPriceNum = parseFloat(oldPrice);
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      showToast.error('New Price must be a positive number');
      return;
    }
    if (isNaN(oldPriceNum) || oldPriceNum <= 0) {
      showToast.error('Old Price must be a positive number');
      return;
    }
    if (oldPriceNum < priceNum) {
      showToast.error('Old Price must be greater than or equal to New Price');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      showToast.error('Stock must be a non-negative integer');
      return;
    }

    try {
      const { title, description, category, brand, thumbnail, isActive, offer } = formValues;
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        oldPrice: oldPriceNum,
        category: category.trim().toLowerCase(),
        brand: brand.trim(),
        stock: stockNum,
        thumbnail: thumbnail.trim(),
        isActive,
        offer: offer.trim() || null
      };

      let res;
      if (modalType === 'add') {
        res = await fetchWithAuth('/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetchWithAuth(`/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      showToast.success(modalType === 'add' ? 'Product added successfully!' : 'Product updated successfully!');
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      showToast.error(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    try {
      const res = await fetchWithAuth(`/products/${deletingProductId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete product');
      }
      showToast.success('Product removed (set to inactive) successfully!');
      setIsDeleteConfirmOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      showToast.error(err.message || 'Failed to remove product');
    }
  };

  return (
    <StoreLayout pageTitle="Product Management">
      <div className="p-6 text-[var(--text-main)]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--primary)] mb-1">Product Management</h1>
            <p className="text-xs text-[var(--text-muted)]">Add, update, deactivate, and manage shop catalog products</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                placeholder="Search by title or brand..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
              />
            </div>
            <button
              className="inline-flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-slate-900 px-4 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all"
              onClick={handleOpenAddModal}
            >
              <FaPlus /> Add Product
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loadingProducts && products.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-lg py-16 px-4 text-center text-[var(--text-muted)]">
            No products found matching the criteria.
          </div>
        ) : (
          <>
            {/* Products Table */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-x-auto shadow-sm">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-white/2 border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Product</th>
                    <th className="px-5 py-4 font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Category</th>
                    <th className="px-5 py-4 font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Price</th>
                    <th className="px-5 py-4 font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Stock</th>
                    <th className="px-5 py-4 font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-5 py-4 font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const disc = product.discountPercentage || 0;
                    const oldPrice = disc > 0 ? (product.price / (1 - disc / 100)) : product.price;

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-[var(--border-color)] last:border-0 hover:bg-white/1"
                        style={{ opacity: product.isActive ? 1 : 0.6 }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.thumbnail || 'https://via.placeholder.com/150'}
                              alt={product.title}
                              className="w-12 h-12 rounded-md object-cover bg-[var(--bg-app)] border border-[var(--border-color)]"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/150';
                              }}
                            />
                            <div>
                              <div className="font-semibold text-[var(--text-main)] text-sm">{product.title}</div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-[var(--text-muted)]">{product.brand || 'No Brand'}</span>
                                {product.offer && (
                                  <span className="inline-block px-1.5 py-0.5 bg-[var(--primary-glow)] text-[var(--primary)] rounded text-[9px] font-semibold">
                                    ★ {product.offer}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block px-2 py-0.5 bg-white/5 rounded text-[10px] capitalize text-[var(--text-light)]">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <span className="font-semibold text-[var(--primary)] text-sm">₹{product.price.toFixed(2)}</span>
                            {disc > 0 && (
                              <div className="text-[10px] text-[var(--text-muted)] line-through">
                                ₹{oldPrice.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-semibold ${product.stock <= 5 ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                            {product.stock} left
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            product.isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="inline-flex items-center justify-center w-8 h-8 rounded border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-glow)] transition-all cursor-pointer"
                              title="Edit Details"
                              onClick={() => handleOpenEditModal(product)}
                            >
                              <FaEdit />
                            </button>
                            {product.isActive && (
                              <button
                                className="inline-flex items-center justify-center w-8 h-8 rounded border border-[var(--border-color)] text-[var(--text-muted)] hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                                title="Deactivate Product"
                                onClick={() => handleOpenDeleteConfirm(product)}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
                <div className="text-xs text-[var(--text-muted)]">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md text-xs font-medium text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md text-xs font-medium text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal: Add/Edit Product */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-white/1">
                <h2 className="text-base font-semibold text-[var(--primary)]">
                  {modalType === 'add' ? 'Add New Product' : 'Edit Product Details'}
                </h2>
                <button
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-lg cursor-pointer"
                  onClick={() => setIsModalOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSubmitProduct}>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Product Title *</label>
                    <input
                      type="text"
                      name="title"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                      placeholder="e.g. Essence Mascara Lash Princess"
                      value={formValues.title}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Description *</label>
                    <textarea
                      name="description"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                      rows={3}
                      placeholder="Enter detailed description of the product..."
                      style={{ resize: 'vertical' }}
                      value={formValues.description}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">New Selling Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="price"
                        className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                        placeholder="e.g. 299"
                        value={formValues.price}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Old Original Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="oldPrice"
                        className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                        placeholder="e.g. 399"
                        value={formValues.oldPrice}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category *</label>
                      <input
                        type="text"
                        name="category"
                        className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                        placeholder="e.g. beauty, fragrances"
                        value={formValues.category}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Brand *</label>
                      <input
                        type="text"
                        name="brand"
                        className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                        placeholder="e.g. L'Oreal, Chanel"
                        value={formValues.brand}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Stock Quantity *</label>
                      <input
                        type="number"
                        name="stock"
                        className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                        placeholder="e.g. 50"
                        value={formValues.stock}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    {modalType === 'edit' && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</label>
                        <div
                          className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md cursor-pointer select-none"
                          onClick={handleToggleActive}
                        >
                          <span className="text-xs font-medium">{formValues.isActive ? 'Active (Visible)' : 'Inactive (Hidden)'}</span>
                          {formValues.isActive ? (
                            <FaToggleOn className="text-emerald-500 text-2xl" />
                          ) : (
                            <FaToggleOff className="text-red-500 text-2xl" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Custom Offer / Promo Text (Optional)</label>
                    <input
                      type="text"
                      name="offer"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                      placeholder="e.g. Buy 1 Get 1 Free, Flat 25% Off"
                      value={formValues.offer}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Thumbnail URL *</label>
                    <input
                      type="url"
                      name="thumbnail"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all"
                      placeholder="https://example.com/image.jpg"
                      value={formValues.thumbnail}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-3 bg-white/1">
                  <button
                    type="button"
                    className="px-4 py-2 border border-[var(--border-color)] rounded-md text-xs font-semibold text-[var(--text-main)] hover:bg-white/5 cursor-pointer transition-all"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-slate-900 rounded-md text-xs font-semibold cursor-pointer transition-all"
                  >
                    {modalType === 'add' ? 'Add Product' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete/Deactivate Confirmation */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-white/1">
                <h2 className="text-base font-semibold text-red-500">Deactivate Product</h2>
                <button
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-lg cursor-pointer"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-xs text-[var(--text-main)] leading-relaxed">
                  Are you sure you want to deactivate <strong>{deletingProductName}</strong>?
                </p>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                  Deactivating this product sets its status to inactive, which means it will be hidden from the storefront catalog for all normal users.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-3 bg-white/1">
                <button
                  type="button"
                  className="px-4 py-2 border border-[var(--border-color)] rounded-md text-xs font-semibold text-[var(--text-main)] hover:bg-white/5 cursor-pointer transition-all"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-semibold cursor-pointer transition-all"
                  onClick={handleDeleteProduct}
                >
                  Yes, Deactivate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
};

