import React, { useState, useEffect } from 'react';
import { Banknote, Building, CheckCircle, Clock, DollarSign, Download, Eye, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SupplierPayment {
  supplierId: string;
  supplierName: string;
  bankDetails: {
    beneficiary: string;
    bank: string;
    branch: string;
    accountNumber: string;
    ifscCode: string;
    swiftCode?: string;
    currency: string;
  };
  pendingAmount: number;
  transactionCount: number;
  lastTransactionDate: string;
  status: 'pending' | 'ready' | 'processing';
  transactions: any[];
  setupFeeAmount?: number;
}

interface PayoutHistory {
  id: string;
  supplierId: string;
  amount: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  reference: string;
}

export default function Treasury() {
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<SupplierPayment | null>(null);
  const [payoutDetailsOpen, setPayoutDetailsOpen] = useState(false);
  const [bankConfirmationOpen, setBankConfirmationOpen] = useState(false);
  const [paymentCompletionOpen, setPaymentCompletionOpen] = useState(false);
  const [completedPayout, setCompletedPayout] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSupplierPayments();
    fetchPayoutHistory();
  }, []);

  const fetchPayoutHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/treasury/payouts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setPayoutHistory(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching payout history:', error);
    }
  };

  const fetchSupplierPayments = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching supplier payments from backend...');
      const response = await fetch('http://localhost:3001/api/treasury/supplier-summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Supplier payments data:', result.data);
        
        setSupplierPayments(result.data || []);
        setTotalPendingAmount(result.data?.reduce((sum: number, payment: any) => sum + payment.pendingAmount, 0) || 0);
      } else {
        console.error('Failed to fetch supplier payments:', response.status, response.statusText);
        // Fallback to empty data
        setSupplierPayments([]);
        setTotalPendingAmount(0);
      }
    } catch (error) {
      console.error('Error fetching supplier payments:', error);
      // Fallback to empty data
      setSupplierPayments([]);
      setTotalPendingAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (payment: SupplierPayment) => {
    setSelectedPayment(payment);
    setBankConfirmationOpen(true);
  };

  const confirmAndProcessPayout = async () => {
    if (!selectedPayment) return;

    try {
      setProcessing(selectedPayment.supplierId);
      setBankConfirmationOpen(false);
      
      const payoutData = {
        supplierId: selectedPayment.supplierId,
        amount: selectedPayment.pendingAmount,
        transactionIds: selectedPayment.transactions.map(t => t.id),
        bankDetails: selectedPayment.bankDetails
      };
      
      console.log('Sending payout data:', payoutData);
      console.log('Selected payment:', selectedPayment);
      
      const response = await fetch('http://localhost:3001/api/treasury/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payoutData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Payout response:', result);
        console.log('result.data:', result.data);
        console.log('result.data.payout:', result.data.payout);
        
        setCompletedPayout({
          ...result.data.payout, // Extract the payout object specifically
          supplierName: selectedPayment.supplierName,
          status: result.data.payout?.status || 'completed'
        });
        
        toast.success('Payout initiated successfully!', {
          description: `Payment of ${formatCurrency(selectedPayment.pendingAmount)} to ${selectedPayment.supplierName} is being processed.`
        });
        
        // Show completion popup
        setPaymentCompletionOpen(true);
        
        // Refresh data
        await fetchSupplierPayments();
        await fetchPayoutHistory();
      } else {
        throw new Error('Failed to process payout');
      }
    } catch (error) {
      console.error('Payout error:', error);
      toast.error('Failed to process payout', {
        description: 'Please try again or contact support.'
      });
    } finally {
      setProcessing(null);
    }
  };

  const downloadAcknowledgement = async (payoutId: string) => {
    try {
      console.log(`Attempting to download acknowledgement for payout: ${payoutId}`);
      console.log('completedPayout object:', completedPayout);
      console.log('completedPayout.id:', completedPayout?.id);
      
      if (!payoutId || payoutId === 'undefined') {
        toast.error('Payout ID is missing. Please try initiating the payout again.');
        return;
      }
      const response = await fetch(`http://localhost:3001/api/treasury/payout/${payoutId}/acknowledgement`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Payment_Acknowledgement_${payoutId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Acknowledgement letter downloaded successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Download failed with response:', errorData);
        throw new Error(errorData.message || 'Failed to download acknowledgement');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download acknowledgement letter: ${error.message}`);
    }
  };

  const handleViewDetails = (payment: SupplierPayment) => {
    setSelectedPayment(payment);
    setPayoutDetailsOpen(true);
  };
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-gray-100 text-gray-700 border-gray-300',
      ready: 'bg-green-100 text-green-700 border-green-300',
      processing: 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return variants[status] || variants.pending;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-financial-navy">Treasury Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage supplier payments and bank account details
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Payments
          </Button>
          <Button className="btn-financial">
            <Banknote className="w-4 h-4 mr-2" />
            Process Payments
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {formatCurrency(totalPendingAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {supplierPayments.length} suppliers
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {supplierPayments.filter(p => p.status === 'ready').length}
                </div>
                <p className="text-xs text-success">Suppliers ready</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-financial-navy">
                  {supplierPayments.reduce((sum, p) => sum + p.transactionCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Processed transactions</p>
              </div>
              <Building className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Payments Table */}
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-financial-navy">
            Supplier Payment Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-semibold">Supplier Details</TableHead>
                <TableHead className="font-semibold">Bank Account</TableHead>
                <TableHead className="font-semibold">Payment Amount</TableHead>
                <TableHead className="font-semibold">Transactions</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="space-y-3">
                      <Clock className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
                      <p className="text-muted-foreground">Loading supplier payments...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : supplierPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="space-y-3">
                      <Banknote className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground text-lg">No pending payments</p>
                      <p className="text-sm text-muted-foreground">
                        Supplier payments will appear here after transactions are processed
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                supplierPayments.map((payment) => (
                  <TableRow key={payment.supplierId} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-financial-navy">{payment.supplierName}</p>
                        <p className="text-xs text-muted-foreground">{payment.supplierId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{payment.bankDetails.beneficiary}</p>
                        <p className="text-xs text-muted-foreground">{payment.bankDetails.bank}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.bankDetails.accountNumber} • {payment.bankDetails.ifscCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-success">
                          {formatCurrency(payment.pendingAmount, payment.bankDetails.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">Net after fees</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{payment.transactionCount} transactions</p>
                        {payment.lastTransactionDate && (
                          <p className="text-xs text-muted-foreground">
                            Last: {new Date(payment.lastTransactionDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(payment.status)}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="btn-financial"
                          onClick={() => handleProcessPayout(payment)}
                          disabled={processing === payment.supplierId}
                        >
                          {processing === payment.supplierId ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pay
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payout History Card */}
      {payoutHistory.length > 0 && (
        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-financial-navy flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Recent Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="font-semibold">Reference</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Processed Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutHistory.slice(0, 5).map((payout) => (
                  <TableRow key={payout.id} className="border-border">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-financial-navy">{payout.reference}</p>
                        <p className="text-xs text-muted-foreground">{payout.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-success">
                        {formatCurrency(payout.amount)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(payout.status)}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {payout.processedAt 
                          ? new Date(payout.processedAt).toLocaleDateString()
                          : 'Processing...'
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payout Details Dialog */}
      <Dialog open={payoutDetailsOpen} onOpenChange={setPayoutDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-financial-navy">
              Payout Details - {selectedPayment?.supplierName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              {/* Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bank Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Beneficiary</p>
                      <p className="font-medium">{selectedPayment.bankDetails.beneficiary}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bank</p>
                      <p className="font-medium">{selectedPayment.bankDetails.bank}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-medium">{selectedPayment.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">IFSC Code</p>
                      <p className="font-medium">{selectedPayment.bankDetails.ifscCode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Invoice Amount</TableHead>
                        <TableHead>Advance</TableHead>
                        <TableHead>Fees</TableHead>
                        <TableHead>Net Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPayment.transactions.map((txn, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{txn.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(txn.invoiceDate).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(parseFloat(txn.invoiceAmount) || 0)}</TableCell>
                          <TableCell className="text-blue-600">
                            {formatCurrency(parseFloat(txn.advanceAmount) || 0)}
                          </TableCell>
                          <TableCell className="text-red-600">
                            -{formatCurrency(parseFloat(txn.perTransactionFees || txn.feeAmount) || 0)}
                          </TableCell>
                          <TableCell className="font-bold text-success">
                            {formatCurrency(parseFloat(txn.netAmount) || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {selectedPayment.setupFeeAmount > 0 && (
                        <TableRow className="bg-amber-50">
                          <TableCell colSpan={3}>
                            <div>
                              <p className="font-medium text-sm">Setup Fee (One-time)</p>
                              <p className="text-xs text-muted-foreground">Applied to credit limit</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            -{formatCurrency(selectedPayment.setupFeeAmount)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell colSpan={4}>Total Payment Amount:</TableCell>
                        <TableCell className="text-lg text-success">
                          {formatCurrency(selectedPayment.pendingAmount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setPayoutDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  className="btn-financial"
                  onClick={() => {
                    setPayoutDetailsOpen(false);
                    handleProcessPayout(selectedPayment);
                  }}
                  disabled={processing === selectedPayment.supplierId}
                >
                  {processing === selectedPayment.supplierId ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Process Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bank Account Confirmation Dialog */}
      <Dialog open={bankConfirmationOpen} onOpenChange={setBankConfirmationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-financial-navy flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Confirm Payment Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-financial-navy mb-2">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Supplier:</span>
                    <span className="font-medium">{selectedPayment.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-bold text-success text-lg">
                      {formatCurrency(selectedPayment.pendingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transactions:</span>
                    <span className="font-medium">{selectedPayment.transactionCount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-financial-navy mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Bank Account Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Beneficiary: </span>
                    <span className="font-medium">{selectedPayment.bankDetails.beneficiary}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bank: </span>
                    <span className="font-medium">{selectedPayment.bankDetails.bank}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Branch: </span>
                    <span className="font-medium">{selectedPayment.bankDetails.branch}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account: </span>
                    <span className="font-medium">{selectedPayment.bankDetails.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IFSC: </span>
                    <span className="font-medium">{selectedPayment.bankDetails.ifscCode}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setBankConfirmationOpen(false)}
                  disabled={processing === selectedPayment.supplierId}
                >
                  Cancel
                </Button>
                <Button 
                  className="btn-financial"
                  onClick={confirmAndProcessPayout}
                  disabled={processing === selectedPayment.supplierId}
                >
                  {processing === selectedPayment.supplierId ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Confirm & Pay
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Completion Dialog */}
      <Dialog open={paymentCompletionOpen} onOpenChange={setPaymentCompletionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-success flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Payment Completed!
            </DialogTitle>
          </DialogHeader>
          
          {completedPayout && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-financial-navy mb-2">
                  Payment Successfully Processed
                </h3>
                <p className="text-muted-foreground">
                  Your payment to {completedPayout.supplierName} has been initiated and is being processed.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID:</span>
                    <span className="font-medium">{completedPayout.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-medium">{completedPayout.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-success">
                      {formatCurrency(completedPayout.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className="bg-blue-100 text-blue-700">
                      {completedPayout.status ? 
                        completedPayout.status.charAt(0).toUpperCase() + completedPayout.status.slice(1) : 
                        'Completed'
                      }
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  className="btn-financial w-full"
                  onClick={() => downloadAcknowledgement(completedPayout.id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Acknowledgement Letter
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setPaymentCompletionOpen(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
