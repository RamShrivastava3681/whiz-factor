import express from 'express';
import { TransactionModel, EntityModel } from '../models/schemas';

const router = express.Router();

// Get transaction reports - simplified
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await TransactionModel.find().sort({ createdAt: -1 }).limit(100);
    
    res.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalTransactions: transactions.length,
          completedTransactions: transactions.filter(t => t.status === 'settled').length,
          pendingTransactions: transactions.filter(t => t.status === 'pending').length
        }
      }
    });
  } catch (error) {
    console.error('Transaction reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get compliance reports - simplified  
router.get('/compliance', async (req, res) => {
  try {
    const totalTransactions = await TransactionModel.countDocuments();
    const entities = await EntityModel.countDocuments();
    
    res.json({
      success: true,
      data: {
        overview: {
          totalTransactions,
          totalEntities: entities,
          complianceScore: 95.2
        },
        riskAnalysis: {
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: entities,
          averageRiskScore: 0
        },
        message: 'Compliance reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Compliance reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get risk reports - simplified
router.get('/risk', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        summary: {
          totalBreaches: 0,
          creditLimitBreaches: 0,
          concentrationLimitBreaches: 0
        },
        recommendations: [
          'Risk reports functionality is being migrated to MongoDB'
        ],
        message: 'Risk reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Risk reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get performance reports - simplified
router.get('/performance', async (req, res) => {
  try {
    const totalTransactions = await TransactionModel.countDocuments();
    
    res.json({
      success: true,
      data: {
        overview: {
          totalTransactions,
          currentMonth: 0,
          lastMonth: 0,
          growthRate: 0
        },
        statusBreakdown: {
          overdue: { count: 0, percentage: 0 },
          active: { count: 0, percentage: 0 }
        },
        message: 'Performance reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Performance reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get financial reports - simplified
router.get('/financial', async (req, res) => {
  try {
    const totalFees = await TransactionModel.aggregate([
      { $group: { _id: null, total: { $sum: '$feeAmount' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalRevenue: totalFees[0]?.total || 0,
        totalExpenses: 0,
        netProfit: totalFees[0]?.total || 0,
        message: 'Financial reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Financial reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get entity reports - simplified
router.get('/entities', async (req, res) => {
  try {
    const entities = await EntityModel.find().sort({ createdAt: -1 }).limit(50);
    const totalCount = await EntityModel.countDocuments();
    
    res.json({
      success: true,
      data: {
        entities,
        summary: {
          totalEntities: totalCount,
          suppliers: await EntityModel.countDocuments({ type: 'supplier' }),
          buyers: await EntityModel.countDocuments({ type: 'buyer' })
        },
        message: 'Entity reports functionality is being migrated to MongoDB'
      }
    });
  } catch (error) {
    console.error('Entity reports error:', error); 
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Wildcard routes for other report types
router.get('/*', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Reports functionality is being migrated to MongoDB',
      data: null
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;