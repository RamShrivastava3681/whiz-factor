import mongoose from 'mongoose';
import { EntityModel } from './src/models/schemas';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whizunik-factoring');
    console.log('Connected to MongoDB for seeding');

    // Clear existing data (optional - remove this if you want to preserve existing data)
    await EntityModel.deleteMany({});
    console.log('Cleared existing entity data');

    // Create the supplier entity that was in your in-memory array
    const supplierEntity = new EntityModel({
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
      lateFeesFrequency: 'monthly'
    });

    await supplierEntity.save();
    console.log('Seeded supplier entity:', supplierEntity.name);

    // Add a sample buyer entity for testing
    const buyerEntity = new EntityModel({
      entityId: 'BUYER-123456',
      name: 'Sample Buyer Corp',
      type: 'buyer',
      status: 'active',
      riskCategory: 'low',
      riskScore: 85,
      contactEmail: 'buyer@example.com',
      phone: '+91123456789',
      address: '123 Business Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      contactPersonName: 'John Doe',
      contactPersonDesignation: 'Purchase Manager',
      contactPersonEmail: 'john@example.com',
      contactPersonPhone: '+91123456789',
      creditLimit: 5000000,
      totalLimitSanctioned: 5000000,
      usedLimit: 0,
      usedCredit: 0,
      utilizedLimit: 0,
      availableLimit: 5000000,
      email: 'buyer@example.com',
      advanceRate: '75',
      gracePeriod: '3',
      transactionFees: {
        days0to30: '2.0',
        days31to60: '2.5',
        days61to90: '3.0',
        days91to120: '3.5',
        days121to150: '4.0'
      },
      feeDeductionMethod: 'from_advance',
      feeChargeMethod: 'face_value',
      feeTimingMethod: 'prorated_advance',
      noaRequired: true,
      collateralTaken: false,
      lateFees: '1.5',
      lateFeesFrequency: 'monthly'
    });

    await buyerEntity.save();
    console.log('Seeded buyer entity:', buyerEntity.name);

    console.log('✅ Database seeding completed successfully');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeder
if (require.main === module) {
  seedData();
}

export default seedData;