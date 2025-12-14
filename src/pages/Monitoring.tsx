import { Bell, AlertTriangle } from 'lucide-react';

export default function Monitoring() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoring & Alerts</h1>
          <p className="text-sm text-muted-foreground">Track thresholds and receive notifications</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          3 Active Alerts
        </div>
      </div>

      <div className="rounded-lg border bg-card p-12 text-center">
        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Monitoring Dashboard</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Monitor open invoices, overdue payments, missing documents, and upcoming maturities. Configure alert thresholds and notification preferences.
        </p>
      </div>
    </div>
  );
}
