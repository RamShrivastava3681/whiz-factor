import express from 'express';
import { transactions } from './transactions';
import { entities } from './entities';
import { broadcastNotification } from '../index';

const router = express.Router();

// Get treasury metrics with comprehensive demo data
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      totalLiquidity: 285000000,
      availableFunds: 125000000,
      pendingDisbursements: 18750000,
      totalReserves: 142500000,
      dailyYield: 0.0425, // 4.25% daily yield
      utilizationRate: 0.562, // 56.2% utilization
      concentrationRisk: 0.312, // 31.2% risk level
      creditLines: {
        total: 500000000,
        utilized: 281250000,
        available: 218750000
      }
    };

    res.json({
      success: true,
      message: 'Treasury metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    console.error('Treasury metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get dashboard metrics including invoice data with late fees
router.get('/dashboard-metrics', async (req, res) => {
  try {
    // Calculate metrics from current data
    const totalTransactions = transactions.length;
    
    // Calculate total due amount including late fees
    let totalDueAmount = 0;
    let totalLateFees = 0;
    
    openInvoices.forEach(invoice => {
      const agingDays = calculateAgingDays(invoice.dueDate);
      const supplier = entities.find((e: any) => e.id === invoice.supplierId && e.type === 'supplier');
      const lateFees = calculateLateFees({ ...invoice, agingDays, dueDate: invoice.dueDate }, supplier);
      
      totalDueAmount += (invoice.remainingAmount || 0) + lateFees;
      totalLateFees += lateFees;
    });
    
    const dashboardMetrics = {
      totalTransactions: {
        value: totalTransactions,
        change: 12.5,
        trend: 'up' as const
      },
      totalFeesEarned: {
        value: 125000,
        change: 8.3,
        trend: 'up' as const,
        currency: 'USD'
      },
      totalReserves: {
        value: 2850000,
        change: -3.2,
        trend: 'down' as const,
        currency: 'USD'
      },
      portfolioUtilization: {
        value: 73.5,
        change: 5.8,
        trend: 'up' as const,
        unit: '%'
      },
      totalDueAmount: {
        value: totalDueAmount,
        change: totalLateFees > 0 ? 15.2 : -5.1,
        trend: totalLateFees > 0 ? 'up' as const : 'down' as const,
        currency: 'USD'
      }
    };

    res.json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: dashboardMetrics
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics'
    });
  }
});

// Get dashboard alerts for overdue invoices and critical notifications
router.get('/dashboard-alerts', async (req, res) => {
  try {
    const alerts: any[] = [];
    const now = new Date();

    // Check for overdue invoices
    openInvoices.forEach(invoice => {
      const agingDays = calculateAgingDays(invoice.dueDate);
      const supplier = entities.find((e: any) => e.id === invoice.supplierId && e.type === 'supplier');
      
      if (agingDays > 0) {
        const lateFees = calculateLateFees({ ...invoice, agingDays, dueDate: invoice.dueDate }, supplier);
        
        alerts.push({
          id: `overdue-${invoice.id}`,
          type: 'overdue',
          severity: agingDays > 30 ? 'critical' : agingDays > 14 ? 'high' : 'medium',
          title: 'Overdue Invoice',
          message: `Invoice ${invoice.reference} is ${agingDays} days overdue`,
          amount: invoice.remainingAmount + lateFees,
          metadata: {
            invoiceId: invoice.id,
            supplierName: invoice.supplierName,
            agingDays,
            lateFees,
            totalDue: invoice.remainingAmount + lateFees,
            dueDate: invoice.dueDate
          },
          timestamp: now.toISOString()
        });
      }

      // Check for invoices due today or tomorrow
      const daysUntilDue = Math.ceil((new Date(invoice.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue === 0) {
        alerts.push({
          id: `due-today-${invoice.id}`,
          type: 'due_today',
          severity: 'high',
          title: 'Invoice Due Today',
          message: `Invoice ${invoice.reference} is due today`,
          amount: invoice.remainingAmount,
          metadata: {
            invoiceId: invoice.id,
            supplierName: invoice.supplierName,
            dueDate: invoice.dueDate
          },
          timestamp: now.toISOString()
        });
      } else if (daysUntilDue === 1) {
        alerts.push({
          id: `due-tomorrow-${invoice.id}`,
          type: 'due_tomorrow',
          severity: 'medium',
          title: 'Invoice Due Tomorrow',
          message: `Invoice ${invoice.reference} is due tomorrow`,
          amount: invoice.remainingAmount,
          metadata: {
            invoiceId: invoice.id,
            supplierName: invoice.supplierName,
            dueDate: invoice.dueDate
          },
          timestamp: now.toISOString()
        });
      }
    });

    // Sort alerts by severity and timestamp
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    res.json({
      success: true,
      message: 'Dashboard alerts retrieved successfully',
      data: alerts
    });
  } catch (error) {
    console.error('Dashboard alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard alerts'
    });
  }
});

// Get disbursements with demo data
router.get('/disbursements', async (req, res) => {
  try {
    const disbursements = [
      {
        id: 'DISB001',
        supplier: 'Premium Textiles Ltd',
        amount: 2750000,
        dueDate: '2024-12-28',
        status: 'pending',
        invoiceRef: 'INV-2024-001',
        priority: 'high'
      },
      {
        id: 'DISB002',
        supplier: 'Advanced Components Inc',
        amount: 1850000,
        dueDate: '2024-12-30',
        status: 'approved',
        invoiceRef: 'INV-2024-002',
        priority: 'medium'
      },
      {
        id: 'DISB003',
        supplier: 'Quality Materials Co',
        amount: 3200000,
        dueDate: '2025-01-02',
        status: 'processing',
        invoiceRef: 'INV-2024-003',
        priority: 'medium'
      },
      {
        id: 'DISB004',
        supplier: 'Industrial Solutions',
        amount: 975000,
        dueDate: '2025-01-05',
        status: 'pending',
        invoiceRef: 'INV-2024-004',
        priority: 'low'
      },
      {
        id: 'DISB005',
        supplier: 'Global Logistics Corp',
        amount: 4100000,
        dueDate: '2025-01-08',
        status: 'approved',
        invoiceRef: 'INV-2024-005',
        priority: 'high'
      }
    ];

    res.json({
      success: true,
      data: disbursements
    });
  } catch (error) {
    console.error('Disbursements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disbursements'
    });
  }
});

