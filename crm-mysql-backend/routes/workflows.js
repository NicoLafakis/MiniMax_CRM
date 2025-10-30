import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all workflow rules for current user
router.get('/', async (req, res) => {
  try {
    const [rules] = await pool.query(
      'SELECT * FROM workflow_rules WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rules);
  } catch (error) {
    console.error('Get workflow rules error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow rules' });
  }
});

// Get single workflow rule
router.get('/:id', async (req, res) => {
  try {
    const [rules] = await pool.query(
      'SELECT * FROM workflow_rules WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (rules.length === 0) {
      return res.status(404).json({ error: 'Workflow rule not found' });
    }

    res.json(rules[0]);
  } catch (error) {
    console.error('Get workflow rule error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow rule' });
  }
});

// Create workflow rule
router.post('/',
  [
    body('name').notEmpty().trim(),
    body('trigger_type').notEmpty(),
    body('action_type').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name, trigger_type, trigger_value, action_type, action_value, is_active
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO workflow_rules 
        (user_id, name, trigger_type, trigger_value, action_type, action_value, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, name, trigger_type, JSON.stringify(trigger_value || {}),
          action_type, JSON.stringify(action_value || {}), is_active !== false
        ]
      );

      const [newRule] = await pool.query(
        'SELECT * FROM workflow_rules WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(newRule[0]);
    } catch (error) {
      console.error('Create workflow rule error:', error);
      res.status(500).json({ error: 'Failed to create workflow rule' });
    }
  }
);

// Update workflow rule
router.put('/:id', async (req, res) => {
  try {
    const {
      name, trigger_type, trigger_value, action_type, action_value, is_active
    } = req.body;

    const [result] = await pool.query(
      `UPDATE workflow_rules 
      SET name = ?, trigger_type = ?, trigger_value = ?, 
          action_type = ?, action_value = ?, is_active = ?
      WHERE id = ? AND user_id = ?`,
      [
        name, trigger_type, JSON.stringify(trigger_value || {}),
        action_type, JSON.stringify(action_value || {}), is_active,
        req.params.id, req.user.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Workflow rule not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM workflow_rules WHERE id = ?',
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update workflow rule error:', error);
    res.status(500).json({ error: 'Failed to update workflow rule' });
  }
});

// Delete workflow rule
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM workflow_rules WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Workflow rule not found' });
    }

    res.json({ message: 'Workflow rule deleted successfully' });
  } catch (error) {
    console.error('Delete workflow rule error:', error);
    res.status(500).json({ error: 'Failed to delete workflow rule' });
  }
});

export default router;
