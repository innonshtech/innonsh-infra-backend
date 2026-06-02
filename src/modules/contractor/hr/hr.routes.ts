import express from 'express';
import { LabourService } from './hr.service';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { checkERPType } from '../../../middleware/erp.middleware';

const router = express.Router();
const service = new LabourService();

// All routes require auth + contractor/builder ERP type
router.use(authMiddleware, checkERPType(['CONTRACTOR', 'BUILDER']));

// ─── Workers ───
router.get('/workers', async (req: any, res) => {
  try {
    const { projectId, role, status } = req.query;
    const workers = await service.getWorkers(req.user.company_id, { projectId: projectId as string, role: role as string, status: status as string });
    res.json({ success: true, data: workers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/workers/stats', async (req: any, res) => {
  try {
    const stats = await service.getWorkerStats(req.user.company_id);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/workers/:id', async (req: any, res) => {
  try {
    const worker = await service.getWorkerById(req.params.id, req.user.company_id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    res.json({ success: true, data: worker });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/workers', async (req: any, res) => {
  try {
    const worker = await service.createWorker(req.user.company_id, req.body);
    res.status(201).json({ success: true, data: worker });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/workers/:id', async (req: any, res) => {
  try {
    await service.updateWorker(req.params.id, req.user.company_id, req.body);
    res.json({ success: true, message: 'Worker updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/workers/:id', async (req: any, res) => {
  try {
    await service.deleteWorker(req.params.id, req.user.company_id);
    res.json({ success: true, message: 'Worker deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Attendance ───
router.get('/attendance', async (req: any, res) => {
  try {
    const { date, projectId } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date is required' });
    const records = await service.getAttendance(req.user.company_id, date as string, projectId as string);
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/attendance/summary', async (req: any, res) => {
  try {
    const { date, projectId } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date is required' });
    const summary = await service.getAttendanceSummary(req.user.company_id, date as string, projectId as string);
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/attendance', async (req: any, res) => {
  try {
    const { records } = req.body; // Array of { workerId, projectId?, date, status, wageAmount }
    if (!records || !records.length) return res.status(400).json({ success: false, message: 'records array is required' });
    const result = await service.saveAttendance(req.user.company_id, records);
    res.json({ success: true, data: result, message: `${result.length} attendance records saved` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Payroll ───
router.get('/payroll', async (req: any, res) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'startDate and endDate required' });
    const payroll = await service.getPayroll(req.user.company_id, startDate as string, endDate as string, projectId as string);
    res.json({ success: true, data: payroll });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payroll/finalize', async (req: any, res) => {
  try {
    const { startDate, endDate, projectId } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'startDate and endDate required' });
    const result = await service.finalizePayroll(req.user.company_id, startDate, endDate, projectId);
    res.json({ success: true, data: result, message: 'Payroll finalized and expense recorded' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Excel Attendance Upload ───

// Generate downloadable template with pre-filled worker names
router.get('/attendance/template/:projectId', async (req: any, res) => {
  try {
    const workers = await service.getWorkers(req.user.company_id, {
      projectId: req.params.projectId,
      status: 'ACTIVE'
    });
    // Return JSON template data — frontend will convert to Excel
    const templateData = (workers || []).map((w: any) => ({
      'Worker Name': `${w.firstName} ${w.lastName}`,
      'Worker ID': w.id,
      'Role': w.role,
      'Daily Wage': w.dailyWage,
      'Date': '', // Fill date for multi-day support (optional, uses header date if empty)
      'Status': 'PRESENT', // PRESENT, ABSENT, HALF_DAY
      'OT Hours': 0, // Overtime hours (calculated at 1.5x hourly rate)
    }));
    res.json({ success: true, data: templateData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process uploaded Excel attendance data (parsed on frontend, sent as JSON)
router.post('/attendance/upload', async (req: any, res) => {
  try {
    const { projectId, date, records, fileName } = req.body;
    if (!projectId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'projectId, date, and records[] are required' });
    }

    const companyId = req.user.company_id;

    // Get all workers for matching
    const allWorkers = await service.getWorkers(companyId, { projectId });
    const workerMap: Record<string, any> = {};
    (allWorkers || []).forEach((w: any) => {
      workerMap[w.id] = w;
      workerMap[`${w.firstName} ${w.lastName}`.toLowerCase()] = w;
      workerMap[`${w.firstName}`.toLowerCase()] = w;
    });

    const matched: any[] = [];
    const unmatched: any[] = [];

    for (const row of records) {
      // Try matching by ID first, then by name
      const worker = workerMap[row['Worker ID']] || workerMap[row['Worker Name']?.toLowerCase()] || workerMap[row['worker_id']] || workerMap[row['name']?.toLowerCase()];
      const status = (row['Status'] || row['status'] || 'PRESENT').toUpperCase();
      // Support per-row date for multi-day uploads, fallback to header date
      const rowDate = row['Date'] || row['date'] || date;
      // OT Hours support
      const otHours = parseFloat(row['OT Hours'] || row['ot_hours'] || row['Overtime'] || '0') || 0;

      if (worker) {
        let wageAmount = worker.dailyWage;
        if (status === 'HALF_DAY') wageAmount = worker.dailyWage / 2;
        else if (status === 'ABSENT') wageAmount = 0;

        // OT pay: 1.5x hourly rate (assuming 8hr day)
        const hourlyRate = worker.dailyWage / 8;
        const otPay = otHours * hourlyRate * 1.5;
        wageAmount += otPay;

        matched.push({
          workerId: worker.id,
          projectId,
          date: rowDate,
          status,
          wageAmount,
          overtimeHrs: otHours,
          otPay,
          companyId,
          workerName: `${worker.firstName} ${worker.lastName}`
        });
      } else {
        unmatched.push({
          name: row['Worker Name'] || row['name'] || 'Unknown',
          reason: 'Worker not found in system'
        });
      }
    }

    // Save matched attendance
    if (matched.length > 0) {
      await service.saveAttendance(companyId, matched.map(m => ({
        workerId: m.workerId,
        projectId: m.projectId,
        date: m.date,
        status: m.status,
        wageAmount: m.wageAmount,
        overtimeHrs: m.overtimeHrs
      })));
    }

    const totalWage = matched.reduce((s, m) => s + m.wageAmount, 0);

    // Save upload record for audit trail
    const { prisma } = require('../../../config/prisma.config');
    await (prisma as any).attendanceUpload.create({
      data: {
        companyId,
        projectId,
        uploadedById: req.user.id,
        fileName: fileName || 'attendance_upload.xlsx',
        date: new Date(date),
        workersMatched: matched.length,
        totalWage,
        status: 'PROCESSED'
      }
    });

    res.json({
      success: true,
      data: {
        matched: matched.length,
        unmatched: unmatched.length,
        unmatchedDetails: unmatched,
        totalWage,
        records: matched
      },
      message: `${matched.length} workers processed, ${unmatched.length} unmatched`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload history
router.get('/attendance/uploads', async (req: any, res) => {
  try {
    const { prisma } = require('../../../config/prisma.config');
    const uploads = await (prisma as any).attendanceUpload.findMany({
      where: { companyId: req.user.company_id },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: uploads });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

