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

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg group",
      active 
        ? "bg-emerald-50 text-emerald-700" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
    {label}
  </button>
);

const StatCard = ({ label, value, icon: Icon, trend, color }: { label: string, value: string | number, icon: any, trend?: string, color: string }) => (
  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
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
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{title}</h3>
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

const TaskView = ({ openModalOnMount, onModalClose }: { openModalOnMount?: boolean, onModalClose?: () => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_date: '', priority: 'Medium' });

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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {tasks.map(task => (
            <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <button 
                onClick={() => toggleTaskStatus(task)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  task.status === 'Completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200"
                )}
              >
                {task.status === 'Completed' && <CheckSquare className="w-4 h-4" />}
              </button>
              <div className="flex-1">
                <div className={cn("text-sm font-medium flex items-center gap-2", task.status === 'Completed' ? "text-slate-400 line-through" : "text-slate-900")}>
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    task.priority === 'High' ? "bg-rose-500" :
                    task.priority === 'Medium' ? "bg-amber-500" :
                    "bg-emerald-500"
                  )} />
                  {task.title}
                </div>
                <div className="text-xs text-slate-500">Due: {task.due_date}</div>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Task Title</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm"
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
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm"
                value={newTask.due_date}
                onChange={e => setNewTask({...newTask, due_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Priority</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm"
                value={newTask.priority}
                onChange={e => setNewTask({...newTask, priority: e.target.value})}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold mt-4">Create Task</button>
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
      <h3 className="text-xl font-bold text-slate-900">Analytics</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-6">Win vs Loss Ratio</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="won" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
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
                  formatter={(value: number) => `${currencySymbol}${value.toLocaleString(locale)}`}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm lg:col-span-2">
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
                    <span className="text-slate-900">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentage}%` }} />
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

      <h3 className="text-xl font-bold text-slate-900">Settings</h3>
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100">
        <div className="p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-4">Profile Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
              <input 
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                value={localSettings.fullName}
                onChange={e => setLocalSettings({...localSettings, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
              <input 
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                value={localSettings.email}
                onChange={e => setLocalSettings({...localSettings, email: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-4">Localization</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Currency</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={localSettings.timezone}
                onChange={e => setLocalSettings({...localSettings, timezone: e.target.value})}
              >
                <option>(GMT+05:30) India Standard Time</option>
                <option>(GMT-08:00) Pacific Time</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">AI Insights</h4>
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
          color="bg-emerald-500"
        />
        <StatCard 
          label="Active Deals" 
          value={stats?.activeDeals || 0} 
          icon={Target} 
          trend="+3" 
          color="bg-blue-500"
        />
        <StatCard 
          label="New Leads" 
          value={stats?.newLeads || 0} 
          icon={UserPlus} 
          trend="+8%" 
          color="bg-violet-500"
        />
        <StatCard 
          label="Win Rate" 
          value={`${stats?.winRate}%`} 
          icon={TrendingUp} 
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Revenue Forecast</h3>
            <select className="text-sm border-none bg-slate-50 rounded-lg px-3 py-1 text-slate-600 focus:ring-0">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">AI Insights</h3>
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-sm text-emerald-900 leading-relaxed">
                <span className="font-bold">Reliance Industries</span> deal is showing high intent. Their team visited the pricing page 4 times today.
              </p>
              <button className="mt-3 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                Draft Follow-up <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-900 leading-relaxed">
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
      <div className={cn("bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 transition-all", selectedContact ? "w-2/3" : "w-full")}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-slate-900">Contacts</h3>
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
            className="p-2 hover:bg-slate-50 rounded-lg text-emerald-600"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  onClick={() => handleContactClick(contact)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-xs">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{contact.name}</div>
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
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{currencySymbol}{(contact.value || 0).toLocaleString(locale)}</td>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Contact">
        <form onSubmit={handleAddContact} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
            <input required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
            <input type="email" required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Company</label>
            <input required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={newContact.company} onChange={e => setNewContact({...newContact, company: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
              <select className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={newContact.status} onChange={e => setNewContact({...newContact, status: e.target.value as any})}>
                <option>Lead</option>
                <option>Opportunity</option>
                <option>Customer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Value ({currencySymbol})</label>
              <input type="number" className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={newContact.value} onChange={e => setNewContact({...newContact, value: Number(e.target.value)})} />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold mt-4">Create Contact</button>
        </form>
      </Modal>

      <AnimatePresence>
        {selectedContact && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Contact Details</h3>
              <button onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl mx-auto">
                {selectedContact.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h4 className="text-xl font-bold text-slate-900">{selectedContact.name}</h4>
              <p className="text-sm text-slate-500">{selectedContact.company}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <a href={`mailto:${selectedContact.email}`} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
                <Mail className="w-4 h-4" /> Email
              </a>
              <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
                <Phone className="w-4 h-4" /> Call
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <Sparkles className="w-4 h-4" /> AI Insight
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{insight}"
              </p>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h5>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1 h-full bg-slate-100 rounded-full" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">Email sent by Rajesh</div>
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
          <h3 className="text-xl font-bold text-slate-900">Pipeline</h3>
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
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage} className="flex-shrink-0 w-72 flex flex-col space-y-4">
            <div className="flex items-center justify-between px-2 bg-slate-100/50 py-2 rounded-lg">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stage}</h4>
              <span className="text-[10px] font-bold text-slate-400">
                {filteredDeals.filter(d => d.stage === stage).length}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {filteredDeals.filter(d => d.stage === stage).map(deal => (
                <motion.div 
                  layout
                  layoutId={`deal-${deal.id}`}
                  key={deal.id} 
                  onClick={() => setExpandedDealId(expandedDealId === deal.id ? null : deal.id)}
                  className={cn(
                    "p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all group cursor-pointer",
                    expandedDealId === deal.id && "ring-2 ring-emerald-500 border-transparent"
                  )}
                >
                  <div className="text-sm font-semibold text-slate-900 mb-1">{deal.title}</div>
                  <div className="text-xs text-slate-500 mb-2">{deal.contact_name}</div>
                  
                  <AnimatePresence>
                    {expandedDealId === deal.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 pb-3 space-y-2 border-t border-slate-100 mt-2">
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
                    <div className="text-sm font-bold text-emerald-600">{currencySymbol}{(deal.value || 0).toLocaleString(locale)}</div>
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
                        className="flex-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 py-1 rounded-md"
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Deal">
        <form onSubmit={handleAddDeal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Deal Title</label>
            <input required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={newDeal.title} onChange={e => setNewDeal({...newDeal, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contact</label>
            <select required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={newDeal.contact_id} onChange={e => setNewDeal({...newDeal, contact_id: Number(e.target.value)})}>
              <option value="">Select a contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Value ({currencySymbol})</label>
              <input type="number" required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Close Date</label>
              <input type="date" required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={newDeal.close_date} onChange={e => setNewDeal({...newDeal, close_date: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold mt-4">Create Deal</button>
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
      aiInsights: true
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

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Core</span>
          </div>

          <nav className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Users} label="Contacts" active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} />
            <SidebarItem icon={Briefcase} label="Pipeline" active={activeTab === 'pipeline'} onClick={() => setActiveTab('pipeline')} />
            <SidebarItem icon={CheckSquare} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
            <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
          <div className="mt-6 flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">Rajesh Kumar</div>
              <div className="text-xs text-slate-500 truncate">Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg relative"
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
                    className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-[110] overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notifications.length} New</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No new notifications</div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
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
                                <div className="text-sm font-semibold text-slate-900">{notif.title}</div>
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
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-200"
            >
              <Plus className="w-4 h-4" /> New Action
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
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
              {activeTab === 'tasks' && <TaskView openModalOnMount={pendingModal === 'task'} onModalClose={() => setPendingModal(null)} />}
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
