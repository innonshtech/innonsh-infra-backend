import { prisma } from './src/config/prisma.config';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Starting seed...');

  const userEmail = 'lokeek.inonsh@gmail.com';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (existingUser) {
    console.log(`User ${userEmail} already exists. Attempting to seed missing data or delete? For this script, we'll delete the existing company and user to re-seed cleanly.`);
    if (existingUser.companyId) {
      // Deleting the company should cascade delete almost everything else if set up right, but Prisma default relations restrict deletions.
      // Alternatively, we can just create a new company and re-assign. Or update the existing user.
      // Let's just create a new company for the new data if not deleting.
    }
  }

  // 1. Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Lokeek Construction Corp',
      erpType: 'BUILDER',
      status: 'ACTIVE',
    },
  });

  // 2. Create Role
  const role = await prisma.role.create({
    data: {
      name: 'Admin',
      permissions: ['ALL'],
      companyId: company.id,
    },
  });

  // 3. Create User
  const hashedPassword = await bcrypt.hash('Lokeek@25', 10);
  let user;
  
  if (existingUser) {
    user = await prisma.user.update({
      where: { email: userEmail },
      data: {
        password: hashedPassword,
        companyId: company.id,
        roleId: role.id,
      }
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        password: hashedPassword,
        firstName: 'Lokeek',
        lastName: 'Inonsh',
        companyId: company.id,
        roleId: role.id,
        isActive: true,
      },
    });
  }

  // 4. Create common data (Vendors, Inventory, Warehouse)
  const vendor = await prisma.vendor.create({
    data: {
      companyId: company.id,
      name: 'BuildMat Suppliers',
      email: 'sales@buildmat.com',
    },
  });

  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      name: 'Main Depot',
      location: 'Central Yard',
    },
  });

  const cement = await prisma.inventoryItem.create({
    data: {
      companyId: company.id,
      name: 'Portland Cement',
      unit: 'Bags',
      category: 'Materials',
    },
  });
  
  const steel = await prisma.inventoryItem.create({
    data: {
      companyId: company.id,
      name: 'Steel Rebar 12mm',
      unit: 'Ton',
      category: 'Materials',
    },
  });

  await prisma.stock.createMany({
    data: [
      { companyId: company.id, warehouseId: warehouse.id, inventoryItemId: cement.id, quantity: 500 },
      { companyId: company.id, warehouseId: warehouse.id, inventoryItemId: steel.id, quantity: 100 },
    ]
  });

  const worker = await prisma.worker.create({
    data: {
      companyId: company.id,
      firstName: 'John',
      lastName: 'Doe',
      role: 'Mason',
      dailyWage: 800,
    },
  });

  const equipment = await prisma.equipment.create({
    data: {
      companyId: company.id,
      name: 'Excavator Cat 320',
      type: 'Excavator',
      status: 'OPERATIONAL',
    },
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: company.id,
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  });

  // 5. Create 4 Projects
  const projectNames = ['Skyline Towers', 'Riverside Residences', 'Green Valley Villas', 'Downtown Commercial Complex'];

  for (let i = 0; i < projectNames.length; i++) {
    const project = await prisma.project.create({
      data: {
        name: projectNames[i],
        companyId: company.id,
        status: 'IN_PROGRESS',
        budget: 5000000 * (i + 1),
        area: 10000 * (i + 1),
      },
    });

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: 'Project Manager',
      },
    });

    const task = await prisma.projectTask.create({
      data: {
        name: 'Foundation Work',
        projectId: project.id,
        status: 'IN_PROGRESS',
        progress: 50,
      },
    });

    await prisma.attendance.create({
      data: {
        companyId: company.id,
        workerId: worker.id,
        projectId: project.id,
        date: new Date(Date.now() - i * 86400000), // different dates
        status: 'PRESENT',
        wageAmount: 800,
      },
    });

    await prisma.equipmentDeployment.create({
      data: {
        companyId: company.id,
        equipmentId: equipment.id,
        projectId: project.id,
        startDate: new Date(),
      },
    });

    const estimation = await prisma.estimation.create({
      data: {
        companyId: company.id,
        projectId: project.id,
      },
    });

    const estVersion = await prisma.estimationVersion.create({
      data: {
        estimationId: estimation.id,
        versionNumber: 1,
        title: 'Initial BOQ',
        totalAmount: 150000,
      },
    });

    await prisma.estimationItem.create({
      data: {
        estimationVersionId: estVersion.id,
        inventoryItemId: cement.id,
        description: 'Cement for Foundation',
        quantity: 100,
        unit: 'Bags',
        rate: 400,
        amount: 40000,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        unitNumber: `A-${i+1}01`,
        price: 2500000,
        status: 'AVAILABLE',
      },
    });

    await prisma.booking.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        unitId: unit.id,
        customerId: customer.id,
        totalAmount: 2500000,
      },
    });

    const procReq = await prisma.procurementRequest.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        title: 'Cement Order',
        requestedById: user.id,
      },
    });

    await prisma.purchaseOrder.create({
      data: {
        companyId: company.id,
        vendorId: vendor.id,
        requestId: procReq.id,
        poNumber: `PO-${i}-${Date.now()}`,
        totalAmount: 40000,
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        invoiceNumber: `INV-${i}-${Date.now()}`,
        clientName: 'Jane Smith',
        totalAmount: 50000,
        dueAmount: 50000,
        dueDate: new Date(),
      },
    });

    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: 'Consultation',
        quantity: 1,
        unitPrice: 50000,
        amount: 50000,
      },
    });

    console.log(`Seeded project ${project.name}`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
