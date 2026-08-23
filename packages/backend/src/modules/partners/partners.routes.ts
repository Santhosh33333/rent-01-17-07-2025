import { Router } from 'express';
import * as partnersController from './partners.controller';

const router = Router();

router.get('/nearby', partnersController.getNearbyPartners);
router.get('/dashboard', partnersController.getPartnerDashboard);
router.patch('/availability', partnersController.updateAvailability);
router.get('/jobs', partnersController.getJobs);
router.get('/job/:id', partnersController.getJobById);
router.post('/apply', partnersController.applyAsPartner);
router.patch('/bank-details', partnersController.updateBankDetails);
router.get('/:id/profile', partnersController.getPartnerProfile);

export default router;
