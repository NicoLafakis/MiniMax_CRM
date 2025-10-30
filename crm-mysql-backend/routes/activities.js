import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all activities for current user
router.get('/', async (req, res) => {
  try {
    const [activities] = await pool.query(
      'SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get single activity
router.get('/:id', async (req, res) => {
  try {
    const [activities] = await pool.query(
      'SELECT * FROM activities WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activities[0]);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Create activity
router.post('/',
  [
    body('type').notEmpty().trim(),
    body('subject').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        customer_id, deal_id, ticket_id, type, subject,
        description, due_date, completed
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO activities 
        (user_id, customer_id, deal_id, ticket_id, type, subject, description, due_date, completed) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, customer_id || null, deal_id || null, ticket_id || null,
          type, subject, description || null, due_date || null, completed || false
        ]
      );

      const [newActivity] = await pool.query(
        'SELECT * FROM activities WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(newActivity[0]);
    } catch (error) {
      console.error('Create activity error:', error);
      res.status(500).json({ error: 'Failed to create activity' });
    }
  }
);

// Update activity
router.put('/:id', async (req, res) => {
  try {
    const {
      customer_id, deal_id, ticket_id, type, subject,
      description, due_date, completed
    } = req.body;

    const [result] = await pool.query(
      `UPDATE activities 
      SET customer_id = ?, deal_id = ?, ticket_id = ?, type = ?, 
          subject = ?, description = ?, due_date = ?, completed = ?
      WHERE id = ? AND user_id = ?`,
      [
        customer_id || null, deal_id || null, ticket_id || null, type,
        subject, description || null, due_date || null, completed,
        req.params.id, req.user.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM activities WHERE id = ?',
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Delete activity
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM activities WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

export default router;
