import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function seedRichData() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- WIPE OPERATIONAL DATA (PRESERVING OWNER/COMPANY/ROLES) START ---');

    // 1. Fetch the existing Owner User and Company
    const user = await prisma.user.findUnique({
      where: { email: 'vaibhav.innonsh@gmail.com' },
      include: { company: true },
    });

    if (!user || !user.companyId) {
      throw new Error('Owner user vaibhav.innonsh@gmail.com or company "Innonsh Construction" not found. Run setup_innonsh_construction.ts first!');
    }

    const companyId = user.companyId;
    console.log(`Found Company ID: ${companyId} and User ID: ${user.id}`);

    // 2. Wipe existing operational data under this company
    const tablesToWipe = [
      { name: 'Attendance', action: () => prisma.attendance.deleteMany({ where: { companyId } }) },
      { name: 'AttendanceUpload', action: () => prisma.attendanceUpload.deleteMany({ where: { companyId } }) },
      { name: 'EquipmentDeployment', action: () => prisma.equipmentDeployment.deleteMany({ where: { companyId } }) },
      { name: 'FuelLog', action: () => prisma.fuelLog.deleteMany({ where: { companyId } }) },
      { name: 'MaintenanceLog', action: () => prisma.maintenanceLog.deleteMany({ where: { companyId } }) },
      { name: 'Equipment', action: () => prisma.equipment.deleteMany({ where: { companyId } }) },
      { name: 'Worker', action: () => prisma.worker.deleteMany({ where: { companyId } }) },
      { name: 'BuilderPayment', action: () => prisma.builderPayment.deleteMany({ where: { companyId } }) },
      { name: 'BuilderInvoice', action: () => prisma.builderInvoice.deleteMany({ where: { companyId } }) },
      { name: 'PaymentMilestone', action: () => prisma.booking.findMany({ where: { companyId } }).then(async (bookings) => {
          return prisma.paymentMilestone.deleteMany({ where: { bookingId: { in: bookings.map(b => b.id) } } });
        })
      },
      { name: 'Booking', action: () => prisma.booking.deleteMany({ where: { companyId } }) },
      { name: 'Customer', action: () => prisma.customer.deleteMany({ where: { companyId } }) },
      { name: 'UnitHistory', action: () => prisma.unitHistory.deleteMany({ where: { unit: { companyId } } }) },
      { name: 'UnitPriceLog', action: () => prisma.unitPriceLog.deleteMany({ where: { unit: { companyId } } }) },
      { name: 'Unit', action: () => prisma.unit.deleteMany({ where: { companyId } }) },
      { name: 'EstimationItem', action: () => prisma.estimationItem.deleteMany({ where: { version: { estimation: { companyId } } } }) },
      { name: 'ProcurementItem', action: () => prisma.procurementItem.deleteMany({ where: { request: { companyId } } }) },
      { name: 'ProcurementRequest', action: () => prisma.procurementRequest.deleteMany({ where: { companyId } }) },
      { name: 'EstimationVersion', action: () => prisma.estimationVersion.deleteMany({ where: { estimation: { companyId } } }) },
      { name: 'Estimation', action: () => prisma.estimation.deleteMany({ where: { companyId } }) },
      { name: 'Payment', action: () => prisma.payment.deleteMany({ where: { companyId } }) },
      { name: 'InvoiceItem', action: () => prisma.invoiceItem.deleteMany({ where: { invoice: { companyId } } }) },
      { name: 'Invoice', action: () => prisma.invoice.deleteMany({ where: { companyId } }) },
      { name: 'PurchaseOrderItem', action: () => prisma.purchaseOrderItem.deleteMany({ where: { po: { companyId } } }) },
      { name: 'PurchaseOrder', action: () => prisma.purchaseOrder.deleteMany({ where: { companyId } }) },
      { name: 'StockMovement', action: () => prisma.stockMovement.deleteMany({ where: { companyId } }) },
      { name: 'Stock', action: () => prisma.stock.deleteMany({ where: { companyId } }) },
      { name: 'Warehouse', action: () => prisma.warehouse.deleteMany({ where: { companyId } }) },
      { name: 'InventoryItem', action: () => prisma.inventoryItem.deleteMany({ where: { companyId } }) },
      { name: 'Vendor', action: () => prisma.vendor.deleteMany({ where: { companyId } }) },
      { name: 'ProjectProgress', action: () => prisma.$executeRawUnsafe(`DELETE FROM "ProjectProgress" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "companyId" = '${companyId}')`) },
      { name: 'ProjectMember', action: () => prisma.$executeRawUnsafe(`DELETE FROM "ProjectMember" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "companyId" = '${companyId}')`) },
      { name: 'ProjectTask', action: () => prisma.$executeRawUnsafe(`DELETE FROM "ProjectTask" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "companyId" = '${companyId}')`) },
      { name: 'Contract', action: () => prisma.contract.deleteMany({ where: { companyId } }) },
      { name: 'Notification', action: () => prisma.notification.deleteMany({ where: { companyId } }) },
      { name: 'Lead', action: () => prisma.lead.deleteMany({ where: { companyId } }) },
      { name: 'ProjectPhase', action: () => prisma.$executeRawUnsafe(`DELETE FROM "ProjectPhase" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "companyId" = '${companyId}')`) },
      { name: 'ProjectMilestone', action: () => prisma.$executeRawUnsafe(`DELETE FROM "ProjectMilestone" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "companyId" = '${companyId}')`) },
      { name: 'ProjectResourcePlan', action: () => prisma.$executeRawUnsafe(`DELETE FROM "ProjectResourcePlan" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "companyId" = '${companyId}')`) },
      { name: 'ProjectRisk', action: () => prisma.$executeRawUnsafe(`DELETE FROM "ProjectRisk" WHERE "projectId" IN (SELECT id FROM "Project" WHERE "companyId" = '${companyId}')`) },
      { name: 'Project', action: () => prisma.project.deleteMany({ where: { companyId } }) },
      { name: 'WBSTemplate', action: () => prisma.wBSTemplate.deleteMany({ where: { companyId } }) },
      { name: 'Branch', action: () => prisma.branch.deleteMany({ where: { companyId } }) },
      { name: 'Department', action: () => prisma.department.deleteMany({ where: { companyId } }) },
      { name: 'Designation', action: () => prisma.designation.deleteMany({ where: { companyId } }) },
      { name: 'CompanyDocument', action: () => prisma.companyDocument.deleteMany({ where: { companyId } }) },
    ];

    for (const table of tablesToWipe) {
      try {
        await table.action();
        console.log(`Cleaned existing records for: ${table.name}`);
      } catch (err: any) {
        console.warn(`Wiping table ${table.name} warned: ${err.message || err}`);
      }
    }

    console.log('\n--- START SEEDING RICH DUMMY DATA ---');

    // 3. Branches, Departments, Designations
    console.log('Seeding organization structure...');
    const mainBranch = await prisma.branch.create({
      data: { companyId, name: 'Mumbai H.O.', code: 'MHO', city: 'Mumbai', state: 'Maharashtra', phone: '+91 22 8888 8888', email: 'mumbai@innonsh.com', address: '101 Corporate Hub, Bandra Kurla Complex' }
    });
    const subBranch = await prisma.branch.create({
      data: { companyId, name: 'Pune Regional Office', code: 'PRO', city: 'Pune', state: 'Maharashtra', phone: '+91 20 9999 9999', email: 'pune@innonsh.com', address: '402 Prime Hub, Baner Road' }
    });

    const hrDept = await prisma.department.create({
      data: { companyId, name: 'Human Resources' }
    });
    const engDept = await prisma.department.create({
      data: { companyId, name: 'Engineering' }
    });

    const managerDes = await prisma.designation.create({
      data: { companyId, name: 'Senior Project Manager' }
    });

    // 4. Vendors & Warehouses
    console.log('Seeding Vendors & Warehouses...');
    const cementVendor = await prisma.vendor.create({
      data: { companyId, name: 'Ultratech Cement Suppliers', email: 'sales@ultratech.com', phone: '+91 90000 11111', address: 'Plot 4, MIDC, Mumbai' }
    });
    const steelVendor = await prisma.vendor.create({
      data: { companyId, name: 'Tata Steel India', email: 'orders@tatasteel.com', phone: '+91 90000 22222', address: 'Jamshedpur Yard' }
    });

    const mainWarehouse = await prisma.warehouse.create({
      data: { companyId, name: 'Mumbai Central Yard', location: 'Navi Mumbai, Sector 15' }
    });
    const subWarehouse = await prisma.warehouse.create({
      data: { companyId, name: 'Pune Material Depot', location: 'Chakan MIDC, Phase 2' }
    });

    // 5. Inventory Items & Stock
    console.log('Seeding Inventory Items...');
    const cement = await prisma.inventoryItem.create({
      data: { companyId, name: 'OPC 53 Grade Cement', category: 'Materials', unit: 'Bags', sku: 'CEM-OPC-53', minStock: 100 }
    });
    const steel = await prisma.inventoryItem.create({
      data: { companyId, name: 'TMT Steel Bar 16mm', category: 'Materials', unit: 'Metric Ton', sku: 'STL-TMT-16', minStock: 10 }
    });
    const pipes = await prisma.inventoryItem.create({
      data: { companyId, name: 'PVC Conduit Pipes 25mm', category: 'Fittings', unit: 'Meters', sku: 'PVC-PIP-25', minStock: 200 }
    });

    await prisma.stock.createMany({
      data: [
        { companyId, warehouseId: mainWarehouse.id, inventoryItemId: cement.id, quantity: 1500 },
        { companyId, warehouseId: mainWarehouse.id, inventoryItemId: steel.id, quantity: 45 },
        { companyId, warehouseId: subWarehouse.id, inventoryItemId: cement.id, quantity: 400 },
        { companyId, warehouseId: subWarehouse.id, inventoryItemId: pipes.id, quantity: 1200 },
      ]
    });

    // 6. Workers & Equipment
    console.log('Seeding Workers...');
    const worker1 = await prisma.worker.create({
      data: { companyId, firstName: 'Ramesh', lastName: 'Kumar', role: 'Carpenter', dailyWage: 750, phone: '+91 99999 00001' }
    });
    const worker2 = await prisma.worker.create({
      data: { companyId, firstName: 'Suresh', lastName: 'Singh', role: 'Mason', dailyWage: 850, phone: '+91 99999 00002' }
    });
    const worker3 = await prisma.worker.create({
      data: { companyId, firstName: 'Amit', lastName: 'Patel', role: 'Helper', dailyWage: 550, phone: '+91 99999 00003' }
    });

    console.log('Seeding Equipment...');
    const excavator = await prisma.equipment.create({
      data: { companyId, name: 'Tata Hitachi ZAXIS 220 Excavator', type: 'Heavy Excavator', serialNumber: 'TH-EX-9988', ownership: 'OWNED', status: 'OPERATIONAL' }
    });
    const backhoe = await prisma.equipment.create({
      data: { companyId, name: 'JCB 3DX Backhoe Loader', type: 'Backhoe', serialNumber: 'JCB-BL-1122', ownership: 'RENTED', status: 'OPERATIONAL' }
    });

    // 7. Projects
    console.log('Seeding Projects...');
    const p1 = await prisma.project.create({
      data: {
        companyId,
        name: 'Mumbai Metro Line 4 (Section A)',
        description: 'Construction of elevated corridor and 5 metro stations.',
        status: 'IN_PROGRESS',
        budget: 450000000,
        area: 120000,
        clientName: 'MMRDA',
        plannedStartDate: new Date('2026-01-10'),
        plannedEndDate: new Date('2027-12-30'),
        currentPhase: 'Civil Substructure',
        priority: 'HIGH',
        code: 'MML4-A',
        projectType: 'Infrastructure',
        clientContactPerson: 'Mr. A. K. Sharma',
        clientPhone: '+91 22 2659 0000',
        clientEmail: 'contact@mmrda.gov.in',
        contractNumber: 'MMRDA/MML4/2026/CA-02',
        address: 'LBS Road, Bhandup West',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400078',
      }
    });

    const p2 = await prisma.project.create({
      data: {
        companyId,
        name: 'Rohan Ananta Sector 2',
        description: 'Residential housing complex containing 3 towers of 15 storeys.',
        status: 'IN_PROGRESS',
        budget: 280000000,
        area: 95000,
        clientName: 'Rohan Developers Pvt Ltd',
        plannedStartDate: new Date('2026-03-01'),
        plannedEndDate: new Date('2027-06-15'),
        currentPhase: 'Superstructure Slab',
        priority: 'MEDIUM',
        code: 'RA-SEC2',
        projectType: 'Residential',
        address: 'Tathawade, Near Highway',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        pincode: '411033',
      }
    });

    const p3 = await prisma.project.create({
      data: {
        companyId,
        name: 'Pune Airport Extension Terminal',
        description: 'Renovation and structural expansion of the new arrivals terminal.',
        status: 'PLANNED',
        budget: 650000000,
        area: 180000,
        clientName: 'AAI (Airports Authority of India)',
        plannedStartDate: new Date('2026-08-01'),
        plannedEndDate: new Date('2028-02-28'),
        currentPhase: 'Planning & Engineering Design',
        priority: 'HIGH',
        code: 'PNQ-TR-EXT',
        projectType: 'Commercial',
        address: 'Lohegaon Airport Road',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        pincode: '411032',
      }
    });

    // 8. Project Members, Phases, Milestones, Progress
    console.log('Seeding Project Sub-entities...');
    await prisma.projectMember.createMany({
      data: [
        { projectId: p1.id, userId: user.id, role: 'Senior Project Manager' },
        { projectId: p2.id, userId: user.id, role: 'Senior Project Manager' },
        { projectId: p3.id, userId: user.id, role: 'Planning Lead' },
      ]
    });

    await prisma.projectProgress.createMany({
      data: [
        { projectId: p1.id, percentage: 34.5, statusUpdate: 'Civil substructure columns 80% completed. Pier cap installations starting next week.' },
        { projectId: p2.id, percentage: 12.0, statusUpdate: 'Excavation completed. Foundation slab poured for Tower A & B.' }
      ]
    });

    const p1Phase1 = await prisma.projectPhase.create({
      data: { projectId: p1.id, name: 'Phase 1: Civil Works', status: 'IN_PROGRESS', startDate: new Date('2026-01-10'), endDate: new Date('2026-11-30') }
    });
    const p1Phase2 = await prisma.projectPhase.create({
      data: { projectId: p1.id, name: 'Phase 2: Finishing & MEP', status: 'PLANNED', startDate: new Date('2026-12-01'), endDate: new Date('2027-10-31') }
    });

    await prisma.projectMilestone.createMany({
      data: [
        { projectId: p1.id, name: 'Foundation Completion', targetDate: new Date('2026-04-15'), isCompleted: true },
        { projectId: p1.id, name: 'Pillar Casting 100 Pillars', targetDate: new Date('2026-09-30'), isCompleted: false },
        { projectId: p2.id, name: 'Basement Excavation Done', targetDate: new Date('2026-05-10'), isCompleted: true },
      ]
    });

    await prisma.projectRisk.createMany({
      data: [
        { projectId: p1.id, name: 'Monsoon Flooding Risk', priority: 'HIGH', status: 'ACTIVE' },
        { projectId: p1.id, name: 'Steel Price Fluctuation', priority: 'MEDIUM', status: 'MITIGATED' },
      ]
    });

    // 9. Project Tasks (WBS)
    console.log('Seeding Project Tasks (WBS)...');
    // Mumbai Metro Tasks
    const tRoot = await prisma.projectTask.create({
      data: { name: 'Civil Substructure & Piers', wbsCode: '1', progress: 68.0, status: 'IN_PROGRESS', projectId: p1.id }
    });
    const tExcavation = await prisma.projectTask.create({
      data: { name: 'Pillar Location Excavation', wbsCode: '1.1', progress: 100.0, status: 'COMPLETED', projectId: p1.id, parentId: tRoot.id, startDate: new Date('2026-01-15'), endDate: new Date('2026-03-10') }
    });
    const tPiles = await prisma.projectTask.create({
      data: { name: 'Reinforcement & Pile Foundation Casting', wbsCode: '1.2', progress: 85.0, status: 'IN_PROGRESS', projectId: p1.id, parentId: tRoot.id, startDate: new Date('2026-03-12'), endDate: new Date('2026-07-20') }
    });
    const tPierCaps = await prisma.projectTask.create({
      data: { name: 'Pier Caps & Segmental Launcher Setup', wbsCode: '1.3', progress: 20.0, status: 'IN_PROGRESS', projectId: p1.id, parentId: tRoot.id, startDate: new Date('2026-06-01'), endDate: new Date('2026-11-15') }
    });

    // Rohan Ananta Tasks
    const tRohanRoot = await prisma.projectTask.create({
      data: { name: 'Substructure Foundation', wbsCode: '1', progress: 40.0, status: 'IN_PROGRESS', projectId: p2.id }
    });
    await prisma.projectTask.create({
      data: { name: 'Soil Compaction & PCC', wbsCode: '1.1', progress: 100.0, status: 'COMPLETED', projectId: p2.id, parentId: tRohanRoot.id, startDate: new Date('2026-03-05'), endDate: new Date('2026-04-10') }
    });
    await prisma.projectTask.create({
      data: { name: 'Raft Reinforcement Shuttering', wbsCode: '1.2', progress: 10.0, status: 'IN_PROGRESS', projectId: p2.id, parentId: tRohanRoot.id, startDate: new Date('2026-04-15'), endDate: new Date('2026-06-30') }
    });

    // 10. Estimations & BOQs
    console.log('Seeding Estimations & BOQs...');
    const est1 = await prisma.estimation.create({
      data: { companyId, projectId: p1.id, status: 'ACTIVE' }
    });
    const est1Ver = await prisma.estimationVersion.create({
      data: {
        estimationId: est1.id,
        versionNumber: 1,
        title: 'Mumbai Metro Phase 1 BOQ Base v1',
        description: 'BOQ representing primary concrete, steel, and pipe structure requirements.',
        totalAmount: 18500000,
        status: 'APPROVED',
        requestedById: user.id,
        approvedById: user.id,
        approvalDate: new Date(),
        approvalNotes: 'Pricing verified against latest materials indices. Approved for execution.'
      }
    });

    await prisma.estimationItem.createMany({
      data: [
        { estimationVersionId: est1Ver.id, inventoryItemId: cement.id, description: 'High durability concrete structures', quantity: 25000, unit: 'Bags', rate: 420, amount: 10500000 },
        { estimationVersionId: est1Ver.id, inventoryItemId: steel.id, description: 'Reinforcement structural bars 16mm', quantity: 160, unit: 'Metric Ton', rate: 48000, amount: 7680000 },
        { estimationVersionId: est1Ver.id, inventoryItemId: pipes.id, description: 'Cable conduit fittings', quantity: 4000, unit: 'Meters', rate: 80, amount: 320000 },
      ]
    });

    // 11. Workers Attendance
    console.log('Seeding Attendance Records...');
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const attendanceDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
      await prisma.attendance.createMany({
        data: [
          { companyId, workerId: worker1.id, projectId: p1.id, date: attendanceDate, status: 'PRESENT', wageAmount: 750, overtimeHrs: 1 },
          { companyId, workerId: worker2.id, projectId: p1.id, date: attendanceDate, status: 'PRESENT', wageAmount: 850, overtimeHrs: 0 },
          { companyId, workerId: worker3.id, projectId: p2.id, date: attendanceDate, status: dayOffset === 2 ? 'ABSENT' : 'PRESENT', wageAmount: dayOffset === 2 ? 0 : 550, overtimeHrs: 0 },
        ]
      });
    }

    // 12. Equipment Deployments, Fuel, and Maintenance
    console.log('Seeding Equipment Logs...');
    const dep1 = await prisma.equipmentDeployment.create({
      data: { companyId, equipmentId: excavator.id, projectId: p1.id, startDate: new Date('2026-01-12'), notes: 'Assigned to Bhandup Pier excavation works.' }
    });
    const dep2 = await prisma.equipmentDeployment.create({
      data: { companyId, equipmentId: backhoe.id, projectId: p2.id, startDate: new Date('2026-03-05'), notes: 'Assigned to basement soil shifting.' }
    });

    await prisma.fuelLog.createMany({
      data: [
        { companyId, equipmentId: excavator.id, projectId: p1.id, date: new Date('2026-06-25'), quantity: 120.5, totalCost: 11500, costPerUnit: 95.4 },
        { companyId, equipmentId: backhoe.id, projectId: p2.id, date: new Date('2026-06-28'), quantity: 65.0, totalCost: 6200, costPerUnit: 95.4 }
      ]
    });

    await prisma.maintenanceLog.createMany({
      data: [
        { companyId, equipmentId: excavator.id, date: new Date('2026-05-15'), type: 'ROUTINE', description: 'Hydraulic oil filter replacement & general lubrication check.', cost: 24500, performedBy: 'Hitachi Authorized Service center' },
        { companyId, equipmentId: backhoe.id, date: new Date('2026-06-10'), type: 'REPAIR', description: 'Replaced damaged radiator hose pipe.', cost: 3800, performedBy: 'Local Workshop Mechanic' }
      ]
    });

    // 13. Procurement Flow (Requests & POs)
    console.log('Seeding Procurement Flow...');
    const req1 = await prisma.procurementRequest.create({
      data: {
        companyId,
        projectId: p1.id,
        title: 'Procurement of Steel Bars - Bhandup site',
        description: 'Urgent demand for slab reinforcement steel bars.',
        status: 'APPROVED',
        requestedById: user.id,
        approvedById: user.id,
        approvalDate: new Date(),
        estimationVersionId: est1Ver.id
      }
    });

    const reqItem1 = await prisma.procurementItem.create({
      data: { requestId: req1.id, description: 'TMT Steel Bar 16mm', quantity: 20, unit: 'Metric Ton', estimatedRate: 48000, amount: 960000 }
    });

    const po1 = await prisma.purchaseOrder.create({
      data: {
        companyId,
        vendorId: steelVendor.id,
        requestId: req1.id,
        poNumber: 'PO-2026-MHO-0087',
        totalAmount: 950000,
        status: 'SENT',
        createdAt: new Date('2026-06-15')
      }
    });

    await prisma.purchaseOrderItem.create({
      data: { poId: po1.id, description: 'TMT Steel Bar 16mm (Fe 500D)', quantity: 20, unit: 'Metric Ton', rate: 47500, amount: 950000 }
    });

    // 14. Invoicing, Payments & Financial Transactions
    console.log('Seeding Invoicing & Billing...');
    const inv1 = await prisma.invoice.create({
      data: {
        companyId,
        projectId: p1.id,
        invoiceNumber: 'INV-MHO-026-004',
        clientName: 'MMRDA Office',
        totalAmount: 8500000,
        paidAmount: 5000000,
        dueAmount: 3500000,
        dueDate: new Date('2026-07-25'),
        status: 'PARTIALLY_PAID',
        createdAt: new Date('2026-06-01')
      }
    });

    await prisma.invoiceItem.createMany({
      data: [
        { invoiceId: inv1.id, description: 'Completion of foundation pillars 1 to 25', quantity: 25, unitPrice: 300000, amount: 7500000 },
        { invoiceId: inv1.id, description: 'Soil clearance and site excavation works', quantity: 1, unitPrice: 1000000, amount: 1000000 }
      ]
    });

    const mainTx = await prisma.transaction.create({
      data: {
        companyId,
        type: 'INCOME',
        category: 'Client Milestone Invoice',
        amount: 5000000,
        date: new Date('2026-06-20'),
        description: 'First part payment for Invoice INV-MHO-026-004 from MMRDA',
        referenceId: inv1.id
      }
    });

    await prisma.payment.create({
      data: {
        companyId,
        invoiceId: inv1.id,
        transactionId: mainTx.id,
        amount: 5000000,
        paymentDate: new Date('2026-06-20'),
        method: 'RTGS'
      }
    });

    await prisma.transaction.create({
      data: {
        companyId,
        type: 'EXPENSE',
        category: 'Equipment Operations',
        amount: 17700,
        date: new Date('2026-06-26'),
        description: 'Fuel filling for excavator and loader machines.'
      }
    });

    // 15. Real estate (Builder ERP) units, customers & bookings
    console.log('Seeding Builder/Real Estate items...');
    const bCustomer = await prisma.customer.create({
      data: { companyId, name: 'Siddharth Patil', email: 'siddharth@gmail.com', phone: '+91 98888 77777', address: 'B-402, Sea Breeze, Mumbai' }
    });

    const unit1 = await prisma.unit.create({
      data: { companyId, projectId: p2.id, unitNumber: 'Tower A - 1001', price: 9500000, status: 'BOOKED', area: 1250, type: '3 BHK Residential' }
    });
    const unit2 = await prisma.unit.create({
      data: { companyId, projectId: p2.id, unitNumber: 'Tower A - 1002', price: 9500000, status: 'AVAILABLE', area: 1250, type: '3 BHK Residential' }
    });

    const booking = await prisma.booking.create({
      data: {
        companyId,
        projectId: p2.id,
        unitId: unit1.id,
        customerId: bCustomer.id,
        totalAmount: 9500000,
        bookingDate: new Date('2026-05-15'),
        paidAmount: 1000000,
        status: 'CONFIRMED'
      }
    });

    await prisma.unitHistory.create({
      data: { unitId: unit1.id, fromStatus: 'AVAILABLE', toStatus: 'BOOKED', changedById: user.id, notes: 'Booked by Siddharth Patil (Booking ID: ' + booking.id + ')' }
    });
    await prisma.unitPriceLog.create({
      data: { unitId: unit1.id, oldPrice: 9500000, newPrice: 9500000, changedById: user.id }
    });

    await prisma.paymentMilestone.create({
      data: { bookingId: booking.id, name: 'Booking Advance Payment', amountPercent: 10.5, status: 'PAID', taskId: tExcavation.id }
    });
    await prisma.paymentMilestone.create({
      data: { bookingId: booking.id, name: 'Foundation Completion', amountPercent: 21.0, status: 'PENDING' }
    });

    const bInvoice1 = await prisma.builderInvoice.create({
      data: {
        companyId,
        bookingId: booking.id,
        invoiceNumber: 'BINV-2026-0001',
        totalAmount: 1000000,
        grandTotal: 1000000,
        dueAmount: 0,
        dueDate: new Date('2026-05-30'),
        status: 'PAID'
      }
    });

    await prisma.builderPayment.create({
      data: {
        companyId,
        bookingId: booking.id,
        invoiceId: bInvoice1.id,
        amount: 1000000,
        paymentDate: new Date('2026-05-18'),
        paymentMethod: 'NetBanking'
      }
    });

    // 16. Documents & Settings
    console.log('Seeding Documents & Settings...');
    await prisma.companyDocument.createMany({
      data: [
        { companyId, name: 'GST Certificate (Innonsh)', type: 'GST_CERTIFICATE', url: 'https://pdfobject.com/pdf/sample.pdf', expiryDate: new Date('2030-01-01') },
        { companyId, name: 'PAN Card (Innonsh)', type: 'OTHER', url: 'https://pdfobject.com/pdf/sample.pdf' },
      ]
    });

    console.log('\n--- ALL RICH DUMMY DATA SEEDED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Error during rich data seeding:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedRichData();
