import express from 'express';
import { broadcastNotification } from '../index';

const router = express.Router();

// In-memory storage for entities (until database is implemented)
const entities: any[] = [
  // Add the supplier you created earlier for testing
  {
    id: '1767938185723',
    entityId: 'SUPPLIER-185723',
    name: 'Ram Shrivastava',
    type: 'supplier',
    status: 'active',
    riskCategory: 'medium',
    riskScore: 74,
    contactEmail: 'ramshrivastava304@gmail.com',
    phone: '+918604996520',
    address: 'C-822, 11th Avenue, Gaur City-2',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '201301',
    contactPersonName: 'Ram Shrivastava',
    contactPersonDesignation: 'Ram Shrivastava',
    contactPersonEmail: 'ramshri860499@gmail.com',
    contactPersonPhone: '+918604996520',
    creditLimit: 10000000,
    totalLimitSanctioned: 10000000,
    usedLimit: 0,
    usedCredit: 0,
    utilizedLimit: 0,
    availableLimit: 10000000,
    email: 'ramshrivastava304@gmail.com',
    advanceRate: '80',
    gracePeriod: '5',
    transactionFees: {
      days0to30: '2.5',
      days31to60: '3.0',
      days61to90: '3.5',
      days91to120: '4.0',
      days121to150: '4.5'
    },
    feeDeductionMethod: 'from_advance',
    feeChargeMethod: 'face_value',
    feeTimingMethod: 'prorated_advance',
    noaRequired: false,
    collateralTaken: false,
    lateFees: '1',
    lateFeesFrequency: 'monthly',
    lateFeesCalculationBase: 'advance',
    lateFeesCalculationMethod: 'prorated',
    processingFees: '1000',
    factoringFees: '5',
    setupFee: '2.5',
    setupFeePaymentMethod: 'one_time',
    otherFees: '',
    notes: '',
    beneficiary: 'asdfghj',
    bank: 'wedcv',
    branch: 'BCA',
    ifscCode: '123456yh',
    accountNumber: '1234567u',
    swiftCode: '2345yuj',
    correspondentBank: '234thm',
    currency: 'USD',
    bicSwiftCode: '',
    additionalAccDetail: '',
    agreementFrameworkDocument: {},
    createdAt: '2026-01-09T05:56:25.723Z',
    updatedAt: '2026-01-09T05:56:25.723Z'
  }
];

