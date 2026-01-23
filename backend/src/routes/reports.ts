import express from 'express';
import {
  ReportConfiguration,
  ReportExecution,
  ApiResponse,
  PaginatedResponse
} from '../models/index';

const router = express.Router();

// In-memory storage for reports data with comprehensive demo data
let reportConfigurations: ReportConfiguration[] = [
  {
    id: 'RPT001',
    name: 'Monthly Transaction Summary',
    description: 'Comprehensive monthly overview of all transactions, volumes, and key metrics',
    category: 'operational',
    reportType: 'operational',
    schedule: { 
      frequency: 'monthly', 
      dayOfMonth: 1, 
      time: '08:00',
      recipients: ['operations@tradeflow.com', 'management@tradeflow.com']
    },
    parameters: {
      includeCharts: true,
      includeSupplierBreakdown: true,
      includeBuyerAnalysis: true,
      dateRange: 'last_month'
    },
    isActive: true,
    createdAt: new Date('2024-11-01T08:00:00Z'),
    updatedAt: new Date('2024-12-01T08:00:00Z'),
    createdBy: 'system'
  },
  {
    id: 'RPT002',
    name: 'Risk Assessment Dashboard',
    description: 'Weekly risk metrics including entity scores, exposure analysis, and alert trends',
    category: 'risk',
    reportType: 'risk',
    schedule: { 
      frequency: 'weekly', 
      dayOfWeek: 1, 
      time: '09:00',
      recipients: ['risk@tradeflow.com', 'compliance@tradeflow.com']
    },
    parameters: {
      includeRiskTrends: true,
      includeEntityScoring: true,
      includeExposureAnalysis: true,
      alertThreshold: 'medium'
    },
    isActive: true,
    createdAt: new Date('2024-10-15T09:00:00Z'),
    updatedAt: new Date('2024-12-15T09:00:00Z'),
    createdBy: 'system'
  },
  {
    id: 'RPT003',
    name: 'Compliance Audit Report',
    description: 'Quarterly compliance review including KYC status, regulatory requirements, and audit trails',
    category: 'compliance',
    reportType: 'compliance',
    schedule: { 
      frequency: 'quarterly', 
      dayOfMonth: 15, 
      time: '10:00',
      recipients: ['compliance@tradeflow.com', 'legal@tradeflow.com', 'audit@tradeflow.com']
    },
    parameters: {
      includeRiskScores: true,
      includeRegulatoryChecks: true,
      includeAuditTrails: true,
      complianceLevel: 'strict'
    },
    isActive: true,
    createdAt: new Date('2024-09-15T10:00:00Z'),
    updatedAt: new Date('2024-12-15T10:00:00Z'),
    createdBy: 'system'
  },
  {
    id: 'RPT004',
    name: 'Treasury Performance Analytics',
    description: 'Daily treasury metrics including liquidity, yield performance, and cash flow projections',
    category: 'financial',
    reportType: 'financial',
    schedule: { 
      frequency: 'daily', 
      time: '07:00',
      recipients: ['treasury@tradeflow.com', 'finance@tradeflow.com']
    },
    parameters: {
      includeLiquidityAnalysis: true,
      includeYieldMetrics: true,
      includeCashFlowProjections: true,
      performancePeriod: '30_days'
    },
    isActive: true,
    createdAt: new Date('2024-11-01T07:00:00Z'),
    updatedAt: new Date('2024-12-20T07:00:00Z'),
    createdBy: 'system'
  },
  {
    id: 'RPT005',
    name: 'Supplier Performance Scorecard',
    description: 'Bi-weekly supplier evaluation including payment history, risk scores, and transaction volumes',
    category: 'operational',
    reportType: 'operational',
    schedule: { 
      frequency: 'weekly', 
      time: '11:00',
      recipients: ['procurement@tradeflow.com', 'operations@tradeflow.com']
    },
    parameters: {
      includePaymentHistory: true,
      includeRiskScoring: true,
      includeVolumeAnalysis: true,
      minimumTransactionCount: 5
    },
    isActive: true,
    createdAt: new Date('2024-10-01T11:00:00Z'),
    updatedAt: new Date('2024-12-10T11:00:00Z'),
    createdBy: 'system'
  }
];

