import React from 'react';
import type { Todo, TodoStatus } from '../types/todo';
import { FiCheck, FiEdit2, FiTrash2, FiCalendar, FiTag } from 'react-icons/fi';

interface TodoCardProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: TodoStatus) => void;
}

export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onToggle,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const isCompleted = todo.status === 'completed';

  const priorityColors = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const categoryColors = {
    personal: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    work: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    study: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div
      className={`group relative bg-slate-800/40 border ${
        isCompleted ? 'border-slate-800 opacity-75' : 'border-slate-700/60 hover:border-slate-600'
      } rounded-xl p-5 backdrop-blur-md shadow-md transition-all duration-200 flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggle(todo.id)}
              className={`mt-1 flex items-center justify-center w-5 h-5 rounded-md border transition-all ${
                isCompleted
                  ? 'bg-teal-500 border-teal-500 text-slate-900'
                  : 'border-slate-600 hover:border-teal-400 bg-slate-900/40'
              }`}
            >
              {isCompleted && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
            <div>
              <h3
                className={`font-semibold text-base tracking-wide transition-all ${
                  isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                }`}
              >
                {todo.title}
              </h3>
              {todo.description && (
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{todo.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-md border font-medium uppercase tracking-wider text-[10px] ${
              priorityColors[todo.priority]
            }`}
          >
            {todo.priority}
          </span>

          <span
            className={`px-2 py-0.5 rounded-md border font-medium capitalize flex items-center gap-1 text-[10px] ${
              categoryColors[todo.category || 'personal']
            }`}
          >
            <FiTag className="w-3 h-3" />
            {todo.category || 'personal'}
          </span>

          <select
            value={todo.status}
            onChange={(e) => onStatusChange(todo.id, e.target.value as TodoStatus)}
            className={`px-2 py-0.5 rounded-md border text-xs font-medium bg-slate-900/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500 ${
              statusColors[todo.status]
            }`}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {todo.dueDate && (
            <span className="flex items-center gap-1 text-slate-400">
              <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
              {todo.dueDate}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(todo)}
            className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-md transition-all"
            title="Edit Task"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all"
            title="Delete Task"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
