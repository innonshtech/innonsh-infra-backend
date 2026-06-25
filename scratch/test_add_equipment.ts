import { EquipmentService } from '../src/modules/contractor/equipment/equipment.service';
import { prisma } from '../src/config/prisma.config';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const service = new EquipmentService();

  // Find a valid company ID from the database
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found in database. Run seed script first.');
    return;
  }

  console.log(`Using company: ${company.name} (${company.id})`);

  // Exact payload format sent by frontend for a new Owned equipment
  const ownedPayload = {
    name: 'Volvo EC210 Excavator',
    type: 'Excavator',
    serialNumber: '', // Blank, simulating empty input field
    ownership: 'OWNED',
    projectId: undefined,
    dailyRentalRate: undefined,
    hourlyRate: undefined,
    purchaseCost: 5000000,
    assetLifeYears: 10,
    depreciationMethod: 'SLM',
    purchaseDate: '2025-12-24'
  };

  try {
    console.log('Testing owned equipment creation...');
    const result = await service.createEquipment(company.id, ownedPayload);
    console.log('Owned equipment created successfully! ID:', result.id);
  } catch (err: any) {
    console.error('Failed to create owned equipment:', err.message || err);
  }

  // Exact payload format sent by frontend for a new Rented equipment
  const rentedPayload = {
    name: 'JCB 3DX Rented',
    type: 'JCB',
    serialNumber: '', // Blank, simulating empty input field
    ownership: 'RENTED',
    projectId: undefined,
    dailyRentalRate: 3000,
    hourlyRate: undefined,
    purchaseCost: undefined,
    assetLifeYears: undefined,
    depreciationMethod: undefined,
    purchaseDate: undefined
  };

  try {
    console.log('Testing rented equipment creation...');
    const result = await service.createEquipment(company.id, rentedPayload);
    console.log('Rented equipment created successfully! ID:', result.id);
  } catch (err: any) {
    console.error('Failed to create rented equipment:', err.message || err);
  }

  await prisma.$disconnect();
}

test();
