import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Transaction, InventoryItem, ApprovalRequest, ScheduleEvent, Invoice, Project, DocumentItem, Task, ProductPricing, Client, WorkflowAlert, OKR, AuditLog } from './types';
import { createSpreadsheet, readSheetLines, writeSheetLines } from './lib/sheets';
import { getAccessToken } from './lib/auth';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  employees: User[];
  setEmployees: React.Dispatch<React.SetStateAction<User[]>>;
  finances: Transaction[];
  setFinances: React.Dispatch<React.SetStateAction<Transaction[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  requests: ApprovalRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ApprovalRequest[]>>;
  schedules: ScheduleEvent[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleEvent[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  documents: DocumentItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  pricings: ProductPricing[];
  setPricings: React.Dispatch<React.SetStateAction<ProductPricing[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  workflows: WorkflowAlert[];
  setWorkflows: React.Dispatch<React.SetStateAction<WorkflowAlert[]>>;
  okrs: OKR[];
  setOkrs: React.Dispatch<React.SetStateAction<OKR[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  logAction: (action: string, module: string, details: string) => void;
  syncAction: () => Promise<void>;
  initializeData: () => Promise<void>;
  resetAllData: () => Promise<void>;
  hasLoaded: boolean;
  isSyncing: boolean;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'ceo-1',
    name: 'Alexander Sterling',
    role: 'Chief Executive Officer',
    email: 'ceo@multiceno.inc'
  });

  const [dateFilter, setDateFilter] = useState<string>(() => {
    return localStorage.getItem('multiceno_date_filter') || 'All';
  });

  useEffect(() => {
    localStorage.setItem('multiceno_date_filter', dateFilter);
  }, [dateFilter]);

  const [employees, setEmployees] = useState<User[]>([
    { id: 'usr-1', name: 'Sarah Vance', role: 'CFO', email: 'sarah@omnidigital.inc', department: 'Finance', status: 'Active' },
    { id: 'usr-2', name: 'Marcus Chen', role: 'VP Engineering', email: 'marcus@omnidigital.inc', department: 'Engineering', status: 'Active' },
  ]);

  const [finances, setFinances] = useState<Transaction[]>([
    { id: 'txn-1', date: '2026-06-01', description: 'Enterprise Client Retainer', amount: 45000, type: 'Income', category: 'Sales' },
    { id: 'txn-2', date: '2026-06-02', description: 'Cloud Infrastructure', amount: 12000, type: 'Expense', category: 'Operations' },
  ]);

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'inv-1', name: 'MacBook Pro M4', sku: 'HW-MBP-14', category: 'Hardware', quantity: 24, price: 2400, status: 'In Stock', minThreshold: 5 },
    { id: 'inv-2', name: 'Ergonomic Office Chairs', sku: 'FF-CHR-01', category: 'Furniture', quantity: 3, price: 800, status: 'Low Stock', minThreshold: 5 },
  ]);

  const [requests, setRequests] = useState<ApprovalRequest[]>([
    { id: 'req-001', title: 'Q3 Enterprise Marketing Budget', description: 'Requesting allocation of $150k for the targeted EU ad campaign.', recipientEmail: 'sarah@omnidigital.inc', date: '2026-06-02', priority: 'High', status: 'Pending' },
  ]);

  const [schedules, setSchedules] = useState<ScheduleEvent[]>([
    { id: 'evt-1', title: 'Board Members Update', date: '2026-06-05', time: '10:00 AM', type: 'Meeting', attendees: ['CEO', 'CFO', 'CTO'] },
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'INV-2026-042', client: 'Acme Corp', date: '2026-05-28', amount: 84500, status: 'Paid' },
  ]);

  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: '1', name: 'Q3 Financial Strategy.pdf', type: 'application/pdf', size: '2.4 MB', date: '2026-06-01' },
    { id: '2', name: 'Board Presentation Deck.pptx', type: 'application/vnd.mspowerpoint', size: '15.1 MB', date: '2026-05-28' },
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Alpha Redesign', status: 'In Progress', progress: 65, team: 8, deadline: '2026-10-24' },
    { id: '2', name: 'Cloud Migration', status: 'At Risk', progress: 42, team: 5, deadline: '2026-09-30' },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 'task-1', title: 'Prepare Board Deck', description: 'Compile financial slides for Q3 board meeting.', status: 'Todo', priority: 'High', dueDate: '2026-06-15', assignee: 'sarah@omnidigital.inc' },
  ]);

  const [pricings, setPricings] = useState<ProductPricing[]>([
    { id: 'p-1', productName: 'Enterprise License', description: 'Annual site license for Alpha', price: 15000, currency: 'USD', lastUpdated: '2026-06-01' }
  ]);

  const [clients, setClients] = useState<Client[]>([
    { id: 'c-1', name: 'Acme Corp', type: 'Client', email: 'billing@acme.corp', phone: '555-0101', company: 'Acme Corp', status: 'Active' },
    { id: 'c-2', name: 'Office Plus', type: 'Supplier', email: 'sales@officeplus.com', phone: '555-0202', company: 'Office Plus', status: 'Active' }
  ]);

  const [workflows, setWorkflows] = useState<WorkflowAlert[]>([
    { id: 'w-1', name: 'Invoice Overdue Alert', trigger: 'Invoice Overdue', action: 'Send Email', status: 'Active', lastRun: '2026-06-05' },
    { id: 'w-2', name: 'Low Stock Notification', trigger: 'Inventory < 5', action: 'Create Task', status: 'Active', lastRun: '2026-06-04' }
  ]);

  const [okrs, setOkrs] = useState<OKR[]>(() => {
    const saved = localStorage.getItem('multiceno_okrs');
    return saved ? JSON.parse(saved) : [
      { id: 'okr-1', title: 'Scale EU Operations', objective: 'Establish MULTICENO Group presence in Frankfurt and London', progress: 45, targetDate: '2026-11-30', status: 'In Progress' },
      { id: 'okr-2', title: 'Ledger Migration', objective: 'Migrate corporate balance ledgers to secure cloud backend databases', progress: 75, targetDate: '2026-09-15', status: 'On Track' },
      { id: 'okr-3', title: 'Operation Efficiency', objective: 'Reduce logistical operational overhead costs by fifteen percent', progress: 10, targetDate: '2026-12-31', status: 'At Risk' }
    ];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('multiceno_audit_logs');
    return saved ? JSON.parse(saved) : [
      { id: 'log-1', timestamp: new Date(Date.now() - 3600000).toLocaleString(), user: 'Alexander Sterling', action: 'User Sign In', module: 'Auth', details: 'CEO session authorized securely.' },
      { id: 'log-2', timestamp: new Date(Date.now() - 7200000).toLocaleString(), user: 'Alexander Sterling', action: 'Synchronized Database', module: 'Sheets Sync', details: 'All structural records synchronized.' },
      { id: 'log-3', timestamp: new Date(Date.now() - 10800000).toLocaleString(), user: 'Sarah Vance', action: 'Requested Budget Approval', module: 'Finance Approval', details: 'Added Q3 Enterprise EU Marketing Budget request ($150,000).' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('multiceno_okrs', JSON.stringify(okrs));
  }, [okrs]);

  useEffect(() => {
    localStorage.setItem('multiceno_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAction = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString(),
      user: currentUser.name || 'Alexander Sterling',
      action,
      module,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addToast(`${action} logged in audit log`, 'info');
  };
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const stateRef = React.useRef({ finances, requests, employees, schedules, inventory, documents, invoices, projects, tasks, pricings, clients, workflows });
  useEffect(() => {
    stateRef.current = { finances, requests, employees, schedules, inventory, documents, invoices, projects, tasks, pricings, clients, workflows };
  }, [finances, requests, employees, schedules, inventory, documents, invoices, projects, tasks, pricings, clients, workflows]);

  const syncAction = async () => {
    try {
      setIsSyncing(true);
      const token = await getAccessToken();
      if (!token) {
        setIsSyncing(false);
        return;
      }
      let spreadsheetId = localStorage.getItem('multiceno_sheet_id');
      if (!spreadsheetId) {
        spreadsheetId = await createSpreadsheet('MULTICENO Data');
        localStorage.setItem('multiceno_sheet_id', spreadsheetId);
      }
      
      const writeAll = async () => {
        const currentData = stateRef.current;
        const fData = currentData.finances.map(f => [f.id, f.date, f.description, f.amount, f.type, f.category]);
        await writeSheetLines(spreadsheetId!, 'Finances!A1:F', [['ID', 'Date', 'Desc', 'Amount', 'Type', 'Category'], ...fData]);

        const rData = currentData.requests.map(r => [r.id, r.title, r.description, r.date, r.status]);
        await writeSheetLines(spreadsheetId!, 'Requests!A1:E', [['ID', 'Title', 'Desc', 'Date', 'Status'], ...rData]);

        const eData = currentData.employees.map(e => [e.id, e.name, e.role, e.email || '', e.department || '', e.status || '']);
        await writeSheetLines(spreadsheetId!, 'Employees!A1:F', [['ID', 'Name', 'Role', 'Email', 'Department', 'Status'], ...eData]);

        const sData = currentData.schedules.map(s => [s.id, s.title, s.date, s.time, s.type, s.attendees.join(',')]);
        await writeSheetLines(spreadsheetId!, 'Schedules!A1:F', [['ID', 'Title', 'Date', 'Time', 'Type', 'Attendees'], ...sData]);

        const iData = currentData.inventory.map(i => [i.id, i.name, i.sku, i.category, i.quantity, i.price, i.status, i.minThreshold ?? 5]);
        await writeSheetLines(spreadsheetId!, 'Inventory!A1:H', [['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Price', 'Status', 'Min Threshold'], ...iData]);

        const dData = currentData.documents.map(d => [d.id, d.name, d.type, d.size, d.date, d.driveLink || '']);
        await writeSheetLines(spreadsheetId!, 'Documents!A1:F', [['ID', 'Name', 'Type', 'Size', 'Date', 'DriveLink'], ...dData]);

        const inData = currentData.invoices.map(i => [i.id, i.client, i.date, i.amount, i.status]);
        await writeSheetLines(spreadsheetId!, 'Invoices!A1:E', [['ID', 'Client', 'Date', 'Amount', 'Status'], ...inData]);
        
        const pData = currentData.projects.map(p => [p.id, p.name, p.status, p.progress.toString(), p.team.toString(), p.deadline]);
        await writeSheetLines(spreadsheetId!, 'Projects!A1:F', [['ID', 'Name', 'Status', 'Progress', 'Team', 'Deadline'], ...pData]);

        const tData = currentData.tasks.map(t => [t.id, t.title, t.description, t.status, t.priority, t.dueDate, t.assignee]);
        await writeSheetLines(spreadsheetId!, 'Tasks!A1:G', [['ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignee'], ...tData]);

        const prData = currentData.pricings.map(p => [p.id, p.productName, p.description, p.price.toString(), p.currency, p.lastUpdated]);
        await writeSheetLines(spreadsheetId!, 'Pricing!A1:F', [['ID', 'Product Name', 'Description', 'Price', 'Currency', 'Last Updated'], ...prData]);

        const cData = currentData.clients.map(c => [c.id, c.name, c.type, c.email, c.phone, c.company, c.status]);
        await writeSheetLines(spreadsheetId!, 'Clients!A1:G', [['ID', 'Name', 'Type', 'Email', 'Phone', 'Company', 'Status'], ...cData]);

        const wData = currentData.workflows.map(w => [w.id, w.name, w.trigger, w.action, w.status, w.lastRun]);
        await writeSheetLines(spreadsheetId!, 'Workflows!A1:F', [['ID', 'Name', 'Trigger', 'Action', 'Status', 'Last Run'], ...wData]);
      };

      await writeAll();
    } catch (e) {
      console.error('Failed to sync to Google Sheets', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const initializeData = async () => {
    try {
      setIsSyncing(true);
      const token = await getAccessToken();
      if (!token) {
        setIsSyncing(false);
        return;
      }
      const sid = localStorage.getItem('multiceno_sheet_id');
      if (sid) {
        // Finances
        try {
          const values = await readSheetLines(sid, 'Finances!A2:F');
          if (values && values.length > 0) {
            setFinances(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              date: row[1] || '',
              description: row[2] || '',
              amount: Number(row[3]) || 0,
              type: (row[4] || 'Income') as any,
              category: row[5] || 'General'
            })));
          }
        } catch (e) {
          console.warn('Failed to load Finances:', e);
        }

        // Requests
        try {
          const values = await readSheetLines(sid, 'Requests!A2:E');
          if (values && values.length > 0) {
            const parsed = values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              title: row[1] || '',
              description: row[2] || '',
              date: row[3] || '',
              status: (row[4] || 'Pending') as any,
              recipientEmail: 'hr@multiceno.inc',
              priority: 'Medium'
            }));
            const deduplicated = Array.from(new Map(parsed.map(item => [item.id, item])).values());
            setRequests(deduplicated);
          }
        } catch (e) {
          console.warn('Failed to load Requests:', e);
        }

        // Employees
        try {
          const values = await readSheetLines(sid, 'Employees!A2:F');
          if (values && values.length > 0) {
            setEmployees(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              name: row[1] || '',
              role: row[2] || '',
              email: row[3] || '',
              department: row[4] || '',
              status: (row[5] || 'Active') as any
            })));
          }
        } catch (e) {
          console.warn('Failed to load Employees:', e);
        }

        // Schedules
        try {
          const values = await readSheetLines(sid, 'Schedules!A2:F');
          if (values && values.length > 0) {
            setSchedules(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              title: row[1] || '',
              date: row[2] || '',
              time: row[3] || '',
              type: (row[4] || 'Meeting') as any,
              attendees: row[5] ? row[5].split(',') : []
            })));
          }
        } catch (e) {
          console.warn('Failed to load Schedules:', e);
        }

        // Inventory
        try {
          const values = await readSheetLines(sid, 'Inventory!A2:G');
          if (values && values.length > 0) {
            setInventory(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              name: row[1] || '',
              sku: row[2] || '',
              category: row[3] || '',
              quantity: Number(row[4]) || 0,
              price: Number(row[5]) || 0,
              status: (row[6] || 'In Stock') as any
            })));
          }
        } catch (e) {
          console.warn('Failed to load Inventory:', e);
        }

        // Documents
        try {
          const values = await readSheetLines(sid, 'Documents!A2:F');
          if (values && values.length > 0) {
            setDocuments(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              name: row[1] || '',
              type: row[2] || '',
              size: row[3] || '',
              date: row[4] || '',
              driveLink: row[5] || ''
            })));
          }
        } catch (e) {
          console.warn('Failed to load Documents:', e);
        }

        // Invoices
        try {
          const values = await readSheetLines(sid, 'Invoices!A2:E');
          if (values && values.length > 0) {
            setInvoices(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              client: row[1] || '',
              date: row[2] || '',
              amount: Number(row[3]) || 0,
              status: (row[4] || 'Pending') as any
            })));
          }
        } catch (e) {
          console.warn('Failed to load Invoices:', e);
        }

        // Projects
        try {
          const values = await readSheetLines(sid, 'Projects!A2:F');
          if (values && values.length > 0) {
            setProjects(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              name: row[1] || '',
              status: (row[2] || 'In Progress') as any,
              progress: Number(row[3]) || 0,
              team: Number(row[4]) || 0,
              deadline: row[5] || ''
            })));
          }
        } catch (e) {
          console.warn('Failed to load Projects:', e);
        }

        // Tasks
        try {
          const values = await readSheetLines(sid, 'Tasks!A2:G');
          if (values && values.length > 0) {
            setTasks(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              title: row[1] || '',
              description: row[2] || '',
              status: (row[3] || 'Todo') as any,
              priority: (row[4] || 'Medium') as any,
              dueDate: row[5] || '',
              assignee: row[6] || ''
            })));
          }
        } catch (e) {
          console.warn('Failed to load Tasks:', e);
        }

        // Pricing
        try {
          const values = await readSheetLines(sid, 'Pricing!A2:F');
          if (values && values.length > 0) {
            setPricings(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              productName: row[1] || '',
              description: row[2] || '',
              price: Number(row[3]) || 0,
              currency: row[4] || 'USD',
              lastUpdated: row[5] || ''
            })));
          }
        } catch (e) {
          console.warn('Failed to load Pricing:', e);
        }
        
        // Clients
        try {
          const values = await readSheetLines(sid, 'Clients!A2:G');
          if (values && values.length > 0) {
            setClients(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              name: row[1] || '',
              type: (row[2] || 'Client') as any,
              email: row[3] || '',
              phone: row[4] || '',
              company: row[5] || '',
              status: (row[6] || 'Active') as any
            })));
          }
        } catch (e) {
          console.warn('Failed to load Clients:', e);
        }

        // Workflows
        try {
          const values = await readSheetLines(sid, 'Workflows!A2:F');
          if (values && values.length > 0) {
            setWorkflows(values.filter(row => row.length > 0 && row[0]).map(row => ({
              id: row[0],
              name: row[1] || '',
              trigger: row[2] || '',
              action: row[3] || '',
              status: (row[4] || 'Active') as any,
              lastRun: row[5] || ''
            })));
          }
        } catch (e) {
          console.warn('Failed to load Workflows:', e);
        }

      } else {
        const spreadsheetId = await createSpreadsheet('MULTICENO Data');
        localStorage.setItem('multiceno_sheet_id', spreadsheetId);
        await new Promise(r => setTimeout(r, 1000));
        // We trigger an initial upload of mock defaults so the spreadsheet starts populated
        const currentData = stateRef.current;
        const fData = currentData.finances.map(f => [f.id, f.date, f.description, f.amount, f.type, f.category]);
        await writeSheetLines(spreadsheetId, 'Finances!A1:F', [['ID', 'Date', 'Desc', 'Amount', 'Type', 'Category'], ...fData]);

        const rData = currentData.requests.map(r => [r.id, r.title, r.description, r.date, r.status]);
        await writeSheetLines(spreadsheetId, 'Requests!A1:E', [['ID', 'Title', 'Desc', 'Date', 'Status'], ...rData]);

        const eData = currentData.employees.map(e => [e.id, e.name, e.role, e.email || '', e.department || '', e.status || '']);
        await writeSheetLines(spreadsheetId, 'Employees!A1:F', [['ID', 'Name', 'Role', 'Email', 'Department', 'Status'], ...eData]);

        const sData = currentData.schedules.map(s => [s.id, s.title, s.date, s.time, s.type, s.attendees.join(',')]);
        await writeSheetLines(spreadsheetId, 'Schedules!A1:F', [['ID', 'Title', 'Date', 'Time', 'Type', 'Attendees'], ...sData]);

        const iData = currentData.inventory.map(i => [i.id, i.name, i.sku, i.category, i.quantity, i.price, i.status]);
        await writeSheetLines(spreadsheetId, 'Inventory!A1:G', [['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Price', 'Status'], ...iData]);

        const dData = currentData.documents.map(d => [d.id, d.name, d.type, d.size, d.date, d.driveLink || '']);
        await writeSheetLines(spreadsheetId, 'Documents!A1:F', [['ID', 'Name', 'Type', 'Size', 'Date', 'DriveLink'], ...dData]);

        const inData = currentData.invoices.map(i => [i.id, i.client, i.date, i.amount, i.status]);
        await writeSheetLines(spreadsheetId, 'Invoices!A1:E', [['ID', 'Client', 'Date', 'Amount', 'Status'], ...inData]);
        
        const pData = currentData.projects.map(p => [p.id, p.name, p.status, p.progress.toString(), p.team.toString(), p.deadline]);
        await writeSheetLines(spreadsheetId, 'Projects!A1:F', [['ID', 'Name', 'Status', 'Progress', 'Team', 'Deadline'], ...pData]);

        const tData = currentData.tasks.map(t => [t.id, t.title, t.description, t.status, t.priority, t.dueDate, t.assignee]);
        await writeSheetLines(spreadsheetId, 'Tasks!A1:G', [['ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignee'], ...tData]);

        const prData = currentData.pricings.map(p => [p.id, p.productName, p.description, p.price.toString(), p.currency, p.lastUpdated]);
        await writeSheetLines(spreadsheetId, 'Pricing!A1:F', [['ID', 'Product Name', 'Description', 'Price', 'Currency', 'Last Updated'], ...prData]);

        const cData = currentData.clients.map(c => [c.id, c.name, c.type, c.email, c.phone, c.company, c.status]);
        await writeSheetLines(spreadsheetId, 'Clients!A1:G', [['ID', 'Name', 'Type', 'Email', 'Phone', 'Company', 'Status'], ...cData]);

        const wData = currentData.workflows.map(w => [w.id, w.name, w.trigger, w.action, w.status, w.lastRun]);
        await writeSheetLines(spreadsheetId, 'Workflows!A1:F', [['ID', 'Name', 'Trigger', 'Action', 'Status', 'Last Run'], ...wData]);
      }
      setHasLoaded(true);
    } catch (e) {
      console.error('Initialization failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetAllData = async () => {
    try {
      setIsSyncing(true);
      setEmployees([]);
      setFinances([]);
      setInventory([]);
      setRequests([]);
      setSchedules([]);
      setInvoices([]);
      setDocuments([]);
      setProjects([]);
      setTasks([]);
      setPricings([]);
      setClients([]);
      setWorkflows([]);

      const sid = localStorage.getItem('multiceno_sheet_id');
      if (sid) {
        await writeSheetLines(sid, 'Finances!A1:F', [['ID', 'Date', 'Desc', 'Amount', 'Type', 'Category']]);
        await writeSheetLines(sid, 'Requests!A1:E', [['ID', 'Title', 'Desc', 'Date', 'Status']]);
        await writeSheetLines(sid, 'Employees!A1:F', [['ID', 'Name', 'Role', 'Email', 'Department', 'Status']]);
        await writeSheetLines(sid, 'Schedules!A1:F', [['ID', 'Title', 'Date', 'Time', 'Type', 'Attendees']]);
        await writeSheetLines(sid, 'Inventory!A1:G', [['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Price', 'Status']]);
        await writeSheetLines(sid, 'Documents!A1:F', [['ID', 'Name', 'Type', 'Size', 'Date', 'DriveLink']]);
        await writeSheetLines(sid, 'Invoices!A1:E', [['ID', 'Client', 'Date', 'Amount', 'Status']]);
        await writeSheetLines(sid, 'Projects!A1:F', [['ID', 'Name', 'Status', 'Progress', 'Team', 'Deadline']]);
        await writeSheetLines(sid, 'Tasks!A1:G', [['ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignee']]);
        await writeSheetLines(sid, 'Pricing!A1:F', [['ID', 'Product Name', 'Description', 'Price', 'Currency', 'Last Updated']]);
        await writeSheetLines(sid, 'Clients!A1:G', [['ID', 'Name', 'Type', 'Email', 'Phone', 'Company', 'Status']]);
        await writeSheetLines(sid, 'Workflows!A1:F', [['ID', 'Name', 'Trigger', 'Action', 'Status', 'Last Run']]);
      }
    } catch (e) {
      console.error('Failed to reset Sheets database', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      employees, setEmployees,
      finances, setFinances,
      inventory, setInventory,
      requests, setRequests,
      schedules, setSchedules,
      invoices, setInvoices,
      documents, setDocuments,
      projects, setProjects,
      tasks, setTasks,
      pricings, setPricings,
      clients, setClients,
      workflows, setWorkflows,
      okrs, setOkrs,
      auditLogs, setAuditLogs,
      logAction,
      syncAction,
      initializeData,
      resetAllData,
      hasLoaded,
      isSyncing,
      toasts,
      addToast,
      removeToast,
      dateFilter,
      setDateFilter
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

