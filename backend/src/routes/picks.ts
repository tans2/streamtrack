import express from 'express';
import { DatabaseService } from '../services/database';
import { authenticateToken } from './auth';

const router = express.Router();

// Add a pick (completed shows, or shows where user has reached season 2+)
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { showId, note } = req.body;

    if (!showId) {
      return res.status(400).json({ success: false, error: 'showId is required' });
    }

    const isEligible = await DatabaseService.isEligibleForPick(userId, showId);
    if (!isEligible) {
      return res.status(400).json({ success: false, error: "You can only pick shows where you've completed at least one season" });
    }

    if (note && note.length > 200) {
      return res.status(400).json({ success: false, error: 'Note must be 200 characters or fewer' });
    }

    const pick = await DatabaseService.addPick(userId, showId, note);
    if (!pick) {
      return res.status(500).json({ success: false, error: 'Failed to add pick' });
    }

    res.status(201).json({ success: true, data: pick });
  } catch (error: any) {
    console.error('Error adding pick:', error);
    res.status(500).json({ success: false, error: 'Failed to add pick' });
  }
});

// Remove a pick
router.delete('/:showId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { showId } = req.params;

    const ok = await DatabaseService.removePick(userId, showId);
    if (!ok) {
      return res.status(500).json({ success: false, error: 'Failed to remove pick' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing pick:', error);
    res.status(500).json({ success: false, error: 'Failed to remove pick' });
  }
});

// Get my own picks
router.get('/mine', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const picks = await DatabaseService.getUserPicks(userId);
    res.json({ success: true, data: picks });
  } catch (error: any) {
    console.error('Error fetching my picks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch picks' });
  }
});

// Get picks feed from group connections
router.get('/feed', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const feed = await DatabaseService.getPicksFeed(userId);
    res.json({ success: true, data: feed });
  } catch (error: any) {
    console.error('Error fetching picks feed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feed' });
  }
});

export default router;
