import { Router } from 'express';
import * as ctrl from './users.controller';

const router = Router();

router.get('/profile', ctrl.getProfile);
router.patch('/profile', ctrl.updateProfile);
router.post('/emergency-contacts', ctrl.addEmergencyContact);
router.get('/emergency-contacts', ctrl.getEmergencyContacts);
router.delete('/emergency-contacts/:id', ctrl.deleteEmergencyContact);
router.get('/friends', ctrl.getFriends);
router.post('/friends/request', ctrl.sendFriendRequest);
router.patch('/friends/:id/accept', ctrl.acceptFriendRequest);
router.delete('/friends/:id', ctrl.removeFriend);
router.post('/block/:userId', ctrl.blockUser);
router.delete('/block/:userId', ctrl.unblockUser);
router.get('/sessions', ctrl.getSessions);
router.delete('/sessions/:id', ctrl.deleteSession);
router.patch('/account/deactivate', ctrl.deactivateAccount);

export default router;
