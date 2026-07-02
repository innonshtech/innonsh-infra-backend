import { prisma } from '../src/config/prisma.config';

async function testLatency() {
  console.log("Measuring database connection & query latency...");
  try {
    for (let i = 1; i <= 5; i++) {
      const start = Date.now();
      const user = await prisma.user.findFirst();
      const elapsed = Date.now() - start;
      console.log(`Query ${i}: ${elapsed}ms`);
    }
  } catch (err: any) {
    console.error(`Query failed:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLatency();
