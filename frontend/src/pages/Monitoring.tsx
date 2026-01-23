import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, TrendingUp, Eye, Bell, CheckCircle, XCircle, DollarSign, Calendar, Clock, RefreshCw, FileText } from 'lucide-react';
import { mockAlerts, mockTransactions } from '@/data/demoData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import InvoicePaymentDialog from '@/components/forms/InvoicePaymentDialog';
import InvoiceClosureDialog from '@/components/forms/InvoiceClosureDialog';

interface TransactionMonitoring {
  id: string;
  transactionId: string;
  healthStatus: 'healthy' | 'warning' | 'critical';
  agingDays: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
  isOverdue: boolean;
  overdueBy?: number;
  riskScore?: number;
  lastUpdated: string;
}

interface SystemAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  entityId?: string;
  entityType?: 'transaction' | 'buyer' | 'supplier';
  transactionId?: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  expiresAt?: string;
}

interface RiskIndicator {
  id: string;
  entityId: string;
  entityType: 'buyer' | 'supplier';
  indicatorType: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  value: number;
  threshold: number;
  isActive: boolean;
  detectedAt: string;
  lastUpdated: string;
}

interface OpenInvoice {
  id: string;
  transactionId?: string;
  payoutId: string;
  supplierId: string;
  supplierName: string;
  invoiceAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'closed' | 'expired';
  agingDays: number;
  lateFees?: number;
  paymentHistory: Array<{
    id: string;
    amount: number;
    paidAt: string;
    paidBy: string;
    reference?: string;
    notes?: string;
  }>;
  alerts: Array<{
    id: string;
    alertType: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    isRead: boolean;
    isResolved: boolean;
    createdAt: string;
  }>;
  reference: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  closedAt?: string;
  closedBy?: string;
  closureNotes?: string;
}

interface MonitoringDashboard {
  healthSummary: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    overdue: number;
  };
  recentAlerts: SystemAlert[];
  activeRisks: RiskIndicator[];
  highRiskTransactions: TransactionMonitoring[];
  agingAnalysis: {
    '0-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
  lastUpdated: string;
}

