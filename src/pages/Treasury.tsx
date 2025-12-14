import { Landmark, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Treasury() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treasury & Payouts</h1>
          <p className="text-sm text-muted-foreground">Manage disbursements and liquidity</p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Export Payment Instructions
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-12 text-center">
        <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Treasury Dashboard</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          View payable amounts, manage approvals, and track liquidity. Execute payments with 2-step approval workflow and generate payment instruction files.
        </p>
      </div>
    </div>
  );
}
