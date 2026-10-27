import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Calendar, 
  Tag, 
  MoreVertical, 
  Trash2, 
  X, 
  ArrowRight,
  Filter,
  Layers,
  Building2
} from 'lucide-react';
import { tasksAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TasksPage() {
  const { user } = useAuth();
  const isManagerOrAbove = ['ADMIN', 'HR', 'MANAGER'].includes(user?.role);

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'HIGH',
    category: 'Retention',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [tasksRes, statsRes, empRes] = await Promise.all([
        tasksAPI.getAll(params),
        tasksAPI.getStats(),
        employeesAPI.getAll()
      ]);
      setTasks(tasksRes.data);
      setStats(statsRes.data);
      setEmployees(empRes.data);
      if (empRes.data.length > 0 && !newTask.assigned_to) {
        setNewTask(prev => ({ ...prev, assigned_to: empRes.data[0].id }));
      }
    } catch (err) {
      console.error("Error loading task data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assigned_to || !newTask.due_date) {
      alert("Please fill in all required task fields.");
      return;
    }
    try {
      await tasksAPI.create({
        ...newTask,
        assigned_to: parseInt(newTask.assigned_to, 10)
      });
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        assigned_to: employees[0]?.id || '',
        priority: 'HIGH',
        category: 'Retention',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not create task");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not update task status");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await tasksAPI.delete(taskId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not delete task");
    }
  };

  const columns = [
    { key: 'TODO', label: 'To Do', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'REVIEW', label: 'In Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'COMPLETED', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  ];

  return (
    <div className="w-full px-6 py-5 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <CheckSquare className="w-4 h-4" />
            Module 21 • Workforce Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workflow & Task Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational task assignments, retention workflow tracking, and deadline monitoring.
          </p>
        </div>

        {isManagerOrAbove && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Assign New Task
          </button>
        )}
      </div>

      {/* Task KPI Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Workflows</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total_tasks}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Assigned operations</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-blue-500">In Progress</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.in_progress_count}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active execution</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-500">Under Review</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.review_count}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting verification</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-500">Completed</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed_count}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Goals delivered
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-rose-500">Overdue</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">{stats.overdue_count}</div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Past deadline
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board Columns View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.key);

          return (
            <div key={col.key} className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col min-h-[550px]">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono">({colTasks.length})</span>
                </div>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`bg-white p-4 rounded-xl border transition-shadow shadow-xs hover:shadow-md ${
                        task.is_overdue ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                      }`}
                    >
                      {/* Priority & Category Tag */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                          task.priority === 'URGENT' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          task.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {task.priority}
                        </span>

                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {task.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1.5">{task.title}</h4>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                      )}

                      {/* Meta: Assignee & Due Date */}
                      <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="flex items-center gap-1.5 font-medium">
                            <User className="w-3 h-3 text-slate-400" />
                            {task.assignee_name}
                          </span>
                          <span className="text-[10px] text-slate-400">{task.department_name}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`flex items-center gap-1 font-mono text-[10px] ${
                            task.is_overdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {task.due_date} {task.is_overdue && '• OVERDUE'}
                          </span>

                          {isManagerOrAbove && (
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Transition Action Bar */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                        {task.status !== 'TODO' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'TODO')}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer font-medium"
                          >
                            To Do
                          </button>
                        )}
                        {task.status !== 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                            className="text-[10px] px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer font-medium"
                          >
                            In Progress
                          </button>
                        )}
                        {task.status !== 'REVIEW' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'REVIEW')}
                            className="text-[10px] px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer font-medium"
                          >
                            Review
                          </button>
                        )}
                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                            className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer font-medium flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                Assign Operational Task
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct retention check-in interview"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Provide context, action items, or expected outcomes..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee Employee *</label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.job_title})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Retention">Retention</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
