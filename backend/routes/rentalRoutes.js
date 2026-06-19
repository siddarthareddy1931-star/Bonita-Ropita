import { Router } from 'express';
import { 
  getRentals, 
  getRentalById, 
  createRental, 
  updateRental, 
  deleteRental 
} from '../controllers/rentalController.js';
import { validateRental } from '../middleware/validation.js';

const router = Router();

router.route('/')
  .get(getRentals)
  .post(validateRental, createRental);

router.route('/:id')
  .get(getRentalById)
  .put(validateRental, updateRental)
  .delete(deleteRental);

export default router;
