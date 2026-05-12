import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// POST /api/test-results - Save new test result
router.post('/', async (req, res) => {
  try {
    const { metric_name, score, unit, notes } = req.body;
    const DEMO_USER_ID = 1; // Hardcoded demo user for now

    // Validate required fields
    if (!metric_name || score === undefined || !unit) {
      return res.status(400).json({
        error: 'Missing required fields: metric_name, score, unit'
      });
    }

    // Insert test result into database
    const result = await pool.query(
      'INSERT INTO test_results (user_id, metric_name, score, unit, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [DEMO_USER_ID, metric_name, score, unit, notes || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error saving test result:', err);
    res.status(500).json({ error: 'Failed to save test result' });
  }
});

// GET /api/test-results/:userId - Get all test results for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT * FROM test_results WHERE user_id = $1 ORDER BY test_date DESC',
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching test results:', err);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// GET /api/latest-scores/:userId - Get latest score for each metric
router.get('/latest/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Query to get the most recent test for each metric
    const result = await pool.query(
      `SELECT DISTINCT ON (metric_name)
        id, metric_name, score, unit, test_date, notes
      FROM test_results
      WHERE user_id = $1
      ORDER BY metric_name, test_date DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching latest scores:', err);
    res.status(500).json({ error: 'Failed to fetch latest scores' });
  }
});

export default router;
