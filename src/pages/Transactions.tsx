import { FileText, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Transactions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions & Documents</h1>
          <p className="text-sm text-muted-foreground">Manage trade finance transactions and documents</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Transaction
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Transaction Management</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Create, track, and manage trade finance transactions. Upload documents, validate invoices, and monitor the complete transaction lifecycle.
        </p>
      </div>
    </div>
  );
}
