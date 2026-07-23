import { prisma } from '../src/config/prisma.config';
import bcrypt from 'bcrypt';

async function restorePassword() {
  try {
    const hashedPassword = await bcrypt.hash('testman@100', 10);
    const updated = await prisma.user.update({
      where: { email: 'testman@gmail.com' },
      data: { password: hashedPassword }
    });
    console.log('Password successfully restored to "testman@100" for:', updated.email);
  } catch (err: any) {
    console.error('Error restoring password:', err.message);
  }
}

restorePassword();
