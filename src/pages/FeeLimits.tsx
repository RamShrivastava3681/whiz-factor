import { Settings2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeeLimits() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee & Limits Configuration</h1>
          <p className="text-sm text-muted-foreground">Configure fees, reserves, and exposure limits</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Configuration
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-12 text-center">
        <Settings2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Fee & Limit Management</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Configure percentage fees, flat fees, reserve percentages, and exposure thresholds. Preview calculations before applying changes.
        </p>
      </div>
    </div>
  );
}
