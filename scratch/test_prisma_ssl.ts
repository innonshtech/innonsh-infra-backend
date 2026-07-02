import { prisma } from '../src/config/prisma.config';

async function run() {
  try {
    console.log('Testing prisma import from config...');
    const count = await prisma.user.count();
    console.log('Prisma query success! User count:', count);
  } catch (err: any) {
    console.error('Prisma connection failed!');
    console.error(err.message || err);
  }
}

run();
