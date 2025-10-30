import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDFs, docs, spreadsheets'));
    }
  }
});

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { related_type, related_id } = req.body;

    if (!related_type || !related_id) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'related_type and related_id are required' });
    }

    // Save file metadata to database
    const [result] = await pool.query(
      `INSERT INTO attachments 
      (user_id, related_type, related_id, file_name, file_path, file_size, mime_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        related_type,
        related_id,
        req.file.originalname,
        req.file.filename, // Store relative filename
        req.file.size,
        req.file.mimetype
      ]
    );

    const [newAttachment] = await pool.query(
      'SELECT * FROM attachments WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newAttachment[0]);
  } catch (error) {
    console.error('File upload error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get attachments for a related entity
router.get('/:related_type/:related_id', async (req, res) => {
  try {
    const { related_type, related_id } = req.params;

    const [attachments] = await pool.query(
      'SELECT * FROM attachments WHERE user_id = ? AND related_type = ? AND related_id = ? ORDER BY created_at DESC',
      [req.user.id, related_type, related_id]
    );

    res.json(attachments);
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Download file
router.get('/download/:id', async (req, res) => {
  try {
    const [attachments] = await pool.query(
      'SELECT * FROM attachments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (attachments.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const attachment = attachments[0];
    const filePath = path.join(__dirname, '../uploads', attachment.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, attachment.file_name);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

// Delete attachment
router.delete('/:id', async (req, res) => {
  try {
    const [attachments] = await pool.query(
      'SELECT * FROM attachments WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (attachments.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const attachment = attachments[0];
    const filePath = path.join(__dirname, '../uploads', attachment.file_path);

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await pool.query(
      'DELETE FROM attachments WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;
