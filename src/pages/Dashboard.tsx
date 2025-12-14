import { FileText, DollarSign, Shield, PieChart } from 'lucide-react';
import { kpiData, formatCurrency } from '@/data/mockData';
import { KPICard } from '@/components/dashboard/KPICard';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { OpenInvoicesChart } from '@/components/dashboard/OpenInvoicesChart';
import { OverdueInvoicesChart } from '@/components/dashboard/OverdueInvoicesChart';
import { BuyerExposureChart } from '@/components/dashboard/BuyerExposureChart';
import { SupplierVolumeChart } from '@/components/dashboard/SupplierVolumeChart';
import { RecentTransactionsTable } from '@/components/dashboard/RecentTransactionsTable';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of trade finance operations</p>
        </div>
        <DateRangeFilter />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Transactions"
          value={kpiData.totalTransactions.toString()}
          trend={kpiData.transactionsTrend}
          trendLabel="vs last month"
          icon={FileText}
          variant="primary"
        />
        <KPICard
          title="Fees Earned"
          value={formatCurrency(kpiData.totalFeesEarned)}
          trend={kpiData.feesTrend}
          trendLabel="vs last month"
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="Total Reserves"
          value={formatCurrency(kpiData.totalReserves)}
          trend={kpiData.reserveUtilization}
          trendLabel="utilization"
          icon={Shield}
          variant="warning"
        />
        <KPICard
          title="Open vs Closed"
          value={`${kpiData.openClosedRatio.open} / ${kpiData.openClosedRatio.closed}`}
          icon={PieChart}
          variant="default"
        />
      </div>

      {/* Charts Grid */}
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
