import { getRecentTransactions, formatCurrency, getStatusColor } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { FileText, ArrowRight, Mail, Eye, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  disbursed: 'Disbursed',
  overdue: 'Overdue',
  completed: 'Completed',
};

export function RecentTransactionsTable() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        // Sort by creation date and take last 8
        const sorted = data.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 8);
        setTransactions(sorted);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Fallback to mock data
      setTransactions(getRecentTransactions(8));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    // Listen for refresh events
    const handleRefresh = () => fetchTransactions();
    window.addEventListener('refreshTransactions', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefresh);
    };
  }, []);

  const getNOAStatusBadge = (transaction: any) => {
    const noaStatus = transaction.noaStatus;
    
    if (!noaStatus || noaStatus === 'not-sent') {
      return null;
    }

    const statusConfig: Record<string, { icon: React.ReactNode; label: string; variant: string }> = {
      'sent': { icon: <Mail className="w-3 h-3" />, label: 'NOA Sent', variant: 'secondary' },
      'viewed': { icon: <Eye className="w-3 h-3" />, label: 'Viewed', variant: 'default' },
      'signed': { icon: <CheckCircle className="w-3 h-3" />, label: 'Signed', variant: 'default' }
    };

    const config = statusConfig[noaStatus];
    if (!config) return null;

    return (
      <Badge variant={config.variant as any} className="text-xs flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getMainTransactionStatus = (transaction: any) => {
    // If NOA is signed, show as approved for funding
    if (transaction.noaStatus === 'signed') {
      return { status: 'approved', label: 'Approved for Funding' };
    }
    
    // If NOA is pending, show as pending NOA
    if (transaction.noaStatus === 'sent' || transaction.noaStatus === 'delivered') {
      return { status: 'pending', label: 'Pending NOA' };
    }
    
    // If transaction status is approved (after NOA signing)
    if (transaction.status === 'approved') {
      return { status: 'approved', label: 'Approved for Funding' };
    }
    
    // Default status
    return { status: transaction.status || 'pending', label: statusLabels[transaction.status] || 'Pending' };
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
            <p className="text-xs text-muted-foreground">Latest factoring transactions</p>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading transactions...</div>
        </div>
      </div>
    );
  }

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
              <th className="text-center text-xs font-medium text-muted-foreground py-3 px-4">NOA</th>
              <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, index) => {
              const mainStatus = getMainTransactionStatus(txn);
              return (
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
                      <span className="text-sm font-medium text-foreground">{txn.transactionId || txn.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground truncate max-w-[150px] block">{txn.supplierName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground truncate max-w-[150px] block">{txn.buyerName}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {txn.currency} {parseFloat(txn.invoiceAmount || txn.amount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center">
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1',
                        getStatusColor(mainStatus.status) === 'success' && 'bg-success/10 text-success',
                        getStatusColor(mainStatus.status) === 'primary' && 'bg-primary/10 text-primary',
                        getStatusColor(mainStatus.status) === 'warning' && 'bg-warning/10 text-warning',
                        getStatusColor(mainStatus.status) === 'destructive' && 'bg-destructive/10 text-destructive',
                      )}>
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          getStatusColor(mainStatus.status) === 'success' && 'bg-success',
                          getStatusColor(mainStatus.status) === 'primary' && 'bg-primary',
                          getStatusColor(mainStatus.status) === 'warning' && 'bg-warning',
                          getStatusColor(mainStatus.status) === 'destructive' && 'bg-destructive',
                        )} />
                        {mainStatus.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center">
                      {getNOAStatusBadge(txn) || (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-muted-foreground">
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
