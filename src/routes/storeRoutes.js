import { Router } from 'express';
import {
  createStore,
  getMyStores,
  joinStoreRequest,
  getStoreMembers,
  handleMembershipRequest,
} from '../controllers/storeController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createStore);
router.get('/my-stores', getMyStores);
router.post('/join', joinStoreRequest);
router.get('/:storeId/members', getStoreMembers);
router.patch('/members/:membershipId', handleMembershipRequest);

export default router;