import { Router } from 'express';
import { getReportsSummary } from '../controllers/reportsController.js';

const router = Router();

router.get('/summary', getReportsSummary);

export default router;
