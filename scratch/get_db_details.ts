import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function getDetails() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Querying database for companies, members, and labour details...\n');

    // 1. Fetch Companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        erpType: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch Users (Members)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: {
          select: { name: true }
        },
        company: {
          select: { name: true }
        }
      },
      orderBy: { email: 'asc' }
    });

    // 3. Fetch Labour (Workers)
    const workers = await prisma.worker.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        dailyWage: true,
        status: true,
        company: {
          select: { name: true }
        },
        project: {
          select: { name: true }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    console.log('=============== DATABASE SUMMARY ===============');
    console.log(`Total Companies: ${companies.length}`);
    console.log(`Total Users (Members): ${users.length}`);
    console.log(`Total Labour (Workers): ${workers.length}`);
    console.log('================================================\n');

    console.log('--- REGISTERED COMPANIES ---');
    companies.forEach((c, index) => {
      console.log(`${index + 1}. Name: ${c.name} | ERP Type: ${c.erpType} | Status: ${c.status} | Created At: ${c.createdAt}`);
    });
    console.log('----------------------------\n');

    console.log('--- REGISTERED USERS / MEMBERS ---');
    users.forEach((u, index) => {
      const roleName = u.role?.name || 'N/A';
      const companyName = u.company?.name || 'N/A';
      console.log(`${index + 1}. Name: ${u.firstName} ${u.lastName} | Email: ${u.email} | Role: ${roleName} | Company: ${companyName} | Active: ${u.isActive}`);
    });
    console.log('----------------------------------\n');

    console.log('--- REGISTERED LABOUR / WORKERS ---');
    workers.forEach((w, index) => {
      const companyName = w.company?.name || 'N/A';
      const projectName = w.project?.name || 'Unassigned';
      console.log(`${index + 1}. Name: ${w.firstName} ${w.lastName} | Role: ${w.role} | Wage: ₹${w.dailyWage} | Status: ${w.status} | Company: ${companyName} | Project: ${projectName}`);
    });
    console.log('-----------------------------------\n');

  } catch (err) {
    console.error('Error fetching details:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

getDetails();
