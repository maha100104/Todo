export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type TodoStatus = 'pending' | 'in_progress' | 'completed';
export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoCategory = 'personal' | 'work' | 'study';

export interface Todo {
  id: number;
  userId: number;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  category: TodoCategory;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  category?: TodoCategory;
  dueDate?: string;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  category?: TodoCategory;
  dueDate?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}

export interface AccountStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface RecentActivity {
  id: number;
  text: string;
  time: string;
}
