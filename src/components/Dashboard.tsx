import React, { useState } from 'react';
import { useAppContext } from '../store';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Users, DollarSign, Activity, FileText, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, Send, Target, ShieldCheck, History, Plus, Sliders, X } from 'lucide-react';
import { RevenueData } from '../types';
import { sendEmail, ensureLabel, addLabelToMessage } from '../lib/gmail';
import { filterByDateRange } from '../lib/dateFilter';

export default function Dashboard() {
  const { currentUser, employees, finances, requests, projects, okrs, setOkrs, auditLogs, logAction, dateFilter } = useAppContext();
  const [sending, setSending] = useState(false);
  const [isOkrModalOpen, setIsOkrModalOpen] = useState(false);
  const [newOkrTitle, setNewOkrTitle] = useState('');
  const [newOkrObjective, setNewOkrObjective] = useState('');
  const [newOkrTargetDate, setNewOkrTargetDate] = useState('');
  const [filterModule, setFilterModule] = useState('All');

  const handleAddOkr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOkrTitle || !newOkrObjective) return;
    const newOkr = {
      id: 'okr-' + Math.floor(Math.random() * 1000000),
      title: newOkrTitle,
      objective: newOkrObjective,
      progress: 0,
      targetDate: newOkrTargetDate || new Date().toISOString().split('T')[0],
      status: 'In Progress' as any
    };
    setOkrs(prev => [...prev, newOkr]);
    logAction('Strategic Goal Formulated', 'Admin', `Formulated new strategic Objective: "${newOkrTitle}" to achieve by ${newOkr.targetDate}.`);
    setIsOkrModalOpen(false);
    setNewOkrTitle('');
    setNewOkrObjective('');
    setNewOkrTargetDate('');
  };

  const handleUpdateOkrProgress = (id: string, progress: number) => {
    setOkrs(prev => prev.map(o => {
      if (o.id === id) {
        const nextProg = Math.min(100, Math.max(0, progress));
        const nextStatus = nextProg >= 100 ? 'Completed' : nextProg > 40 ? 'On Track' : 'In Progress';
        return { ...o, progress: nextProg, status: nextStatus };
      }
      return o;
    }));
  };

  const handleSendReport = async () => {
    setSending(true);
    try {
      const filteredFinancesForReport = filterByDateRange<any>(finances, dateFilter);
      const inc = filteredFinancesForReport.filter(t => t.type === 'Income').reduce((a, t) => a + t.amount, 0);
      const exp = filteredFinancesForReport.filter(t => t.type === 'Expense').reduce((a, t) => a + t.amount, 0);
      const reqCount = requests.filter(r => r.status === 'Pending').length;

      const body = `
        <h2>MULTICENO Daily Executive Report</h2>
        <p><strong>Total Income:</strong> $${inc.toLocaleString()}</p>
        <p><strong>Total Expenditure:</strong> $${exp.toLocaleString()}</p>
        <p><strong>Pending Approvals:</strong> ${reqCount}</p>
        <p><strong>Active Employees:</strong> ${employees.length}</p>
        <br/>
        <p>Data synced directly from MULTICENO operational systems.</p>
      `;

      const messageId = await sendEmail(currentUser.email!, '[Daily Report] MULTICENO Update', body);
      const labelId = await ensureLabel('Daily Report');
      await addLabelToMessage(messageId, labelId);

      alert("Daily Report has been securely dispatched to your CEO email and labeled as 'Daily Report'.");
    } catch(e) {
      console.error(e);
      alert("Failed to send daily report. Please verify connection.");
    } finally {
      setSending(false);
    }
  };

  const filteredFinances = filterByDateRange<any>(finances, dateFilter);
  const filteredProjects = filterByDateRange<any>(projects, dateFilter);

  // Dynamic calculations
  const totalIncome = filteredFinances.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredFinances.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
  const totalRevenueFormatted = `$${(totalIncome / 1000).toFixed(1)}k`;
  
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;

  const [activeTrendTab, setActiveTrendTab] = useState<'financial' | 'workforce' | 'projects'>('financial');

  // Dynamic grouping of financials
  const getMonthlyFinancials = () => {
    const baseline: Record<string, { revenue: number; expenses: number }> = {
      '01': { revenue: 38000, expenses: 22000 },
      '02': { revenue: 41000, expenses: 24000 },
      '03': { revenue: 46000, expenses: 28000 },
      '04': { revenue: 44000, expenses: 27000 },
      '05': { revenue: 52000, expenses: 31000 },
      '06': { revenue: 0, expenses: 0 },
      '07': { revenue: 0, expenses: 0 },
      '08': { revenue: 0, expenses: 0 },
      '09': { revenue: 0, expenses: 0 },
      '10': { revenue: 0, expenses: 0 },
      '11': { revenue: 0, expenses: 0 },
      '12': { revenue: 0, expenses: 0 },
    };

    // Group real transactions in state
    filteredFinances.forEach(tx => {
      if (!tx.date) return;
      const parts = tx.date.split('-');
      if (parts.length >= 2) {
        const monthKey = parts[1];
        if (baseline[monthKey]) {
          if (tx.type === 'Income') {
            baseline[monthKey].revenue += tx.amount;
          } else {
            baseline[monthKey].expenses += tx.amount;
          }
        }
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.keys(baseline).map((key, idx) => ({
      month: monthNames[idx],
      revenue: baseline[key].revenue || (idx < 5 ? 40000 + idx * 2500 : 0),
      expenses: baseline[key].expenses || (idx < 5 ? 24000 + idx * 1200 : 0),
    }));
  };

  // Dynamic workforce growth trend (ending directly at current active length)
  const getEmployeeGrowthData = () => {
    const currentCount = employees.length || 10;
    const growthSteps = [0.4, 0.5, 0.65, 0.75, 0.9, 1.0]; // scale factors for Jan - Jun
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthNames.map((month, idx) => {
      let count = 0;
      if (idx <= 5) {
        count = Math.max(1, Math.round(currentCount * growthSteps[idx]));
      } else {
        count = currentCount;
      }
      return {
        month,
        employees: count
      };
    });
  };

  // Dynamic project completion rate trend (ending directly at current average completion)
  const getProjectProgressData = () => {
    const currentAvg = filteredProjects.length 
      ? Math.round(filteredProjects.reduce((acc, p) => acc + p.progress, 0) / filteredProjects.length) 
      : 65;
    
    const progressSteps = [35, 42, 48, 55, 58, 1.0]; // scale factor or benchmark
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return monthNames.map((month, idx) => {
      let val = 0;
      if (idx < 5) {
        val = progressSteps[idx];
      } else if (idx === 5) {
        val = currentAvg;
      } else {
        val = Math.min(100, Math.max(0, currentAvg + (idx - 5) * 5));
      }
      return {
        month,
        completionRate: val
      };
    });
  };

  const FINANCIALS_DATA = getMonthlyFinancials();
  const WORKFORCE_DATA = getEmployeeGrowthData();
  const PROJECTS_DATA = getProjectProgressData();
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Welcome back. Here's what's happening across MULTICENO today.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleSendReport} disabled={sending} className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors shadow-sm disabled:opacity-50">
            {sending ? <div className="w-4 h-4 border-2 border-indigo-600/40 border-t-indigo-600 rounded-full animate-spin" /> : <Send size={16} />}
            <span>{sending ? 'Sending...' : 'Dispatch Daily Report'}</span>
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
            Schedule Briefing
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Revenue" 
          value={totalRevenueFormatted} 
          trend="+12.5%" 
          isPositive={true}
          icon={DollarSign}
          color="indigo"
        />
        <KpiCard 
          title="Active Projects" 
          value={filteredProjects.filter(p => ['In Progress', 'Planning'].includes(p.status)).length.toString()} 
          trend="" 
          isPositive={true}
          icon={Activity}
          color="emerald"
          type="neutral"
        />
        <KpiCard 
          title="Total Employees" 
          value={employees.length.toString()} 
          trend="+2" 
          isPositive={true}
          icon={Users}
          color="blue"
        />
        <KpiCard 
          title="Pending Approvals" 
          value={pendingRequests.toString()} 
          trend="-2" 
          isPositive={false}
          icon={FileText}
          color="amber"
          type="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Corporate Trend Lines</h2>
              <p className="text-sm text-slate-500">Interactive live performance indicators</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTrendTab('financial')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-0 cursor-pointer ${
                  activeTrendTab === 'financial' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 bg-transparent'
                }`}
              >
                Financials
              </button>
              <button 
                onClick={() => setActiveTrendTab('workforce')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-0 cursor-pointer ${
                  activeTrendTab === 'workforce' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 bg-transparent'
                }`}
              >
                Workforce
              </button>
              <button 
                onClick={() => setActiveTrendTab('projects')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-0 cursor-pointer ${
                  activeTrendTab === 'projects' 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 bg-transparent'
                }`}
              >
                Project Delivery
              </button>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTrendTab === 'financial' ? (
                <AreaChart data={FINANCIALS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `$${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                  />
                  <Area 
                    type="monotone" 
                    name="Revenue"
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    name="Expenses"
                    dataKey="expenses" 
                    stroke="#f43f5e" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorExpenses)" 
                    activeDot={{ r: 5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : activeTrendTab === 'workforce' ? (
                <AreaChart data={WORKFORCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWorkforce" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value} Personnel`, 'Workforce']}
                  />
                  <Area 
                    type="monotone" 
                    name="FTE Employees"
                    dataKey="employees" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorWorkforce)" 
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <AreaChart data={PROJECTS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `${val}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value}%`, 'Completion Speed']}
                  />
                  <Area 
                    type="monotone" 
                    name="Execution Delivery"
                    dataKey="completionRate" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorProjects)" 
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Panel */}
        <div className="grid grid-rows-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Urgent Actions</h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              <ActionItem 
                title="Q3 Budget Approval" 
                subtitle="Requested by Sarah V. (Finance)" 
                time="2 hrs ago"
                urgent
              />
              <ActionItem 
                title="VP Engineering Final Hire" 
                subtitle="Offer letter review pending" 
                time="4 hrs ago"
              />
              <ActionItem 
                title="Acquisition Due Diligence" 
                subtitle="Legal docs uploaded" 
                time="1 day ago"
              />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 shadow-lg shadow-indigo-900/20 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-[-30%] right-[-10%] w-48 h-48 bg-indigo-500/30 rounded-full blur-[40px] pointer-events-none" />
            
            <div>
              <div className="inline-flex items-center space-x-2 bg-indigo-500/20 rounded-full px-3 py-1 mb-4 border border-indigo-400/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">System Status</span>
              </div>
              <h2 className="text-xl font-semibold mb-1">Company Health is Optimal</h2>
              <p className="text-indigo-200 text-sm">All core systems and divisions are operating within acceptable parameters.</p>
            </div>
            
            <button className="w-full bg-white text-indigo-900 font-medium py-2.5 rounded-xl text-sm transition-transform hover:scale-[1.02] shadow-xl">
              View Detailed Diagnostic
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Management & Compliance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Strategic Objectives (OKRs) Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">Strategic Objectives (OKRs)</h2>
            </div>
            <button 
              onClick={() => setIsOkrModalOpen(true)} 
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus size={14} />
              <span>Define Goal</span>
            </button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {okrs.map((okr) => (
              <div key={okr.id} className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{okr.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{okr.objective}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    okr.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    okr.status === 'On Track' ? 'bg-indigo-100 text-indigo-700' :
                    okr.status === 'At Risk' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {okr.status}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex-1">
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${okr.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 min-w-[32px] text-right">{okr.progress}%</span>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50">
                  <span className="text-[10px] text-slate-400 font-medium">Target: {okr.targetDate}</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleUpdateOkrProgress(okr.id, okr.progress - 10)}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 rounded text-[10px] font-bold active:scale-95"
                    >
                      -10%
                    </button>
                    <button 
                      onClick={() => handleUpdateOkrProgress(okr.id, okr.progress + 10)}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 rounded text-[10px] font-bold active:scale-95"
                    >
                      +10%
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Audit Trail Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <History className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">Corporate Audit Trail</h2>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                <ShieldCheck size={10} />
                <span>Compliant</span>
              </span>
            </div>
          </div>
          
          <div className="flex space-x-1.5 mb-4 overflow-x-auto pb-1">
            {['All', 'Finance', 'Approvals', 'Admin', 'Auth'].map((mod) => (
              <button
                key={mod}
                onClick={() => setFilterModule(mod)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  filterModule === mod 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1 font-sans">
            {auditLogs
              .filter(log => filterModule === 'All' || log.module.toLowerCase() === filterModule.toLowerCase() || log.action.toLowerCase().includes(filterModule.toLowerCase()))
              .slice(0, 20)
              .map((log) => (
                <div key={log.id} className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                        {log.module}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{log.action}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-mono">{log.details}</p>
                  <div className="text-[9px] text-slate-400 mt-1 font-semibold flex items-center justify-end">
                    Authorized By: {log.user}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Define OKR Goal Modal */}
      {isOkrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Define Strategic Objective</h2>
              <button onClick={() => setIsOkrModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddOkr} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Objective Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. EU Regional Expansion" 
                  required 
                  value={newOkrTitle} 
                  onChange={e => setNewOkrTitle(e.target.value)} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Measurable Goal Statement</label>
                <textarea 
                  placeholder="e.g. Expand services to London and Frankfurt with 3 active enterprise clients." 
                  required 
                  value={newOkrObjective} 
                  onChange={e => setNewOkrObjective(e.target.value)} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl min-h-[80px]" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Achievement Date</label>
                <input 
                  type="date" 
                  required 
                  value={newOkrTargetDate} 
                  onChange={e => setNewOkrTargetDate(e.target.value)} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white" 
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsOkrModalOpen(false)} 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium border-0 cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm font-medium hover:bg-indigo-700 border-0 cursor-pointer"
                >
                  Define Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, trend, isPositive, icon: Icon, color, type = 'financial' }: any) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  const trendColor = type === 'neutral' 
    ? 'text-slate-500 bg-slate-100' 
    : isPositive 
      ? 'text-emerald-700 bg-emerald-100' 
      : 'text-rose-700 bg-rose-100';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon size={22} strokeWidth={2} />
        </div>
        <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trendColor}`}>
          {type !== 'neutral' && (isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}
          <span>{trend}</span>
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{value}</div>
        <div className="text-sm text-slate-500 font-medium mt-1">{title}</div>
      </div>
    </div>
  );
}

function ActionItem({ title, subtitle, time, urgent }: any) {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
      <div className="mt-0.5">
        {urgent ? (
          <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <Clock size={14} />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <CheckCircle2 size={14} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
      <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 whitespace-nowrap">
        {time}
      </div>
    </div>
  );
}
