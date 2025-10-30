import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all deals for current user
router.get('/', async (req, res) => {
  try {
    const [deals] = await pool.query(
      'SELECT * FROM deals WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(deals);
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Get single deal
router.get('/:id', async (req, res) => {
  try {
    const [deals] = await pool.query(
      'SELECT * FROM deals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (deals.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json(deals[0]);
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

// Create deal
router.post('/',
  [
    body('title').notEmpty().trim(),
    body('value').isNumeric()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        customer_id, title, description, value, stage,
        expected_close_date, probability
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO deals 
        (user_id, customer_id, title, description, value, stage, expected_close_date, probability) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, customer_id || null, title, description || null,
          value, stage || 'Lead', expected_close_date || null, probability || 50
        ]
      );

      const [newDeal] = await pool.query(
        'SELECT * FROM deals WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(newDeal[0]);
    } catch (error) {
      console.error('Create deal error:', error);
      res.status(500).json({ error: 'Failed to create deal' });
    }
  }
);

// Update deal
router.put('/:id', async (req, res) => {
  try {
    const {
      customer_id, title, description, value, stage,
      expected_close_date, probability
    } = req.body;

    const [result] = await pool.query(
      `UPDATE deals 
      SET customer_id = ?, title = ?, description = ?, value = ?, 
          stage = ?, expected_close_date = ?, probability = ?
      WHERE id = ? AND user_id = ?`,
      [
        customer_id || null, title, description || null, value,
        stage, expected_close_date || null, probability,
        req.params.id, req.user.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM deals WHERE id = ?',
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// Delete deal
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM deals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

export default router;
