export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  PROJECTS = 'PROJECTS',
  EMPLOYEES = 'EMPLOYEES',
  FINANCES = 'FINANCES',
  INVENTORY = 'INVENTORY',
  REQUESTS = 'REQUESTS',
  SCHEDULES = 'SCHEDULES',
  INVOICES = 'INVOICES',
  DOCUMENTS = 'DOCUMENTS',
  TASKS = 'TASKS',
  PRICING = 'PRICING',
  SETTINGS = 'SETTINGS',
  CLIENTS = 'CLIENTS',
  WORKFLOWS = 'WORKFLOWS',
}

export interface Client {
  id: string;
  name: string;
  type: 'Client' | 'Supplier';
  email: string;
  phone: string;
  company: string;
  status: 'Active' | 'Inactive';
}

export interface WorkflowAlert {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'Active' | 'Paused';
  lastRun: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
  department?: string;
  status?: 'Active' | 'On Leave' | 'Terminated';
  avatarUrl?: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  minThreshold?: number;
  supplier?: string;
  shelfLocation?: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  recipientEmail: string;
  date: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'Meeting' | 'Review' | 'Operation';
  attendees: string[];
  calendarEventId?: string;
}

export interface Project {
  id: string;
  name: string;
  status: 'In Progress' | 'Planning' | 'At Risk' | 'Completed';
  progress: number;
  team: number;
  deadline: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  driveLink?: string;
}

export interface Invoice {
  id: string;
  client: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  assignee: string;
}

export interface ProductPricing {
  id: string;
  productName: string;
  description: string;
  price: number;
  currency: string;
  lastUpdated: string;
}

export interface OKR {
  id: string;
  title: string;
  objective: string;
  progress: number;
  targetDate: string;
  status: 'In Progress' | 'On Track' | 'At Risk' | 'Completed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}
