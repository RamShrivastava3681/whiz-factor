import express from 'express';
import {
  TransactionMonitoring,
  SystemAlert,
  AlertSeverity,
  RiskIndicator,
  TransactionStatus,
  ApiResponse
} from '../models/index';

const router = express.Router();

// In-memory storage for monitoring data (in production, this would be a database)
let transactionMonitoring: TransactionMonitoring[] = [];
let systemAlerts: SystemAlert[] = [
  {
    id: 'ALT001',
    type: 'credit_limit_exceeded',
    severity: 'high' as AlertSeverity,
    title: 'Credit Limit Exceeded',
    message: 'Tech Innovations Inc has exceeded 95% of their credit limit ($15M)',
    entityId: 'buyer1',
    entityType: 'buyer',
    isRead: false,
    isResolved: false,
    createdAt: new Date('2024-12-26T14:30:00Z')
  },
  {
    id: 'ALT002',
    type: 'overdue_payment',
    severity: 'medium' as AlertSeverity,
    title: 'Overdue Payment Alert',
    message: 'Premium Textiles Ltd has payments overdue by 67 days ($850K)',
    entityId: 'supplier1',
    entityType: 'supplier',
    createdAt: new Date('2024-12-26T10:15:00Z'),
    isRead: true,
    isResolved: false
  },
  {
    id: 'ALT003',
    type: 'risk_score_degraded',
    severity: 'medium' as AlertSeverity,
    title: 'Risk Score Deterioration',
    message: 'Quality Materials Co risk score dropped from 78 to 65',
    entityId: 'supplier3',
    entityType: 'supplier',
    createdAt: new Date('2024-12-26T09:45:00Z'),
    isRead: true,
    isResolved: true,
    ...(true && { resolvedAt: new Date('2024-12-26T10:00:00Z') })
  },
  {
    id: 'ALT004',
    type: 'unusual_transaction',
    severity: 'low' as AlertSeverity,
    title: 'Unusual Transaction Pattern',
    message: 'Advanced Components Inc has 300% increase in transaction volume',
    entityId: 'supplier2',
    entityType: 'supplier',
    createdAt: new Date('2024-12-26T08:20:00Z'),
    isRead: false,
    isResolved: false
  },
  {
    id: 'ALT005',
    type: 'kyc_expiry',
    severity: 'high' as AlertSeverity,
    title: 'KYC Documentation Expiring',
    message: 'Industrial Solutions KYC documents expire in 5 days',
    entityId: 'supplier4',
    entityType: 'supplier',
    createdAt: new Date('2024-12-26T07:00:00Z'),
    isRead: false,
    isResolved: false,
    ...(new Date('2024-12-31') && { expiresAt: new Date('2024-12-31') })
  }
];
let riskIndicators: RiskIndicator[] = [];

// Mock transaction data for monitoring (this would come from the main transactions store) - cleared
let mockTransactions: any[] = [];

// Helper function to generate unique IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper function to calculate aging days
const calculateAgingDays = (date: Date): number => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to determine aging bucket
const getAgingBucket = (days: number): '0-30' | '31-60' | '61-90' | '90+' => {
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
};

// Helper function to calculate health status
const calculateHealthStatus = (transaction: any): 'healthy' | 'warning' | 'critical' => {
  const agingDays = calculateAgingDays(new Date(transaction.dueDate));
  const now = new Date();
  const dueDate = new Date(transaction.dueDate);
  const isOverdue = now > dueDate;
  
  if (transaction.status === 'closed' || transaction.status === 'settled') {
    return 'healthy';
  }
  
  if (isOverdue && agingDays > 30) {
    return 'critical';
  }
  
  if (isOverdue || agingDays > 21) {
    return 'warning';
  }
  
  return 'healthy';
};

// Function to update transaction monitoring
const updateTransactionMonitoring = (transaction: any) => {
  const agingDays = calculateAgingDays(new Date(transaction.createdAt));
  const healthStatus = calculateHealthStatus(transaction);
  const now = new Date();
  const dueDate = new Date(transaction.dueDate);
  const isOverdue = now > dueDate;
  const overdueBy = isOverdue ? calculateAgingDays(dueDate) : undefined;
  
  const existingIndex = transactionMonitoring.findIndex(tm => tm.transactionId === transaction.id);
  
  const monitoringData: TransactionMonitoring = {
    id: existingIndex >= 0 && transactionMonitoring[existingIndex] ? transactionMonitoring[existingIndex].id : generateId('tm'),
    transactionId: transaction.id,
    healthStatus,
    agingDays,
    agingBucket: getAgingBucket(agingDays),
    isOverdue,
    riskScore: calculateRiskScore(transaction),
    lastUpdated: new Date(),
    ...(overdueBy !== undefined && { overdueBy })
  };
  
  if (existingIndex >= 0) {
    transactionMonitoring[existingIndex] = monitoringData;
  } else {
    transactionMonitoring.push(monitoringData);
  }
  
  return monitoringData;
};

