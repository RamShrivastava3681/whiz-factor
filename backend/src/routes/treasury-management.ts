import express from 'express';
import {
  DisbursementQueue,
  DisbursementStatus,
  ReserveManagement,
  ReserveStatus,
  LedgerEntry,
  LedgerEntryType,
  ApiResponse,
  Transaction
} from '../models/index';

const router = express.Router();

// In-memory storage for treasury data (in production, this would be a database)
let disbursementQueue: DisbursementQueue[] = [];
let reserveManagement: ReserveManagement[] = [];
let ledgerEntries: LedgerEntry[] = [];

// Mock balances for different accounts
const accountBalances = new Map<string, number>([
  ['treasury-main', 1000000],
  ['reserve-account', 500000],
  ['fee-collection', 250000]
]);

// Helper function to generate unique IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper function to create ledger entry
const createLedgerEntry = (
  transactionId: string,
  entryType: LedgerEntryType,
  amount: number,
  debitAccount: string,
  creditAccount: string,
  description: string,
  createdBy: string,
  reference?: string
): LedgerEntry => {
  const entry: LedgerEntry = {
    id: generateId('ledger'),
    transactionId,
    entryType,
    amount,
    debitAccount,
    creditAccount,
    description,
    ...(reference && { reference }),
    createdAt: new Date(),
    createdBy
  };
  
  ledgerEntries.push(entry);
  
  // Update account balances
  const debitBalance = accountBalances.get(debitAccount) || 0;
  const creditBalance = accountBalances.get(creditAccount) || 0;
  
  accountBalances.set(debitAccount, debitBalance - amount);
  accountBalances.set(creditAccount, creditBalance + amount);
  
  return entry;
};

// Disbursement Queue Routes

