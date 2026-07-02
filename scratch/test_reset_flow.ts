import { authService } from '../src/modules/auth/auth.service';
import { prisma } from '../src/config/prisma.config';
import crypto from 'crypto';

async function testFlow() {
  console.log('--- STARTING RESET FLOW TEST ---');
  const email = 'testman@gmail.com';
  
  // Create a custom token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiry = new Date(Date.now() + 30 * 60 * 1000);
  
  await prisma.user.update({
    where: { email },
    data: { resetPasswordToken: hashedToken, resetPasswordExpire: expiry }
  });
  console.log('1. Injected token into database.');
  console.log('Raw Token:', rawToken);
  console.log('Hashed Token:', hashedToken);
  
  // Call reset password
  try {
    await authService.resetPassword({ token: rawToken, newPassword: 'Innonsh@100' });
    console.log('2. Reset password succeeded!');
    
    // Verify password is changed
    const userAfter = await prisma.user.findUnique({ where: { email } });
    console.log('3. Token cleared in DB:', userAfter?.resetPasswordToken === null);
  } catch (err: any) {
    console.error('Reset password failed:', err.message, err);
  }
}
testFlow();
