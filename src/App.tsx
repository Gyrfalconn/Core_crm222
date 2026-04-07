import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  Plus,
  MoreVertical,
  TrendingUp,
  DollarSign,
  UserPlus,
  Target,
  Sparkles,
  ChevronRight,
  Mail,
  Phone,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { cn } from './lib/utils';
import { Contact, Deal, Task, Stats, Notification, UserSettings } from './types';
import { getLeadInsights } from './services/gemini';
import { exportToExcel, exportToPDF } from './lib/export';
import { format, differenceInDays, parseISO } from 'date-fns';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, primaryColor = 'emerald', theme = 'light' }: { icon: any, label: string, active?: boolean, onClick: () => void, primaryColor?: string, theme?: string }) => {
  const activeColors = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-700"
  };

  const activeDarkColors = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    violet: "bg-violet-500/10 text-violet-400",
    rose: "bg-rose-500/10 text-rose-400"
  };

  const iconColors = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    violet: "text-violet-600",
    rose: "text-rose-600"
  };

  const iconDarkColors = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    violet: "text-violet-400",
    rose: "text-rose-400"
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg group",
        active 
          ? (theme === 'dark' ? activeDarkColors[primaryColor as keyof typeof activeDarkColors] : activeColors[primaryColor as keyof typeof activeColors])
          : (theme === 'dark' ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
      )}
    >
      <Icon className={cn(
        "w-5 h-5", 
        active 
          ? (theme === 'dark' ? iconDarkColors[primaryColor as keyof typeof iconDarkColors] : iconColors[primaryColor as keyof typeof iconColors])
          : "text-slate-400 group-hover:text-slate-600"
      )} />
      {label}
    </button>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, color, theme = 'light' }: { label: string, value: string | number, icon: any, trend?: string, color: string, theme?: string }) => (
  <div className={cn(
    "p-6 border rounded-2xl shadow-sm transition-colors",
    theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
  )}>
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          theme === 'dark' ? "text-emerald-400 bg-emerald-500/10" : "text-emerald-600 bg-emerald-50"
        )}>
          {trend}
        </span>
      )}
    </div>
    <div className={cn("text-2xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, theme = 'light' }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, theme?: string }) => (
  <AnimatePresence>
    {isOpen && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "rounded-2xl shadow-xl w-full max-w-md overflow-hidden",
            theme === 'dark' ? "bg-slate-900 border border-slate-800" : "bg-white"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={cn("px-6 py-4 border-b flex items-center justify-between", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
            <h3 className={cn("font-semibold", theme === 'dark' ? "text-white" : "text-slate-900")}>{title}</h3>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const TaskView = ({ openModalOnMount, onModalClose, settings }: { openModalOnMount?: boolean, onModalClose?: () => void, settings: UserSettings }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_date: '', priority: 'Medium' });

  const theme = settings.theme;
  const compact = settings.compactMode;

  useEffect(() => {
    if (openModalOnMount) {
      setIsModalOpen(true);
      onModalClose?.();
    }
  }, [openModalOnMount]);

  const fetchTasks = () => fetch('/api/tasks').then(res => res.json()).then(setTasks);
  useEffect(() => { fetchTasks(); }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    setIsModalOpen(false);
    fetchTasks();
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchTasks();
  };

  const handleExportExcel = () => {
    const exportData = tasks.map(t => ({
      Title: t.title,
      'Due Date': t.due_date,
      Priority: t.priority,
      Status: t.status
    }));
    exportToExcel(exportData, 'Tasks_Export');
  };

  const handleExportPDF = () => {
    const exportData = tasks.map(t => ({
      title: t.title,
      due: t.due_date,
      priority: t.priority,
      status: t.status
    }));
    exportToPDF(exportData, ['title', 'due', 'priority', 'status'], 'Tasks_Export', 'Core CRM - Task List');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-slate-900">Tasks</h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleExportExcel}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExportPDF}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
              title="Export to PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className={cn(
        "border rounded-2xl shadow-sm overflow-hidden transition-colors",
        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className={cn("divide-y", theme === 'dark' ? "divide-slate-800" : "divide-slate-100")}>
          {tasks.map(task => (
            <div key={task.id} className={cn(
              "flex items-center gap-4 transition-colors",
              compact ? "p-2" : "p-4",
              theme === 'dark' ? "hover:bg-slate-800" : "hover:bg-slate-50"
            )}>
              <button 
                onClick={() => toggleTaskStatus(task)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  task.status === 'Completed' ? "bg-emerald-500 border-emerald-500 text-white" : (theme === 'dark' ? "border-slate-700" : "border-slate-200")
                )}
              >
                {task.status === 'Completed' && <CheckSquare className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <div className={cn(
                  "font-medium flex items-center gap-2", 
                  compact ? "text-xs" : "text-sm",
                  task.status === 'Completed' ? "text-slate-500 line-through" : (theme === 'dark' ? "text-slate-200" : "text-slate-900")
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    task.priority === 'High' ? "bg-rose-500" :
                    task.priority === 'Medium' ? "bg-amber-500" :
                    "bg-emerald-500"
                  )} />
                  {task.title}
                </div>
                <div className="text-[10px] text-slate-500">Due: {task.due_date}</div>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                task.priority === 'High' ? "bg-rose-100 text-rose-700" :
                task.priority === 'Medium' ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              )}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Task" theme={theme}>
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Task Title</label>
            <input 
              required
              className={cn(
                "w-full px-4 py-2 border-none rounded-xl text-sm transition-all",
                theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900"
              )}
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Due Date</label>
              <input 
                type="date"
                required
                className={cn(
                  "w-full px-4 py-2 border-none rounded-xl text-sm transition-all",
                  theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900"
                )}
                value={newTask.due_date}
                onChange={e => setNewTask({...newTask, due_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Priority</label>
              <select 
                className={cn(
                  "w-full px-4 py-2 border-none rounded-xl text-sm transition-all",
                  theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900"
                )}
                value={newTask.priority}
                onChange={e => setNewTask({...newTask, priority: e.target.value})}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
          <button type="submit" className={cn(
            "w-full py-3 text-white rounded-xl font-semibold mt-4",
            settings.primaryColor === 'emerald' ? "bg-emerald-600" :
            settings.primaryColor === 'blue' ? "bg-blue-600" :
            settings.primaryColor === 'violet' ? "bg-violet-600" : "bg-rose-600"
          )}>Create Task</button>
        </form>
      </Modal>
    </div>
  );
};

const AnalyticsView = ({ settings }: { settings: UserSettings }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const currencySymbol = settings.currency === 'Indian Rupee (₹)' ? '₹' : '$';
  const locale = settings.currency === 'Indian Rupee (₹)' ? 'en-IN' : 'en-US';
  const theme = settings.theme;

  useEffect(() => {
    fetch('/api/deals')
      .then(res => res.json())
      .then(data => {
        setDeals(data);
        setLoading(false);
      });
  }, []);

  const data = [
    { name: 'Week 1', won: 4000, lost: 2400 },
    { name: 'Week 2', won: 3000, lost: 1398 },
    { name: 'Week 3', won: 2000, lost: 9800 },
    { name: 'Week 4', won: 2780, lost: 3908 },
  ];

  const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'];
  const stageValueData = stages.map(stage => ({
    name: stage,
    value: deals.filter(d => d.stage === stage).reduce((sum, d) => sum + (d.value || 0), 0)
  })).filter(item => item.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      <h3 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>Analytics</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cn(
          "p-6 border rounded-2xl shadow-sm transition-colors",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-6">Win vs Loss Ratio</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={theme === 'dark' ? { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' } : { borderRadius: '12px', border: 'none' }}
                />
                <Bar dataKey="won" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "p-6 border rounded-2xl shadow-sm transition-colors",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-6">Pipeline Value by Stage</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageValueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stageValueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={theme === 'dark' ? { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' } : { borderRadius: '12px', border: 'none' }}
                  formatter={(value: number) => `${currencySymbol}${value.toLocaleString(locale)}`}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "p-6 border rounded-2xl shadow-sm lg:col-span-2 transition-colors",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-6">Stage Distribution (Count)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stages.slice(0, 4).map(stage => {
              const count = deals.filter(d => d.stage === stage).length;
              const total = deals.length || 1;
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600">{stage}</span>
                    <span className={theme === 'dark' ? "text-slate-200" : "text-slate-900"}>{percentage}%</span>
                  </div>
                  <div className={cn("w-full h-2 rounded-full overflow-hidden", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")}>
                    <div className={cn(
                      "h-full rounded-full",
                      settings.primaryColor === 'emerald' ? "bg-emerald-500" :
                      settings.primaryColor === 'blue' ? "bg-blue-500" :
                      settings.primaryColor === 'violet' ? "bg-violet-500" : "bg-rose-500"
                    )} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ settings, onSave }: { settings: UserSettings, onSave: (newSettings: UserSettings) => void }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onSave(localSettings);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-4xl relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl z-[120] flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <h3 className={cn("text-xl font-bold", settings.theme === 'dark' ? "text-white" : "text-slate-900")}>Settings</h3>
      
        <div className={cn(
          "border rounded-2xl shadow-sm divide-y transition-colors",
          settings.theme === 'dark' ? "bg-slate-900 border-slate-800 divide-slate-800" : "bg-white border-slate-200 divide-slate-100"
        )}>
          <div className="p-6">
            <h4 className={cn("text-sm font-bold mb-4", settings.theme === 'dark' ? "text-white" : "text-slate-900")}>Profile Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <input 
                  className={cn(
                    "w-full px-4 py-2 border-none rounded-xl text-sm transition-all",
                    settings.theme === 'dark' ? "bg-slate-800 text-white focus:ring-emerald-500/40" : "bg-slate-50 text-slate-900 focus:ring-emerald-500/20"
                  )}
                  value={localSettings.fullName}
                  onChange={e => setLocalSettings({...localSettings, fullName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                <input 
                  className={cn(
                    "w-full px-4 py-2 border-none rounded-xl text-sm transition-all",
                    settings.theme === 'dark' ? "bg-slate-800 text-white focus:ring-emerald-500/40" : "bg-slate-50 text-slate-900 focus:ring-emerald-500/20"
                  )}
                  value={localSettings.email}
                  onChange={e => setLocalSettings({...localSettings, email: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            <h4 className={cn("text-sm font-bold mb-4", settings.theme === 'dark' ? "text-white" : "text-slate-900")}>Localization</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Currency</label>
                <select 
                  className={cn(
                    "w-full px-4 py-2 border-none rounded-xl text-sm transition-all",
                    settings.theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900"
                  )}
                  value={localSettings.currency}
                  onChange={e => setLocalSettings({...localSettings, currency: e.target.value as any})}
                >
                  <option>Indian Rupee (₹)</option>
                  <option>US Dollar ($)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Timezone</label>
                <select 
                  className={cn(
                    "w-full px-4 py-2 border-none rounded-xl text-sm transition-all",
                    settings.theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900"
                  )}
                  value={localSettings.timezone}
                  onChange={e => setLocalSettings({...localSettings, timezone: e.target.value})}
                >
                  <option>(GMT+05:30) India Standard Time</option>
                  <option>(GMT-08:00) Pacific Time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h4 className={cn("text-sm font-bold mb-4", settings.theme === 'dark' ? "text-white" : "text-slate-900")}>Appearance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Theme</label>
                <div className="flex gap-2">
                  {['light', 'dark'].map(t => (
                    <button
                      key={t}
                      onClick={() => setLocalSettings({...localSettings, theme: t as any})}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all border",
                        localSettings.theme === t 
                          ? "bg-emerald-600 border-emerald-600 text-white" 
                          : (settings.theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600")
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Primary Color</label>
                <div className="flex gap-2">
                  {(['emerald', 'blue', 'violet', 'rose'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setLocalSettings({...localSettings, primaryColor: c})}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all border-2",
                        c === 'emerald' ? "bg-emerald-500" : c === 'blue' ? "bg-blue-500" : c === 'violet' ? "bg-violet-500" : "bg-rose-500",
                        localSettings.primaryColor === c 
                          ? (settings.theme === 'dark' ? "border-slate-400 scale-110 shadow-lg" : "border-white scale-110 shadow-lg") 
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className={cn("text-sm font-bold", settings.theme === 'dark' ? "text-white" : "text-slate-900")}>Compact Mode</h4>
                <p className="text-xs text-slate-500">Reduce padding and font sizes across the app</p>
              </div>
              <button 
                onClick={() => setLocalSettings({...localSettings, compactMode: !localSettings.compactMode})}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-200",
                  localSettings.compactMode ? "bg-emerald-500" : "bg-slate-200"
                )}
              >
                <motion.div 
                  animate={{ x: localSettings.compactMode ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className={cn("text-sm font-bold", settings.theme === 'dark' ? "text-white" : "text-slate-900")}>AI Insights</h4>
                <p className="text-xs text-slate-500">Enable Gemini-powered lead analysis</p>
              </div>
              <button 
                onClick={() => setLocalSettings({...localSettings, aiInsights: !localSettings.aiInsights})}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-200",
                  localSettings.aiInsights ? "bg-emerald-500" : "bg-slate-200"
                )}
              >
                <motion.div 
                  animate={{ x: localSettings.aiInsights ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                />
              </button>
            </div>
          </div>
        </div>

      <div className="flex justify-end gap-3">
        <button 
          className="px-6 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
          onClick={() => setLocalSettings(settings)}
        >
          Cancel
        </button>
        <button 
          disabled={isSaving}
          onClick={handleSave}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all flex items-center gap-2",
            isSaving ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

const DashboardView = ({ stats, settings }: { stats: Stats | null, settings: UserSettings }) => {
  const currencySymbol = settings.currency === 'Indian Rupee (₹)' ? '₹' : '$';
  const locale = settings.currency === 'Indian Rupee (₹)' ? 'en-IN' : 'en-US';
  const theme = settings.theme;

  const data = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Pipeline Value" 
          value={`${currencySymbol}${(stats?.pipelineValue || 0).toLocaleString(locale)}`} 
          icon={DollarSign} 
          trend="+12.5%" 
          color={settings.primaryColor === 'emerald' ? "bg-emerald-500" : settings.primaryColor === 'blue' ? "bg-blue-500" : settings.primaryColor === 'violet' ? "bg-violet-500" : "bg-rose-500"}
          theme={theme}
        />
        <StatCard 
          label="Active Deals" 
          value={stats?.activeDeals || 0} 
          icon={Target} 
          trend="+3" 
          color="bg-blue-500"
          theme={theme}
        />
        <StatCard 
          label="New Leads" 
          value={stats?.newLeads || 0} 
          icon={UserPlus} 
          trend="+8%" 
          color="bg-violet-500"
          theme={theme}
        />
        <StatCard 
          label="Win Rate" 
          value={`${stats?.winRate}%`} 
          icon={TrendingUp} 
          color="bg-amber-500"
          theme={theme}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={cn(
          "p-6 border rounded-2xl shadow-sm lg:col-span-2 transition-colors",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={cn("text-lg font-semibold", theme === 'dark' ? "text-white" : "text-slate-900")}>Revenue Forecast</h3>
            <select className={cn(
              "text-sm border-none rounded-lg px-3 py-1 focus:ring-0",
              theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-600"
            )}>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={settings.primaryColor === 'emerald' ? "#10b981" : settings.primaryColor === 'blue' ? "#3b82f6" : settings.primaryColor === 'violet' ? "#8b5cf6" : "#f43f5e"} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={settings.primaryColor === 'emerald' ? "#10b981" : settings.primaryColor === 'blue' ? "#3b82f6" : settings.primaryColor === 'violet' ? "#8b5cf6" : "#f43f5e"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={theme === 'dark' ? { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' } : { borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke={settings.primaryColor === 'emerald' ? "#10b981" : settings.primaryColor === 'blue' ? "#3b82f6" : settings.primaryColor === 'violet' ? "#8b5cf6" : "#f43f5e"} strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "p-6 border rounded-2xl shadow-sm transition-colors",
          theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={cn("text-lg font-semibold", theme === 'dark' ? "text-white" : "text-slate-900")}>AI Insights</h3>
            <Sparkles className={cn(
              "w-5 h-5",
              settings.primaryColor === 'emerald' ? "text-emerald-500" : settings.primaryColor === 'blue' ? "text-blue-500" : settings.primaryColor === 'violet' ? "text-violet-500" : "text-rose-500"
            )} />
          </div>
          <div className="space-y-4">
            <div className={cn(
              "p-4 rounded-xl border transition-colors",
              theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100" : "bg-emerald-50 border-emerald-100 text-emerald-900"
            )}>
              <p className="text-sm leading-relaxed">
                <span className="font-bold">Reliance Industries</span> deal is showing high intent. Their team visited the pricing page 4 times today.
              </p>
              <button className={cn(
                "mt-3 text-xs font-semibold flex items-center gap-1",
                theme === 'dark' ? "text-emerald-400" : "text-emerald-700"
              )}>
                Draft Follow-up <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className={cn(
              "p-4 rounded-xl border transition-colors",
              theme === 'dark' ? "bg-blue-500/10 border-blue-500/20 text-blue-100" : "bg-blue-50 border-blue-100 text-blue-900"
            )}>
              <p className="text-sm leading-relaxed">
                Pipeline health is <span className="font-bold">excellent</span>. You're on track to exceed Q1 targets by 15%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactsView = ({ searchQuery, openModalOnMount, onModalClose, settings }: { searchQuery: string, openModalOnMount?: boolean, onModalClose?: () => void, settings: UserSettings }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', company: '', status: 'Lead', value: 0 });

  const currencySymbol = settings.currency === 'Indian Rupee (₹)' ? '₹' : '$';
  const locale = settings.currency === 'Indian Rupee (₹)' ? 'en-IN' : 'en-US';
  const theme = settings.theme;
  const compact = settings.compactMode;

  useEffect(() => {
    if (openModalOnMount) {
      setIsModalOpen(true);
      onModalClose?.();
    }
  }, [openModalOnMount]);

  const fetchContacts = () => fetch('/api/contacts').then(res => res.json()).then(data => {
    setContacts(data);
    setLoading(false);
  });

  useEffect(() => { fetchContacts(); }, []);

  const filteredContacts = (contacts || []).filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact)
    });
    setIsModalOpen(false);
    fetchContacts();
  };

  const handleContactClick = async (contact: Contact) => {
    setSelectedContact(contact);
    setInsight("Generating AI insights...");
    const aiInsight = await getLeadInsights(contact.name, contact.company, contact.status);
    setInsight(aiInsight || "No insights available.");
  };

  const handleExportExcel = () => {
    const exportData = filteredContacts.map(c => ({
      Name: c.name,
      Email: c.email,
      Company: c.company,
      Status: c.status,
      Value: `${currencySymbol}${c.value.toLocaleString(locale)}`
    }));
    exportToExcel(exportData, 'Contacts_Export');
  };

  const handleExportPDF = () => {
    const exportData = filteredContacts.map(c => ({
      name: c.name,
      email: c.email,
      company: c.company,
      status: c.status,
      value: `${currencySymbol}${c.value.toLocaleString(locale)}`
    }));
    exportToPDF(exportData, ['name', 'email', 'company', 'status', 'value'], 'Contacts_Export', 'Core CRM - Contacts List');
  };

  return (
    <div className="flex gap-6 h-full">
      <div className={cn(
        "border rounded-2xl shadow-sm overflow-hidden flex-1 transition-all", 
        selectedContact ? "w-2/3" : "w-full",
        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className={cn("p-4 border-b flex items-center justify-between", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
          <div className="flex items-center gap-4">
            <h3 className={cn("font-semibold", theme === 'dark' ? "text-white" : "text-slate-900")}>Contacts</h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleExportExcel}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                title="Export to Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button 
                onClick={handleExportPDF}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                title="Export to PDF"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "p-2 hover:bg-slate-50 rounded-lg",
              settings.primaryColor === 'emerald' ? "text-emerald-600" : settings.primaryColor === 'blue' ? "text-blue-600" : settings.primaryColor === 'violet' ? "text-violet-600" : "text-rose-600"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={theme === 'dark' ? "bg-slate-800/50" : "bg-slate-50/50"}>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", theme === 'dark' ? "divide-slate-800" : "divide-slate-100")}>
              {filteredContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  onClick={() => handleContactClick(contact)}
                  className={cn(
                    "cursor-pointer transition-colors group",
                    theme === 'dark' ? "hover:bg-slate-800" : "hover:bg-slate-50"
                  )}
                >
                  <td className={cn("px-6", compact ? "py-2" : "py-4")}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs",
                        theme === 'dark' ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className={cn("text-sm font-medium", theme === 'dark' ? "text-slate-200" : "text-slate-900")}>{contact.name}</div>
                        <div className="text-xs text-slate-500">{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{contact.company}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      contact.status === 'Customer' ? "bg-emerald-100 text-emerald-700" :
                      contact.status === 'Lead' ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {contact.status}
                    </span>
                  </td>
                  <td className={cn("px-6 py-4 text-sm font-medium", theme === 'dark' ? "text-slate-200" : "text-slate-900")}>{currencySymbol}{(contact.value || 0).toLocaleString(locale)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Contact" theme={theme}>
        <form onSubmit={handleAddContact} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
            <input required className={cn("w-full px-4 py-2 border-none rounded-xl text-sm", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900")} value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
            <input type="email" required className={cn("w-full px-4 py-2 border-none rounded-xl text-sm", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900")} value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Company</label>
            <input required className={cn("w-full px-4 py-2 border-none rounded-xl text-sm", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900")} value={newContact.company} onChange={e => setNewContact({...newContact, company: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
              <select className={cn("w-full px-4 py-2 border-none rounded-xl text-sm", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900")} value={newContact.status} onChange={e => setNewContact({...newContact, status: e.target.value as any})}>
                <option>Lead</option>
                <option>Opportunity</option>
                <option>Customer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Value ({currencySymbol})</label>
              <input type="number" className={cn("w-full px-4 py-2 border-none rounded-xl text-sm", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900")} value={newContact.value} onChange={e => setNewContact({...newContact, value: Number(e.target.value)})} />
            </div>
          </div>
          <button type="submit" className={cn(
            "w-full py-3 text-white rounded-xl font-semibold mt-4",
            settings.primaryColor === 'emerald' ? "bg-emerald-600" : settings.primaryColor === 'blue' ? "bg-blue-600" : settings.primaryColor === 'violet' ? "bg-violet-600" : "bg-rose-600"
          )}>Create Contact</button>
        </form>
      </Modal>

      <AnimatePresence>
        {selectedContact && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className={cn(
              "w-1/3 border rounded-2xl shadow-sm p-6 space-y-6 transition-colors overflow-y-auto",
              theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className={cn("font-semibold", theme === 'dark' ? "text-white" : "text-slate-900")}>Contact Details</h3>
              <button onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl mx-auto",
                theme === 'dark' ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
              )}>
                {selectedContact.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h4 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{selectedContact.name}</h4>
              <p className="text-sm text-slate-500">{selectedContact.company}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <a href={`mailto:${selectedContact.email}`} className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors",
                theme === 'dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}>
                <Mail className="w-4 h-4" /> Email
              </a>
              <button className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors",
                theme === 'dark' ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}>
                <Phone className="w-4 h-4" /> Call
              </button>
            </div>

            <div className={cn("p-4 rounded-xl space-y-3", theme === 'dark' ? "bg-slate-800" : "bg-slate-50")}>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <Sparkles className="w-4 h-4" /> AI Insight
              </div>
              <p className={cn("text-sm leading-relaxed italic", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>
                "{insight}"
              </p>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h5>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className={cn("w-1 h-full rounded-full", theme === 'dark' ? "bg-slate-800" : "bg-slate-100")} />
                    <div>
                      <div className={cn("text-sm font-medium", theme === 'dark' ? "text-slate-200" : "text-slate-900")}>Email sent by Rajesh</div>
                      <div className="text-xs text-slate-500">2 days ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PipelineView = ({ searchQuery, openModalOnMount, onModalClose, settings }: { searchQuery: string, openModalOnMount?: boolean, onModalClose?: () => void, settings: UserSettings }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDealId, setExpandedDealId] = useState<number | null>(null);
  const [newDeal, setNewDeal] = useState({ title: '', contact_id: 0, stage: 'Discovery', value: 0, close_date: '' });
  const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'];

  useEffect(() => {
    if (openModalOnMount) {
      setIsModalOpen(true);
      onModalClose?.();
    }
  }, [openModalOnMount]);

  const currencySymbol = settings.currency === 'Indian Rupee (₹)' ? '₹' : '$';
  const locale = settings.currency === 'Indian Rupee (₹)' ? 'en-IN' : 'en-US';

  const fetchData = () => {
    fetch('/api/deals').then(res => res.json()).then(setDeals);
    fetch('/api/contacts').then(res => res.json()).then(setContacts);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDeals = (deals || []).filter(d => 
    (d.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.contact_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeal)
    });
    setIsModalOpen(false);
    fetchData();
  };

  const moveDeal = async (dealId: number, nextStage: string) => {
    await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage })
    });
    fetchData();
  };

  const handleExportExcel = () => {
    const exportData = filteredDeals.map(d => ({
      Title: d.title,
      Contact: d.contact_name,
      Stage: d.stage,
      Value: `${currencySymbol}${d.value.toLocaleString(locale)}`,
      'Close Date': d.close_date
    }));
    exportToExcel(exportData, 'Pipeline_Export');
  };

  const theme = settings.theme;
  const compact = settings.compactMode;

  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, dealId: number) => {
    e.dataTransfer.setData('dealId', dealId.toString());
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const dealId = Number(e.dataTransfer.getData('dealId'));
    if (dealId) {
      moveDeal(dealId, stage);
    }
  };

  const handleExportPDF = () => {
    const exportData = filteredDeals.map(d => ({
      title: d.title,
      contact: d.contact_name,
      stage: d.stage,
      value: `${currencySymbol}${d.value.toLocaleString(locale)}`,
      date: d.close_date
    }));
    exportToPDF(exportData, ['title', 'contact', 'stage', 'value', 'date'], 'Pipeline_Export', 'Core CRM - Sales Pipeline');
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>Pipeline</h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleExportExcel}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExportPDF}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
              title="Export to PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm",
            settings.primaryColor === 'emerald' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" :
            settings.primaryColor === 'blue' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" :
            settings.primaryColor === 'violet' ? "bg-violet-600 hover:bg-violet-700 shadow-violet-200" :
            "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
          )}
        >
          <Plus className="w-4 h-4" /> Add Deal
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div 
            key={stage} 
            className="flex-shrink-0 w-72 flex flex-col space-y-4"
            onDragOver={(e) => {
              e.preventDefault();
              setDraggedOverStage(stage);
            }}
            onDragLeave={() => setDraggedOverStage(null)}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className={cn(
              "flex items-center justify-between px-2 py-2 rounded-lg transition-colors", 
              theme === 'dark' ? "bg-slate-800/50" : "bg-slate-100/50",
              draggedOverStage === stage && (theme === 'dark' ? "bg-slate-700" : "bg-slate-200")
            )}>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stage}</h4>
              <span className="text-[10px] font-bold text-slate-400">
                {filteredDeals.filter(d => d.stage === stage).length}
              </span>
            </div>
            <div className={cn(
              "flex-1 space-y-3 overflow-y-auto rounded-xl transition-colors p-1",
              draggedOverStage === stage && (theme === 'dark' ? "bg-slate-800/30 ring-2 ring-emerald-500/20" : "bg-slate-50 ring-2 ring-emerald-500/20")
            )}>
              {filteredDeals.filter(d => d.stage === stage).map(deal => (
                <motion.div 
                  layout
                  layoutId={`deal-${deal.id}`}
                  key={deal.id} 
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, deal.id)}
                  onClick={() => setExpandedDealId(expandedDealId === deal.id ? null : deal.id)}
                  className={cn(
                    "p-4 border rounded-xl shadow-sm transition-all group cursor-pointer active:cursor-grabbing",
                    theme === 'dark' ? "bg-slate-900 border-slate-800 hover:border-emerald-500/50" : "bg-white border-slate-200 hover:shadow-md hover:border-emerald-500",
                    expandedDealId === deal.id && (theme === 'dark' ? "ring-2 ring-emerald-500/50 border-transparent" : "ring-2 ring-emerald-500 border-transparent")
                  )}
                >
                  <div className={cn("font-semibold mb-1", compact ? "text-xs" : "text-sm", theme === 'dark' ? "text-white" : "text-slate-900")}>{deal.title}</div>
                  <div className="text-xs text-slate-500 mb-2">{deal.contact_name}</div>
                  
                  <AnimatePresence>
                    {expandedDealId === deal.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={cn("pt-2 pb-3 space-y-2 border-t mt-2", theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Mail className="w-3 h-3" /> {deal.contact_email}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <CheckSquare className="w-3 h-3" /> Close Date: {deal.close_date}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                      "text-sm font-bold",
                      settings.primaryColor === 'emerald' ? "text-emerald-600" : settings.primaryColor === 'blue' ? "text-blue-600" : settings.primaryColor === 'violet' ? "text-violet-600" : "text-rose-600"
                    )}>{currencySymbol}{(deal.value || 0).toLocaleString(locale)}</div>
                    <div className="flex items-center gap-2">
                      {differenceInDays(parseISO(deal.close_date), new Date()) <= 7 && differenceInDays(parseISO(deal.close_date), new Date()) >= 0 && (
                        <div className="p-1 bg-rose-50 text-rose-500 rounded-md" title="Approaching Close Date">
                          <Bell className="w-3 h-3 animate-pulse" />
                        </div>
                      )}
                      {expandedDealId !== deal.id && <div className="text-[10px] text-slate-400 font-medium">{deal.close_date}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {stages.indexOf(stage) < stages.length - 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDeal(deal.id, stages[stages.indexOf(stage) + 1]);
                        }}
                        className={cn(
                          "flex-1 text-[10px] font-bold py-1 rounded-md transition-colors",
                          settings.primaryColor === 'emerald' ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" :
                          settings.primaryColor === 'blue' ? "text-blue-600 bg-blue-50 hover:bg-blue-100" :
                          settings.primaryColor === 'violet' ? "text-violet-600 bg-violet-50 hover:bg-violet-100" :
                          "text-rose-600 bg-rose-50 hover:bg-rose-100"
                        )}
                      >
                        Next Stage
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Deal" theme={theme}>
        <form onSubmit={handleAddDeal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Deal Title</label>
            <input required className={cn("w-full px-4 py-2 border-none rounded-xl text-sm", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900")} value={newDeal.title} onChange={e => setNewDeal({...newDeal, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contact</label>
            <select required className={cn("w-full px-4 py-2 border-none rounded-xl text-sm", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900")} value={newDeal.contact_id} onChange={e => setNewDeal({...newDeal, contact_id: Number(e.target.value)})}>
              <option value="">Select a contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Value ({currencySymbol})</label>
              <input type="number" required className={cn("w-full px-4 py-2 border-none rounded-xl text-sm", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900")} value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Close Date</label>
              <input type="date" required className={cn("w-full px-4 py-2 border-none rounded-xl text-sm", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-900")} value={newDeal.close_date} onChange={e => setNewDeal({...newDeal, close_date: e.target.value})} />
            </div>
          </div>
          <button type="submit" className={cn(
            "w-full py-3 text-white rounded-xl font-semibold mt-4",
            settings.primaryColor === 'emerald' ? "bg-emerald-600" : settings.primaryColor === 'blue' ? "bg-blue-600" : settings.primaryColor === 'violet' ? "bg-violet-600" : "bg-rose-600"
          )}>Create Deal</button>
        </form>
      </Modal>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingModal, setPendingModal] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('core_crm_settings');
    return saved ? JSON.parse(saved) : {
      fullName: 'Rajesh Kumar',
      email: 'rajesh@corecrm.in',
      currency: 'Indian Rupee (₹)',
      timezone: '(GMT+05:30) India Standard Time',
      aiInsights: true,
      theme: 'light',
      compactMode: false,
      primaryColor: 'emerald'
    };
  });

  useEffect(() => {
    localStorage.setItem('core_crm_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then(setStats)
      .catch(err => console.error('Error fetching stats:', err));

    // Generate notifications from deals
    fetch('/api/deals')
      .then(res => res.json())
      .then((deals: Deal[]) => {
        const notifs: Notification[] = [];
        const today = new Date();
        
        deals.forEach(deal => {
          const closeDate = parseISO(deal.close_date);
          const daysLeft = differenceInDays(closeDate, today);
          
          if (daysLeft >= 0 && daysLeft <= 7) {
            notifs.push({
              id: `deal-${deal.id}`,
              title: 'Approaching Close Date',
              message: `Deal "${deal.title}" is closing in ${daysLeft} days.`,
              type: daysLeft <= 3 ? 'urgent' : 'warning',
              date: deal.close_date,
              dealId: deal.id
            });
          }
        });
        
        setNotifications(notifs);
      });
  }, []);

  const colorClasses = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 text-emerald-600 text-emerald-700 bg-emerald-50 text-emerald-900 bg-emerald-100',
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-blue-600 text-blue-700 bg-blue-50 text-blue-900 bg-blue-100',
    violet: 'bg-violet-600 hover:bg-violet-700 shadow-violet-200 text-violet-600 text-violet-700 bg-violet-50 text-violet-900 bg-violet-100',
    rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-rose-600 text-rose-700 bg-rose-50 text-rose-900 bg-rose-100'
  };

  return (
    <div className={cn(
      "flex h-screen font-sans transition-colors duration-300",
      settings.theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900",
      settings.compactMode && "text-xs"
    )}>
      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-r flex flex-col transition-colors",
        settings.theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className={cn(settings.compactMode ? "p-4" : "p-6")}>
          <div className="flex items-center gap-2 mb-8">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              settings.primaryColor === 'emerald' ? "bg-emerald-600" :
              settings.primaryColor === 'blue' ? "bg-blue-600" :
              settings.primaryColor === 'violet' ? "bg-violet-600" : "bg-rose-600"
            )}>
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className={cn("text-xl font-bold tracking-tight", settings.theme === 'dark' ? "text-white" : "text-slate-900")}>Core</span>
          </div>

          <nav className="space-y-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              primaryColor={settings.primaryColor}
              theme={settings.theme}
            />
            <SidebarItem 
              icon={Users} 
              label="Contacts" 
              active={activeTab === 'contacts'} 
              onClick={() => setActiveTab('contacts')} 
              primaryColor={settings.primaryColor}
              theme={settings.theme}
            />
            <SidebarItem 
              icon={Briefcase} 
              label="Pipeline" 
              active={activeTab === 'pipeline'} 
              onClick={() => setActiveTab('pipeline')} 
              primaryColor={settings.primaryColor}
              theme={settings.theme}
            />
            <SidebarItem 
              icon={CheckSquare} 
              label="Tasks" 
              active={activeTab === 'tasks'} 
              onClick={() => setActiveTab('tasks')} 
              primaryColor={settings.primaryColor}
              theme={settings.theme}
            />
            <SidebarItem 
              icon={BarChart3} 
              label="Analytics" 
              active={activeTab === 'analytics'} 
              onClick={() => setActiveTab('analytics')} 
              primaryColor={settings.primaryColor}
              theme={settings.theme}
            />
          </nav>
        </div>

        <div className={cn("mt-auto border-t transition-colors", settings.theme === 'dark' ? "border-slate-800 p-4" : "border-slate-100 p-6")}>
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            primaryColor={settings.primaryColor}
            theme={settings.theme}
          />
          <div className="mt-6 flex items-center gap-3 px-2">
            <div className={cn("w-8 h-8 rounded-full", settings.theme === 'dark' ? "bg-slate-800" : "bg-slate-200")} />
            <div className="flex-1 min-w-0">
              <div className={cn("text-sm font-medium truncate", settings.theme === 'dark' ? "text-slate-200" : "text-slate-900")}>Rajesh Kumar</div>
              <div className="text-xs text-slate-500 truncate">Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-8 transition-colors",
          settings.theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 border-none rounded-xl text-sm transition-all",
                  settings.theme === 'dark' ? "bg-slate-800 text-white focus:ring-emerald-500/40" : "bg-slate-50 text-slate-900 focus:ring-emerald-500/20"
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={cn(
                  "p-2 rounded-lg relative transition-colors",
                  settings.theme === 'dark' ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={cn(
                      "absolute right-0 mt-2 w-80 border rounded-2xl shadow-xl z-[110] overflow-hidden",
                      settings.theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    )}
                  >
                    <div className={cn("p-4 border-b flex items-center justify-between", settings.theme === 'dark' ? "border-slate-800" : "border-slate-100")}>
                      <h4 className={cn("font-bold text-sm", settings.theme === 'dark' ? "text-white" : "text-slate-900")}>Notifications</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notifications.length} New</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No new notifications</div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={cn(
                              "p-4 cursor-pointer transition-colors",
                              settings.theme === 'dark' ? "hover:bg-slate-800" : "hover:bg-slate-50"
                            )}
                            onClick={() => {
                              if (notif.dealId) {
                                setActiveTab('pipeline');
                                setIsNotifOpen(false);
                              }
                            }}
                          >
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                notif.type === 'urgent' ? "bg-rose-500" : "bg-amber-500"
                              )} />
                              <div className="space-y-1">
                                <div className={cn("text-sm font-semibold", settings.theme === 'dark' ? "text-slate-200" : "text-slate-900")}>{notif.title}</div>
                                <div className="text-xs text-slate-500 leading-relaxed">{notif.message}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{notif.date}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => setIsQuickAddOpen(true)}
              className={cn(
                "flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm",
                settings.primaryColor === 'emerald' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" :
                settings.primaryColor === 'blue' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" :
                settings.primaryColor === 'violet' ? "bg-violet-600 hover:bg-violet-700 shadow-violet-200" :
                "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
              )}
            >
              <Plus className="w-4 h-4" /> New Action
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className={cn("flex-1 overflow-y-auto", settings.compactMode ? "p-4" : "p-8")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <DashboardView stats={stats} settings={settings} />}
              {activeTab === 'contacts' && <ContactsView searchQuery={searchQuery} openModalOnMount={pendingModal === 'contact'} onModalClose={() => setPendingModal(null)} settings={settings} />}
              {activeTab === 'pipeline' && <PipelineView searchQuery={searchQuery} openModalOnMount={pendingModal === 'deal'} onModalClose={() => setPendingModal(null)} settings={settings} />}
              {activeTab === 'tasks' && <TaskView openModalOnMount={pendingModal === 'task'} onModalClose={() => setPendingModal(null)} settings={settings} />}
              {activeTab === 'analytics' && <AnalyticsView settings={settings} />}
              {activeTab === 'settings' && <SettingsView settings={settings} onSave={setSettings} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Modal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} title="Quick Actions">
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => { setActiveTab('contacts'); setPendingModal('contact'); setIsQuickAddOpen(false); }}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"
          >
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><UserPlus className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-bold text-slate-900">Add New Contact</div>
              <div className="text-xs text-slate-500">Create a new lead or customer</div>
            </div>
          </button>
          <button 
            onClick={() => { setActiveTab('pipeline'); setPendingModal('deal'); setIsQuickAddOpen(false); }}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"
          >
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Target className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-bold text-slate-900">Create New Deal</div>
              <div className="text-xs text-slate-500">Start a new sales opportunity</div>
            </div>
          </button>
          <button 
            onClick={() => { setActiveTab('tasks'); setPendingModal('task'); setIsQuickAddOpen(false); }}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"
          >
            <div className="p-2 bg-violet-100 rounded-lg text-violet-600"><CheckSquare className="w-5 h-5" /></div>
            <div>
              <div className="text-sm font-bold text-slate-900">Schedule Task</div>
              <div className="text-xs text-slate-500">Set a reminder for follow-up</div>
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
}