// Get all disbursements
router.get('/disbursements', (req, res) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;
    
    let filteredDisbursements = disbursementQueue;
    
    if (status) {
      filteredDisbursements = disbursementQueue.filter(d => d.status === status);
    }
    
    // Sort by created date (newest first)
    filteredDisbursements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedResults = filteredDisbursements.slice(offsetNum, offsetNum + limitNum);
    
    const response: ApiResponse<DisbursementQueue[]> = {
      success: true,
      message: 'Disbursements retrieved successfully',
      data: paginatedResults,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get disbursements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Get disbursement by ID
router.get('/disbursements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const disbursement = disbursementQueue.find(d => d.id === id);
    
    if (!disbursement) {
      return res.status(404).json({
        success: false,
        message: 'Disbursement not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse<DisbursementQueue> = {
      success: true,
      message: 'Disbursement retrieved successfully',
      data: disbursement,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get disbursement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Create disbursement (typically called when transaction is approved)
router.post('/disbursements', (req, res) => {
  try {
    const {
      transactionId,
      amount,
      recipientDetails,
      scheduledDate,
      createdBy = 'system'
    } = req.body;
    
    if (!transactionId || !amount || !recipientDetails) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID, amount, and recipient details are required',
        timestamp: new Date()
      });
    }

    const disbursement: DisbursementQueue = {
      id: generateId('disb'),
      transactionId,
      amount,
      recipientDetails,
      status: DisbursementStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(scheduledDate && { scheduledDate: new Date(scheduledDate) })
    };
    
    disbursementQueue.push(disbursement);

    // Create ledger entry for disbursement queue
    createLedgerEntry(
      transactionId,
      LedgerEntryType.DISBURSEMENT,
      amount,
      'treasury-main',
      'disbursement-queue',
      `Disbursement queued for ${recipientDetails.name}`,
      createdBy,
      disbursement.id
    );

    const response: ApiResponse<DisbursementQueue> = {
      success: true,
      message: 'Disbursement created successfully',
      data: disbursement,
      timestamp: new Date()
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create disbursement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Process disbursement (mark as paid, failed, etc.)
router.put('/disbursements/:id/process', (req, res) => {
  try {
    const { id } = req.params;
    const { status, processedBy, failureReason, reference } = req.body;
    
    const disbursementIndex = disbursementQueue.findIndex(d => d.id === id);
    if (disbursementIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Disbursement not found',
        timestamp: new Date()
      });
    }

    const disbursement = disbursementQueue[disbursementIndex];
    
    if (!disbursement) {
      return res.status(404).json({
        success: false,
        message: 'Disbursement not found',
        timestamp: new Date()
      });
    }
    
    if (disbursement.status !== DisbursementStatus.PENDING && 
        disbursement.status !== DisbursementStatus.PROCESSING) {
      return res.status(400).json({
        success: false,
        message: 'Disbursement cannot be processed in current status',
        timestamp: new Date()
      });
    }

    // Update disbursement
    const updatedDisbursement: DisbursementQueue = {
      ...disbursement,
      status,
      processedAt: new Date(),
      processedBy,
      failureReason: status === DisbursementStatus.FAILED ? failureReason : undefined,
      reference,
      updatedAt: new Date()
    };

    disbursementQueue[disbursementIndex] = updatedDisbursement;

    // Create appropriate ledger entries based on status
    if (status === DisbursementStatus.PAID && disbursement) {
      createLedgerEntry(
        disbursement.transactionId,
        LedgerEntryType.DISBURSEMENT,
        disbursement.amount,
        'disbursement-queue',
        disbursement.recipientDetails.accountNumber,
        `Payment processed to ${disbursement.recipientDetails.name}`,
        processedBy,
        reference
      );
    } else if (status === DisbursementStatus.FAILED && disbursement) {
      createLedgerEntry(
        disbursement.transactionId,
        LedgerEntryType.REVERSAL,
        disbursement.amount,
        'disbursement-queue',
        'treasury-main',
        `Failed disbursement reversed: ${failureReason}`,
        processedBy,
        reference
      );
    }

    const response: ApiResponse<DisbursementQueue> = {
      success: true,
      message: 'Disbursement processed successfully',
      data: updatedDisbursement,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Process disbursement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Reserve Management Routes

// Get all reserves
router.get('/reserves', (req, res) => {
  try {
    const { status, transactionId } = req.query;
    
    let filteredReserves = reserveManagement;
    
    if (status) {
      filteredReserves = reserveManagement.filter(r => r.status === status);
    }
    
    if (transactionId) {
      filteredReserves = filteredReserves.filter(r => r.transactionId === transactionId);
    }
    
    // Sort by held date (newest first)
    filteredReserves.sort((a, b) => b.heldDate.getTime() - a.heldDate.getTime());

    const response: ApiResponse<ReserveManagement[]> = {
      success: true,
      message: 'Reserves retrieved successfully',
      data: filteredReserves,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get reserves error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Create reserve hold
router.post('/reserves', (req, res) => {
  try {
    const {
      transactionId,
      reserveAmount,
      reservePercentage,
      releaseDate,
      createdBy
    } = req.body;
    
    if (!transactionId || (!reserveAmount && !reservePercentage)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and reserve amount/percentage are required',
        timestamp: new Date()
      });
    }

    const reserve: ReserveManagement = {
      id: generateId('reserve'),
      transactionId,
      reserveAmount: reserveAmount || 0,
      reservePercentage: reservePercentage || 0,
      heldDate: new Date(),
      status: ReserveStatus.HELD,
      releasedAmount: 0,
      createdBy,
      ...(releaseDate && { releaseDate: new Date(releaseDate) })
    };
    
    reserveManagement.push(reserve);

    // Create ledger entry for reserve hold
    createLedgerEntry(
      transactionId,
      LedgerEntryType.RESERVE_HOLD,
      reserve.reserveAmount,
      'treasury-main',
      'reserve-account',
      `Reserve held for transaction ${transactionId}`,
      createdBy,
      reserve.id
    );

    const response: ApiResponse<ReserveManagement> = {
      success: true,
      message: 'Reserve created successfully',
      data: reserve,
      timestamp: new Date()
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create reserve error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Release reserve
router.put('/reserves/:id/release', (req, res) => {
  try {
    const { id } = req.params;
    const { releaseAmount, releaseReason, releasedBy } = req.body;
    
    const reserveIndex = reserveManagement.findIndex(r => r.id === id);
    if (reserveIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Reserve not found',
        timestamp: new Date()
      });
    }

    const reserve = reserveManagement[reserveIndex];
    
    if (!reserve) {
      return res.status(404).json({
        success: false,
        message: 'Reserve not found',
        timestamp: new Date()
      });
    }
    
    if (reserve.status === ReserveStatus.RELEASED) {
      return res.status(400).json({
        success: false,
        message: 'Reserve is already fully released',
        timestamp: new Date()
      });
    }

    const remainingAmount = reserve.reserveAmount - reserve.releasedAmount;
    const amountToRelease = releaseAmount || remainingAmount;
    
    if (amountToRelease > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Release amount exceeds remaining reserve amount',
        timestamp: new Date()
      });
    }

    const newReleasedAmount = reserve.releasedAmount + amountToRelease;
    const newStatus = newReleasedAmount >= reserve.reserveAmount 
      ? ReserveStatus.RELEASED 
      : ReserveStatus.PARTIALLY_RELEASED;

    const updatedReserve: ReserveManagement = {
      ...reserve,
      releasedAmount: newReleasedAmount,
      status: newStatus,
      actualReleaseDate: new Date(),
      releaseReason,
      releasedBy
    };

    reserveManagement[reserveIndex] = updatedReserve;

    // Create ledger entry for reserve release
    if (reserve) {
      createLedgerEntry(
        reserve.transactionId,
        LedgerEntryType.RESERVE_RELEASE,
        amountToRelease,
        'reserve-account',
        'treasury-main',
        `Reserve released: ${releaseReason || 'Manual release'}`,
        releasedBy,
        reserve.id
      );
    }

    const response: ApiResponse<ReserveManagement> = {
      success: true,
      message: 'Reserve released successfully',
      data: updatedReserve,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Release reserve error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Ledger Routes

// Get ledger entries
router.get('/ledger', (req, res) => {
  try {
    const { transactionId, entryType, limit = '100', offset = '0' } = req.query;
    
    let filteredEntries = ledgerEntries;
    
    if (transactionId) {
      filteredEntries = filteredEntries.filter(entry => entry.transactionId === transactionId);
    }
    
    if (entryType) {
      filteredEntries = filteredEntries.filter(entry => entry.entryType === entryType);
    }
    
    // Sort by created date (newest first)
    filteredEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedResults = filteredEntries.slice(offsetNum, offsetNum + limitNum);

    const response: ApiResponse<LedgerEntry[]> = {
      success: true,
      message: 'Ledger entries retrieved successfully',
      data: paginatedResults,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get ledger entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Get account balances
router.get('/balances', (req, res) => {
  try {
    const balances = Object.fromEntries(accountBalances);
    
    // Calculate derived metrics
    const totalReserved = reserveManagement
      .filter(r => r.status === ReserveStatus.HELD || r.status === ReserveStatus.PARTIALLY_RELEASED)
      .reduce((sum, r) => sum + (r.reserveAmount - r.releasedAmount), 0);
    
    const pendingDisbursements = disbursementQueue
      .filter(d => d.status === DisbursementStatus.PENDING || d.status === DisbursementStatus.PROCESSING)
      .reduce((sum, d) => sum + d.amount, 0);

    const summary = {
      accounts: balances,
      metrics: {
        totalReserved,
        pendingDisbursements,
        availableLiquidity: (balances['treasury-main'] || 0) - pendingDisbursements
      },
      lastUpdated: new Date()
    };

    const response: ApiResponse = {
      success: true,
      message: 'Account balances retrieved successfully',
      data: summary,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Treasury Dashboard Summary
router.get('/dashboard', (req, res) => {
  try {
    const totalDisbursements = disbursementQueue.length;
    const pendingDisbursements = disbursementQueue.filter(d => 
      d.status === DisbursementStatus.PENDING || d.status === DisbursementStatus.PROCESSING
    ).length;
    
    const totalReserves = reserveManagement.length;
    const activeReserves = reserveManagement.filter(r => 
      r.status === ReserveStatus.HELD || r.status === ReserveStatus.PARTIALLY_RELEASED
    ).length;
    
    const totalReservedAmount = reserveManagement
      .filter(r => r.status === ReserveStatus.HELD || r.status === ReserveStatus.PARTIALLY_RELEASED)
      .reduce((sum, r) => sum + (r.reserveAmount - r.releasedAmount), 0);
    
    const totalPendingAmount = disbursementQueue
      .filter(d => d.status === DisbursementStatus.PENDING || d.status === DisbursementStatus.PROCESSING)
      .reduce((sum, d) => sum + d.amount, 0);

    const recentLedgerEntries = ledgerEntries
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    const dashboard = {
      summary: {
        totalDisbursements,
        pendingDisbursements,
        totalReserves,
        activeReserves,
        totalReservedAmount,
        totalPendingAmount,
        availableLiquidity: (accountBalances.get('treasury-main') || 0) - totalPendingAmount
      },
      recentActivity: recentLedgerEntries,
      accountBalances: Object.fromEntries(accountBalances)
    };

    const response: ApiResponse = {
      success: true,
      message: 'Treasury dashboard data retrieved successfully',
      data: dashboard,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get treasury dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Bulk operations for treasury management
router.post('/disbursements/bulk-process', (req, res) => {
  try {
    const { disbursementIds, action, processedBy, reason } = req.body;
    
    if (!disbursementIds || !Array.isArray(disbursementIds) || disbursementIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Disbursement IDs array is required',
        timestamp: new Date()
      });
    }

    const results: Array<{ id: any; status: string; data: DisbursementQueue }> = [];
    const errors: Array<{ id: any; error: string }> = [];

    for (const id of disbursementIds) {
      try {
        const disbursementIndex = disbursementQueue.findIndex(d => d.id === id);
        if (disbursementIndex === -1) {
          errors.push({ id, error: 'Disbursement not found' });
          continue;
        }

        const disbursement = disbursementQueue[disbursementIndex];
        
        if (!disbursement) {
          errors.push({ id, error: 'Disbursement not found' });
          continue;
        }
        
        if (disbursement.status !== DisbursementStatus.PENDING && 
            disbursement.status !== DisbursementStatus.PROCESSING) {
          errors.push({ id, error: 'Invalid status for processing' });
          continue;
        }

        // Update disbursement
        const updatedDisbursement: DisbursementQueue = {
          ...disbursement,
          status: action,
          processedAt: new Date(),
          processedBy,
          failureReason: action === DisbursementStatus.FAILED ? reason : undefined,
          reference: `bulk-${Date.now()}`,
          updatedAt: new Date()
        };

        disbursementQueue[disbursementIndex] = updatedDisbursement;

        // Create ledger entry
        if (action === DisbursementStatus.PAID && disbursement) {
          createLedgerEntry(
            disbursement.transactionId,
            LedgerEntryType.DISBURSEMENT,
            disbursement.amount,
            'disbursement-queue',
            disbursement.recipientDetails.accountNumber,
            `Bulk payment processed to ${disbursement.recipientDetails.name}`,
            processedBy,
            updatedDisbursement.reference || undefined
          );
        }

        results.push({ id, status: 'success', data: updatedDisbursement });
      } catch (error) {
        errors.push({ id, error: 'Processing error' });
      }
    }

    const response: ApiResponse = {
      success: true,
      message: `Bulk operation completed. ${results.length} successful, ${errors.length} errors.`,
      data: { results, errors },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Bulk process disbursements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

export default router;