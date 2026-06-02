import express from 'express';
import { prisma } from '@config/prisma.config';
import { authMiddleware } from '@middleware/auth.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();

router.get('/', authMiddleware, async (req: any, res) => {
  try {
    console.log('[UsersRoute] Fetching users for company:', req.user.company_id);
    const users = await (prisma as any).user.findMany({
      where: { 
        companyId: req.user.company_id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        permissions: true,
      },
      orderBy: { firstName: 'asc' }
    });
    res.json({ success: true, data: users });
  } catch (error: any) {
    console.error('[UsersRoute] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// Only Superadmin (*) can create users
router.post('/', authMiddleware, allowPermissions('*'), async (req: any, res) => {
  try {
    const { firstName, lastName, email, password, permissions } = req.body;
    
    // Quick validation
    if (!firstName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Hash password 
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await (prisma as any).user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        companyId: req.user.company_id,
        permissions: permissions || [],
      }
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error: any) {
    console.error('[UsersRoute] Error creating user:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Only Superadmin (*) can update permissions
router.patch('/:id/permissions', authMiddleware, allowPermissions('*'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    // Ensure the user modifying has permission or is the admin of the company
    if (req.user.company_id) {
      const targetUser = await (prisma as any).user.findFirst({
        where: { id, companyId: req.user.company_id }
      });
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }

    const updatedUser = await (prisma as any).user.update({
      where: { id },
      data: { permissions: permissions || [] },
      select: { id: true, firstName: true, lastName: true, permissions: true }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error('[UsersRoute] Error updating user permissions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Only Superadmin (*) can delete users
router.delete('/:id', authMiddleware, allowPermissions('*'), async (req: any, res) => {
  try {
    const { id } = req.params;
    
    // Ensure the user modifying has permission or is the admin of the company
    if (req.user.company_id) {
      const targetUser = await (prisma as any).user.findFirst({
        where: { id, companyId: req.user.company_id }
      });
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }

    // Clear safe junction relations first
    await (prisma as any).projectMember.deleteMany({
      where: { userId: id }
    });

    try {
      await (prisma as any).user.delete({
        where: { id }
      });
      return res.json({ success: true, message: 'User fully deleted' });
    } catch (err: any) {
      if (err.code === 'P2003') {
        // Soft delete if there are strict foreign key constraints (like ProcurementRequests)
        await (prisma as any).user.update({
          where: { id },
          data: { isActive: false, permissions: [] }
        });
        return res.json({ success: true, message: 'User has active records (like requests) and was safely deactivated instead.' });
      }
      throw err;
    }
  } catch (error: any) {
    console.error('[UsersRoute] Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