let reportExecutions: ReportExecution[] = [
  {
    id: 'EXEC001',
    reportConfigId: 'RPT001',
    status: 'completed',
    parameters: { dateRange: '2024-11-01 to 2024-11-30' },
    generatedAt: new Date('2024-12-01T08:00:00Z'),
    completedAt: new Date('2024-12-01T08:15:00Z'),
    filePath: '/reports/files/monthly-summary-2024-11.pdf',
    fileFormat: 'pdf' as const,
    executedBy: 'system'
  },
  {
    id: 'EXEC002',
    reportConfigId: 'RPT002',
    status: 'completed',
    parameters: { weekOf: '2024-12-16 to 2024-12-22' },
    generatedAt: new Date('2024-12-23T09:00:00Z'),
    completedAt: new Date('2024-12-23T09:12:00Z'),
    filePath: '/reports/files/risk-assessment-2024-w51.pdf',
    fileFormat: 'pdf' as const,
    executedBy: 'system'
  },
  {
    id: 'EXEC003',
    reportConfigId: 'RPT004',
    status: 'running',
    parameters: { date: '2024-12-25' },
    generatedAt: new Date('2024-12-26T07:00:00Z'),
    fileFormat: 'pdf' as const,
    executedBy: 'system'
  },
  {
    id: 'EXEC004',
    reportConfigId: 'RPT005',
    status: 'failed',
    parameters: { period: '2024-12-10 to 2024-12-23' },
    generatedAt: new Date('2024-12-24T11:00:00Z'),
    completedAt: new Date('2024-12-24T11:03:00Z'),
    fileFormat: 'excel' as const,
    executedBy: 'system',
    errorMessage: 'Data source temporarily unavailable'
  }
];

// Helper function to generate unique IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Sample report data generators
const generateOperationalReport = (parameters: any) => {
  const { startDate, endDate, entityType } = parameters;
  
  // Mock data - in production, this would query actual database
  return {
    summary: {
      totalTransactions: 156,
      totalValue: 7850000,
      averageTransactionValue: 50320,
      completedTransactions: 142,
      pendingTransactions: 8,
      rejectedTransactions: 6
    },
    transactionFlow: [
      { status: 'pending', count: 8, value: 425000 },
      { status: 'approved', count: 28, value: 1420000 },
      { status: 'disbursed', count: 65, value: 3250000 },
      { status: 'settled', count: 49, value: 2450000 },
      { status: 'rejected', count: 6, value: 305000 }
    ],
    settlementTimelines: {
      averageDays: 18.5,
      onTime: 89,
      delayed: 53
    },
    topSuppliers: [
      { name: 'Tech Solutions Ltd', transactionCount: 23, totalValue: 1150000 },
      { name: 'Global Manufacturing', transactionCount: 18, totalValue: 945000 },
      { name: 'Supply Chain Co', transactionCount: 15, totalValue: 780000 }
    ]
  };
};

const generateFinancialReport = (parameters: any) => {
  const { startDate, endDate, includeProjections } = parameters;
  
  return {
    revenue: {
      totalFeeRevenue: 185650,
      processingFees: 142300,
      serviceFees: 28950,
      lateFees: 14400
    },
    reserves: {
      totalHeld: 950000,
      totalReleased: 650000,
      currentlyHeld: 300000,
      reserveRatio: 0.125
    },
    disbursements: {
      totalDisbursed: 7200000,
      pendingDisbursements: 425000,
      averageDisbursementTime: 2.3,
      failedDisbursements: 12500
    },
    cashFlow: {
      netInflow: 6850000,
      netOutflow: 7200000,
      netPosition: -350000,
      projectedCashFlow: includeProjections ? [
        { month: 'Jan 2026', inflow: 2100000, outflow: 2200000 },
        { month: 'Feb 2026', inflow: 2300000, outflow: 2100000 },
        { month: 'Mar 2026', inflow: 2450000, outflow: 2350000 }
      ] : null
    }
  };
};