// Get all entities
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Entities retrieved successfully',
      data: entities
    });
  } catch (error) {
    console.error('Get entities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific entity by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const entity = entities.find(e => e.id === id);
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Entity retrieved successfully',
      data: entity
    });
  } catch (error) {
    console.error('Get entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get buyers only
router.get('/buyers/list', async (req, res) => {
  try {
    const buyers = entities.filter(entity => entity.type === 'buyer');
    res.json({
      success: true,
      message: 'Buyers retrieved successfully',
      data: buyers
    });
  } catch (error) {
    console.error('Get buyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get suppliers only
router.get('/suppliers/list', async (req, res) => {
  try {
    const suppliers = entities.filter(entity => entity.type === 'supplier');
    res.json({
      success: true,
      message: 'Suppliers retrieved successfully',
      data: suppliers
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new entity
router.post('/', async (req, res) => {
  try {
    const entityData = req.body;
    
    // Create new entity with generated ID and timestamps
    const newEntity = {
      id: Date.now().toString(),
      entityId: `${entityData.type?.toUpperCase() || 'ENT'}-${Date.now().toString().slice(-6)}`,
      name: entityData.name,
      type: entityData.type, // 'supplier' or 'buyer'
      status: 'active',
      riskCategory: 'medium', 
      riskScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
      
      // Contact information
      contactEmail: entityData.email,
      phone: entityData.phone,
      address: entityData.address,
      city: entityData.city,
      state: entityData.state,
      country: entityData.country,
      pincode: entityData.pincode,
      
      // Contact person
      contactPersonName: entityData.contactPersonName,
      contactPersonDesignation: entityData.contactPersonDesignation,
      contactPersonEmail: entityData.contactPersonEmail,
      contactPersonPhone: entityData.contactPersonPhone,
      
      // Financial information
      creditLimit: entityData.totalLimitSanctioned || entityData.creditLimit || 0,
      totalLimitSanctioned: entityData.totalLimitSanctioned || 0,
      usedLimit: 0, // For suppliers
      usedCredit: 0, // For buyers
      utilizedLimit: 0,
      availableLimit: entityData.totalLimitSanctioned || entityData.creditLimit || 0,
      
      // Additional fields from forms
      ...entityData,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store the entity in memory 
    entities.push(newEntity);

    console.log('Entity created:', newEntity);

    // Send real-time notification about new entity
    broadcastNotification({
      id: Date.now().toString(),
      title: `New ${newEntity.type.charAt(0).toUpperCase() + newEntity.type.slice(1)} Added`,
      message: `${newEntity.name} has been successfully added to the system`,
      type: 'success',
      timestamp: new Date().toISOString(),
      actionUrl: '/entities'
    });

    res.status(201).json({
      success: true,
      message: 'Entity created successfully',
      data: newEntity
    });
  } catch (error) {
    console.error('Create entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update entity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const entityIndex = entities.findIndex(e => e.id === id);
    
    if (entityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }
    
    // Update entity with new data
    entities[entityIndex] = {
      ...entities[entityIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Entity updated:', entities[entityIndex]);
    
    res.json({
      success: true,
      message: 'Entity updated successfully',
      data: entities[entityIndex]
    });
  } catch (error) {
    console.error('Update entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Adjust entity limits (specific endpoint for limit adjustments)
router.put('/:id/limits', async (req, res) => {
  try {
    const { id } = req.params;
    const { newLimit, reason, adjustedBy } = req.body;
    
    const entityIndex = entities.findIndex(e => e.id === id);
    
    if (entityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }

    const entity = entities[entityIndex];
    const currentLimit = entity.type === 'supplier' 
      ? (entity.totalLimitSanctioned || entity.creditLimit || 0)
      : (entity.creditLimit || entity.exposureLimit || 0);
    
    const usedLimit = entity.usedLimit || entity.usedCredit || 0;

    // Validation
    if (newLimit < 0) {
      return res.status(400).json({
        success: false,
        message: 'New limit cannot be negative'
      });
    }

    if (newLimit < usedLimit) {
      return res.status(400).json({
        success: false,
        message: 'New limit cannot be less than currently used limit',
        data: { usedLimit, newLimit }
      });
    }

    // Update limit fields based on entity type
    const limitUpdates = entity.type === 'supplier' 
      ? {
          totalLimitSanctioned: newLimit,
          creditLimit: newLimit,
          availableLimit: newLimit - usedLimit
        }
      : {
          creditLimit: newLimit,
          exposureLimit: newLimit,
          availableLimit: newLimit - usedLimit
        };

    // Update entity with new limits and audit trail
    entities[entityIndex] = {
      ...entity,
      ...limitUpdates,
      limitAdjustmentHistory: [
        ...(entity.limitAdjustmentHistory || []),
        {
          date: new Date().toISOString(),
          previousLimit: currentLimit,
          newLimit,
          reason: reason || 'No reason provided',
          adjustedBy: adjustedBy || 'System',
          change: newLimit - currentLimit,
          changePercentage: currentLimit > 0 ? ((newLimit - currentLimit) / currentLimit * 100) : 0
        }
      ],
      updatedAt: new Date().toISOString()
    };
    
    console.log(`Limit adjusted for ${entity.name}: ${currentLimit} -> ${newLimit} (${reason})`);
    
    res.json({
      success: true,
      message: 'Limits adjusted successfully',
      data: {
        entity: entities[entityIndex],
        previousLimit: currentLimit,
        newLimit,
        change: newLimit - currentLimit,
        availableLimit: newLimit - usedLimit
      }
    });
  } catch (error) {
    console.error('Adjust limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete entity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const entityIndex = entities.findIndex(e => e.id === id);
    
    if (entityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }
    
    const deletedEntity = entities.splice(entityIndex, 1)[0];
    
    console.log('Entity deleted:', deletedEntity.name, deletedEntity.id);
    
    res.json({
      success: true,
      message: 'Entity deleted successfully',
      data: deletedEntity
    });
  } catch (error) {
    console.error('Delete entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Export entities for cross-module access (temporary until database implementation)
export { entities };

export default router;