// Function to calculate risk score (0-100)
const calculateRiskScore = (transaction: any): number => {
  let score = 0;
  
  const agingDays = calculateAgingDays(new Date(transaction.createdAt));
  const now = new Date();
  const dueDate = new Date(transaction.dueDate);
  const isOverdue = now > dueDate;
  
  // Base score based on aging
  if (agingDays > 60) score += 40;
  else if (agingDays > 30) score += 20;
  else if (agingDays > 14) score += 10;
  
  // Overdue penalty
  if (isOverdue) {
    const overdueDays = calculateAgingDays(dueDate);
    score += Math.min(overdueDays * 2, 50);
  }
  
  // Status-based scoring
  if (transaction.status === 'rejected') score += 30;
  else if (transaction.status === 'pending') score += 15;
  
  // Amount-based risk
  if (transaction.fundingAmount > 100000) score += 10;
  else if (transaction.fundingAmount > 50000) score += 5;
  
  return Math.min(score, 100);
};

// Function to create system alert
const createAlert = (
  type: string,
  severity: AlertSeverity,
  title: string,
  message: string,
  entityId?: string,
  entityType?: 'transaction' | 'buyer' | 'supplier',
  transactionId?: string
): SystemAlert => {
  const alert: SystemAlert = {
    id: generateId('alert'),
    type,
    severity,
    title,
    message,
    isRead: false,
    isResolved: false,
    createdAt: new Date(),
    ...(entityId && { entityId }),
    ...(entityType && { entityType }),
    ...(transactionId && { transactionId })
  };
  systemAlerts.push(alert);
  return alert;
};

// Mock data initialization removed - using empty data

// Transaction Health Monitoring Routes

