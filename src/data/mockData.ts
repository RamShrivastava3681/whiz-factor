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

// Suppliers Mock Data
export const suppliers: Supplier[] = [
  { id: 'SUP001', name: 'Acme Manufacturing Co.', category: 'Manufacturing', status: 'active', creditLimit: 5000000, utilization: 68, feeRate: 2.5, reserveRate: 10, paymentTerms: 30, country: 'United States', createdAt: '2024-01-15' },
  { id: 'SUP002', name: 'Global Textiles Ltd.', category: 'Textiles', status: 'active', creditLimit: 3000000, utilization: 45, feeRate: 2.8, reserveRate: 12, paymentTerms: 45, country: 'India', createdAt: '2024-02-20' },
  { id: 'SUP003', name: 'TechParts International', category: 'Electronics', status: 'active', creditLimit: 8000000, utilization: 82, feeRate: 2.2, reserveRate: 8, paymentTerms: 30, country: 'Germany', createdAt: '2023-11-10' },
  { id: 'SUP004', name: 'Fresh Foods Corp.', category: 'Food & Beverage', status: 'active', creditLimit: 2000000, utilization: 55, feeRate: 3.0, reserveRate: 15, paymentTerms: 15, country: 'Mexico', createdAt: '2024-03-05' },
  { id: 'SUP005', name: 'Steel Works Industries', category: 'Raw Materials', status: 'pending', creditLimit: 10000000, utilization: 0, feeRate: 2.0, reserveRate: 10, paymentTerms: 60, country: 'China', createdAt: '2024-06-01' },
  { id: 'SUP006', name: 'Pacific Logistics', category: 'Logistics', status: 'active', creditLimit: 4000000, utilization: 72, feeRate: 2.5, reserveRate: 10, paymentTerms: 30, country: 'Japan', createdAt: '2023-08-22' },
  { id: 'SUP007', name: 'Euro Chemicals AG', category: 'Chemicals', status: 'active', creditLimit: 6000000, utilization: 38, feeRate: 2.7, reserveRate: 12, paymentTerms: 45, country: 'Switzerland', createdAt: '2024-01-30' },
  { id: 'SUP008', name: 'Sunrise Pharma', category: 'Pharmaceuticals', status: 'inactive', creditLimit: 7000000, utilization: 0, feeRate: 2.3, reserveRate: 10, paymentTerms: 30, country: 'United Kingdom', createdAt: '2023-05-15' },
  { id: 'SUP009', name: 'Nordic Wood Products', category: 'Raw Materials', status: 'active', creditLimit: 3500000, utilization: 61, feeRate: 2.6, reserveRate: 11, paymentTerms: 45, country: 'Sweden', createdAt: '2024-04-12' },
  { id: 'SUP010', name: 'Brazilian Coffee Exports', category: 'Food & Beverage', status: 'active', creditLimit: 2500000, utilization: 88, feeRate: 3.2, reserveRate: 14, paymentTerms: 30, country: 'Brazil', createdAt: '2023-09-08' },
];