export default function Monitoring() {
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [transactionMonitoring, setTransactionMonitoring] = useState<TransactionMonitoring[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [riskIndicators, setRiskIndicators] = useState<RiskIndicator[]>([]);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [closedInvoices, setClosedInvoices] = useState<OpenInvoice[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    partiallyPaid: 0,
    totalAmount: 0,
    totalRemaining: 0
  });
  const [closedInvoiceSummary, setClosedInvoiceSummary] = useState({
    total: 0,
    totalAmount: 0,
    totalPaidAmount: 0,
    totalLateFees: 0
  });
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dialog states
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [bulkResolveDialogOpen, setBulkResolveDialogOpen] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadMonitoringData().catch(console.error);
    loadOpenInvoices();
  }, []);

  useEffect(() => {
    if (activeTab === 'open-invoices') {
      loadOpenInvoices();
    } else if (activeTab === 'closed-invoices') {
      loadClosedInvoices();
    }
  }, [activeTab]);

  const loadClosedInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/treasury/closed-invoices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setClosedInvoices(result.data || []);
        setClosedInvoiceSummary(result.summary || {
          total: 0,
          totalAmount: 0,
          totalPaidAmount: 0,
          totalLateFees: 0
        });
      }
    } catch (error) {
      console.error('Failed to load closed invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadOpenInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/treasury/open-invoices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setOpenInvoices(result.data || []);
        setInvoiceSummary(result.summary || {
          total: 0,
          pending: 0,
          overdue: 0,
          partiallyPaid: 0,
          totalAmount: 0,
          totalRemaining: 0
        });
      }
    } catch (error) {
      console.error('Failed to load open invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handlePaymentRecorded = (updatedInvoice: OpenInvoice, payment: any) => {
    setOpenInvoices(prev => 
      prev.map(invoice => 
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      )
    );
    loadOpenInvoices(); // Refresh to get updated summary
  };

  const handleInvoiceClosed = (closedInvoice: OpenInvoice) => {
    // Force immediate state update with closed status
    setOpenInvoices(prev => 
      prev.map(invoice => 
        invoice.id === closedInvoice.id ? { ...invoice, ...closedInvoice, status: 'closed' } : invoice
      )
    );
    
    // Refresh data after a brief delay
    setTimeout(() => {
      loadOpenInvoices();
    }, 500);
  };

  const getInvoiceStatusBadge = (status: string) => {
    const config = {
      pending: { className: 'bg-blue-100 text-blue-800', icon: Clock },
      partially_paid: { className: 'bg-yellow-100 text-yellow-800', icon: DollarSign },
      paid: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { className: 'bg-red-100 text-red-800', icon: AlertTriangle },
      closed: { className: 'bg-gray-100 text-gray-800', icon: XCircle },
      expired: { className: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.pending;
    const Icon = statusConfig.icon;
    
    return (
      <Badge className={statusConfig.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const loadMonitoringData = async () => {
    setLoading(true);
    
    try {
      // Fetch real transactions data from backend
      const transactionsResponse = await fetch('http://localhost:3001/api/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      let transactions = [];
      if (transactionsResponse.ok) {
        const transactionsResult = await transactionsResponse.json();
        transactions = transactionsResult.data || [];
      }

      // Fetch alerts data (you can replace with real API call)
      setAlerts(mockAlerts);
      
      // Create transaction monitoring data from real transactions
      const transactionMonitoringData = transactions.map((txn: any) => {
        const createdDate = new Date(txn.createdAt);
        const today = new Date();
        const agingDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const getAgingBucket = (days: number) => {
          if (days <= 30) return '0-30' as const;
          if (days <= 60) return '31-60' as const;
          if (days <= 90) return '61-90' as const;
          return '90+' as const;
        };

        const getHealthStatus = (status: string, aging: number) => {
          if (status === 'overdue' || aging > 60) return 'critical' as const;
          if (status === 'pending_approval' || aging > 30) return 'warning' as const;
          return 'healthy' as const;
        };

        return {
          id: `MON-${txn.id}`,
          transactionId: txn.id,
          healthStatus: getHealthStatus(txn.status, agingDays),
          agingDays,
          agingBucket: getAgingBucket(agingDays),
          isOverdue: txn.status === 'overdue' || agingDays > 45,
          overdueBy: txn.status === 'overdue' ? agingDays - 30 : undefined,
          riskScore: txn.riskLevel === 'high' ? 85 : txn.riskLevel === 'medium' ? 65 : 35,
          lastUpdated: txn.updatedAt || txn.createdAt
        };
      });
      
      setTransactionMonitoring(transactionMonitoringData);
      
      // Create risk indicators
      const riskIndicatorsData = [
      {
        id: 'RISK-001',
        entityId: 'BYR-003',
        entityType: 'buyer' as const,
        indicatorType: 'credit_utilization',
        description: 'High credit utilization detected',
        severity: 'warning' as const,
        value: 85,
        threshold: 80,
        isActive: true,
        detectedAt: '2026-01-04T10:30:00Z',
        lastUpdated: '2026-01-05T08:00:00Z'
      },
      {
        id: 'RISK-002',
        entityId: 'BYR-005',
        entityType: 'buyer' as const,
        indicatorType: 'payment_delay',
        description: 'Payment consistently delayed',
        severity: 'critical' as const,
        value: 15,
        threshold: 10,
        isActive: true,
        detectedAt: '2026-01-01T14:20:00Z',
        lastUpdated: '2026-01-05T09:15:00Z'
      }
    ];
    
    setRiskIndicators(riskIndicatorsData);
    
    // Set dashboard summary
    const criticalAlerts = mockAlerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = mockAlerts.filter(a => a.severity === 'warning').length;
    const overdueTransactions = transactionMonitoringData.filter(t => t.isOverdue).length;
    
    setDashboard({
      healthSummary: {
        total: transactionMonitoringData.length,
        healthy: transactionMonitoringData.filter(t => t.healthStatus === 'healthy').length,
        warning: transactionMonitoringData.filter(t => t.healthStatus === 'warning').length,
        critical: transactionMonitoringData.filter(t => t.healthStatus === 'critical').length,
        overdue: overdueTransactions
      },
      recentAlerts: mockAlerts,
      activeRisks: riskIndicatorsData,
      highRiskTransactions: transactionMonitoringData.filter(t => (t.riskScore || 0) > 70),
      agingAnalysis: {
        '0-30': transactionMonitoringData.filter(t => t.agingBucket === '0-30').length,
        '31-60': transactionMonitoringData.filter(t => t.agingBucket === '31-60').length,
        '61-90': transactionMonitoringData.filter(t => t.agingBucket === '61-90').length,
        '90+': transactionMonitoringData.filter(t => t.agingBucket === '90+').length
      },
      lastUpdated: new Date().toISOString()
    });
    
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      // Fallback to mock data on error
      setAlerts(mockAlerts);
      setTransactionMonitoring([]);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleResolveAlert = () => {
    if (!selectedAlert) return;
    
    // Update the alert in local state
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === selectedAlert.id 
          ? { ...alert, isResolved: true, resolvedBy: 'current-user', resolvedAt: new Date().toISOString(), resolutionNotes }
          : alert
      )
    );
    
    setResolveDialogOpen(false);
    setSelectedAlert(null);
    setResolutionNotes('');
  };

  const handleBulkResolve = async () => {
    try {
      const response = await fetch('/api/monitoring/alerts/bulk-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertIds: selectedAlerts,
          resolvedBy: 'current-user',
          resolutionNotes: 'Bulk resolved'
        })
      });
      
      if (response.ok) {
        fetchMonitoringData();
        setBulkResolveDialogOpen(false);
        setSelectedAlerts([]);
      }
    } catch (error) {
      console.error('Error bulk resolving alerts:', error);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/read`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        fetchMonitoringData();
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getHealthStatusBadge = (status: string) => {
    const config = {
      healthy: { variant: 'default' as const, label: 'Healthy', color: 'text-green-600' },
      warning: { variant: 'secondary' as const, label: 'Warning', color: 'text-yellow-600' },
      critical: { variant: 'destructive' as const, label: 'Critical', color: 'text-red-600' }
    };
    
    return config[status as keyof typeof config] || config.warning;
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      info: { variant: 'outline' as const, label: 'Info' },
      warning: { variant: 'secondary' as const, label: 'Warning' },
      critical: { variant: 'destructive' as const, label: 'Critical' }
    };
    
    return config[severity as keyof typeof config] || config.info;
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-pulse text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Risk Monitoring & Oversight</h1>
          <p className="text-sm text-muted-foreground">Real-time transaction health and risk indicators</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Health</TabsTrigger>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
          <TabsTrigger value="risks">Risk Indicators</TabsTrigger>
          <TabsTrigger value="open-invoices">Open Invoices</TabsTrigger>
          <TabsTrigger value="closed-invoices">Closed Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {dashboard && (
            <>
              {/* Health Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.healthSummary.total}</div>
                    <p className="text-xs text-muted-foreground">
                      Under monitoring
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Healthy</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dashboard.healthSummary.healthy}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.healthSummary.total > 0 ? Math.round((dashboard.healthSummary.healthy / dashboard.healthSummary.total) * 100) : 0}% of total
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Warning</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{dashboard.healthSummary.warning}</div>
                    <p className="text-xs text-muted-foreground">
                      Need attention
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{dashboard.healthSummary.critical}</div>
                    <p className="text-xs text-muted-foreground">
                      Immediate action
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{dashboard.healthSummary.overdue}</div>
                    <p className="text-xs text-muted-foreground">
                      Past due date
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Aging Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Aging Analysis</CardTitle>
                  <CardDescription>Distribution of transactions by aging buckets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(dashboard.agingAnalysis).map(([bucket, count]) => {
                      const total = Object.values(dashboard.agingAnalysis).reduce((sum, c) => sum + c, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      
                      return (
                        <div key={bucket} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="font-medium">{bucket} days</span>
                            <Progress value={percentage} className="flex-1 max-w-xs" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{count}</div>
                            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Recent Alerts
                      <Badge variant="secondary">
                        {dashboard.recentAlerts.filter(a => !a.isResolved).length} active
                      </Badge>
                    </CardTitle>
                    <CardDescription>Latest system notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboard.recentAlerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{alert.title}</div>
                            <div className="text-sm text-muted-foreground">{alert.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityBadge(alert.severity).variant}>
                              {getSeverityBadge(alert.severity).label}
                            </Badge>
                            {!alert.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* High Risk Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle>High Risk Transactions</CardTitle>
                    <CardDescription>Transactions with risk score &gt; 70</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboard.highRiskTransactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium font-mono">{transaction.transactionId}</div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.agingDays} days old • {transaction.agingBucket} bucket
                            </div>
                            {transaction.isOverdue && (
                              <div className="text-xs text-red-600">
                                Overdue by {transaction.overdueBy} days
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`font-bold text-lg ${getRiskScoreColor(transaction.riskScore || 0)}`}>
                              {transaction.riskScore || 0}
                            </div>
                            <Badge variant={getHealthStatusBadge(transaction.healthStatus).variant}>
                              {getHealthStatusBadge(transaction.healthStatus).label}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Health Monitoring</CardTitle>
              <CardDescription>Real-time health status of all transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Health Status</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionMonitoring.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono">{transaction.transactionId}</TableCell>
                      <TableCell>
                        <Badge variant={getHealthStatusBadge(transaction.healthStatus).variant}>
                          {getHealthStatusBadge(transaction.healthStatus).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.agingDays} days</div>
                          <div className="text-xs text-muted-foreground">{transaction.agingBucket} bucket</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${getRiskScoreColor(transaction.riskScore || 0)}`}>
                          {transaction.riskScore || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.isOverdue ? (
                          <div className="text-red-600 font-medium">
                            Yes ({transaction.overdueBy}d)
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(transaction.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Active system notifications and alerts</CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedAlerts.length > 0 && (
                    <Dialog open={bulkResolveDialogOpen} onOpenChange={setBulkResolveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          Resolve Selected ({selectedAlerts.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Resolve Alerts</DialogTitle>
                          <DialogDescription>
                            Resolve {selectedAlerts.length} selected alerts
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Are you sure you want to resolve all selected alerts?</p>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setBulkResolveDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleBulkResolve}>
                              Resolve Selected
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAlerts(alerts.filter(a => !a.isResolved).map(a => a.id));
                          } else {
                            setSelectedAlerts([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        {!alert.isResolved && (
                          <input
                            type="checkbox"
                            checked={selectedAlerts.includes(alert.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAlerts([...selectedAlerts, alert.id]);
                              } else {
                                setSelectedAlerts(selectedAlerts.filter(id => id !== alert.id));
                              }
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {!alert.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          )}
                          <div>
                            <div className="font-medium">{alert.title}</div>
                            <div className="text-sm text-muted-foreground">{alert.message}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityBadge(alert.severity).variant}>
                          {getSeverityBadge(alert.severity).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {alert.entityType && (
                          <div className="text-sm">
                            <div>{alert.entityType}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {alert.entityId}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {alert.isResolved ? (
                            <Badge variant="default">Resolved</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                          {!alert.isRead && (
                            <div className="text-xs text-blue-600">Unread</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!alert.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(alert.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          {!alert.isResolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAlert(alert);
                                setResolveDialogOpen(true);
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Alert Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Title</Label>
                                  <p className="font-medium">{alert.title}</p>
                                </div>
                                <div>
                                  <Label>Message</Label>
                                  <p>{alert.message}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Severity</Label>
                                    <div>
                                      <Badge variant={getSeverityBadge(alert.severity).variant}>
                                        {getSeverityBadge(alert.severity).label}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Created</Label>
                                    <p>{new Date(alert.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>
                                {alert.resolutionNotes && (
                                  <div>
                                    <Label>Resolution Notes</Label>
                                    <p className="text-sm bg-muted p-2 rounded">{alert.resolutionNotes}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Resolve Alert Dialog */}
          <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resolve Alert</DialogTitle>
                <DialogDescription>
                  Mark this alert as resolved and provide resolution notes
                </DialogDescription>
              </DialogHeader>
              {selectedAlert && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="font-medium">{selectedAlert.title}</div>
                    <div className="text-sm text-muted-foreground">{selectedAlert.message}</div>
                  </div>
                  <div>
                    <Label htmlFor="resolution-notes">Resolution Notes</Label>
                    <Textarea
                      id="resolution-notes"
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Describe how this alert was resolved..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleResolveAlert}>
                      Resolve Alert
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Indicators</CardTitle>
              <CardDescription>Active risk indicators across entities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Risk Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Value/Threshold</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskIndicators.map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell>
                        <div>
                          <div className="font-mono">{risk.entityId}</div>
                          <Badge variant="outline" className="text-xs">
                            {risk.entityType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{risk.indicatorType}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{risk.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityBadge(risk.severity).variant}>
                          {getSeverityBadge(risk.severity).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          <div>{risk.value.toLocaleString()}</div>
                          <div className="text-muted-foreground">
                            Threshold: {risk.threshold.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(risk.detectedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={risk.isActive ? 'destructive' : 'default'}>
                          {risk.isActive ? 'Active' : 'Resolved'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open-invoices" className="space-y-6">
          {/* Open Invoices Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoiceSummary.total}</div>
                <p className="text-xs text-muted-foreground">
                  Open invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{invoiceSummary.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{invoiceSummary.overdue}</div>
                <p className="text-xs text-muted-foreground">
                  Past due date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Partial Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{invoiceSummary.partiallyPaid}</div>
                <p className="text-xs text-muted-foreground">
                  Partially paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${invoiceSummary.totalAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Invoice value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${invoiceSummary.totalRemaining.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Remaining amount
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Open Invoices Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Open Invoices Tracking</CardTitle>
                <CardDescription>
                  Monitor payment status and aging of open invoices
                </CardDescription>
              </div>
              <Button 
                onClick={loadOpenInvoices} 
                variant="outline" 
                size="sm"
                disabled={invoicesLoading}
              >
                {invoicesLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Aging</TableHead>
                      <TableHead>Late Fees</TableHead>
                      <TableHead>Alerts</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No open invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      openInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="font-mono text-sm">{invoice.id}</div>
                            <div className="text-xs text-muted-foreground">{invoice.reference}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.supplierName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ${invoice.invoiceAmount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-green-600 font-medium">
                              ${invoice.paidAmount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${
                              invoice.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              ${invoice.remainingAmount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getInvoiceStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell>
                            <div className={`text-sm ${
                              invoice.agingDays > 0 ? 'text-red-600 font-medium' : ''
                            }`}>
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {invoice.agingDays > 0 ? (
                                <Badge variant="destructive" className="text-xs">
                                  {invoice.agingDays}d overdue
                                </Badge>
                              ) : invoice.agingDays < 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  Due in {Math.abs(invoice.agingDays)}d
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Due today
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {invoice.lateFees > 0 ? (
                                <div>
                                  <div className="font-medium text-red-600">
                                    ${invoice.lateFees.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-red-500">
                                    Late fee applied
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">$0</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {invoice.alerts.filter(alert => !alert.isResolved).map((alert) => (
                                <Badge 
                                  key={alert.id} 
                                  variant={
                                    alert.severity === 'critical' ? 'destructive' : 
                                    alert.severity === 'warning' ? 'secondary' : 'outline'
                                  }
                                  className="text-xs block w-fit"
                                >
                                  {alert.alertType.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {invoice.status !== 'closed' && (
                                <InvoicePaymentDialog
                                  invoice={invoice}
                                  onPaymentRecorded={handlePaymentRecorded}
                                />
                              )}
                              
                              {(invoice.status === 'paid' || invoice.status === 'partially_paid' || invoice.status === 'overdue') && (
                                <InvoiceClosureDialog
                                  invoice={invoice}
                                  onInvoiceClosed={handleInvoiceClosed}
                                />
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  // Show invoice details in a toast or alert
                                  const details = [
                                    `ID: ${invoice.id}`,
                                    `Supplier: ${invoice.supplierName}`,
                                    `Amount: $${invoice.invoiceAmount?.toLocaleString() || 'N/A'}`,
                                    `Remaining: $${invoice.remainingAmount?.toLocaleString() || 'N/A'}`,
                                    `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
                                    `Status: ${invoice.status.toUpperCase()}`,
                                    invoice.agingDays > 0 ? `Overdue: ${invoice.agingDays} days` : null,
                                    invoice.lateFees ? `Late Fees: $${invoice.lateFees.toLocaleString()}` : null
                                  ].filter(Boolean).join('\n');
                                  
                                  alert(details);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed-invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Closed Invoices</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadClosedInvoices}
                  disabled={invoicesLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${invoicesLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {/* Closed Invoices Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{closedInvoiceSummary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Closed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${closedInvoiceSummary.totalAmount?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${closedInvoiceSummary.totalPaidAmount?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-muted-foreground">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${closedInvoiceSummary.totalLateFees?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-muted-foreground">Late Fees</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Activity className="w-6 h-6 animate-pulse text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Closed Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closedInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No closed invoices found
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      closedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{invoice.id}</div>
                              <div className="text-sm text-muted-foreground">
                                Ref: {invoice.reference || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.supplierName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ${invoice.invoiceAmount?.toLocaleString() || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              ${invoice.paidAmount?.toLocaleString() || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {invoice.closedAt ? new Date(invoice.closedAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getInvoiceStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const details = [
                                    `ID: ${invoice.id}`,
                                    `Supplier: ${invoice.supplierName}`,
                                    `Amount: $${invoice.invoiceAmount?.toLocaleString() || 'N/A'}`,
                                    `Paid: $${invoice.paidAmount?.toLocaleString() || 'N/A'}`,
                                    `Closed Date: ${invoice.closedAt ? new Date(invoice.closedAt).toLocaleDateString() : 'N/A'}`,
                                    `Status: ${invoice.status.toUpperCase()}`,
                                    invoice.lateFees ? `Late Fees: $${invoice.lateFees.toLocaleString()}` : null,
                                    invoice.closureNotes ? `Notes: ${invoice.closureNotes}` : null
                                  ].filter(Boolean).join('\\n');
                                  
                                  alert(details);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
