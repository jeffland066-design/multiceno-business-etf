import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Settings, 
  LogOut,
  Bell,
  Search,
  ChevronDown,
  X,
  DollarSign,
  Target,
  Calendar,
  Sliders
} from 'lucide-react';
import { ViewState } from '../types';
import { useAppContext } from '../store';

interface LayoutProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({ currentView, onViewChange, onLogout, children }: LayoutProps) {
  const { currentUser, schedules, requests, tasks, projects, employees, documents, dateFilter, setDateFilter } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.role.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDocuments = documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const hasSearchResults = filteredProjects.length > 0 || filteredEmployees.length > 0 || filteredDocuments.length > 0;

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.PROJECTS, label: 'Projects', icon: Briefcase },
    { id: ViewState.EMPLOYEES, label: 'Directory', icon: Users },
    { id: ViewState.CLIENTS, label: 'Clients & Suppliers', icon: Users },
    { id: ViewState.FINANCES, label: 'Finances', icon: TrendingUp },
    { id: ViewState.INVENTORY, label: 'Inventory', icon: Search },
    { id: ViewState.REQUESTS, label: 'Requests', icon: Bell },
    { id: ViewState.SCHEDULES, label: 'Schedules', icon: LayoutDashboard },
    { id: ViewState.INVOICES, label: 'Invoices', icon: TrendingUp },
    { id: ViewState.DOCUMENTS, label: 'Documents', icon: Search },
    { id: ViewState.TASKS, label: 'Tasks', icon: Briefcase },
    { id: ViewState.PRICING, label: 'Pricing', icon: DollarSign },
    { id: ViewState.WORKFLOWS, label: 'Workflows & Alerts', icon: Target },
    { id: ViewState.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 relative z-20">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white mr-3 shadow-lg shadow-indigo-500/30">
            <Briefcase size={18} strokeWidth={2} />
          </div>
          <span className="text-white font-semibold tracking-tight text-lg">MULTICENO</span>
        </div>

        <div className="flex-1 py-8 px-4 space-y-2">
          <div className="px-3 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'} />
                <span className="font-medium text-sm">{item.label}</span>
                {item.id === ViewState.PROJECTS && (
                  <span className="ml-auto bg-indigo-500/20 text-indigo-300 py-0.5 px-2 rounded-full text-[10px] font-bold">
                    12 active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-colors text-slate-400 group"
          >
            <LogOut size={20} className="group-hover:text-rose-400" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
          
          <div className="flex items-center space-x-3 px-3 py-3 mt-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-inner">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50 relative z-10">
        
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-10 sticky top-0">
          <div className="flex items-center w-96 relative" ref={searchRef}>
            <Search className="absolute left-3 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search across the organization..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            />

            {/* Search Results Dropdown */}
            {searchQuery && showSearchResults && (
              <div className="absolute top-full left-0 mt-2 w-[480px] max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
                {hasSearchResults ? (
                  <div className="py-2">
                    {filteredProjects.length > 0 && (
                      <div className="px-4 py-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Projects</div>
                        <div className="space-y-1">
                          {filteredProjects.slice(0, 3).map(p => (
                            <button 
                              key={`p-${p.id}`} 
                              onClick={() => { onViewChange(ViewState.PROJECTS); setShowSearchResults(false); }}
                              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors bg-transparent border-0 cursor-pointer text-left"
                            >
                              <span className="text-sm font-medium text-slate-700">{p.name}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' : p.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {p.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {filteredEmployees.length > 0 && (
                      <div className="px-4 py-2 border-t border-slate-50">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Directory</div>
                        <div className="space-y-1">
                          {filteredEmployees.slice(0, 3).map(e => (
                            <button 
                              key={`e-${e.id}`} 
                              onClick={() => { onViewChange(ViewState.EMPLOYEES); setShowSearchResults(false); }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors bg-transparent border-0 cursor-pointer"
                            >
                              <div className="text-sm font-medium text-slate-700">{e.name}</div>
                              <div className="text-xs text-slate-500">{e.role} • {e.department}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredDocuments.length > 0 && (
                      <div className="px-4 py-2 border-t border-slate-50">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Documents</div>
                        <div className="space-y-1">
                          {filteredDocuments.slice(0, 3).map(d => (
                            <button 
                              key={`d-${d.id}`} 
                              onClick={() => { onViewChange(ViewState.DOCUMENTS); setShowSearchResults(false); }}
                              className="w-full text-left flex justify-between items-center px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors bg-transparent border-0 cursor-pointer"
                            >
                              <span className="text-sm font-medium text-slate-700 truncate mr-3">{d.name}</span>
                              <span className="text-xs text-slate-400 whitespace-nowrap">{d.type.split('/')[1] || 'doc'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6 relative">
            {/* Global Corporate Fiscal Period Selector */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all font-medium text-xs">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-slate-500 font-semibold select-none hidden sm:inline">Period:</span>
              <select
                id="global-fiscal-period-picker"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent border-0 font-bold text-slate-800 outline-none cursor-pointer pr-1 focus:ring-0 focus:outline-none"
              >
                <option value="All">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="q1">Q1 (Jan - Mar)</option>
                <option value="q2">Q2 (Apr - Jun)</option>
                <option value="ytd">Year to Date (YTD)</option>
              </select>
            </div>

            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
            >
              <Bell size={20} />
              {(requests.filter(r => r.status === 'Pending').length > 0 || schedules.length > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
              )}
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <button className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              <span className="truncate max-w-[120px]">{currentUser.name.split(' ')[0]} (CEO)</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            
            {showNotifications && (
              <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {requests.filter(r => r.status === 'Pending').map((req, index) => (
                    <div key={`${req.id}-${index}`} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer text-sm">
                      <div className="font-semibold text-amber-600 mb-1">Pending Approval</div>
                      <div className="text-slate-800">{req.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{req.date}</div>
                    </div>
                  ))}
                  {schedules.slice(0, 3).map((event, index) => (
                    <div key={`${event.id}-${index}`} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer text-sm">
                      <div className="font-semibold text-indigo-600 mb-1">Upcoming Schedule</div>
                      <div className="text-slate-800">{event.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{event.date} at {event.time}</div>
                    </div>
                  ))}
                  {requests.filter(r => r.status === 'Pending').length === 0 && schedules.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-sm">No new notifications.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
