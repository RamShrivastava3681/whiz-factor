import express from 'express';
import { broadcastNotification } from '../index';
// Import removed - using empty data

const router = express.Router();

// In-memory storage for transactions (replace with database in production)
let transactions: any[] = [];

// Export transactions for cross-module access (temporary until database implementation)
export { transactions };

// Get all transactions - now returns stored transactions
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get recent transactions for dashboard
router.get('/recent', async (req, res) => {
  try {
    // Return recent transactions from stored data
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10); // Get last 10 transactions

    res.json({
      success: true,
      data: recentTransactions
    });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to calculate due date based on financing tenure + BL or invoice date
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

// Create new transaction (maintains demo data)
router.post('/', async (req, res) => {
  try {
    const transactionData = req.body;
    
    // Calculate due date based on financing tenure + BL or invoice date
    let calculatedDueDate = transactionData.dueDate;
    
    if (transactionData.tenureDays && (transactionData.invoiceDate || transactionData.blDate)) {
      calculatedDueDate = calculateDueDate(
        transactionData.invoiceDate,
        transactionData.blDate,
        parseInt(transactionData.tenureDays),
        transactionData.useInvoiceDateForCalculation !== false, // default to true
        transactionData.useBLDateForCalculation === true // default to false
      );
      
      if (calculatedDueDate) {
        console.log(`Due date calculated from tenure: ${calculatedDueDate}`);
      } else {
        console.log('Failed to calculate due date from tenure, using provided due date');
        calculatedDueDate = transactionData.dueDate;
      }
    }
    
    // Calculate net amount (advance amount - fees)
    const invoiceAmount = parseFloat(transactionData.invoiceAmount) || 0;
    const advanceAmount = parseFloat(transactionData.advanceAmount) || 0;
    const feeAmount = parseFloat(transactionData.feeAmount) || 0;
    const netAmount = advanceAmount - feeAmount;
    
    // Generate unique IDs
    const timestamp = Date.now();
    const transactionId = `TXN-${timestamp.toString().slice(-6)}`;
    const invoiceId = `INV-${timestamp.toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    
    // Create new transaction with generated IDs and timestamps
    const newTransaction = {
      id: timestamp.toString(),
      transactionId,
      invoiceId,
      ...transactionData,
      invoiceAmount,
      advanceAmount,
      feeAmount,
      netAmount,
      dueDate: calculatedDueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: transactionData.status || 'pending'
    };

    // Store the transaction
    transactions.push(newTransaction);
    console.log(`Transaction stored: ${newTransaction.transactionId}, Invoice ID: ${newTransaction.invoiceId}`, newTransaction);

    // Send real-time notification
    broadcastNotification({
      id: Date.now().toString(),
      title: 'New Transaction Created',
      message: `Transaction ${newTransaction.transactionId} has been created for ${newTransaction.supplierName}`,
      type: 'success',
      timestamp: new Date().toISOString(),
      actionUrl: '/transactions'
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: newTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;