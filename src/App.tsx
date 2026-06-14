import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import { AppProvider, useAppContext } from './store';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Employees from './components/Employees';
import Finances from './components/Finances';
import Inventory from './components/Inventory';
import Requests from './components/Requests';
import Schedules from './components/Schedules';
import Invoices from './components/Invoices';
import Settings from './components/Settings';
import Documents from './components/Documents';
import Tasks from './components/Tasks';
import Pricing from './components/Pricing';
import Clients from './components/Clients';
import Workflows from './components/Workflows';
import AIChatWidget from './components/AIChat';
import GenericPlaceholder from './components/GenericPlaceholder';
import Toasts from './components/Toasts';
import { logout } from './lib/auth';

function AppContent({ handleLogout }: { handleLogout: () => void }) {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const { requests, setRequests, syncAction, initializeData } = useAppContext();

  useEffect(() => {
    // Process approvals from email link on boot
    const params = new URLSearchParams(window.location.search);
    const approveId = params.get('approve');
    if (approveId && requests.length > 0) {
      const match = requests.find(r => r.id === approveId);
      if (match && match.status === 'Pending') {
        setRequests(prev => prev.map(req => req.id === approveId ? { ...req, status: 'Approved' } as any : req));
        setTimeout(() => {
            alert(`Request ${approveId} has been successfully approved via the secure email link.`);
            syncAction(); // Sync state to Google Sheets
        }, 1000);
        setCurrentView(ViewState.REQUESTS);
        // Clear param from URL cleanly
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [requests, setRequests, syncAction]);

  useEffect(() => {
    // Trigger initial data retrieval
    initializeData();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.PROJECTS:
        return <Projects />;
      case ViewState.EMPLOYEES:
        return <Employees />;
      case ViewState.FINANCES:
        return <Finances />;
      case ViewState.INVENTORY:
        return <Inventory />;
      case ViewState.REQUESTS:
        return <Requests />;
      case ViewState.SCHEDULES:
        return <Schedules />;
      case ViewState.INVOICES:
        return <Invoices />;
      case ViewState.DOCUMENTS:
        return <Documents />;
      case ViewState.TASKS:
        return <Tasks />;
      case ViewState.PRICING:
        return <Pricing />;
      case ViewState.CLIENTS:
        return <Clients />;
      case ViewState.WORKFLOWS:
        return <Workflows />;
      case ViewState.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      >
        {renderView()}
      </Layout>
      <AIChatWidget />
      <Toasts />
    </>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = async () => {
    localStorage.removeItem('multiceno_sheet_id');
    await logout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AppProvider>
      <AppContent handleLogout={handleLogout} />
    </AppProvider>
  );
}
