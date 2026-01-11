import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getAvailability,
  setAvailability,
  getTimeBlocks,
  addTimeBlock,
  deleteTimeBlock,
  getUserCalendar
} from '../controllers/calendar.controller';

const router = Router();

router.use(authenticate);

// Get user's weekly availability
router.get('/:id/availability', getAvailability);

// Set user's weekly availability (user or admin)
router.put('/:id/availability', setAvailability);

// Get user's time blocks (holidays, sick, etc)
router.get('/:id/timeblocks', getTimeBlocks);

// Add time block
router.post('/:id/timeblocks', addTimeBlock);

// Delete time block
router.delete('/timeblocks/:blockId', deleteTimeBlock);

// Get full calendar view (availability + time blocks + scheduled jobs)
router.get('/:id/calendar', getUserCalendar);

export default router;