// Get supplier payment summary (aggregates actual transaction data)
router.get('/supplier-summary', async (req, res) => {
  try {
    // Import transactions from transactions route
    const { transactions } = require('./transactions');
    const { entities } = require('./entities');
    
    const suppliers = entities.filter((e: any) => e.type === 'supplier');
    const supplierPayments = suppliers.map((supplier: any) => {
      // Get all pending transactions for this supplier
      const supplierTransactions = transactions.filter((txn: any) => 
        txn.supplierId === supplier.id && 
        ['pending', 'approved', 'disbursed'].includes(txn.status)
      );
      
      if (supplierTransactions.length === 0) {
        return null;
      }
      
      // Calculate totals from stored transaction data
      let totalInvoiceAmount = 0;
      let totalAdvanceAmount = 0;
      let totalFeeAmount = 0;
      let totalNetAmount = 0;
      
      const transactionDetails = supplierTransactions.map((txn: any) => {
        const invoiceAmount = parseFloat(txn.invoiceAmount) || 0;
        const advanceAmount = parseFloat(txn.advanceAmount) || 0;
        const feeAmount = parseFloat(txn.feeAmount) || 0;
        const netAmount = advanceAmount - feeAmount;
        
        totalInvoiceAmount += invoiceAmount;
        totalAdvanceAmount += advanceAmount;
        totalFeeAmount += feeAmount;
        totalNetAmount += netAmount;
        
        return {
          ...txn,
          invoiceAmount,
          advanceAmount,
          feeAmount,
          netAmount
        };
      });
      
      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        bankDetails: {
          beneficiary: supplier.beneficiary || supplier.name,
          bank: supplier.bankDetails?.bankName || supplier.bank || '',
          branch: supplier.bankDetails?.branchCode || supplier.branch || '',
          accountNumber: supplier.bankDetails?.accountNumber || supplier.accountNumber || '',
          ifscCode: supplier.bankDetails?.ifscCode || supplier.ifscCode || '',
          swiftCode: supplier.bankDetails?.swiftCode || supplier.swiftCode || '',
          currency: supplier.currency || 'USD'
        },
        totalInvoiceAmount,
        totalAdvanceAmount,
        totalFeeAmount,
        pendingAmount: Math.max(0, totalNetAmount),
        transactionCount: supplierTransactions.length,
        transactions: transactionDetails,
        lastTransactionDate: supplierTransactions.length > 0 
          ? supplierTransactions.sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0].createdAt
          : null,
        status: totalNetAmount > 0 ? 'ready' : 'pending'
      };
    }).filter(payment => payment !== null && payment.pendingAmount > 0);
    
    res.json({
      success: true,
      message: 'Supplier payment summary retrieved successfully',
      data: supplierPayments
    });
  } catch (error) {
    console.error('Supplier summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending approvals with demo data
router.get('/approvals', async (req, res) => {
  try {
    const approvals = [
      {
        id: 'APR001',
        type: 'credit_increase',
        entity: 'Tech Innovations Inc',
        currentLimit: 15000000,
        requestedLimit: 20000000,
        requestDate: '2024-12-20',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'APR002',
        type: 'new_supplier',
        entity: 'Manufacturing Excellence Ltd',
        requestedLimit: 5000000,
        requestDate: '2024-12-22',
        priority: 'medium',
        status: 'under_review'
      },
      {
        id: 'APR003',
        type: 'emergency_disbursement',
        entity: 'Premium Textiles Ltd',
        amount: 1200000,
        requestDate: '2024-12-26',
        priority: 'urgent',
        status: 'escalated'
      }
    ];

    res.json({
      success: true,
      message: 'Pending approvals retrieved successfully',
      data: approvals
    });
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// In-memory storage for payouts tracking
let payouts: any[] = [];

// In-memory storage for open invoices tracking
let openInvoices: any[] = [];

// Helper function to calculate due date based on financing tenure + BL or invoice date (same as transactions)
const calculateDueDate = (invoiceDate: string, blDate: string, tenureDays: number, useInvoiceDate: boolean = true, useBLDate: boolean = false): string => {
  // Determine base date for calculation (prefer BL date if specified, otherwise invoice date)
  let baseDate: string | undefined;
  if (useBLDate && blDate) {
    baseDate = blDate;
  } else if (useInvoiceDate && invoiceDate) {
    baseDate = invoiceDate;
  } else {
    // Fallback: prefer invoice date, then BL date
    baseDate = invoiceDate || blDate;
  }

  if (!baseDate || !tenureDays || tenureDays <= 0) {
    console.log('Cannot calculate due date: missing base date or invalid tenure days');
    return '';
  }

  // Calculate due date = base date + financing tenure
  const baseDateObj = new Date(baseDate);
  const dueDate = new Date(baseDateObj);
  dueDate.setDate(dueDate.getDate() + tenureDays);

  const isoString = dueDate.toISOString();
  const datePart = isoString.substring(0, 10); // Get first 10 characters (YYYY-MM-DD)
  console.log(`Calculated due date: ${datePart} (base date: ${baseDate} + ${tenureDays} tenure days)`);
  
  return datePart;
};

// Helper function to calculate late fees based on aging days and supplier settings
const calculateLateFees = (invoice: any, supplier: any): number => {
  console.log('=== Late Fee Calculation Debug ===');
  console.log('Invoice ID:', invoice.id);
  console.log('Supplier:', supplier ? supplier.name : 'Not found');
  console.log('Raw Aging Days (from due date):', invoice.agingDays);
  
  if (!supplier?.lateFees) {
    console.log('No late fees: supplier lateFees not set');
    return 0;
  }
  
  // Calculate effective aging days considering grace period
  const gracePeriodDays = parseInt(supplier.gracePeriodDays) || 0;
  const effectiveAgingDays = calculateEffectiveAgingDays(invoice.dueDate, gracePeriodDays);
  
  console.log('Grace period days:', gracePeriodDays);
  console.log('Effective aging days (after grace):', effectiveAgingDays);
  
  if (effectiveAgingDays <= 0) {
    console.log('No late fees: still within grace period or not overdue');
    return 0;
  }

  const lateFeePercentage = parseFloat(supplier.lateFees) || 0;
  console.log('Late fee settings from supplier:');
  console.log('- Rate:', lateFeePercentage + '%');
  console.log('- Frequency:', supplier.lateFeesFrequency);
  console.log('- Base:', supplier.lateFeesCalculationBase);
  console.log('- Method:', supplier.lateFeesCalculationMethod);
  console.log('- Grace Period:', gracePeriodDays + ' days');
  
  if (lateFeePercentage === 0) return 0;

  // Get base amount for calculation (advance amount or face value)
  const baseAmount = supplier.lateFeesCalculationBase === 'face_value' 
    ? invoice.invoiceAmount 
    : invoice.advanceAmount || (invoice.invoiceAmount * 0.8); // default 80% advance
    
  console.log('Base amount for calculation:', baseAmount);

  // Calculate frequency multiplier using effective aging days
  let frequencyMultiplier = 1;
  if (supplier.lateFeesFrequency === 'annually') {
    frequencyMultiplier = effectiveAgingDays / 365;
  } else if (supplier.lateFeesFrequency === 'monthly') {
    if (supplier.lateFeesCalculationMethod === 'prorated') {
      frequencyMultiplier = effectiveAgingDays / 30;
    } else {
      // Entire month method - charge full monthly rate for any part of month overdue
      frequencyMultiplier = Math.ceil(effectiveAgingDays / 30);
    }
  }
  
  console.log('Frequency multiplier (based on effective aging):', frequencyMultiplier);

  const lateFeeAmount = (baseAmount * lateFeePercentage / 100) * frequencyMultiplier;
  console.log('Calculated late fee:', lateFeeAmount);
  console.log('=== End Late Fee Debug ===');
  
  return Math.max(0, lateFeeAmount);
};

// Helper function to calculate effective aging days after grace period
const calculateEffectiveAgingDays = (dueDate: string, gracePeriodDays: number = 0): number => {
  const now = new Date();
  const due = new Date(dueDate);
  const graceEndDate = new Date(due);
  graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);
  
  const diffTime = now.getTime() - graceEndDate.getTime();
  const effectiveAgingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log(`Grace period calculation: Due=${dueDate}, Grace=${gracePeriodDays}d, Grace ends=${graceEndDate.toISOString().substring(0, 10)}, Effective aging=${Math.max(0, effectiveAgingDays)}d`);
  
  return Math.max(0, effectiveAgingDays); // Return 0 if still within grace period
};

// Helper function to calculate aging days
const calculateAgingDays = (dueDate: string): number => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = now.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to determine invoice status
const determineInvoiceStatus = (invoice: any): string => {
  const agingDays = calculateAgingDays(invoice.dueDate);
  
  if (invoice.remainingAmount <= 0) return 'paid';
  if (invoice.paidAmount > 0 && invoice.remainingAmount > 0) return 'partially_paid';
  if (agingDays > 0) return 'overdue';
  return 'pending';
};

// Helper function to create invoice alerts
const createInvoiceAlerts = (invoice: any): any[] => {
  const alerts: any[] = [];
  const agingDays = calculateAgingDays(invoice.dueDate);
  
  if (agingDays > 0) {
    alerts.push({
      id: `${invoice.id}_overdue`,
      alertType: 'OVERDUE',
      message: `Payment is ${agingDays} day(s) overdue`,
      severity: 'critical',
      isRead: false,
      isResolved: false,
      createdAt: new Date()
    });
  } else if (agingDays >= -7 && agingDays < 0) {
    alerts.push({
      id: `${invoice.id}_due_soon`,
      alertType: 'DUE_SOON',
      message: `Payment due in ${Math.abs(agingDays)} day(s)`,
      severity: 'warning',
      isRead: false,
      isResolved: false,
      createdAt: new Date()
    });
  }
  
  if (invoice.paidAmount > 0 && invoice.remainingAmount > 0) {
    alerts.push({
      id: `${invoice.id}_partial`,
      alertType: 'PARTIAL_PAYMENT',
      message: `Partial payment received. Remaining: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.remainingAmount)}`,
      severity: 'info',
      isRead: false,
      isResolved: false,
      createdAt: new Date()
    });
  }
  
  return alerts;
};

// Process payout for a supplier
router.post('/payout', async (req, res) => {
  try {
    const { supplierId, amount, transactionIds, bankDetails } = req.body;

    // Create payout record
    const payout = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      supplierId,
      amount,
      transactionIds: transactionIds || [],
      bankDetails,
      status: 'processing',
      createdAt: new Date().toISOString(),
      processedAt: null,
      reference: `PAY-${Date.now()}`
    };

    // Store payout
    payouts.push(payout);
    console.log('Created payout:', payout);
    console.log('Stored payouts count:', payouts.length);

    // Get supplier details for open invoice
    const supplier = entities.find((e: any) => e.id === supplierId && e.type === 'supplier');
    
    // Create open invoice for this payout - use proper due date calculation
    let calculatedDueDate = '';
    
    // If we have transaction IDs, get the transaction data to calculate proper due date
    if (transactionIds && transactionIds.length > 0) {
      // Get the first transaction to use for due date calculation
      const firstTransaction = transactions.find((t: any) => t.id === transactionIds[0]);
      if (firstTransaction && firstTransaction.tenureDays) {
        // Use the same calculation logic as transactions
        calculatedDueDate = calculateDueDate(
          firstTransaction.invoiceDate,
          firstTransaction.blDate,
          parseInt(firstTransaction.tenureDays),
          firstTransaction.useInvoiceDateForCalculation !== false,
          firstTransaction.useBLDateForCalculation === true
        );
      }
    }
    
    // Fallback to 30 days if we couldn't calculate from transaction
    if (!calculatedDueDate) {
      const fallbackDueDate = new Date();
      fallbackDueDate.setDate(fallbackDueDate.getDate() + 30);
      calculatedDueDate = fallbackDueDate.toISOString().substring(0, 10);
    }
    
    const openInvoice: any = {
      id: `OI-${Date.now().toString().slice(-6)}`,
      transactionId: transactionIds?.[0] || null,
      payoutId: payout.id,
      supplierId,
      supplierName: supplier?.name || 'Unknown Supplier',
      invoiceAmount: amount,
      paidAmount: 0,
      remainingAmount: amount,
      dueDate: calculatedDueDate,
      status: 'pending',
      agingDays: 0,
      paymentHistory: [],
      alerts: [] as any[],
      reference: payout.reference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'treasury'
    };

    // Calculate initial alerts
    openInvoice.alerts = createInvoiceAlerts(openInvoice);
    
    // Store open invoice
    openInvoices.push(openInvoice);

    // Send real-time notification about payout initiation
    broadcastNotification({
      id: Date.now().toString(),
      title: 'Payout Initiated',
      message: `Payment of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} initiated for supplier`,
      type: 'info',
      timestamp: new Date().toISOString(),
      actionUrl: '/treasury'
    });

    // Send notification about new open invoice
    broadcastNotification({
      id: (Date.now() + 1).toString(),
      title: 'Open Invoice Created',
      message: `New open invoice ${openInvoice.id} created for ${supplier?.name || 'supplier'} - Amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}`,
      type: 'info',
      timestamp: new Date().toISOString(),
      actionUrl: '/monitoring'
    });

    // Update related transactions status to 'paid' when payout is created
    if (transactionIds && transactionIds.length > 0) {
      transactionIds.forEach((txnId: string) => {
        const txnIndex = transactions.findIndex((t: any) => t.id === txnId);
        if (txnIndex !== -1) {
          transactions[txnIndex].status = 'paid';
          transactions[txnIndex].payoutId = payout.id;
          transactions[txnIndex].paidAt = new Date().toISOString();
          console.log(`Transaction ${txnId} marked as paid`);
        }
      });
    }

    // Simulate processing time - in real world, this would be async
    setTimeout(() => {
      const payoutIndex = payouts.findIndex(p => p.id === payout.id);
      if (payoutIndex !== -1) {
        payouts[payoutIndex].status = 'completed';
        payouts[payoutIndex].processedAt = new Date().toISOString();
        console.log(`Payout ${payout.id} completed`);
        
        // Send real-time notification about payout completion
        broadcastNotification({
          id: Date.now().toString() + '_completed',
          title: 'Payout Completed',
          message: `Payment of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} has been completed`,
          type: 'success',
          timestamp: new Date().toISOString(),
          actionUrl: '/treasury'
        });
      }
    }, 3000); // 3 seconds simulation

    const responseData = {
      success: true,
      message: 'Payout initiated successfully',
      data: {
        payout,
        openInvoice
      }
    };
    
    console.log('Sending payout response:', responseData);
    console.log('Payout in response:', responseData.data.payout);
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Process payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payout'
    });
  }
});

// Get payout history
router.get('/payouts', async (req, res) => {
  try {
    const { supplierId } = req.query;
    
    let filteredPayouts = payouts;
    if (supplierId) {
      filteredPayouts = payouts.filter(p => p.supplierId === supplierId);
    }

    res.json({
      success: true,
      data: filteredPayouts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts'
    });
  }
});

// Get payout status
router.get('/payout/:payoutId', async (req, res) => {
  try {
    const { payoutId } = req.params;
    const payout = payouts.find(p => p.id === payoutId);

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    console.error('Get payout status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payout status'
    });
  }
});

