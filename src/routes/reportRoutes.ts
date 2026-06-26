import { Router } from 'express';
import { createReport, getReports, updateReportStatus } from '../controllers/reportController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), getReports);
router.post('/:promptId', authenticate, createReport);
router.patch('/:id', authenticate, authorize('admin'), updateReportStatus);

export default router;
