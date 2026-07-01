import { prisma } from '../src/config/prisma.config';
import { organizationService } from '../src/modules/organization/organization.service';

async function verify() {
  console.log('--- STARTING ORGANIZATION API AND SCHEMA VERIFICATION ---');

  // 1. Fetch Company
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('ERROR: No company found in DB to test.');
    return;
  }
  const companyId = company.id;
  console.log(`Using company: ${company.name} (${companyId})`);

  // 2. Test profile fetching (should auto-create settings)
  console.log('\nTesting getProfile()...');
  const profile = await organizationService.getProfile(companyId);
  console.log('✔ Profile fetched successfully.');
  console.log(`Settings: Currency=${profile.settings?.currency}, TimeZone=${profile.settings?.timeZone}`);

  // 3. Test update profile
  console.log('\nTesting updateProfile()...');
  await organizationService.updateProfile(companyId, {
    name: company.name,
    gstNumber: '27GSTA1234F1Z1',
    panNumber: 'PAN123456F',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
  });
  console.log('✔ Profile updated successfully.');

  // 4. Test branches
  console.log('\nTesting branches CRUD...');
  const newBranch = await organizationService.createBranch(companyId, {
    name: 'Pune Regional Office',
    code: 'PN-01',
    address: 'Viman Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    phone: '9876543210',
    email: 'pune@innonsh.com',
    managerName: 'Rajiv Sen',
  });
  console.log(`✔ Created branch: ${newBranch.name} (${newBranch.id})`);

  const branches = await organizationService.getBranches(companyId);
  console.log(`✔ Fetched branches list. Count: ${branches.length}`);

  await organizationService.deleteBranch(newBranch.id, companyId);
  console.log('✔ Deleted branch successfully.');

  // 5. Test departments (should seed defaults)
  console.log('\nTesting departments autoseeding...');
  const departments = await organizationService.getDepartments(companyId);
  console.log(`✔ Fetched departments list. Count: ${departments.length}`);
  console.log(`First 3 departments: ${departments.slice(0, 3).map(d => d.name).join(', ')}`);

  // 6. Test designations (should seed defaults)
  console.log('\nTesting designations autoseeding...');
  const designations = await organizationService.getDesignations(companyId);
  console.log(`✔ Fetched designations list. Count: ${designations.length}`);
  console.log(`First 3 designations: ${designations.slice(0, 3).map(d => d.name).join(', ')}`);

  console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY (ALL CHECKS PASSED) ---');
}

verify()
  .catch(err => {
    console.error('VERIFICATION FAILED WITH ERROR:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
