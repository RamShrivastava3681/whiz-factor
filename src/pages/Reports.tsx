import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Generate and export operational reports</p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-12 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Reports Dashboard</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Access transaction summaries, fee reports, exposure analytics, and more. Filter by date, entity, and currency. Export to PDF, CSV, or Excel.
        </p>
      </div>
    </div>
  );
}