// Get all open invoices with filtering
router.get('/open-invoices', async (req, res) => {
  try {
    const { status, supplierId, overdue } = req.query;
    
    // Start with only non-closed invoices
    let filteredInvoices = openInvoices.filter(inv => inv.status !== 'closed');
    
    // Apply additional filters
    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }
    
    if (supplierId) {
      filteredInvoices = filteredInvoices.filter(inv => inv.supplierId === supplierId);
    }
    
    if (overdue === 'true') {
      filteredInvoices = filteredInvoices.filter(inv => {
        const agingDays = calculateAgingDays(inv.dueDate);
        return agingDays > 0;
      });
    }

    // Update invoice status, alerts, and late fees for all invoices
    filteredInvoices = filteredInvoices.map(invoice => {
      const agingDays = calculateAgingDays(invoice.dueDate);
      const status = determineInvoiceStatus(invoice);
      const alerts = createInvoiceAlerts(invoice);
      
      // Find supplier to get late fee settings
      const supplier = entities.find(e => e.id === invoice.supplierId);
      const lateFees = calculateLateFees({ ...invoice, agingDays, dueDate: invoice.dueDate }, supplier);
      
      return {
        ...invoice,
        agingDays,
        status,
        alerts,
        lateFees,
        updatedAt: new Date().toISOString()
      };
    });

    // Sort by due date (most urgent first)
    filteredInvoices.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    res.json({
      success: true,
      data: filteredInvoices,
      summary: {
        total: filteredInvoices.length,
        pending: filteredInvoices.filter(inv => inv.status === 'pending').length,
        overdue: filteredInvoices.filter(inv => inv.status === 'overdue').length,
        partiallyPaid: filteredInvoices.filter(inv => inv.status === 'partially_paid').length,
        totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0),
        totalRemaining: filteredInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
        totalLateFees: filteredInvoices.reduce((sum, inv) => sum + (inv.lateFees || 0), 0)
      }
    });
  } catch (error) {
    console.error('Get open invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch open invoices'
    });
  }
});

