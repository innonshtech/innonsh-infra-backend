import { prisma } from '../src/config/prisma.config';

async function main() {
  const keys = Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'));
  console.log('--- GENERATED PRISMA MODELS ---');
  console.log(keys.sort());
  console.log('--------------------------------');
}

main();
