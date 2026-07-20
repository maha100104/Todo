import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoStatus } from '../types/todo';
import { Navbar } from '../components/Navbar';
import { TodoStats } from '../components/TodoStats';
import { TodoCard } from '../components/TodoCard';
import { TodoModal } from '../components/TodoModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiFilter, FiInbox, FiTag, FiClock, FiAlertTriangle } from 'react-icons/fi';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [showAllDueToday, setShowAllDueToday] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Debounce search query by 400ms to reduce backend database requests while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Fetch filtered todos directly from Database via API
  const fetchFilteredTodos = useCallback(async () => {
    try {
      const response = await api.get('/todos', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          search: debouncedSearchQuery.trim() !== '' ? debouncedSearchQuery.trim() : undefined,
        },
      });
      setTodos(response.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, debouncedSearchQuery]);

  // Fetch all todos for global dashboard statistics
  const fetchAllTodos = async () => {
    try {
      const response = await api.get('/todos');
      setAllTodos(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshData = () => {
    fetchFilteredTodos();
    fetchAllTodos();
  };

  useEffect(() => {
    refreshData();
  }, [fetchFilteredTodos]);

  const handleCreateOrUpdate = async (data: CreateTodoInput | UpdateTodoInput) => {
    try {
      if (editingTodo) {
        await api.patch(`/todos/${editingTodo.id}`, data);
        toast.success('Task updated successfully');
      } else {
        await api.post('/todos', data);
        toast.success('Task created successfully');
      }
      refreshData();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api.patch(`/todos/${id}/toggle`);
      refreshData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleStatusChange = async (id: number, status: TodoStatus) => {
    try {
      await api.patch(`/todos/${id}`, { status });
      toast.success(`Task status updated to ${status.replace('_', ' ')}`);
      refreshData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Open custom Delete Confirmation Modal
  const handleDeleteRequest = (id: number) => {
    const found = allTodos.find((t) => t.id === id) || todos.find((t) => t.id === id);
    if (found) {
      setDeletingTodo(found);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTodo) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/todos/${deletingTodo.id}`);
      toast.success('Task deleted');
      setIsDeleteModalOpen(false);
      setDeletingTodo(null);
      refreshData();
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTodo(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  // Date Calculations for Welcome Banner, Overdue, and Due Today
  const todayDateObj = new Date();
  const todayFormatted = todayDateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const todayYYYYMMDD = todayDateObj.toISOString().split('T')[0];

  const overdueTasks = allTodos.filter(
    (t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayYYYYMMDD
  );

  const dueTodayTasks = allTodos.filter(
    (t) => t.status !== 'completed' && t.dueDate && t.dueDate === todayYYYYMMDD
  );

  const visibleOverdueTasks = showAllOverdue ? overdueTasks : overdueTasks.slice(0, 3);
  const visibleDueTodayTasks = showAllDueToday ? dueTodayTasks : dueTodayTasks.slice(0, 3);

  const formatShortDueDate = (dueDateStr?: string) => {
    if (!dueDateStr) return '';
    const d = new Date(dueDateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col pb-12">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              👋 Welcome, {user?.name || 'User'}
            </h1>
            <p className="text-sm text-slate-300 mt-2 font-semibold">
              Today: {todayFormatted}
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0"></span>
              <span>
                {overdueTasks.length > 0 || dueTodayTasks.length > 0 ? (
                  <>
                    You have <span className="font-bold text-rose-400">{overdueTasks.length} overdue task{overdueTasks.length === 1 ? '' : 's'}</span> and <span className="font-bold text-amber-400">{dueTodayTasks.length} task{dueTodayTasks.length === 1 ? '' : 's'} due today</span>.
                  </>
                ) : (
                  <>You have no overdue tasks and no tasks due today. All caught up!</>
                )}
              </span>
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] shrink-0"
          >
            <FiPlus className="w-5 h-5 stroke-[2.5]" />
            <span>New Task</span>
          </button>
        </div>

        {/* Global Task Statistics Cards */}
        <TodoStats todos={allTodos} />

        {/* 🔴 Overdue Tasks Section */}
        {overdueTasks.length > 0 && (
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 mb-8 backdrop-blur-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                <FiAlertTriangle className="text-rose-400 animate-bounce" />
                Overdue Tasks ({overdueTasks.length})
              </h2>
              {overdueTasks.length > 3 && (
                <button
                  onClick={() => setShowAllOverdue(!showAllOverdue)}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 underline transition-colors"
                >
                  {showAllOverdue ? '[Show Less]' : `[View All Overdue (${overdueTasks.length})]`}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {visibleOverdueTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleOpenEditModal(t)}
                  className="bg-slate-900/80 border border-rose-500/30 hover:border-rose-500/60 rounded-2xl p-4 flex justify-between items-center gap-3 shadow-md hover:shadow-rose-500/10 cursor-pointer transition-all group"
                  title="Click to edit task"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-100 flex items-center gap-1.5 truncate group-hover:text-rose-300 transition-colors">
                      ⚠️ {t.title}
                    </p>
                    <p className="text-xs text-rose-400 font-semibold mt-1">
                      Due: {formatShortDueDate(t.dueDate)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(t);
                    }}
                    className="text-xs bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap capitalize flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    {t.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📅 Due Today Section */}
        {dueTodayTasks.length > 0 && (
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-3xl p-6 mb-8 backdrop-blur-md shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <FiClock className="text-amber-400" />
                Due Today ({dueTodayTasks.length})
              </h2>
              {dueTodayTasks.length > 3 && (
                <button
                  onClick={() => setShowAllDueToday(!showAllDueToday)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline transition-colors"
                >
                  {showAllDueToday ? '[Show Less]' : `[View All Due Today (${dueTodayTasks.length})]`}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {visibleDueTodayTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleOpenEditModal(t)}
                  className="bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-4 flex justify-between items-center gap-3 shadow-md hover:shadow-amber-500/10 cursor-pointer transition-all group"
                  title="Click to edit task"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-100 flex items-center gap-1.5 truncate group-hover:text-amber-300 transition-colors">
                      📌 {t.title}
                    </p>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mt-1">
                      Due Today
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(t);
                    }}
                    className="text-xs bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-amber-200 px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap capitalize flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    {t.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Title for Rest of Tasks */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            Task Management & Filters
          </h2>
        </div>

        {/* Filter and Search Bar with Category Filter & Debounce */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6 backdrop-blur-md flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <FiFilter className="text-teal-400 w-3.5 h-3.5" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-100 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all" className="bg-slate-900">All</option>
                <option value="pending" className="bg-slate-900">Pending</option>
                <option value="in_progress" className="bg-slate-900">In Progress</option>
                <option value="completed" className="bg-slate-900">Completed</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <span>Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-slate-100 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all" className="bg-slate-900">All</option>
                <option value="high" className="bg-slate-900">High</option>
                <option value="medium" className="bg-slate-900">Medium</option>
                <option value="low" className="bg-slate-900">Low</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <FiTag className="text-purple-400 w-3.5 h-3.5" />
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-100 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all" className="bg-slate-900">All</option>
                <option value="personal" className="bg-slate-900">Personal</option>
                <option value="work" className="bg-slate-900">Work</option>
                <option value="study" className="bg-slate-900">Study</option>
              </select>
            </div>
          </div>
        </div>

        {/* Todo Grid / List */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mb-3" />
            <p className="text-sm">Loading tasks from database...</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center my-8">
            <FiInbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-300">No tasks found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                ? 'No matching tasks found in database for the selected filters.'
                : 'Get started by creating your first task!'}
            </p>
            {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && categoryFilter === 'all' && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-xl text-sm font-semibold hover:bg-teal-500/20 transition-all"
              >
                <FiPlus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteRequest}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      <TodoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingTodo}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTodo(null);
        }}
        onConfirm={handleConfirmDelete}
        taskTitle={deletingTodo?.title || ''}
        loading={deletingLoading}
      />
    </div>
  );
};
