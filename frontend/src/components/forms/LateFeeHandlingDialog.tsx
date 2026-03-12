import { createApiUrl, getApiHeaders } from '@/config/api';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface LateFeeHandlingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    supplierName: string;
    invoiceAmount: number;
    paidAmount: number;
    remainingAmount: number;
    lateFees: number;
    reference: string;
    agingDays: number;
    supplierId?: string;
  };
  reserves: number;
  onConfirm: (option: 'add_to_invoice' | 'cut_from_reserves', returnReserves?: boolean) => Promise<void>;
}

export default function LateFeeHandlingDialog({
  open,
  onOpenChange,
  invoice,
  reserves,
  onConfirm
}: LateFeeHandlingDialogProps) {
  const [returnRemainingReserves, setReturnRemainingReserves] = useState(false);
  const [supplierDetails, setSupplierDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reservesFromThisInvoice = invoice.invoiceAmount * 0.20; // 20% of this specific invoice
  const canCutFromReserves = reservesFromThisInvoice >= invoice.lateFees;
  const totalDue = invoice.remainingAmount + invoice.lateFees;
  const newReserves = reservesFromThisInvoice - invoice.lateFees;
  const remainingInvoiceReserves = Math.max(0, reservesFromThisInvoice - invoice.lateFees);

  // Fetch supplier details when dialog opens
  useEffect(() => {
    if (open && invoice.supplierId) {
      fetchSupplierDetails();
    }
  }, [open, invoice.supplierId]);

  const fetchSupplierDetails = async () => {
    try {
      const response = await fetch(createApiUrl(`/entities/suppliers/${invoice.supplierId}`), {
        headers: getApiHeaders()
      });
      const result = await response.json();
      if (result.success) {
        setSupplierDetails(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch supplier details:', error);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm('cut_from_reserves', returnRemainingReserves);
      onOpenChange(false);
    } catch (error) {
      console.error('Error handling late fees:', error);
      toast.error('Failed to process late fees');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Handle Late Fees
          </DialogTitle>
          <DialogDescription>
            This invoice has accrued late fees. Choose how to handle them before closing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Invoice ID:</span>
                <span className="font-mono text-sm">{invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Supplier:</span>
                <span className="font-medium">{invoice.supplierName}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Remaining Amount:</span>
                <span className="font-medium">${invoice.remainingAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Late Fees ({invoice.agingDays} days overdue):</span>
                <span className="font-medium text-red-600">${invoice.lateFees.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-800">Total Due:</span>
                <span className="font-bold text-lg text-red-600">${totalDue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Available Reserves */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900">Available Reserves (This Invoice)</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    ${reservesFromThisInvoice.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    {canCutFromReserves
                      ? `Sufficient reserves available to cover ${invoice.lateFees > 0 ? 'late fees' : 'the amount'}`
                      : `Insufficient reserves. Need $${Math.abs(newReserves).toLocaleString()} more`
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Late Fee Handling */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Late Fee Handling Method:</Label>

            {/* Only Option: Cut from Reserves */}
            <div className="space-y-4">
              <div className={`border rounded-lg p-4 ${canCutFromReserves ? 'bg-blue-50 border-blue-200' : 'opacity-50 cursor-not-allowed bg-gray-50'
                }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-base font-medium text-blue-800">
                      Deduct Late Fees from Reserves
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      The late fees (${invoice.lateFees.toLocaleString()}) will be paid from this invoice's reserves (${reservesFromThisInvoice.toLocaleString()}).
                    </p>
                    <div className="mt-3 ml-4 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-700">
                        <span>Remaining amount (unchanged):</span>
                        <span className="font-medium">${invoice.remainingAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>This invoice's reserves:</span>
                        <span className="font-medium">${reservesFromThisInvoice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Late fees to be deducted:</span>
                        <span className="font-medium text-red-600">-${invoice.lateFees.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700 border-t pt-1">
                        <span>Remaining reserves for this invoice:</span>
                        <span className={`font-medium ${remainingInvoiceReserves > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          ${remainingInvoiceReserves.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {!canCutFromReserves && (
                      <div className="mt-3 text-sm text-red-600 font-medium">
                        ⚠️ Insufficient reserves. Need ${Math.abs(newReserves).toLocaleString()} more
                      </div>
                    )}

                    {/* Reserve Return Option */}
                    {canCutFromReserves && remainingInvoiceReserves > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="returnReserves"
                            checked={returnRemainingReserves}
                            onChange={(e) => setReturnRemainingReserves(e.target.checked)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <Label htmlFor="returnReserves" className="text-sm font-medium cursor-pointer">
                              Return remaining reserves (${remainingInvoiceReserves.toLocaleString()}) to supplier
                            </Label>
                            <p className="text-xs text-blue-700 mt-1">
                              After deducting late fees, the remaining reserves from this invoice will be transferred back to the supplier.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Bank Details - Show when returning reserves */}
          {returnRemainingReserves && supplierDetails && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Supplier Bank Details for Reserve Return
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Beneficiary:</span>
                    <p className="font-medium">{supplierDetails.beneficiary || supplierDetails.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Bank:</span>
                    <p className="font-medium">{supplierDetails.bank || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Account Number:</span>
                    <p className="font-mono font-medium">{supplierDetails.accountNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">IFSC Code:</span>
                    <p className="font-mono font-medium">{supplierDetails.ifscCode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Branch:</span>
                    <p className="font-medium">{supplierDetails.branch || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Currency:</span>
                    <p className="font-medium">{supplierDetails.currency || 'USD'}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white border border-green-300 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-800">Amount to be returned:</span>
                    <span className="text-lg font-bold text-green-600">${remainingInvoiceReserves.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    This amount will be processed for transfer within 2-3 business days
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> Late fees are penalties charged for delayed payments. Choose the option that best aligns with your company's financial policy. The selected option will be applied when the invoice is closed.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || !canCutFromReserves}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Processing...' : 'Confirm & Close Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
