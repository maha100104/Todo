import React from 'react';
import type { Todo } from '../types/todo';
import { FiList, FiClock, FiCheckCircle, FiLoader } from 'react-icons/fi';

interface TodoStatsProps {
  todos: Todo[];
}

export const TodoStats: React.FC<TodoStatsProps> = ({ todos }) => {
  const total = todos.length;
  const pending = todos.filter((t) => t.status === 'pending').length;
  const inProgress = todos.filter((t) => t.status === 'in_progress').length;
  const completed = todos.filter((t) => t.status === 'completed').length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex items-center space-x-3 backdrop-blur-sm shadow-sm">
          <div className="p-3 bg-slate-700/50 rounded-lg text-slate-300">
            <FiList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Tasks</p>
            <p className="text-xl font-bold text-slate-100">{total}</p>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-amber-500/20 rounded-xl p-4 flex items-center space-x-3 backdrop-blur-sm shadow-sm">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Pending</p>
            <p className="text-xl font-bold text-amber-400">{pending}</p>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-blue-500/20 rounded-xl p-4 flex items-center space-x-3 backdrop-blur-sm shadow-sm">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <FiLoader className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">In Progress</p>
            <p className="text-xl font-bold text-blue-400">{inProgress}</p>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3 backdrop-blur-sm shadow-sm">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Completed</p>
            <p className="text-xl font-bold text-emerald-400">{completed}</p>
          </div>
        </div>
      </div>

      {total > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
          <div className="flex justify-between items-center text-sm font-medium mb-2">
            <span className="text-slate-300">Completion Progress</span>
            <span className="text-teal-400 font-bold">
              {progressPercent}% Completed ({completed}/{total})
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
