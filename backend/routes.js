const express = require('express');
const router = express.Router();
const { pool } = require('./db');

router.get('/picture', async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM picture');
        res.json(result.rows);

    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/picture/:id', async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM picture WHERE id = $1', [req.params.id]);
        res.json(result.rows);

    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/picture', async (req, res) => {
    try{
        const { latitude ,longitude ,path ,commentary } = req.body;
        const result = await pool.query('INSERT INTO picture ( latitude, longitude, path, commentary) VALUES ($1, $2, $3, $4) RETURNING *', [latitude, longitude, path, commentary]);
        res.status(201).json(result.rows[0]);
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/picture/:id', async (req, res) => {
    try{
        const { latitude ,longitude ,path ,commentary } = req.body;
        const result = await pool.query('UPDATE picture SET latitude = $1, longitude = $2, path = $3, commentary = $4 WHERE id = $5 RETURNING *', [latitude, longitude, path, commentary, req.params.id]);
        res.json(result.rows[0]);
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/picture/:id', async (req, res) => {
    try{
        await pool.query('DELETE FROM picture WHERE id = $1', [req.params.id]);
        res.status(204).send({'message': 'Picture deleted successfully'});
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;