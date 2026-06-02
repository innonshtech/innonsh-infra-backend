import express from 'express';
import authRoutes from '../modules/auth/auth.routes';
import systemRoutes from '../modules/system/system.routes';
import contractorProjectRoutes from '../modules/contractor/project/project.routes';
import contractorEstimationRoutes from '../modules/contractor/estimation/estimation.routes';
import contractorProcurementRoutes from '../modules/contractor/procurement/procurement.routes';
import contractorInventoryRoutes from '../modules/contractor/inventory/inventory.routes';
import contractorFinanceRoutes from '../modules/contractor/finance/finance.routes';
import contractorLabourRoutes from '../modules/contractor/hr/hr.routes';
import contractorEquipmentRoutes from '../modules/contractor/equipment/equipment.routes';
import contractorContractRoutes from '../modules/contractor/contract/contract.routes';
import contractorNotificationRoutes from '../modules/contractor/notification/notification.routes';
import builderBrokerRoutes from '../modules/builder/crm/broker/broker.routes';
import builderProjectRoutes from '../modules/builder/project/project.routes';
import builderUnitRoutes from '../modules/builder/units/units.routes';
import builderBookingRoutes from '../modules/builder/booking/booking.routes';
import builderBillingRoutes from '../modules/builder/billing/billing.routes';
import builderLeaseRoutes from '../modules/builder/lease/lease.routes';
import builderLegalRoutes from '../modules/builder/legal/legal.routes';
import builderReportRoutes from '../modules/builder/reports/reports.routes';
import usersRoutes from '../modules/users/users.routes';
import companyRoutes from '../modules/company/company.routes';



const router = express.Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Module routes
router.use('/auth', authRoutes);
router.use('/system', systemRoutes);
router.use('/users', usersRoutes);
router.use('/contractor/projects', contractorProjectRoutes);
router.use('/contractor/estimations', contractorEstimationRoutes);
router.use('/contractor/procurement', contractorProcurementRoutes);
router.use('/contractor/inventory', contractorInventoryRoutes);
router.use('/contractor/finance', contractorFinanceRoutes);
router.use('/contractor/labour', contractorLabourRoutes);
router.use('/contractor/equipment', contractorEquipmentRoutes);
router.use('/contractor/contracts', contractorContractRoutes);
router.use('/contractor/notifications', contractorNotificationRoutes);
router.use('/builder/crm/brokers', builderBrokerRoutes);
router.use('/builder/projects', builderProjectRoutes);
router.use('/builder/units', builderUnitRoutes);
router.use('/builder/bookings', builderBookingRoutes);
router.use('/builder/billing', builderBillingRoutes);
router.use('/builder/lease', builderLeaseRoutes);
router.use('/builder/legal', builderLegalRoutes);
router.use('/builder', builderReportRoutes); // Dashboard and reports
router.use('/superadmin', companyRoutes);

export default router;
