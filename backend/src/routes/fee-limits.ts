import express from 'express';
import {
  FeeConfiguration,
  FeeTier,
  FeeType,
  LimitConfiguration,
  LimitType,
  TransactionFee,
  ApiResponse
} from '../models/index';

const router = express.Router();

// In-memory storage for fees and limits (in production, this would be a database)
let feeConfigurations: FeeConfiguration[] = [];
let limitConfigurations: LimitConfiguration[] = [];
let transactionFees: TransactionFee[] = [];

// Initialize with comprehensive demo configurations
const initializeDefaults = () => {
  if (feeConfigurations.length === 0) {
    feeConfigurations = [
      {
        id: 'fee-1',
        name: 'Standard Processing Fee',
        description: 'Standard 2.5% processing fee for all transactions under $50K',
        type: FeeType.PERCENTAGE,
        isActive: true,
        percentage: 2.5,
        minAmount: 50,
        maxAmount: 5000,
        applicableTo: { transactionCategories: ['standard'] },
        version: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-12-01T00:00:00Z'),
        createdBy: 'admin@tradeflow.com'
      },
      {
        id: 'fee-2',
        name: 'High Value Flat Fee',
        description: 'Flat $1,500 fee for transactions $50K - $500K',
        type: FeeType.FLAT,
        isActive: true,
        flatAmount: 1500,
        applicableTo: { transactionCategories: ['high-value'] },
        version: 2,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-11-15T00:00:00Z'),
        createdBy: 'admin@tradeflow.com'
      },
      {
        id: 'fee-3',
        name: 'Premium Tier Percentage',
        description: 'Reduced 1.8% fee for transactions above $500K',
        type: FeeType.PERCENTAGE,
        isActive: true,
        percentage: 1.8,
        minAmount: 2000,
        maxAmount: 15000,
        applicableTo: { transactionCategories: ['premium'] },
        version: 1,
        createdAt: new Date('2024-03-01T00:00:00Z'),
        updatedAt: new Date('2024-10-15T00:00:00Z'),
        createdBy: 'admin@tradeflow.com'
      },
      {
        id: 'fee-4',
        name: 'Express Processing Fee',
        description: 'Additional $500 for same-day processing',
        type: FeeType.FLAT,
        isActive: true,
        flatAmount: 500,
        applicableTo: { transactionCategories: ['express'] },
        version: 1,
        createdAt: new Date('2024-06-01T00:00:00Z'),
        updatedAt: new Date('2024-06-01T00:00:00Z'),
        createdBy: 'operations@tradeflow.com'
      },
      {
        id: 'fee-5',
        name: 'Risk-Based Fee Adjustment',
        description: 'Additional 0.5% fee for high-risk entities',
        type: FeeType.PERCENTAGE,
        isActive: true,
        percentage: 0.5,
        minAmount: 25,
        maxAmount: 2500,
        applicableTo: { transactionCategories: ['high-risk'] },
        version: 1,
        createdAt: new Date('2024-08-01T00:00:00Z'),
        updatedAt: new Date('2024-12-10T00:00:00Z'),
        createdBy: 'risk@tradeflow.com'
      }
    ];
    
    limitConfigurations = [
      {
        id: 'limit-1',
        name: 'Standard Supplier Credit Limit',
        description: 'Default credit limit for new suppliers',
        type: LimitType.BUYER_CREDIT,
        isActive: true,
        maxValue: 1000000,
        blockOnBreach: true,
        requireManualApproval: false,
        entityType: 'supplier',
        version: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-06-01T00:00:00Z'),
        createdBy: 'admin@tradeflow.com'
      },
      {
        id: 'limit-2',
        name: 'Premium Buyer Credit Limit',
        description: 'Enhanced credit limit for premium buyers',
        type: LimitType.BUYER_CREDIT,
        isActive: true,
        maxValue: 5000000,
        blockOnBreach: false,
        requireManualApproval: true,
        entityType: 'buyer',
        version: 2,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-09-15T00:00:00Z'),
        createdBy: 'admin@tradeflow.com'
      },
      {
        id: 'limit-3',
        name: 'Daily Transaction Limit',
        description: 'Maximum daily transaction volume per entity',
        type: LimitType.DAILY,
        isActive: true,
        maxValue: 2000000,
        period: 'daily',
        blockOnBreach: true,
        requireManualApproval: false,
        version: 1,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        updatedAt: new Date('2024-11-01T00:00:00Z'),
        createdBy: 'operations@tradeflow.com'
      },
      {
        id: 'limit-4',
        name: 'High Risk Entity Limit',
        description: 'Restricted credit limit for high-risk entities',
        type: LimitType.BUYER_CREDIT,
        isActive: true,
        maxValue: 250000,
        blockOnBreach: true,
        requireManualApproval: true,
        version: 1,
        createdAt: new Date('2024-05-01T00:00:00Z'),
        updatedAt: new Date('2024-12-01T00:00:00Z'),
        createdBy: 'risk@tradeflow.com'
      },
      {
        id: 'limit-5',
        name: 'Emergency Processing Limit',
        description: 'Maximum amount for emergency same-day processing',
        type: LimitType.TRANSACTION_VALUE,
        isActive: true,
        maxValue: 500000,
        blockOnBreach: false,
        requireManualApproval: true,
        version: 1,
        createdAt: new Date('2024-07-01T00:00:00Z'),
        updatedAt: new Date('2024-07-01T00:00:00Z'),
        createdBy: 'operations@tradeflow.com'
      }
    ];
  }

  if (limitConfigurations.length === 0) {
    limitConfigurations = [
      {
        id: 'limit-1',
        name: 'Maximum Transaction Value',
        description: 'Maximum allowed transaction value',
        type: LimitType.TRANSACTION_VALUE,
        isActive: true,
        maxValue: 100000,
        warningThreshold: 80,
        blockOnBreach: true,
        requireManualApproval: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'limit-2',
        name: 'Daily Transaction Limit',
        description: 'Daily cumulative transaction limit per entity',
        type: LimitType.DAILY,
        isActive: true,
        maxValue: 500000,
        warningThreshold: 75,
        period: 'daily',
        blockOnBreach: false,
        requireManualApproval: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];
  }
};

initializeDefaults();

// Helper function to calculate fees for a transaction
const calculateTransactionFees = (
  transactionAmount: number,
  buyerId?: string,
  supplierId?: string,
  category?: string
): { fees: TransactionFee[]; totalFees: number } => {
  const applicableFees: TransactionFee[] = [];
  let totalFees = 0;

  feeConfigurations.forEach(config => {
    if (!config.isActive) return;

    // Check if fee applies to this transaction
    let applies = true;
    
    if (config.applicableTo.buyers?.length && buyerId && 
        !config.applicableTo.buyers.includes(buyerId)) {
      applies = false;
    }
    
    if (config.applicableTo.suppliers?.length && supplierId && 
        !config.applicableTo.suppliers.includes(supplierId)) {
      applies = false;
    }
    
    if (config.applicableTo.transactionCategories?.length && category && 
        !config.applicableTo.transactionCategories.includes(category)) {
      applies = false;
    }

    if (!applies) return;

    let feeAmount = 0;

    switch (config.type) {
      case FeeType.FLAT:
        feeAmount = config.flatAmount || 0;
        break;
      
      case FeeType.PERCENTAGE:
        feeAmount = (transactionAmount * (config.percentage || 0)) / 100;
        if (config.minAmount && feeAmount < config.minAmount) {
          feeAmount = config.minAmount;
        }
        if (config.maxAmount && feeAmount > config.maxAmount) {
          feeAmount = config.maxAmount;
        }
        break;
      
      case FeeType.TIERED:
        if (config.tiers) {
          for (const tier of config.tiers) {
            if (transactionAmount >= tier.fromAmount && 
                (!tier.toAmount || transactionAmount <= tier.toAmount)) {
              if (tier.flatAmount) {
                feeAmount = tier.flatAmount;
              } else if (tier.percentage) {
                feeAmount = (transactionAmount * tier.percentage) / 100;
              }
              break;
            }
          }
        }
        break;
    }

    const transactionFee: TransactionFee = {
      id: `fee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      transactionId: '', // Will be set when applied to actual transaction
      feeConfigId: config.id,
      feeType: config.type,
      description: config.description,
      amount: Math.round(feeAmount * 100) / 100, // Round to 2 decimal places
      percentage: config.type === FeeType.PERCENTAGE ? (config.percentage || 0) : 0,
      calculatedAt: new Date()
    };

    applicableFees.push(transactionFee);
    totalFees += transactionFee.amount;
  });

  return {
    fees: applicableFees,
    totalFees: Math.round(totalFees * 100) / 100
  };
};

// Helper function to check limits
const checkTransactionLimits = (
  transactionAmount: number,
  buyerId?: string,
  supplierId?: string
): { canProceed: boolean; violations: string[]; warnings: string[] } => {
  const violations: string[] = [];
  const warnings: string[] = [];

  limitConfigurations.forEach(config => {
    if (!config.isActive) return;

    let limitExceeded = false;
    let warningThresholdReached = false;

    switch (config.type) {
      case LimitType.TRANSACTION_VALUE:
        if (transactionAmount > config.maxValue) {
          limitExceeded = true;
        } else if (config.warningThreshold) {
          const warningLimit = (config.maxValue * config.warningThreshold) / 100;
          if (transactionAmount > warningLimit) {
            warningThresholdReached = true;
          }
        }
        break;
      
      case LimitType.BUYER_CREDIT:
        if (buyerId && config.entityId === buyerId) {
          // This would need to check against current buyer credit usage
          // For now, we'll skip this check as it requires buyer data
        }
        break;
      
      case LimitType.SUPPLIER_CONCENTRATION:
        if (supplierId && config.entityId === supplierId) {
          // This would need to check against current supplier exposure
          // For now, we'll skip this check as it requires supplier data
        }
        break;
      
      case LimitType.DAILY:
      case LimitType.MONTHLY:
        // These would need to aggregate transactions by period
        // For now, we'll skip these checks as they require historical data
        break;
    }

    if (limitExceeded) {
      violations.push(`${config.name}: Limit of ${config.maxValue} exceeded`);
    } else if (warningThresholdReached) {
      warnings.push(`${config.name}: Approaching limit (${config.warningThreshold}% threshold reached)`);
    }
  });

  const canProceed = violations.length === 0;
  return { canProceed, violations, warnings };
};

// Fee Configuration Routes

// Get all fee configurations
router.get('/fees', (req, res) => {
  try {
    const response: ApiResponse<FeeConfiguration[]> = {
      success: true,
      message: 'Fee configurations retrieved successfully',
      data: feeConfigurations,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get fee configurations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Get fee configuration by ID
router.get('/fees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const feeConfig = feeConfigurations.find(f => f.id === id);
    
    if (!feeConfig) {
      return res.status(404).json({
        success: false,
        message: 'Fee configuration not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse<FeeConfiguration> = {
      success: true,
      message: 'Fee configuration retrieved successfully',
      data: feeConfig,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get fee configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Create new fee configuration
router.post('/fees', (req, res) => {
  try {
    const newFeeConfig: Omit<FeeConfiguration, 'id' | 'createdAt' | 'updatedAt'> = req.body;
    
    const feeConfig: FeeConfiguration = {
      ...newFeeConfig,
      id: `fee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    feeConfigurations.push(feeConfig);

    const response: ApiResponse<FeeConfiguration> = {
      success: true,
      message: 'Fee configuration created successfully',
      data: feeConfig,
      timestamp: new Date()
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create fee configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Update fee configuration
router.put('/fees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const feeConfigIndex = feeConfigurations.findIndex(f => f.id === id);
    if (feeConfigIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Fee configuration not found',
        timestamp: new Date()
      });
    }

    // Create new version for auditing
    const currentConfig = feeConfigurations[feeConfigIndex];
    if (!currentConfig) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fee configuration not found' 
      });
    }
    
    const updatedConfig: FeeConfiguration = {
      ...currentConfig,
      ...updates,
      version: currentConfig.version + 1,
      updatedAt: new Date()
    };

    feeConfigurations[feeConfigIndex] = updatedConfig;

    const response: ApiResponse<FeeConfiguration> = {
      success: true,
      message: 'Fee configuration updated successfully',
      data: updatedConfig,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Update fee configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Delete fee configuration
router.delete('/fees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const feeConfigIndex = feeConfigurations.findIndex(f => f.id === id);
    
    if (feeConfigIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Fee configuration not found',
        timestamp: new Date()
      });
    }

    feeConfigurations.splice(feeConfigIndex, 1);

    const response: ApiResponse = {
      success: true,
      message: 'Fee configuration deleted successfully',
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Delete fee configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Limit Configuration Routes

// Get all limit configurations
router.get('/limits', (req, res) => {
  try {
    const response: ApiResponse<LimitConfiguration[]> = {
      success: true,
      message: 'Limit configurations retrieved successfully',
      data: limitConfigurations,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get limit configurations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Create new limit configuration
router.post('/limits', (req, res) => {
  try {
    const newLimitConfig: Omit<LimitConfiguration, 'id' | 'createdAt' | 'updatedAt'> = req.body;
    
    const limitConfig: LimitConfiguration = {
      ...newLimitConfig,
      id: `limit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    limitConfigurations.push(limitConfig);

    const response: ApiResponse<LimitConfiguration> = {
      success: true,
      message: 'Limit configuration created successfully',
      data: limitConfig,
      timestamp: new Date()
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create limit configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Update limit configuration
router.put('/limits/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const limitConfigIndex = limitConfigurations.findIndex(l => l.id === id);
    if (limitConfigIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Limit configuration not found',
        timestamp: new Date()
      });
    }

    const currentConfig = limitConfigurations[limitConfigIndex];
    if (!currentConfig) {
      return res.status(404).json({ 
        success: false, 
        message: 'Limit configuration not found' 
      });
    }
    
    const updatedConfig: LimitConfiguration = {
      ...currentConfig,
      ...updates,
      version: currentConfig.version + 1,
      updatedAt: new Date()
    };

    limitConfigurations[limitConfigIndex] = updatedConfig;

    const response: ApiResponse<LimitConfiguration> = {
      success: true,
      message: 'Limit configuration updated successfully',
      data: updatedConfig,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Update limit configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Utility Routes

// Calculate fees for a given transaction amount
router.post('/fees/calculate', (req, res) => {
  try {
    const { transactionAmount, buyerId, supplierId, category } = req.body;
    
    if (!transactionAmount || transactionAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid transaction amount is required',
        timestamp: new Date()
      });
    }

    const result = calculateTransactionFees(transactionAmount, buyerId, supplierId, category);

    const response: ApiResponse = {
      success: true,
      message: 'Fees calculated successfully',
      data: result,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Calculate fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Check limits for a transaction
router.post('/limits/check', (req, res) => {
  try {
    const { transactionAmount, buyerId, supplierId } = req.body;
    
    if (!transactionAmount || transactionAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid transaction amount is required',
        timestamp: new Date()
      });
    }

    const result = checkTransactionLimits(transactionAmount, buyerId, supplierId);

    const response: ApiResponse = {
      success: true,
      message: 'Limits checked successfully',
      data: result,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Check limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Preview fees and limits for transaction approval
router.post('/preview', (req, res) => {
  try {
    const { transactionAmount, buyerId, supplierId, category } = req.body;
    
    if (!transactionAmount || transactionAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid transaction amount is required',
        timestamp: new Date()
      });
    }

    const feeResult = calculateTransactionFees(transactionAmount, buyerId, supplierId, category);
    const limitResult = checkTransactionLimits(transactionAmount, buyerId, supplierId);

    const preview = {
      transactionAmount,
      fees: feeResult.fees,
      totalFees: feeResult.totalFees,
      netAmount: transactionAmount - feeResult.totalFees,
      limitCheck: limitResult,
      canProceed: limitResult.canProceed,
      requiresApproval: !limitResult.canProceed || limitResult.warnings.length > 0
    };

    const response: ApiResponse = {
      success: true,
      message: 'Transaction preview generated successfully',
      data: preview,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Generate preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

export default router;