// Get all closed invoices
router.get('/closed-invoices', async (req, res) => {
  try {
    // Filter only closed invoices
    let closedInvoices = openInvoices.filter(inv => inv.status === 'closed');
    
    // Sort by closure date (most recent first)
    closedInvoices.sort((a, b) => {
      const aDate = new Date(a.closedAt || a.updatedAt).getTime();
      const bDate = new Date(b.closedAt || b.updatedAt).getTime();
      return bDate - aDate;
    });

    res.json({
      success: true,
      data: closedInvoices,
      summary: {
        total: closedInvoices.length,
        totalAmount: closedInvoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0),
        totalPaidAmount: closedInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
        totalLateFees: closedInvoices.reduce((sum, inv) => sum + (inv.lateFees || 0), 0)
      }
    });
  } catch (error) {
    console.error('Closed invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific open invoice
router.get('/open-invoices/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoiceIndex = openInvoices.findIndex(inv => inv.id === invoiceId);

    if (invoiceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Open invoice not found'
      });
    }

    const invoice = openInvoices[invoiceIndex];
    
    // Update invoice status and alerts
    const agingDays = calculateAgingDays(invoice.dueDate);
    const status = determineInvoiceStatus(invoice);
    const alerts = createInvoiceAlerts(invoice);
    
    const updatedInvoice = {
      ...invoice,
      agingDays,
      status,
      alerts,
      updatedAt: new Date().toISOString()
    };

    // Update the stored invoice
    openInvoices[invoiceIndex] = updatedInvoice;

    res.json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    console.error('Get open invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch open invoice'
    });
  }
});

