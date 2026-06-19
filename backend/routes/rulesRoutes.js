import { Router } from 'express';
import { getSystemRules, updateSystemRules } from '../controllers/rulesController.js';

const router = Router();

router.route('/')
  .get(getSystemRules)
  .put(updateSystemRules);

export default router;