// Buyers Mock Data
export const buyers: Buyer[] = [
  { id: 'BUY001', name: 'Walmart Inc.', category: 'Retail', status: 'active', exposureLimit: 15000000, currentExposure: 8500000, riskRating: 'low', country: 'United States', createdAt: '2023-01-10' },
  { id: 'BUY002', name: 'Amazon Marketplace', category: 'E-Commerce', status: 'active', exposureLimit: 20000000, currentExposure: 12000000, riskRating: 'low', country: 'United States', createdAt: '2023-02-15' },
  { id: 'BUY003', name: 'Carrefour SA', category: 'Retail', status: 'active', exposureLimit: 8000000, currentExposure: 5200000, riskRating: 'medium', country: 'France', createdAt: '2023-06-20' },
  { id: 'BUY004', name: 'Tesco PLC', category: 'Retail', status: 'active', exposureLimit: 10000000, currentExposure: 7800000, riskRating: 'low', country: 'United Kingdom', createdAt: '2023-03-12' },
  { id: 'BUY005', name: 'Metro AG', category: 'Wholesale', status: 'active', exposureLimit: 6000000, currentExposure: 4100000, riskRating: 'medium', country: 'Germany', createdAt: '2023-07-25' },
  { id: 'BUY006', name: 'Alibaba Group', category: 'E-Commerce', status: 'active', exposureLimit: 25000000, currentExposure: 18500000, riskRating: 'medium', country: 'China', createdAt: '2023-04-08' },
  { id: 'BUY007', name: 'Costco Wholesale', category: 'Wholesale', status: 'active', exposureLimit: 12000000, currentExposure: 6500000, riskRating: 'low', country: 'United States', createdAt: '2023-05-30' },
  { id: 'BUY008', name: 'AEON Co. Ltd', category: 'Retail', status: 'pending', exposureLimit: 7000000, currentExposure: 0, riskRating: 'low', country: 'Japan', createdAt: '2024-06-01' },
  { id: 'BUY009', name: 'Mercado Libre', category: 'E-Commerce', status: 'active', exposureLimit: 5000000, currentExposure: 4200000, riskRating: 'high', country: 'Argentina', createdAt: '2023-09-15' },
  { id: 'BUY010', name: 'Reliance Retail', category: 'Retail', status: 'active', exposureLimit: 9000000, currentExposure: 5800000, riskRating: 'medium', country: 'India', createdAt: '2023-08-20' },
];

// Transactions Mock Data
export const transactions: Transaction[] = [
  { id: 'TXN001', supplierId: 'SUP001', supplierName: 'Acme Manufacturing Co.', buyerId: 'BUY001', buyerName: 'Walmart Inc.', amount: 1250000, currency: 'USD', status: 'completed', invoiceNumber: 'INV-2024-0001', dueDate: '2024-07-15', createdAt: '2024-06-15', feeAmount: 31250, reserveAmount: 125000 },
  { id: 'TXN002', supplierId: 'SUP002', supplierName: 'Global Textiles Ltd.', buyerId: 'BUY002', buyerName: 'Amazon Marketplace', amount: 850000, currency: 'USD', status: 'disbursed', invoiceNumber: 'INV-2024-0002', dueDate: '2024-08-01', createdAt: '2024-06-20', feeAmount: 23800, reserveAmount: 102000 },
  { id: 'TXN003', supplierId: 'SUP003', supplierName: 'TechParts International', buyerId: 'BUY003', buyerName: 'Carrefour SA', amount: 2100000, currency: 'EUR', status: 'approved', invoiceNumber: 'INV-2024-0003', dueDate: '2024-08-15', createdAt: '2024-07-01', feeAmount: 46200, reserveAmount: 168000 },
  { id: 'TXN004', supplierId: 'SUP004', supplierName: 'Fresh Foods Corp.', buyerId: 'BUY004', buyerName: 'Tesco PLC', amount: 450000, currency: 'GBP', status: 'pending', invoiceNumber: 'INV-2024-0004', dueDate: '2024-07-20', createdAt: '2024-07-05', feeAmount: 13500, reserveAmount: 67500 },
  { id: 'TXN005', supplierId: 'SUP006', supplierName: 'Pacific Logistics', buyerId: 'BUY005', buyerName: 'Metro AG', amount: 680000, currency: 'EUR', status: 'overdue', invoiceNumber: 'INV-2024-0005', dueDate: '2024-06-30', createdAt: '2024-06-01', feeAmount: 17000, reserveAmount: 68000 },
  { id: 'TXN006', supplierId: 'SUP007', supplierName: 'Euro Chemicals AG', buyerId: 'BUY006', buyerName: 'Alibaba Group', amount: 3200000, currency: 'USD', status: 'disbursed', invoiceNumber: 'INV-2024-0006', dueDate: '2024-08-20', createdAt: '2024-07-10', feeAmount: 86400, reserveAmount: 384000 },
  { id: 'TXN007', supplierId: 'SUP009', supplierName: 'Nordic Wood Products', buyerId: 'BUY007', buyerName: 'Costco Wholesale', amount: 920000, currency: 'USD', status: 'completed', invoiceNumber: 'INV-2024-0007', dueDate: '2024-07-25', createdAt: '2024-06-25', feeAmount: 23920, reserveAmount: 101200 },
  { id: 'TXN008', supplierId: 'SUP010', supplierName: 'Brazilian Coffee Exports', buyerId: 'BUY009', buyerName: 'Mercado Libre', amount: 380000, currency: 'USD', status: 'pending', invoiceNumber: 'INV-2024-0008', dueDate: '2024-08-05', createdAt: '2024-07-08', feeAmount: 12160, reserveAmount: 53200 },
  { id: 'TXN009', supplierId: 'SUP001', supplierName: 'Acme Manufacturing Co.', buyerId: 'BUY010', buyerName: 'Reliance Retail', amount: 1650000, currency: 'USD', status: 'approved', invoiceNumber: 'INV-2024-0009', dueDate: '2024-08-25', createdAt: '2024-07-12', feeAmount: 41250, reserveAmount: 165000 },
  { id: 'TXN010', supplierId: 'SUP003', supplierName: 'TechParts International', buyerId: 'BUY001', buyerName: 'Walmart Inc.', amount: 2800000, currency: 'USD', status: 'disbursed', invoiceNumber: 'INV-2024-0010', dueDate: '2024-08-30', createdAt: '2024-07-15', feeAmount: 61600, reserveAmount: 224000 },
  { id: 'TXN011', supplierId: 'SUP002', supplierName: 'Global Textiles Ltd.', buyerId: 'BUY004', buyerName: 'Tesco PLC', amount: 520000, currency: 'GBP', status: 'overdue', invoiceNumber: 'INV-2024-0011', dueDate: '2024-07-01', createdAt: '2024-06-01', feeAmount: 14560, reserveAmount: 62400 },
  { id: 'TXN012', supplierId: 'SUP006', supplierName: 'Pacific Logistics', buyerId: 'BUY002', buyerName: 'Amazon Marketplace', amount: 1100000, currency: 'USD', status: 'completed', invoiceNumber: 'INV-2024-0012', dueDate: '2024-07-10', createdAt: '2024-06-10', feeAmount: 27500, reserveAmount: 110000 },
];