const generateRiskReport = (parameters: any) => {
  const { riskLevel, includeRecommendations } = parameters;
  
  return {
    overdueSummary: {
      totalOverdue: 15,
      totalOverdueValue: 785000,
      averageOverdueDays: 12.5,
      buckets: {
        '1-15 days': 8,
        '16-30 days': 4,
        '31-60 days': 2,
        '60+ days': 1
      }
    },
    limitBreaches: {
      totalBreaches: 3,
      creditLimitBreaches: 2,
      concentrationLimitBreaches: 1,
      transactionValueBreaches: 0
    },
    highRiskEntities: [
      { name: 'Risk Corp Ltd', type: 'buyer', riskScore: 85, exposure: 125000 },
      { name: 'Volatile Suppliers', type: 'supplier', riskScore: 78, exposure: 95000 },
      { name: 'New Buyer Inc', type: 'buyer', riskScore: 72, exposure: 65000 }
    ],
    riskMetrics: {
      averageRiskScore: 42.5,
      highRiskCount: 12,
      mediumRiskCount: 34,
      lowRiskCount: 110
    },
    recommendations: includeRecommendations ? [
      'Review credit limits for entities with scores above 70',
      'Implement stricter monitoring for transactions over $100K',
      'Consider diversifying supplier concentration'
    ] : null
  };
};

const generateComplianceReport = (parameters: any) => {
  const { auditLevel } = parameters;
  
  return {
    policyCompliance: {
      feeApplicationCompliance: 98.5,
      limitEnforcementCompliance: 96.2,
      disbursementProcessCompliance: 99.1,
      documentationCompliance: 94.8
    },
    auditTrail: {
      totalAuditEvents: 2458,
      criticalEvents: 23,
      warningEvents: 67,
      infoEvents: 2368
    },
    exceptions: [
      { type: 'Manual Override', count: 12, description: 'Manual approvals for limit breaches' },
      { type: 'Late Processing', count: 8, description: 'Disbursements processed after SLA' },
      { type: 'Fee Adjustment', count: 5, description: 'Manual fee adjustments applied' }
    ],
    slaPerformance: {
      transactionProcessing: 96.8,
      disbursementTiming: 94.2,
      reportGeneration: 99.5,
      issueResolution: 91.3
    }
  };
};

