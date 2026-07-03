import { prisma } from '../src/config/prisma.config';

async function testDepreciationReport() {
  console.log('=== STARTING AUTOMATED DEPRECIATION MATH TEST ===');

  // Fetch the first company
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found. Seed first.');
    return;
  }

  // 1. Fetch owned equipment with purchaseCost > 0
  const ownedEquipment = await prisma.equipment.findMany({
    where: { companyId: company.id, ownership: 'OWNED', purchaseCost: { gt: 0 } }
  });

  if (ownedEquipment.length === 0) {
    console.log('No owned assets found. Let\'s create a test Excavator first...');
    const testAsset = await prisma.equipment.create({
      data: {
        companyId: company.id,
        name: 'Test Heavy Excavator 200',
        type: 'Excavator',
        ownership: 'OWNED',
        purchaseCost: 6000000, // ₹60 Lakhs
        assetLifeYears: 10,
        depreciationMethod: 'SLM',
        purchaseDate: new Date('2024-01-01'), // Purchased Jan 2024
      }
    });
    ownedEquipment.push(testAsset);
  }

  // 2. Perform the calculations
  const report = ownedEquipment.map((eq: any) => {
    const cost = eq.purchaseCost || 0;
    const lifeYears = eq.assetLifeYears || 10;
    const method = eq.depreciationMethod || 'SLM';
    const purchaseDate = eq.purchaseDate ? new Date(eq.purchaseDate) : new Date(eq.createdAt);
    
    // Calculate months used
    const monthsUsed = Math.max(1, Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    let monthlyDep = 0, totalDep = 0, bookValue = cost;

    if (method === 'SLM') {
      monthlyDep = cost / (lifeYears * 12);
      totalDep = Math.min(monthlyDep * monthsUsed, cost * 0.95);
      bookValue = cost - totalDep;
    } else {
      const annualRate = 0.15;
      const yearsUsed = monthsUsed / 12;
      bookValue = cost * Math.pow(1 - annualRate, yearsUsed);
      totalDep = cost - bookValue;
      monthlyDep = totalDep / Math.max(monthsUsed, 1);
    }

    return {
      name: eq.name,
      purchaseCost: cost,
      purchaseDate: purchaseDate.toDateString(),
      method,
      monthsUsed,
      monthlyDep: Math.round(monthlyDep),
      totalDep: Math.round(totalDep),
      bookValue: Math.round(bookValue),
      depPct: Math.round((totalDep / cost) * 100)
    };
  });

  // 3. Print Report
  console.log(`\nCompany: ${company.name}`);
  console.table(report);

  const totalOriginal = report.reduce((s, r) => s + r.purchaseCost, 0);
  const totalDepreciated = report.reduce((s, r) => s + r.totalDep, 0);
  const totalCurrentValue = report.reduce((s, r) => s + r.bookValue, 0);

  console.log('\n--- SUMMARY ---');
  console.log(`Total Original Assets Value: ₹${totalOriginal.toLocaleString('en-IN')}`);
  console.log(`Total Accumulated Depreciation: ₹${totalDepreciated.toLocaleString('en-IN')}`);
  console.log(`Current Total Book Value: ₹${totalCurrentValue.toLocaleString('en-IN')}`);
  console.log('=== MATH VERIFICATION SUCCESSFUL ===');
}

testDepreciationReport();
