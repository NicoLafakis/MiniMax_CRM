import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all tickets for current user
router.get('/', async (req, res) => {
  try {
    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket
router.get('/:id', async (req, res) => {
  try {
    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(tickets[0]);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create ticket
router.post('/',
  [
    body('title').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        customer_id, title, description, status, priority
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO tickets 
        (user_id, customer_id, title, description, status, priority) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, customer_id || null, title, description || null,
          status || 'New', priority || 'Medium'
        ]
      );

      const [newTicket] = await pool.query(
        'SELECT * FROM tickets WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(newTicket[0]);
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  }
);

// Update ticket
router.put('/:id', async (req, res) => {
  try {
    const {
      customer_id, title, description, status, priority, resolved_at
    } = req.body;

    const [result] = await pool.query(
      `UPDATE tickets 
      SET customer_id = ?, title = ?, description = ?, status = ?, 
          priority = ?, resolved_at = ?
      WHERE id = ? AND user_id = ?`,
      [
        customer_id || null, title, description || null, status,
        priority, resolved_at || null,
        req.params.id, req.user.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Delete ticket
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tickets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

export default router;