// Record payment received for an open invoice
router.post('/open-invoices/:invoiceId/payment', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { amount, paidAt, notes, reference } = req.body;

    const invoiceIndex = openInvoices.findIndex(inv => inv.id === invoiceId);

    if (invoiceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Open invoice not found'
      });
    }

    const invoice = openInvoices[invoiceIndex];
    
    // Validate payment amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }
    
    if (amount > invoice.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed remaining amount of ${invoice.remainingAmount}`
      });
    }

    // Create payment record
    const payment = {
      id: `PAY-${Date.now().toString().slice(-8)}`,
      amount,
      paidAt: paidAt || new Date().toISOString(),
      paidBy: 'treasury', // This should come from authenticated user
      reference: reference || `PAY-${Date.now()}`,
      notes,
      createdAt: new Date().toISOString()
    };

    // Update invoice
    const updatedInvoice = {
      ...invoice,
      paidAmount: invoice.paidAmount + amount,
      remainingAmount: invoice.remainingAmount - amount,
      paymentHistory: [...invoice.paymentHistory, payment],
      updatedAt: new Date().toISOString()
    };

    // Update status
    updatedInvoice.status = determineInvoiceStatus(updatedInvoice);
    updatedInvoice.alerts = createInvoiceAlerts(updatedInvoice);

    // Store updated invoice
    openInvoices[invoiceIndex] = updatedInvoice;

    // Send notification
    const supplier = entities.find((e: any) => e.id === invoice.supplierId);
    broadcastNotification({
      id: Date.now().toString(),
      title: 'Payment Received',
      message: `Payment of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} received for invoice ${invoiceId}. Remaining: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(updatedInvoice.remainingAmount)}`,
      type: updatedInvoice.remainingAmount === 0 ? 'success' : 'info',
      timestamp: new Date().toISOString(),
      actionUrl: '/monitoring'
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        invoice: updatedInvoice,
        payment
      }
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment'
    });
  }
});

// Close an open invoice
router.post('/open-invoices/:invoiceId/close', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { closureNotes, forceClose } = req.body;

    const invoiceIndex = openInvoices.findIndex(inv => inv.id === invoiceId);

    if (invoiceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Open invoice not found'
      });
    }

    const invoice = openInvoices[invoiceIndex];
    
    // Calculate total due including late fees
    const totalDue = (invoice.remainingAmount || 0) + (invoice.lateFees || 0);

    // Check if invoice can be closed
    if (totalDue > 0 && !forceClose) {
      return res.status(400).json({
        success: false,
        message: `Cannot close invoice with total remaining amount of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalDue)} (including late fees). Use forceClose if intentional.`
      });
    }

    // Update invoice to closed status
    const closedInvoice = {
      ...invoice,
      status: 'closed',
      closedAt: new Date().toISOString(),
      closedBy: 'treasury', // This should come from authenticated user
      closureNotes: closureNotes || 'Invoice closed by treasury',
      updatedAt: new Date().toISOString()
    };

    openInvoices[invoiceIndex] = closedInvoice;

    // Send notification
    const supplier = entities.find((e: any) => e.id === invoice.supplierId);
    broadcastNotification({
      id: Date.now().toString(),
      title: 'Invoice Closed',
      message: `Invoice ${invoiceId} for ${supplier?.name || 'supplier'} has been closed${invoice.remainingAmount > 0 ? ` with remaining balance of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.remainingAmount)}` : ''}`,
      type: 'success',
      timestamp: new Date().toISOString(),
      actionUrl: '/monitoring'
    });

    res.json({
      success: true,
      message: 'Invoice closed successfully',
      data: closedInvoice
    });
  } catch (error) {
    console.error('Close invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close invoice'
    });
  }
});

// Get invoice audit trail
router.get('/open-invoices/:invoiceId/audit', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = openInvoices.find(inv => inv.id === invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Open invoice not found'
      });
    }

    // Create audit trail from invoice data
    const auditTrail = [
      {
        id: `audit_${invoice.id}_created`,
        action: 'INVOICE_CREATED',
        description: 'Open invoice created from payout',
        performedBy: invoice.createdBy,
        timestamp: invoice.createdAt,
        details: {
          invoiceAmount: invoice.invoiceAmount,
          payoutId: invoice.payoutId,
          dueDate: invoice.dueDate
        }
      },
      // Add payment history to audit trail
      ...invoice.paymentHistory.map(payment => ({
        id: `audit_${payment.id}`,
        action: 'PAYMENT_RECORDED',
        description: `Payment of $${payment.amount.toLocaleString()} recorded`,
        performedBy: payment.paidBy,
        timestamp: payment.createdAt,
        details: {
          amount: payment.amount,
          reference: payment.reference,
          notes: payment.notes
        }
      }))
    ];

    // Add closure event if closed
    if (invoice.closedAt) {
      auditTrail.push({
        id: `audit_${invoice.id}_closed`,
        action: 'INVOICE_CLOSED',
        description: 'Invoice closed',
        performedBy: invoice.closedBy || 'system',
        timestamp: invoice.closedAt,
        details: {
          closureNotes: invoice.closureNotes,
          finalRemainingAmount: invoice.remainingAmount
        }
      });
    }

    // Sort by timestamp
    auditTrail.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    res.json({
      success: true,
      data: auditTrail
    });
  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit trail'
    });
  }
});

// Get invoice analytics
router.get('/open-invoices/analytics', async (req, res) => {
  try {
    const now = new Date();
    
    const analytics = {
      summary: {
        total: openInvoices.length,
        totalAmount: openInvoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0),
        totalRemaining: openInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
        totalPaid: openInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
      },
      statusBreakdown: {
        pending: openInvoices.filter(inv => inv.status === 'pending').length,
        partially_paid: openInvoices.filter(inv => inv.status === 'partially_paid').length,
        paid: openInvoices.filter(inv => inv.status === 'paid').length,
        overdue: openInvoices.filter(inv => inv.status === 'overdue').length,
        closed: openInvoices.filter(inv => inv.status === 'closed').length,
        expired: openInvoices.filter(inv => inv.status === 'expired').length
      },
      agingAnalysis: {
        '0-7': openInvoices.filter(inv => Math.abs(inv.agingDays) <= 7).length,
        '8-30': openInvoices.filter(inv => Math.abs(inv.agingDays) > 7 && Math.abs(inv.agingDays) <= 30).length,
        '31-60': openInvoices.filter(inv => Math.abs(inv.agingDays) > 30 && Math.abs(inv.agingDays) <= 60).length,
        '61-90': openInvoices.filter(inv => Math.abs(inv.agingDays) > 60 && Math.abs(inv.agingDays) <= 90).length,
        '90+': openInvoices.filter(inv => Math.abs(inv.agingDays) > 90).length
      },
      riskMetrics: {
        criticalAlerts: openInvoices.reduce((count, inv) => 
          count + inv.alerts.filter(alert => alert.severity === 'critical' && !alert.isResolved).length, 0
        ),
        expiringSoon: openInvoices.filter(inv => inv.daysUntilExpiry <= 7 && inv.daysUntilExpiry > 0).length,
        overdueAmount: openInvoices
          .filter(inv => inv.status === 'overdue')
          .reduce((sum, inv) => sum + inv.remainingAmount, 0)
      },
      topSuppliers: openInvoices
        .reduce((acc, inv) => {
          const existing = acc.find(s => s.supplierId === inv.supplierId);
          if (existing) {
            existing.invoiceCount += 1;
            existing.totalAmount += inv.invoiceAmount;
            existing.remainingAmount += inv.remainingAmount;
          } else {
            acc.push({
              supplierId: inv.supplierId,
              supplierName: inv.supplierName,
              invoiceCount: 1,
              totalAmount: inv.invoiceAmount,
              remainingAmount: inv.remainingAmount
            });
          }
          return acc;
        }, [] as any[])
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10)
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get invoice analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Generate acknowledgement letter for payout
router.get('/payout/:payoutId/acknowledgement', async (req, res) => {
  try {
    const { payoutId } = req.params;
    console.log(`Generating acknowledgement for payout ID: ${payoutId}`);
    console.log(`Available payouts:`, payouts.map(p => ({ id: p.id, reference: p.reference })));
    
    const payout = payouts.find(p => p.id === payoutId);

    if (!payout) {
      console.log(`Payout not found. Available payout IDs: ${payouts.map(p => p.id).join(', ')}`);
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    console.log(`Found payout:`, payout);
    
    // Get supplier details
    const supplier = entities.find((e: any) => e.id === payout.supplierId && e.type === 'supplier');
    console.log(`Looking for supplier ID: ${payout.supplierId}`);
    console.log(`Available suppliers:`, entities.filter(e => e.type === 'supplier').map(s => ({ id: s.id, name: s.name })));

    if (!supplier) {
      console.log(`Supplier not found. Available supplier IDs: ${entities.filter(e => e.type === 'supplier').map(s => s.id).join(', ')}`);
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    console.log(`Found supplier:`, supplier.name);

    // Get transaction details for fee breakdown
    const payoutTransactions = transactions.filter(txn => 
      payout.transactionIds.includes(txn.id)
    );

    // Calculate fee breakdown totals
    let totalInvoiceAmount = 0;
    let totalAdvanceAmount = 0;
    let totalTransactionFees = 0;
    let totalProcessingFees = 0;
    let totalFactoringFees = 0;
    let totalSetupFees = 0;
    let totalFeeAmount = 0;

    payoutTransactions.forEach(txn => {
      totalInvoiceAmount += parseFloat(txn.invoiceAmount) || 0;
      totalAdvanceAmount += parseFloat(txn.advanceAmount) || 0;
      totalFeeAmount += parseFloat(txn.feeAmount) || 0;
      // Include fee breakdown if available
      totalTransactionFees += parseFloat(txn.transactionFee) || 0;
      totalProcessingFees += parseFloat(txn.processingFee) || 0;
      totalFactoringFees += parseFloat(txn.factoringFee) || 0;
      totalSetupFees += parseFloat(txn.setupFee) || 0;
    });

    // Format currency helper
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2 
      }).format(amount);
    };

    // Generate acknowledgement letter content
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const letterContent = `
PAYMENT ACKNOWLEDGEMENT LETTER

