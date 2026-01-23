import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { XCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface InvoiceClosureDialogProps {
  invoice: {
    id: string;
    supplierName: string;
    invoiceAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    expirationDate: string;
    status: string;
    agingDays: number;
    daysUntilExpiry: number;
    reference: string;
    lateFees?: number;
  };
  onInvoiceClosed?: (invoice: any) => void;
  onClose?: () => void;
}

export default function InvoiceClosureDialog({ invoice, onInvoiceClosed, onClose }: InvoiceClosureDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    closureNotes: '',
    forceClose: false
  });
  const [loading, setLoading] = useState(false);

  const totalDue = (invoice.remainingAmount || 0) + (invoice.lateFees || 0);
  const canClose = totalDue <= 0;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canClose && !formData.forceClose) {
      toast.error('Cannot close invoice with outstanding balance unless force close is enabled');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/treasury/open-invoices/${invoice.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          closureNotes: formData.closureNotes,
          forceClose: formData.forceClose
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Invoice closed successfully');
        onInvoiceClosed?.(result.data);
        setOpen(false);
        setFormData({
          closureNotes: '',
          forceClose: false
        });
      } else {
        toast.error(result.message || 'Failed to close invoice');
      }
    } catch (error) {
      console.error('Close invoice error:', error);
      toast.error('Failed to close invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={canClose ? "default" : "destructive"} 
          size="sm"
          className={canClose ? "" : "hover:bg-red-600"}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Close Invoice
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Close Invoice - {invoice.id}
          </DialogTitle>
          <DialogDescription>
            {canClose 
              ? "This invoice is ready to be closed as all payments have been received."
              : "Warning: This invoice has an outstanding balance. Force close will mark it as closed despite the remaining amount."
            }
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Supplier:</span>
              <span className="font-medium">{invoice.supplierName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Reference:</span>
              <span className="font-mono text-sm">{invoice.reference}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className={getStatusColor(invoice.status)}>
                {getStatusIcon(invoice.status)}
                <span className="ml-1 capitalize">{invoice.status.replace('_', ' ')}</span>
              </Badge>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Invoice Amount:</span>
                <span className="font-medium">${invoice.invoiceAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paid Amount:</span>
                <span className="text-green-600 font-medium">${invoice.paidAmount.toLocaleString()}</span>
              </div>
              
              {invoice.lateFees && invoice.lateFees > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Late Fees:</span>
                    <span className="text-red-600 font-medium">${invoice.lateFees.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-red-500 pl-4">
                    Applied due to {invoice.agingDays} days overdue
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Due:</span>
                <span className={((invoice.remainingAmount || 0) + (invoice.lateFees || 0)) > 0 ? "text-red-600 font-medium text-lg" : "text-green-600 font-medium text-lg"}>
                  ${((invoice.remainingAmount || 0) + (invoice.lateFees || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Due Date:</span>
                <span className={invoice.agingDays > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                </span>
              </div>
              
              {invoice.agingDays > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Overdue by:</span>
                  <span className="text-red-600 font-medium">{invoice.agingDays} day(s)</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!canClose && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-amber-800 font-medium">Outstanding Balance Warning</h4>
                <p className="text-amber-700 text-sm mt-1">
                  This invoice has an outstanding balance of ${invoice.remainingAmount.toLocaleString()}. 
                  Closing this invoice will mark it as resolved, but the remaining amount will not be collected.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="closureNotes">Closure Notes</Label>
            <Textarea
              id="closureNotes"
              placeholder="Add notes about why this invoice is being closed"
              value={formData.closureNotes}
              onChange={(e) => setFormData({ ...formData, closureNotes: e.target.value })}
              rows={3}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              {canClose 
                ? "Optional: Add any final notes about this closure"
                : "Required: Explain why this invoice is being force closed"
              }
            </p>
          </div>

          {!canClose && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="forceClose"
                checked={formData.forceClose}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, forceClose: checked === true })
                }
              />
              <Label 
                htmlFor="forceClose" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand this will close the invoice with an outstanding balance of ${invoice.remainingAmount.toLocaleString()}
              </Label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (!canClose && !formData.forceClose)}
              variant={canClose ? "default" : "destructive"}
            >
              {loading ? 'Closing...' : 'Close Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}