import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db/db';
import { todos } from '../schema/schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { eq, and, desc, or, like } from 'drizzle-orm';

@Injectable()
export class TodosService {
  async create(userId: number, createTodoDto: CreateTodoDto) {
    const [result] = await db.insert(todos).values({
      userId,
      title: createTodoDto.title,
      description: createTodoDto.description || '',
      status: createTodoDto.status || 'pending',
      priority: createTodoDto.priority || 'medium',
      category: createTodoDto.category || 'personal',
      dueDate: createTodoDto.dueDate || null,
      isActive: true,
    });

    return {
      message: 'Todo created successfully',
      todoId: result.insertId,
    };
  }

  async findAll(userId: number, status?: string, priority?: string, search?: string, category?: string) {
    const conditions: any[] = [eq(todos.userId, userId), eq(todos.isActive, true)];

    if (status && status !== 'all') {
      conditions.push(eq(todos.status, status as any));
    }

    if (priority && priority !== 'all') {
      conditions.push(eq(todos.priority, priority as any));
    }

    if (search && search.trim() !== '') {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          like(todos.title, pattern),
          like(todos.description, pattern)
        )
      );
    }

    if (category && category !== 'all') {
      conditions.push(eq(todos.category, category as any));
    }

    return await db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(desc(todos.createdAt));
  }

  async findOne(userId: number, id: number) {
    const todoList = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId), eq(todos.isActive, true)));

    if (todoList.length === 0) {
      throw new NotFoundException('Todo not found');
    }

    return todoList[0];
  }

  async update(userId: number, id: number, updateTodoDto: UpdateTodoDto) {
    await this.findOne(userId, id);

    await db
      .update(todos)
      .set({
        ...updateTodoDto,
      })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));

    return {
      message: 'Todo updated successfully',
    };
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);

    await db
      .update(todos)
      .set({ isActive: false })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));

    return {
      message: 'Todo deleted successfully',
    };
  }

  async toggleStatus(userId: number, id: number) {
    const existing = await this.findOne(userId, id);
    const newStatus = existing.status === 'completed' ? 'pending' : 'completed';

    await db
      .update(todos)
      .set({ status: newStatus })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));

    return {
      message: `Todo marked as ${newStatus}`,
      status: newStatus,
    };
  }
}
