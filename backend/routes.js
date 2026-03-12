const express = require('express');

const router = express.Router();
const { pool } = require('./db');

router.get('/picture', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id,
                p.location_id,
                p.path,
                p.commentary,
                p.timestamp,
                l.name AS location_name,
                l.description AS location_description,
                l.latitude,
                l.longitude,
                (l.main_picture_id = p.id) AS is_main_picture
            FROM picture p
            JOIN location l ON l.id = p.location_id
            ORDER BY p.timestamp DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/picture/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id,
                p.location_id,
                p.path,
                p.commentary,
                p.timestamp,
                l.name AS location_name,
                l.description AS location_description,
                l.latitude,
                l.longitude,
                (l.main_picture_id = p.id) AS is_main_picture
            FROM picture p
            JOIN location l ON l.id = p.location_id
            WHERE p.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Picture not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/picture', async (req, res) => {
    try {
        const { location_id, path, commentary } = req.body;

        const result = await pool.query(
            'INSERT INTO picture (location_id, path, commentary) VALUES ($1, $2, $3) RETURNING *',
            [location_id, path, commentary]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/picture/:id', async (req, res) => {
    try {
        const { location_id, path, commentary } = req.body;

        const result = await pool.query(
            'UPDATE picture SET location_id = $1, path = $2, commentary = $3 WHERE id = $4 RETURNING *',
            [location_id, path, commentary, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Picture not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/picture/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM picture WHERE id = $1 RETURNING id', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Picture not found' });
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
