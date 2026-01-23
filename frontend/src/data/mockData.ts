// Mock Data Layer for Trade Finance Portal

export interface Supplier {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  creditLimit: number;
  utilization: number;
  feeRate: number;
  reserveRate: number;
  paymentTerms: number;
  country: string;
  createdAt: string;
}

export interface Buyer {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  exposureLimit: number;
  currentExposure: number;
  riskRating: 'low' | 'medium' | 'high';
  country: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  supplierId: string;
  supplierName: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'disbursed' | 'overdue' | 'completed';
  invoiceNumber: string;
  dueDate: string;
  createdAt: string;
  feeAmount: number;
  reserveAmount: number;
}

export interface KPIData {
  totalTransactions: number;
  transactionsTrend: number;
  totalFeesEarned: number;
  feesTrend: number;
  totalReserves: number;
  reserveUtilization: number;
  openClosedRatio: { open: number; closed: number };
}

// Empty data arrays - to be replaced with API calls
export const suppliers: Supplier[] = [];

export const buyers: Buyer[] = [];

export const transactions: Transaction[] = [];

// Empty chart data - to be loaded from API
export const openInvoicesByMonth: { month: string; count: number }[] = [];

export const overdueInvoicesTrend: { month: string; amount: number }[] = [];

export const buyerExposureData: { name: string; exposure: number; limit: number; percentage: number }[] = [];

export const supplierVolumeData: { name: string; volume: number }[] = [];

// Empty KPI Data - to be loaded from API
export const kpiData: KPIData = {
  totalTransactions: 0,
  transactionsTrend: 0,
  totalFeesEarned: 0,
  feesTrend: 0,
  totalReserves: 0,
  reserveUtilization: 0,
  openClosedRatio: { open: 0, closed: 0 },
};

// Get recent transactions
export const getRecentTransactions = (limit: number = 10): Transaction[] => {
  return [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Get status color
export const getStatusColor = (status: Transaction['status']): string => {
  switch (status) {
    case 'completed': return 'success';
    case 'approved': return 'primary';
    case 'disbursed': return 'primary';
    case 'pending': return 'warning';
    case 'overdue': return 'destructive';
    default: return 'muted';
  }
};