// Get transaction health overview
router.get('/health/overview', (req, res) => {
  try {
    const healthStats = {
      total: transactionMonitoring.length,
      healthy: transactionMonitoring.filter(tm => tm.healthStatus === 'healthy').length,
      warning: transactionMonitoring.filter(tm => tm.healthStatus === 'warning').length,
      critical: transactionMonitoring.filter(tm => tm.healthStatus === 'critical').length,
      overdue: transactionMonitoring.filter(tm => tm.isOverdue).length
    };
    
    const agingBuckets = {
      '0-30': transactionMonitoring.filter(tm => tm.agingBucket === '0-30').length,
      '31-60': transactionMonitoring.filter(tm => tm.agingBucket === '31-60').length,
      '61-90': transactionMonitoring.filter(tm => tm.agingBucket === '61-90').length,
      '90+': transactionMonitoring.filter(tm => tm.agingBucket === '90+').length
    };
    
    const averageRiskScore = transactionMonitoring.length > 0 
      ? transactionMonitoring.reduce((sum, tm) => sum + (tm.riskScore || 0), 0) / transactionMonitoring.length
      : 0;

    const response: ApiResponse<{
      healthStats: typeof healthStats;
      agingBuckets: typeof agingBuckets;
      averageRiskScore: number;
      lastUpdated: Date;
    }> = {
      success: true,
      message: 'Transaction health overview retrieved successfully',
      data: {
        healthStats,
        agingBuckets,
        averageRiskScore: Math.round(averageRiskScore * 100) / 100,
        lastUpdated: new Date()
      },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get health overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Get transaction monitoring details
router.get('/health/transactions', (req, res) => {
  try {
    const { status, agingBucket, limit = '50', offset = '0' } = req.query;
    
    let filteredMonitoring = transactionMonitoring;
    
    if (status) {
      filteredMonitoring = filteredMonitoring.filter(tm => tm.healthStatus === status);
    }
    
    if (agingBucket) {
      filteredMonitoring = filteredMonitoring.filter(tm => tm.agingBucket === agingBucket);
    }
    
    // Sort by risk score (highest first)
    filteredMonitoring.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedResults = filteredMonitoring.slice(offsetNum, offsetNum + limitNum);

    const response: ApiResponse<TransactionMonitoring[]> = {
      success: true,
      message: 'Transaction monitoring data retrieved successfully',
      data: paginatedResults,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get transaction monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Get monitoring details for specific transaction
router.get('/health/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const monitoring = transactionMonitoring.find(tm => tm.transactionId === id);
    
    if (!monitoring) {
      return res.status(404).json({
        success: false,
        message: 'Transaction monitoring data not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse<TransactionMonitoring> = {
      success: true,
      message: 'Transaction monitoring data retrieved successfully',
      data: monitoring,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get transaction monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Update transaction monitoring (typically called when transaction status changes)
router.put('/health/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transaction = mockTransactions.find(t => t.id === id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
        timestamp: new Date()
      });
    }

    const monitoringData = updateTransactionMonitoring(transaction);

    const response: ApiResponse<TransactionMonitoring> = {
      success: true,
      message: 'Transaction monitoring updated successfully',
      data: monitoringData,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Update transaction monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// System Alerts Routes

// Get all alerts
router.get('/alerts', (req, res) => {
  try {
    const { severity, isRead, isResolved, limit = '50', offset = '0' } = req.query;
    
    let filteredAlerts = systemAlerts;
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    if (isRead !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.isRead === (isRead === 'true'));
    }
    
    if (isResolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.isResolved === (isResolved === 'true'));
    }
    
    // Sort by created date (newest first)
    filteredAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedResults = filteredAlerts.slice(offsetNum, offsetNum + limitNum);

    const response: ApiResponse<SystemAlert[]> = {
      success: true,
      message: 'Alerts retrieved successfully',
      data: paginatedResults,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Create new alert
router.post('/alerts', (req, res) => {
  try {
    const {
      type,
      severity,
      title,
      message,
      entityId,
      entityType,
      transactionId,
      expiresAt
    } = req.body;
    
    if (!type || !severity || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, severity, title, and message are required',
        timestamp: new Date()
      });
    }

    const alert: SystemAlert = {
      id: generateId('alert'),
      type,
      severity,
      title,
      message,
      isRead: false,
      isResolved: false,
      createdAt: new Date(),
      ...(entityId && { entityId }),
      ...(entityType && { entityType }),
      ...(transactionId && { transactionId }),
      ...(expiresAt && { expiresAt: new Date(expiresAt) })
    };

    systemAlerts.push(alert);

    const response: ApiResponse<SystemAlert> = {
      success: true,
      message: 'Alert created successfully',
      data: alert,
      timestamp: new Date()
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Mark alert as read
router.put('/alerts/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const alertIndex = systemAlerts.findIndex(alert => alert.id === id);
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
        timestamp: new Date()
      });
    }

    const alert = systemAlerts[alertIndex];
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
        timestamp: new Date()
      });
    }

    alert.isRead = true;

    const response: ApiResponse<SystemAlert> = {
      success: true,
      message: 'Alert marked as read',
      data: alert,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Resolve alert
router.put('/alerts/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedBy, resolutionNotes } = req.body;
    
    const alertIndex = systemAlerts.findIndex(alert => alert.id === id);
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
        timestamp: new Date()
      });
    }

    const alert = systemAlerts[alertIndex];
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
        timestamp: new Date()
      });
    }

    alert.isResolved = true;
    alert.resolvedAt = new Date();
    if (resolvedBy) alert.resolvedBy = resolvedBy;
    if (resolutionNotes) alert.resolutionNotes = resolutionNotes;

    const response: ApiResponse<SystemAlert> = {
      success: true,
      message: 'Alert resolved successfully',
      data: alert,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Risk Indicators Routes

// Get all risk indicators
router.get('/risk', (req, res) => {
  try {
    const { entityType, severity, isActive } = req.query;
    
    let filteredIndicators = riskIndicators;
    
    if (entityType) {
      filteredIndicators = filteredIndicators.filter(ri => ri.entityType === entityType);
    }
    
    if (severity) {
      filteredIndicators = filteredIndicators.filter(ri => ri.severity === severity);
    }
    
    if (isActive !== undefined) {
      filteredIndicators = filteredIndicators.filter(ri => ri.isActive === (isActive === 'true'));
    }
    
    // Sort by severity and detected date
    filteredIndicators.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      const severityDiff = (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                          (severityOrder[a.severity as keyof typeof severityOrder] || 0);
      if (severityDiff !== 0) return severityDiff;
      return b.detectedAt.getTime() - a.detectedAt.getTime();
    });

    const response: ApiResponse<RiskIndicator[]> = {
      success: true,
      message: 'Risk indicators retrieved successfully',
      data: filteredIndicators,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get risk indicators error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Create risk indicator
router.post('/risk', (req, res) => {
  try {
    const {
      entityId,
      entityType,
      indicatorType,
      description,
      severity,
      value,
      threshold
    } = req.body;
    
    if (!entityId || !entityType || !indicatorType || !description || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Entity ID, type, indicator type, description, and severity are required',
        timestamp: new Date()
      });
    }

    const riskIndicator: RiskIndicator = {
      id: generateId('risk'),
      entityId,
      entityType,
      indicatorType,
      description,
      severity,
      value: value || 0,
      threshold: threshold || 0,
      isActive: true,
      detectedAt: new Date(),
      lastUpdated: new Date()
    };

    riskIndicators.push(riskIndicator);

    // Also create an alert for critical risk indicators
    if (severity === AlertSeverity.CRITICAL) {
      createAlert(
        'risk_indicator',
        severity,
        `Critical Risk: ${indicatorType}`,
        description,
        entityId,
        entityType === 'buyer' || entityType === 'supplier' ? entityType : undefined
      );
    }

    const response: ApiResponse<RiskIndicator> = {
      success: true,
      message: 'Risk indicator created successfully',
      data: riskIndicator,
      timestamp: new Date()
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create risk indicator error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Monitoring Dashboard
router.get('/dashboard', (req, res) => {
  try {
    // Health summary
    const healthSummary = {
      total: transactionMonitoring.length,
      healthy: transactionMonitoring.filter(tm => tm.healthStatus === 'healthy').length,
      warning: transactionMonitoring.filter(tm => tm.healthStatus === 'warning').length,
      critical: transactionMonitoring.filter(tm => tm.healthStatus === 'critical').length,
      overdue: transactionMonitoring.filter(tm => tm.isOverdue).length
    };
    
    // Recent alerts
    const recentAlerts = systemAlerts
      .filter(alert => !alert.isResolved)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
    
    // Active risk indicators
    const activeRisks = riskIndicators
      .filter(ri => ri.isActive)
      .sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
               (severityOrder[a.severity as keyof typeof severityOrder] || 0);
      })
      .slice(0, 10);
    
    // High-risk transactions
    const highRiskTransactions = transactionMonitoring
      .filter(tm => (tm.riskScore || 0) > 70)
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
      .slice(0, 10);
    
    // Aging analysis
    const agingAnalysis = {
      '0-30': transactionMonitoring.filter(tm => tm.agingBucket === '0-30').length,
      '31-60': transactionMonitoring.filter(tm => tm.agingBucket === '31-60').length,
      '61-90': transactionMonitoring.filter(tm => tm.agingBucket === '61-90').length,
      '90+': transactionMonitoring.filter(tm => tm.agingBucket === '90+').length
    };

    const dashboard = {
      healthSummary,
      recentAlerts,
      activeRisks,
      highRiskTransactions,
      agingAnalysis,
      lastUpdated: new Date()
    };

    const response: ApiResponse<typeof dashboard> = {
      success: true,
      message: 'Monitoring dashboard data retrieved successfully',
      data: dashboard,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get monitoring dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Bulk operations
router.post('/alerts/bulk-resolve', (req, res) => {
  try {
    const { alertIds, resolvedBy, resolutionNotes } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds)) {
      return res.status(400).json({
        success: false,
        message: 'Alert IDs array is required',
        timestamp: new Date()
      });
    }

    const results: Array<{ id: string; status: string }> = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of alertIds) {
      const alertIndex = systemAlerts.findIndex(alert => alert.id === id);
      if (alertIndex === -1) {
        errors.push({ id, error: 'Alert not found' });
        continue;
      }

      const alert = systemAlerts[alertIndex];
      if (!alert) {
        errors.push({ id, error: 'Alert not found' });
        continue;
      }

      alert.isResolved = true;
      alert.resolvedAt = new Date();
      if (resolvedBy) alert.resolvedBy = resolvedBy;
      if (resolutionNotes) alert.resolutionNotes = resolutionNotes;

      results.push({ id, status: 'resolved' });
    }

    const response: ApiResponse<{ results: typeof results; errors: typeof errors }> = {
      success: true,
      message: `Bulk resolve completed. ${results.length} resolved, ${errors.length} errors.`,
      data: { results, errors },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Bulk resolve alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

export default router;