Date: ${currentDate}
Reference: ${payout.reference}
Payout ID: ${payout.id}

Dear ${supplier.name},

We are pleased to confirm that your payment has been successfully processed and transferred to your designated bank account.

PAYMENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Payment Amount: ${formatCurrency(payout.amount)}
Payment Date: ${new Date(payout.processedAt || payout.createdAt).toLocaleDateString()}
Transaction Count: ${payout.transactionIds.length} transactions
Processing Status: ${payout.status.toUpperCase()}

FINANCIAL SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Invoice Amount:        ${formatCurrency(totalInvoiceAmount)}
Total Advance Amount:        ${formatCurrency(totalAdvanceAmount)}

FEE BREAKDOWN:
${totalTransactionFees > 0 ? `Transaction Fees:            ${formatCurrency(totalTransactionFees)}` : ''}
${totalProcessingFees > 0 ? `Processing Fees:             ${formatCurrency(totalProcessingFees)}` : ''}
${totalFactoringFees > 0 ? `Factoring Fees:              ${formatCurrency(totalFactoringFees)}` : ''}
${totalSetupFees > 0 ? `Setup Fees:                  ${formatCurrency(totalSetupFees)}` : ''}
                            ────────────────────
Total Fees Deducted:        ${formatCurrency(totalFeeAmount)}
                            ════════════════════
