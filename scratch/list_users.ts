import { prisma } from '../src/config/prisma.config';

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        company: true
      }
    });
    console.log('=== USERS LIST ===');
    for (const u of users) {
      console.log(`- Email: ${u.email}, Name: ${u.firstName} ${u.lastName}, Role: ${u.role?.name || 'None'}, Company: ${u.company?.name || 'None'} (ERP: ${u.company?.erpType || 'None'})`);
    }
  } catch (err: any) {
    console.error('Error fetching users:', err.message);
  }
}

listUsers();
