import express from 'express';
const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'Placeholder for crm module' }));

export default router;
