require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const StockMovement = require('../models/StockMovement');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out to preserve data)
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Settings.deleteMany({});
    await StockMovement.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // --- Create Admin User ---
    const adminUser = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@omcartridge.local',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);

    // --- Create Default Settings ---
    await Settings.create({
      singleton: 'settings',
      business: {
        name: 'OM ENTERPRISE',
        brandName: 'OM CARTRIDGE',
        address: '10, C-DAC Computer,\nBavla Road,\nSanand, Ahmedabad,\nGujarat',
        gstin: '24ACWPZ3281G1ZX',
        state: 'Gujarat',
        stateCode: '24',
        phone1: '70967 06868',
        phone2: '70967 06363',
      },
      bank: {
        bankName: 'THE KALUPUR COMMERCIAL CO.OP.BANK LTD.',
        accountNo: '00520103077',
        branch: 'SANAND',
        ifsc: 'KCCB0SNN005',
      },
      invoice: {
        prefix: 'OM',
        defaultGstRate: 18,
        defaultPaymentTerms: 'Due on Receipt',
        jurisdiction: 'SUBJECT TO AHMEDABAD JURISDICTION',
        declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      },
      smtp: { host: '', port: 587, user: '', password: '', from: '' },
    });
    console.log('✅ Default settings created');

    // --- Create Sample Products ---
    const product1 = await Product.create({
      name: 'NEW 337/283A PRINTER TONER CARTRIDGE',
      sku: 'OC-337-283A',
      hsnSac: '84439952',
      description: 'Compatible toner cartridge for HP printers',
      quantity: 50,
      unit: 'PCS',
      purchaseRate: 200,
      sellingRate: 270,
      gstRate: 18,
      minimumStock: 5,
      isActive: true,
    });

    const product2 = await Product.create({
      name: 'NEW 072/1380A PRINTER TONER CARTRIDGE (WITH CHIP)',
      sku: 'OC-072-1380A',
      hsnSac: '84439952',
      description: 'Compatible toner cartridge with chip for HP printers',
      quantity: 30,
      unit: 'PCS',
      purchaseRate: 400,
      sellingRate: 546,
      gstRate: 18,
      minimumStock: 5,
      isActive: true,
    });

    // Record initial stock movements
    await StockMovement.create([
      {
        productId: product1._id,
        type: 'IN',
        quantity: 50,
        previousQuantity: 0,
        newQuantity: 50,
        reason: 'Initial Stock - Seed',
        referenceType: 'SEED',
        createdBy: adminUser._id,
      },
      {
        productId: product2._id,
        type: 'IN',
        quantity: 30,
        previousQuantity: 0,
        newQuantity: 30,
        reason: 'Initial Stock - Seed',
        referenceType: 'SEED',
        createdBy: adminUser._id,
      },
    ]);

    console.log(`✅ Products created:`);
    console.log(`   - ${product1.name} (Qty: 50)`);
    console.log(`   - ${product2.name} (Qty: 30)`);

    // --- Create Sample Customer ---
    const customer = await Customer.create({
      name: 'AMBA INFOTECH',
      address: '9, DARBARI BAGICHA SOCIETY,\nBAVLA ROAD,\nSANAND, AHMEDABAD',
      gstin: '24APSPP7299B2ZB',
      state: 'Gujarat',
      stateCode: '24',
      phone: '',
      email: '',
      contactPerson: '',
      notes: 'Sample customer from seed data',
    });
    console.log(`✅ Customer created: ${customer.name}`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Admin Email: ${adminUser.email}`);
    console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
