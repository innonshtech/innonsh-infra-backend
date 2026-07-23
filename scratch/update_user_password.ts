import { prisma } from '../src/config/prisma.config';
import bcrypt from 'bcrypt';

async function updatePassword() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const updated = await prisma.user.update({
      where: { email: 'testman@gmail.com' },
      data: { password: hashedPassword }
    });
    console.log('Password successfully reset to password123 for:', updated.email);
  } catch (err: any) {
    console.error('Error resetting password:', err.message);
  }
}

updatePassword();