// Chart Data
export const openInvoicesByMonth = [
  { month: 'Jan', count: 45 },
  { month: 'Feb', count: 52 },
  { month: 'Mar', count: 48 },
  { month: 'Apr', count: 61 },
  { month: 'May', count: 55 },
  { month: 'Jun', count: 67 },
  { month: 'Jul', count: 72 },
];

export const overdueInvoicesTrend = [
  { month: 'Jan', amount: 1200000 },
  { month: 'Feb', amount: 980000 },
  { month: 'Mar', amount: 1450000 },
  { month: 'Apr', amount: 1100000 },
  { month: 'May', amount: 890000 },
  { month: 'Jun', amount: 1320000 },
  { month: 'Jul', amount: 1580000 },
];

export const buyerExposureData = [
  { name: 'Walmart Inc.', exposure: 8500000, limit: 15000000, percentage: 57 },
  { name: 'Amazon', exposure: 12000000, limit: 20000000, percentage: 60 },
  { name: 'Alibaba', exposure: 18500000, limit: 25000000, percentage: 74 },
  { name: 'Tesco PLC', exposure: 7800000, limit: 10000000, percentage: 78 },
  { name: 'Mercado Libre', exposure: 4200000, limit: 5000000, percentage: 84 },
];

export const supplierVolumeData = [
  { name: 'TechParts Intl', volume: 4900000 },
  { name: 'Euro Chemicals', volume: 3200000 },
  { name: 'Acme Mfg', volume: 2900000 },
  { name: 'Pacific Logistics', volume: 1780000 },
  { name: 'Global Textiles', volume: 1370000 },
];

// KPI Data
export const kpiData: KPIData = {
  totalTransactions: 156,
  transactionsTrend: 12.5,
  totalFeesEarned: 2847500,
  feesTrend: 8.3,
  totalReserves: 4250000,
  reserveUtilization: 72,
  openClosedRatio: { open: 67, closed: 89 },
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
