import { Router } from 'express';
import * as ctrl from './kyc.controller';

const router = Router();

router.post('/submit', ctrl.submitKyc);
router.get('/status', ctrl.getKycStatus);
router.patch('/:id/approve', ctrl.approveKyc);
router.patch('/:id/reject', ctrl.rejectKyc);
router.get('/queue', ctrl.getKycQueue);
router.post('/resubmit', ctrl.resubmitKyc);

export default router;
