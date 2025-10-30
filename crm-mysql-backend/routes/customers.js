import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all customers for current user
router.get('/', async (req, res) => {
  try {
    const [customers] = await pool.query(
      'SELECT * FROM customers WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const [customers] = await pool.query(
      'SELECT * FROM customers WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customers[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/',
  [
    body('name').notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name, email, phone, company, address, city, state, zip, country,
        custom_fields, tags
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO customers 
        (user_id, name, email, phone, company, address, city, state, zip, country, custom_fields, tags) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, name, email || null, phone || null, company || null,
          address || null, city || null, state || null, zip || null, country || null,
          JSON.stringify(custom_fields || {}), JSON.stringify(tags || [])
        ]
      );

      const [newCustomer] = await pool.query(
        'SELECT * FROM customers WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(newCustomer[0]);
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }
);

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const {
      name, email, phone, company, address, city, state, zip, country,
      custom_fields, tags
    } = req.body;

    const [result] = await pool.query(
      `UPDATE customers 
      SET name = ?, email = ?, phone = ?, company = ?, address = ?, 
          city = ?, state = ?, zip = ?, country = ?, custom_fields = ?, tags = ?
      WHERE id = ? AND user_id = ?`,
      [
        name, email || null, phone || null, company || null, address || null,
        city || null, state || null, zip || null, country || null,
        JSON.stringify(custom_fields || {}), JSON.stringify(tags || []),
        req.params.id, req.user.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM customers WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
