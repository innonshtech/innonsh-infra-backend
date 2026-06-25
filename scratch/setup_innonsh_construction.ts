import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

async function setupCompany() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- DB WIPE AND INITIALIZATION START ---');

    // 1. Wipe all operational tables
    const operationalTables = [
      'Attendance', 'AttendanceUpload', 'EquipmentDeployment', 'FuelLog', 'MaintenanceLog',
      'Equipment', 'Worker', 'BuilderPayment', 'BuilderInvoice', 'PaymentMilestone',
      'Booking', 'Customer', 'UnitHistory', 'UnitPriceLog', 'Unit', 'EstimationItem',
      'ProcurementItem', 'ProcurementRequest', 'EstimationVersion', 'Estimation',
      'Payment', 'InvoiceItem', 'Invoice', 'PurchaseOrderItem', 'PurchaseOrder',
      'Transaction',
      'StockMovement', 'Stock', 'Warehouse', 'InventoryItem', 'Vendor',
      'ProjectProgress', 'ProjectMember', 'ProjectTask', 'Contract', 'Notification',
      'Lead', 'Project', 'WBSTemplate'
    ];

    for (const table of operationalTables) {
      try {
        await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany();
      } catch (err: any) {
        console.warn(`Warning wiping table ${table}:`, err.message || err);
      }
    }

    // 2. Wipe core User, Role, and Company tables
    console.log('Wiping User, Role, and Company tables...');
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.company.deleteMany();
    console.log('Wiped core tables successfully!');

    // 3. Create the requested Company: "Innonsh Construction"
    console.log('Creating company "Innonsh Construction"...');
    const company = await prisma.company.create({
      data: {
        name: 'Innonsh Construction',
        erpType: 'CONTRACTOR',
        status: 'ACTIVE',
      }
    });
    console.log(`Created Company: ${company.name} (ID: ${company.id})`);

    // 4. Create Owner Role for this company
    console.log('Creating "Owner" role...');
    const role = await prisma.role.create({
      data: {
        name: 'Owner',
        permissions: ['*'],
        companyId: company.id
      }
    });
    console.log(`Created Role: ${role.name} (ID: ${role.id})`);

    // 5. Create Owner User: vaibhav.innonsh@gmail.com
    console.log('Creating owner user "vaibhav.innonsh@gmail.com"...');
    const hashedPassword = await bcrypt.hash('Innonsh@100', 10);
    const user = await prisma.user.create({
      data: {
        email: 'vaibhav.innonsh@gmail.com',
        password: hashedPassword,
        firstName: 'Vaibhav',
        lastName: 'Thorat',
        isActive: true,
        companyId: company.id,
        roleId: role.id,
      }
    });
    console.log(`Created User: ${user.firstName} ${user.lastName} | Email: ${user.email}`);

    console.log('\n--- SETUP COMPLETED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

setupCompany();
