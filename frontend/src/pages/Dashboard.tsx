import { useState, useEffect } from 'react';
import { FileText, DollarSign, Shield, TrendingUp, Download, RefreshCw, AlertTriangle, Bell, Clock } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { OpenInvoicesChart } from '@/components/dashboard/OpenInvoicesChart';
import { OverdueInvoicesChart } from '@/components/dashboard/OverdueInvoicesChart';
import { BuyerExposureChart } from '@/components/dashboard/BuyerExposureChart';
import { SupplierVolumeChart } from '@/components/dashboard/SupplierVolumeChart';
import { RecentTransactionsTable } from '@/components/dashboard/RecentTransactionsTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpTrigger } from '@/components/DashboardHelpSystem';
import { mockDashboardKPIs } from '@/data/demoData';
import { createApiUrl, getApiHeaders } from '@/config/api';

interface DashboardKPIs {
  totalTransactions: { value: number; change: number; trend: 'up' | 'down' };
  totalFeesEarned: { value: number; change: number; trend: 'up' | 'down'; currency: string };
  totalReserves: { value: number; change: number; trend: 'up' | 'down'; currency: string };
  portfolioUtilization: { value: number; change: number; trend: 'up' | 'down'; unit: string };
  totalDueAmount: { value: number; change: number; trend: 'up' | 'down'; currency: string };
}

interface DashboardAlert {
  id: string;
  type: 'overdue' | 'due_today' | 'due_tomorrow';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  amount: number;
  metadata: {
    invoiceId: string;
    supplierName: string;
    agingDays?: number;
    lateFees?: number;
    totalDue?: number;
    dueDate: string;
  };
  timestamp: string;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Fetch KPI data
      const metricsResponse = await fetch(createApiUrl('/treasury/dashboard-metrics'), {
        headers: getApiHeaders()
      });
      
      // Fetch alerts data
      const alertsResponse = await fetch(createApiUrl('/treasury/dashboard-alerts'), {
        headers: getApiHeaders()
      });
      
      if (metricsResponse.ok) {
        const result = await metricsResponse.json();
        setKpis(result.data);
      } else {
        // Fallback to demo data if API fails
        setKpis(mockDashboardKPIs);
      }

      if (alertsResponse.ok) {
        const alertsResult = await alertsResponse.json();
        setAlerts(alertsResult.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to demo data
      setKpis(mockDashboardKPIs);
    }
    
    setLastUpdated(new Date());
    setTimeout(() => setLoading(false), 500);
  };

  useEffect(() => {
    loadDashboardData();
    
    // Listen for refresh events from transaction creation
    const handleRefresh = () => {
      console.log('Dashboard refreshing due to transaction update...');
      loadDashboardData();
    };
    
    window.addEventListener('refreshTransactions', handleRefresh);
    window.addEventListener('refreshEntities', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefresh);
      window.removeEventListener('refreshEntities', handleRefresh);
    };
  }, []);

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleExportSnapshot = () => {
    console.log('Exporting dashboard snapshot...');
    // Implementation for PDF/PNG export
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue': return AlertTriangle;
      case 'due_today': 
      case 'due_tomorrow': return Clock;
      default: return Bell;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-financial-navy">Whizunik Factoring Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time operational intelligence and portfolio oversight
            {lastUpdated && (
              <span className="ml-2 text-xs">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter />
          <HelpTrigger />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportSnapshot}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Transactions"
          value={kpis?.totalTransactions?.value?.toLocaleString() || '0'}
          icon={FileText}
          variant="primary"
          loading={loading}
        />
        <KPICard
          title="Total Due Amount"
          value={kpis?.totalDueAmount ? formatCurrency(kpis.totalDueAmount.value, kpis.totalDueAmount.currency) : '$0'}
          icon={DollarSign}
          variant={kpis?.totalDueAmount?.trend === 'up' ? 'warning' : 'success'}
          loading={loading}
        />
        <KPICard
          title="Total Reserves"
          value={kpis?.totalReserves ? formatCurrency(kpis.totalReserves.value, kpis.totalReserves.currency) : '$0'}
          icon={Shield}
          variant={kpis?.totalReserves?.trend === 'down' ? 'warning' : 'success'}
          loading={loading}
        />
        <KPICard
          title="Portfolio Utilization"
          value={kpis?.portfolioUtilization ? `${kpis.portfolioUtilization.value}%` : '0%'}
          icon={TrendingUp}
          variant={kpis?.portfolioUtilization?.value > 80 ? 'warning' : 'primary'}
          loading={loading}
        />
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Dashboard Alerts
              <Badge variant="destructive" className="ml-2">
                {alerts.filter(alert => alert.severity === 'critical').length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map(alert => (
                <Alert key={alert.id} className={`border-l-4 ${
                  alert.severity === 'critical' 
                    ? 'border-l-red-500 bg-red-50' 
                    : alert.severity === 'high'
                    ? 'border-l-orange-500 bg-orange-50'
                    : 'border-l-yellow-500 bg-yellow-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {alert.type === 'overdue' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-500 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{alert.title}</span>
                          <Badge 
                            variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} 
                            className="text-xs"
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <AlertDescription className="mt-1 text-sm">
                          {alert.message} • {alert.metadata.supplierName}
                        </AlertDescription>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Amount: ${alert.amount.toLocaleString()}</span>
                          {alert.metadata.lateFees && (
                            <span>Late Fees: ${alert.metadata.lateFees.toLocaleString()}</span>
                          )}
                          <span>Due: {new Date(alert.metadata.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
              {alerts.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    View All {alerts.length} Alerts
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid - Financial Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OpenInvoicesChart />
        <OverdueInvoicesChart />
        <BuyerExposureChart />
        <SupplierVolumeChart />
      </div>

      {/* Recent Transactions */}
      <RecentTransactionsTable />
    </div>
  );
}