NET AMOUNT TO SUPPLIER:     ${formatCurrency(payout.amount)}

BANK ACCOUNT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Beneficiary Name: ${payout.bankDetails.beneficiary}
Bank Name: ${payout.bankDetails.bank}
Branch: ${payout.bankDetails.branch}
Account Number: ${payout.bankDetails.accountNumber}
IFSC Code: ${payout.bankDetails.ifscCode}
${payout.bankDetails.swiftCode ? `SWIFT Code: ${payout.bankDetails.swiftCode}` : ''}

TRANSACTION SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This payment covers the following ${payout.transactionIds.length} transaction(s) processed through our factoring facility:

${payoutTransactions.map((txn, index) => `
${index + 1}. Transaction ID: ${txn.transactionId || txn.id}
   Invoice ID: ${txn.invoiceId || 'N/A'}
   Invoice Number: ${txn.invoiceNumber}
   Invoice Amount: ${formatCurrency(parseFloat(txn.invoiceAmount) || 0)}
   Advance Amount: ${formatCurrency(parseFloat(txn.advanceAmount) || 0)}
   Total Fees:     ${formatCurrency(parseFloat(txn.feeAmount) || 0)}
   Net Amount:     ${formatCurrency((parseFloat(txn.advanceAmount) || 0) - (parseFloat(txn.feeAmount) || 0))}
   Invoice Date:   ${new Date(txn.invoiceDate).toLocaleDateString()}
`).join('')}

