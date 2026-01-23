import { getRecentTransactions, formatCurrency, getStatusColor } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  disbursed: 'Disbursed',
  overdue: 'Overdue',
  completed: 'Completed',
};

export function RecentTransactionsTable() {
  const transactions = getRecentTransactions(8);

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          <p className="text-xs text-muted-foreground">Latest factoring transactions</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Transaction ID</th>
              <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Supplier</th>
              <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Buyer</th>
              <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">Amount</th>
              <th className="text-center text-xs font-medium text-muted-foreground py-3 px-4">Status</th>
              <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, index) => (
              <tr 
                key={txn.id} 
                className={cn(
                  'border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer',
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                )}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{txn.id}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-foreground truncate max-w-[150px] block">{txn.supplierName}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-foreground truncate max-w-[150px] block">{txn.buyerName}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-medium text-foreground">{formatCurrency(txn.amount, txn.currency)}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-center">
                    <span className={cn(
                      'text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1',
                      getStatusColor(txn.status) === 'success' && 'bg-success/10 text-success',
                      getStatusColor(txn.status) === 'primary' && 'bg-primary/10 text-primary',
                      getStatusColor(txn.status) === 'warning' && 'bg-warning/10 text-warning',
                      getStatusColor(txn.status) === 'destructive' && 'bg-destructive/10 text-destructive',
                    )}>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        getStatusColor(txn.status) === 'success' && 'bg-success',
                        getStatusColor(txn.status) === 'primary' && 'bg-primary',
                        getStatusColor(txn.status) === 'warning' && 'bg-warning',
                        getStatusColor(txn.status) === 'destructive' && 'bg-destructive',
                      )} />
                      {statusLabels[txn.status]}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