// Initialize with default report configurations
const initializeDefaultReports = () => {
  if (reportConfigurations.length === 0) {
    reportConfigurations = [
      {
        id: 'rpt-cfg-1',
        name: 'Daily Operations Summary',
        description: 'Daily summary of transaction flows and operational metrics',
        category: 'operational',
        reportType: 'operational_summary',
        parameters: {
          includeCharts: true,
          groupBy: 'status',
          includeTrends: true
        },
        schedule: {
          frequency: 'daily',
          time: '08:00',
          recipients: ['operations@company.com', 'management@company.com']
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'rpt-cfg-2',
        name: 'Weekly Financial Report',
        description: 'Weekly financial performance and cash flow analysis',
        category: 'financial',
        reportType: 'financial_summary',
        parameters: {
          includeProjections: true,
          includeCashFlow: true,
          compareWithPrevious: true
        },
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 1,
          time: '09:00',
          recipients: ['finance@company.com', 'cfo@company.com']
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'rpt-cfg-3',
        name: 'Monthly Risk Assessment',
        description: 'Comprehensive monthly risk analysis and recommendations',
        category: 'risk',
        reportType: 'risk_analysis',
        parameters: {
          riskLevel: 'all',
          includeRecommendations: true,
          detailedAnalysis: true
        },
        schedule: {
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '10:00',
          recipients: ['risk@company.com', 'compliance@company.com']
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];
  }
};

initializeDefaultReports();

// Report Configuration Routes

// Get all report configurations
router.get('/configurations', (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    let filteredConfigs = reportConfigurations;
    
    if (category) {
      filteredConfigs = filteredConfigs.filter(config => config.category === category);
    }
    
    if (isActive !== undefined) {
      filteredConfigs = filteredConfigs.filter(config => config.isActive === (isActive === 'true'));
    }
    
    // Sort by category and name
    filteredConfigs.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    const response: ApiResponse<ReportConfiguration[]> = {
      success: true,
      message: 'Report configurations retrieved successfully',
      data: filteredConfigs,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get report configurations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Get report configuration by ID
router.get('/configurations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const config = reportConfigurations.find(c => c.id === id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Report configuration not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse<ReportConfiguration> = {
      success: true,
      message: 'Report configuration retrieved successfully',
      data: config,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get report configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Create new report configuration
router.post('/configurations', (req, res) => {
  try {
    const newConfig: Omit<ReportConfiguration, 'id' | 'createdAt' | 'updatedAt'> = req.body;
    
    const config: ReportConfiguration = {
      ...newConfig,
      id: generateId('rpt-cfg'),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    reportConfigurations.push(config);

    const response: ApiResponse<ReportConfiguration> = {
      success: true,
      message: 'Report configuration created successfully',
      data: config,
      timestamp: new Date()
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Create report configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Update report configuration
router.put('/configurations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const configIndex = reportConfigurations.findIndex(c => c.id === id);
    if (configIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Report configuration not found',
        timestamp: new Date()
      });
    }

    const updatedConfig: ReportConfiguration = {
      ...reportConfigurations[configIndex],
      ...updates,
      updatedAt: new Date()
    };

    reportConfigurations[configIndex] = updatedConfig;

    const response: ApiResponse<ReportConfiguration> = {
      success: true,
      message: 'Report configuration updated successfully',
      data: updatedConfig,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Update report configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Report Execution Routes

// Get all report executions
router.get('/executions', (req, res) => {
  try {
    const { reportConfigId, status, limit = '50', offset = '0' } = req.query;
    
    let filteredExecutions = reportExecutions;
    
    if (reportConfigId) {
      filteredExecutions = filteredExecutions.filter(exec => exec.reportConfigId === reportConfigId);
    }
    
    if (status) {
      filteredExecutions = filteredExecutions.filter(exec => exec.status === status);
    }
    
    // Sort by generated date (newest first)
    filteredExecutions.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedResults = filteredExecutions.slice(offsetNum, offsetNum + limitNum);

    const response: ApiResponse<ReportExecution[]> = {
      success: true,
      message: 'Report executions retrieved successfully',
      data: paginatedResults,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get report executions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Execute report (generate)
router.post('/execute', (req, res) => {
  try {
    const { reportConfigId, parameters, fileFormat = 'pdf', executedBy } = req.body;
    
    if (!reportConfigId) {
      return res.status(400).json({
        success: false,
        message: 'Report configuration ID is required',
        timestamp: new Date()
      });
    }

    const config = reportConfigurations.find(c => c.id === reportConfigId);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Report configuration not found',
        timestamp: new Date()
      });
    }

    const execution: ReportExecution = {
      id: generateId('rpt-exec'),
      reportConfigId,
      status: 'running',
      parameters: { ...config.parameters, ...parameters },
      generatedAt: new Date(),
      fileFormat,
      executedBy
    };

    reportExecutions.push(execution);

    // Simulate report generation (in production, this would be an async process)
    setTimeout(() => {
      const executionIndex = reportExecutions.findIndex(e => e.id === execution.id);
      if (executionIndex !== -1) {
        const filePath = `/reports/${execution.id}.${fileFormat}`;
        const currentExecution = reportExecutions[executionIndex];
        if (currentExecution) {
          const updatedExecution: ReportExecution = {
            id: currentExecution.id,
            reportConfigId: currentExecution.reportConfigId,
            status: 'completed',
            parameters: currentExecution.parameters,
            generatedAt: currentExecution.generatedAt,
            completedAt: new Date(),
            filePath,
            fileFormat: currentExecution.fileFormat,
            executedBy: currentExecution.executedBy,
            ...(currentExecution.errorMessage && { errorMessage: currentExecution.errorMessage })
          };
          reportExecutions[executionIndex] = updatedExecution;
        }
      }
    }, 2000);

    const response: ApiResponse<ReportExecution> = {
      success: true,
      message: 'Report execution started successfully',
      data: execution,
      timestamp: new Date()
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Execute report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Get report execution status
router.get('/executions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const execution = reportExecutions.find(e => e.id === id);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Report execution not found',
        timestamp: new Date()
      });
    }

    const response: ApiResponse<ReportExecution> = {
      success: true,
      message: 'Report execution retrieved successfully',
      data: execution,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get report execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Preview report data (without generating file)
router.post('/preview', (req, res) => {
  try {
    const { reportType, parameters } = req.body;
    
    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required',
        timestamp: new Date()
      });
    }

    let reportData;
    
    switch (reportType) {
      case 'operational_summary':
        reportData = generateOperationalReport(parameters);
        break;
      case 'financial_summary':
        reportData = generateFinancialReport(parameters);
        break;
      case 'risk_analysis':
        reportData = generateRiskReport(parameters);
        break;
      case 'compliance_audit':
        reportData = generateComplianceReport(parameters);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type',
          timestamp: new Date()
        });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Report preview generated successfully',
      data: {
        reportType,
        parameters,
        data: reportData,
        generatedAt: new Date()
      },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Preview report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Get report templates/types
router.get('/templates', (req, res) => {
  try {
    const templates = [
      {
        type: 'operational_summary',
        name: 'Operational Summary',
        description: 'Transaction flows, settlement timelines, and operational metrics',
        category: 'operational',
        parameters: [
          { name: 'startDate', type: 'date', required: true },
          { name: 'endDate', type: 'date', required: true },
          { name: 'includeCharts', type: 'boolean', default: true },
          { name: 'groupBy', type: 'select', options: ['status', 'entity', 'date'] },
          { name: 'includeTrends', type: 'boolean', default: false }
        ]
      },
      {
        type: 'financial_summary',
        name: 'Financial Summary',
        description: 'Revenue, reserves, disbursements, and cash flow analysis',
        category: 'financial',
        parameters: [
          { name: 'startDate', type: 'date', required: true },
          { name: 'endDate', type: 'date', required: true },
          { name: 'includeProjections', type: 'boolean', default: false },
          { name: 'includeCashFlow', type: 'boolean', default: true },
          { name: 'compareWithPrevious', type: 'boolean', default: false }
        ]
      },
      {
        type: 'risk_analysis',
        name: 'Risk Analysis',
        description: 'Overdue transactions, limit breaches, and risk metrics',
        category: 'risk',
        parameters: [
          { name: 'startDate', type: 'date', required: true },
          { name: 'endDate', type: 'date', required: true },
          { name: 'riskLevel', type: 'select', options: ['all', 'high', 'medium', 'low'] },
          { name: 'includeRecommendations', type: 'boolean', default: true },
          { name: 'detailedAnalysis', type: 'boolean', default: false }
        ]
      },
      {
        type: 'compliance_audit',
        name: 'Compliance Audit',
        description: 'Policy compliance, audit trail, and SLA performance',
        category: 'compliance',
        parameters: [
          { name: 'startDate', type: 'date', required: true },
          { name: 'endDate', type: 'date', required: true },
          { name: 'auditLevel', type: 'select', options: ['summary', 'detailed', 'full'] },
          { name: 'includeExceptions', type: 'boolean', default: true }
        ]
      }
    ];

    const response: ApiResponse = {
      success: true,
      message: 'Report templates retrieved successfully',
      data: templates,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get report templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Download report file
router.get('/download/:id', (req, res) => {
  try {
    const { id } = req.params;
    const execution = reportExecutions.find(e => e.id === id);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Report execution not found',
        timestamp: new Date()
      });
    }

    if (execution.status !== 'completed' || !execution.filePath) {
      return res.status(400).json({
        success: false,
        message: 'Report not ready for download',
        timestamp: new Date()
      });
    }

    // In production, this would serve the actual file
    const response: ApiResponse = {
      success: true,
      message: 'Report download initiated',
      data: {
        filePath: execution.filePath,
        fileFormat: execution.fileFormat,
        downloadUrl: `/api/reports/files${execution.filePath}`
      },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

// Reports Dashboard
router.get('/dashboard', (req, res) => {
  try {
    const totalConfigs = reportConfigurations.length;
    const activeConfigs = reportConfigurations.filter(c => c.isActive).length;
    
    const totalExecutions = reportExecutions.length;
    const completedExecutions = reportExecutions.filter(e => e.status === 'completed').length;
    const failedExecutions = reportExecutions.filter(e => e.status === 'failed').length;
    const runningExecutions = reportExecutions.filter(e => e.status === 'running').length;
    
    // Recent executions
    const recentExecutions = reportExecutions
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, 10);
    
    // Execution stats by category
    const executionsByCategory = reportConfigurations.reduce((acc, config) => {
      const executions = reportExecutions.filter(e => e.reportConfigId === config.id);
      acc[config.category] = executions.length;
      return acc;
    }, {} as Record<string, number>);
    
    // Scheduled reports (next 24 hours)
    const upcomingReports = reportConfigurations
      .filter(c => c.isActive && c.schedule)
      .map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        nextRun: 'Next scheduled run would be calculated based on schedule'
      }));

    const dashboard = {
      summary: {
        totalConfigs,
        activeConfigs,
        totalExecutions,
        completedExecutions,
        failedExecutions,
        runningExecutions
      },
      recentExecutions,
      executionsByCategory,
      upcomingReports: upcomingReports.slice(0, 5),
      lastUpdated: new Date()
    };

    const response: ApiResponse = {
      success: true,
      message: 'Reports dashboard data retrieved successfully',
      data: dashboard,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    console.error('Get reports dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date()
    });
  }
});

export default router;