All applicable fees and charges have been deducted as per the agreed terms and fee structure.

Please retain this acknowledgement for your records. If you have any questions regarding this payment, 
please contact our treasury department with reference number ${payout.reference}.

Thank you for your continued partnership with Whiz Factor Trade Finance.

Sincerely,
Treasury Department
Whiz Factor Trade Finance
Email: treasury@whizfactor.com
Phone: +1-800-WHIZ-FACTOR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automatically generated acknowledgement letter.
Generated on: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    // Set headers for file download
    const fileName = `Payment_Acknowledgement_${payout.reference}_${supplier.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    
    console.log(`Sending acknowledgement file: ${fileName}`);
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(letterContent);

    console.log(`Acknowledgement letter generated successfully for payout ${payoutId}`);

  } catch (error) {
    console.error('Generate acknowledgement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate acknowledgement letter',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Automated alert checking for open invoices
const checkInvoiceAlerts = () => {
  console.log('Checking invoice alerts...');
  
  openInvoices.forEach((invoice, index) => {
    const agingDays = calculateAgingDays(invoice.dueDate);
    
    // Check if we need to send notifications
    let shouldNotify = false;
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType: 'info' | 'warning' | 'error' | 'success' = 'info';
    
    if (agingDays > 0 && invoice.status !== 'overdue') {
      // Payment is overdue
      openInvoices[index].status = 'overdue';
      shouldNotify = true;
      notificationTitle = 'Payment Overdue';
      notificationMessage = `Payment for invoice ${invoice.id} from ${invoice.supplierName} is ${agingDays} day(s) overdue - Amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.remainingAmount)}`;
      notificationType = 'error';
    } else if (agingDays >= -1 && agingDays <= 0 && invoice.status === 'pending') {
      // Payment due today or tomorrow
      shouldNotify = true;
      notificationTitle = 'Payment Due Soon';
      notificationMessage = `Payment for invoice ${invoice.id} from ${invoice.supplierName} is due ${agingDays === 0 ? 'today' : 'tomorrow'} - Amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.remainingAmount)}`;
      notificationType = 'warning';
    }
    
    if (shouldNotify) {
      // Update invoice alerts
      const newAlert = {
        id: `${invoice.id}_${Date.now()}`,
        alertType: agingDays > 0 ? 'OVERDUE' : 'DUE_SOON',
        message: notificationMessage,
        severity: notificationType === 'error' ? 'critical' : notificationType === 'warning' ? 'warning' : 'info',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      };
      
      // Add alert if not already present
      const alertExists = invoice.alerts.some(alert => 
        alert.alertType === newAlert.alertType && !alert.isResolved
      );
      
      if (!alertExists) {
        openInvoices[index].alerts.push(newAlert);
      }
      
      // Send real-time notification
      broadcastNotification({
        id: Date.now().toString() + '_alert',
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        timestamp: new Date().toISOString(),
        actionUrl: '/monitoring'
      });
    }
    
    // Update invoice timestamps
    openInvoices[index].agingDays = agingDays;
    openInvoices[index].updatedAt = new Date().toISOString();
  });
};

// Run alert checking every hour
setInterval(checkInvoiceAlerts, 60 * 60 * 1000);

// Also run it immediately when server starts
setTimeout(checkInvoiceAlerts, 5000); // 5 seconds after server start

export default router;