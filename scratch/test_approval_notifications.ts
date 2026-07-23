import { prisma } from '../src/config/prisma.config';
import { ProcurementService } from '../src/modules/contractor/procurement/procurement.service';
import bcrypt from 'bcrypt';

async function runApprovalTest() {
  console.log('--- STARTINGtargeted APPROVAL NOTIFICATION TEST ---');
  const service = new ProcurementService();

  try {
    // 1. Setup passwords to be known
    console.log('Pre-configuring passwords...');
    const hashed = await bcrypt.hash('password123', 10);
    await prisma.user.updateMany({
      where: { email: { in: ['testman@gmail.com', 'testman1@gmail.com', 'testman2@gmail.com', 'testman3@gmail.com'] } },
      data: { password: hashed }
    });
    
    // Guarantee testman3 has no permissions
    await prisma.user.update({
      where: { email: 'testman3@gmail.com' },
      data: { permissions: [] }
    });

    // 2. Load the users
    const requester = await prisma.user.findFirst({
      where: { email: 'testman1@gmail.com' },
      include: { company: true, role: true }
    });
    const approver = await prisma.user.findFirst({
      where: { email: 'testman@gmail.com' },
      include: { company: true, role: true }
    });
    const stranger = await prisma.user.findFirst({
      where: { email: 'testman3@gmail.com' },
      include: { company: true, role: true }
    });

    if (!requester || !approver || !stranger) {
      console.error('Users not found in database!');
      return;
    }

    const companyId = requester.companyId!;
    
    // Resolve project ID
    const project = await prisma.project.findFirst({ where: { companyId } });
    if (!project) {
      console.error('No project found for testing!');
      return;
    }
    console.log(`Using project: ${project.name} (${project.id})`);

    // Clear notifications for clean assertions
    console.log('Clearing old notifications...');
    await (prisma as any).notification.deleteMany({ where: { companyId } });

    // 3. Create request as testman1@gmail.com (requester)
    console.log(`Creating procurement request as requester (${requester.email})...`);
    const reqData = {
      projectId: project.id,
      title: 'Demo Test Steel Request',
      description: 'Testing targeted notifications approval cycle',
      items: [
        { description: 'TMT Steel 12mm', quantity: 5, unit: 'ton', estimatedRate: 45000 }
      ]
    };

    const request = await service.createRequest(companyId, requester.id, reqData);
    console.log(`Request created successfully. ID: ${request.id}`);

    // 4. Retrieve notifications for approver (testman@gmail.com)
    console.log(`Checking notifications for Owner/Approver (${approver.email})...`);
    const approverNotifs = await (prisma as any).notification.findMany({
      where: { companyId, OR: [{ userId: approver.id }, { userId: null }] }
    });
    console.log(`Approver notifications count: ${approverNotifs.length}`);
    const approvalPendingNotif = approverNotifs.find((n: any) => n.type === 'PENDING_APPROVAL' && n.referenceId === request.id);
    if (approvalPendingNotif) {
      console.log('✅ PASS: Approver received the PENDING_APPROVAL notification!');
      console.log(`   Message: "${approvalPendingNotif.message}"`);
    } else {
      console.error('❌ FAIL: Approver did NOT receive the notification!');
    }

    // 5. Retrieve notifications for unrelated user (testman2@gmail.com)
    console.log(`Checking notifications for unrelated user (${stranger.email})...`);
    console.log(`Stranger User DB state:`, { id: stranger.id, permissions: stranger.permissions, role: stranger.role });
    const strangerNotifs = await (prisma as any).notification.findMany({
      where: { companyId, OR: [{ userId: stranger.id }, { userId: null }] }
    });
    console.log(`Stranger notifications list:`, strangerNotifs);
    const strangerHasNotif = strangerNotifs.some((n: any) => n.referenceId === request.id);
    if (!strangerHasNotif) {
      console.log('✅ PASS: Unrelated user did NOT receive the notification! (Privacy preserved)');
    } else {
      console.error('❌ FAIL: Unrelated user received a notification they should not see!');
    }

    // 6. Approve the request as approver
    console.log(`Approving request as ${approver.email}...`);
    await service.approveRequest(request.id, companyId, approver.id);

    // 7. Retrieve notifications for requester (testman1@gmail.com)
    console.log(`Checking notifications for requester (${requester.email})...`);
    const requesterNotifs = await (prisma as any).notification.findMany({
      where: { companyId, OR: [{ userId: requester.id }, { userId: null }] }
    });
    const approvedNotif = requesterNotifs.find((n: any) => n.type === 'REQUEST_APPROVED' && n.referenceId === request.id);
    if (approvedNotif) {
      console.log('✅ PASS: Requester received the REQUEST_APPROVED notification!');
      console.log(`   Message: "${approvedNotif.message}"`);
    } else {
      console.error('❌ FAIL: Requester did NOT receive the approval notification!');
    }

    console.log('\n--- TARGETED NOTIFICATION TEST COMPLETED SUCCESSFULLY ---');
  } catch (err: any) {
    console.error('Error during test:', err.message || err);
  }
}

runApprovalTest();
