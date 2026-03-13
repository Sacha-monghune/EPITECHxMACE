const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { pool } = require('./db');

const router = express.Router();
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const locationId = req.body.location_id;
    const extension = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `loc_${locationId}_${timestamp}${extension}`);
  },
});

const upload = multer({ storage });

router.get('/locations', async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          l.id,
          l.name,
          l.description_fr,
          l.description_en,
          l.category,
          l.latitude,
          l.longitude,
          l.main_picture_id,
          p.id AS main_picture_picture_id,
          p.location_id AS main_picture_location_id,
          p.path AS main_picture_path,
          p.commentary AS main_picture_commentary,
          p.timestamp AS main_picture_timestamp
        FROM location l
        LEFT JOIN picture p
          ON p.id = l.main_picture_id
         AND p.location_id = l.id
        ORDER BY l.id ASC
      `
    );

    const locations = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description_fr: row.description_fr,
      description_en: row.description_en,
      category: row.category,
      latitude: row.latitude,
      longitude: row.longitude,
      main_picture_id: row.main_picture_id,
      main_picture: row.main_picture_picture_id
        ? {
            id: row.main_picture_picture_id,
            location_id: row.main_picture_location_id,
            path: row.main_picture_path,
            commentary: row.main_picture_commentary,
            timestamp: row.main_picture_timestamp,
          }
        : null,
    }));

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/locations/:id/pictures', async (req, res) => {
  try {
    const locationResult = await pool.query(
      'SELECT id FROM location WHERE id = $1',
      [req.params.id]
    );

    if (locationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          location_id,
          path,
          commentary,
          timestamp
        FROM picture
        WHERE location_id = $1
        ORDER BY timestamp DESC
      `,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/picture', async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          p.id,
          p.location_id,
          p.path,
          p.commentary,
          p.timestamp,
          l.id AS location_ref_id,
          l.name AS location_name,
          l.description_fr AS location_description_fr,
          l.description_en AS location_description_en,
          l.category AS location_category,
          l.latitude AS location_latitude,
          l.longitude AS location_longitude,
          l.main_picture_id AS location_main_picture_id
        FROM picture p
        JOIN location l
          ON l.id = p.location_id
        ORDER BY p.timestamp DESC, p.id DESC
      `
    );

    const pictures = result.rows.map((row) => ({
      id: row.id,
      location_id: row.location_id,
      path: row.path,
      commentary: row.commentary,
      timestamp: row.timestamp,
      location: {
        id: row.location_ref_id,
        name: row.location_name,
        description_fr: row.location_description_fr,
        description_en: row.location_description_en,
        category: row.location_category,
        latitude: row.location_latitude,
        longitude: row.location_longitude,
        main_picture_id: row.location_main_picture_id,
      },
    }));

    res.json(pictures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/picture/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          p.id,
          p.location_id,
          p.path,
          p.commentary,
          p.timestamp,
          l.id AS location_ref_id,
          l.name AS location_name,
          l.description_fr AS location_description_fr,
          l.description_en AS location_description_en,
          l.category AS location_category,
          l.latitude AS location_latitude,
          l.longitude AS location_longitude,
          l.main_picture_id AS location_main_picture_id
        FROM picture p
        JOIN location l
          ON l.id = p.location_id
        WHERE p.id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Picture not found' });
    }

    const row = result.rows[0];

    res.json({
      id: row.id,
      location_id: row.location_id,
      path: row.path,
      commentary: row.commentary,
      timestamp: row.timestamp,
      location: {
        id: row.location_ref_id,
        name: row.location_name,
        description_fr: row.location_description_fr,
        description_en: row.location_description_en,
        category: row.location_category,
        latitude: row.location_latitude,
        longitude: row.location_longitude,
        main_picture_id: row.location_main_picture_id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/picture', upload.single('image'), async (req, res) => {
  const client = await pool.connect();

  try {
    const { location_id, commentary } = req.body;

    if (!req.file || !location_id) {
      if (req.file) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    await client.query('BEGIN');

    const locationResult = await client.query(
      'SELECT id, main_picture_id FROM location WHERE id = $1',
      [location_id]
    );

    if (locationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ error: 'Location not found' });
    }

    const publicPath = `/uploads/${req.file.filename}`;

    const insertResult = await client.query(
      `
        INSERT INTO picture (location_id, path, commentary)
        VALUES ($1, $2, $3)
        RETURNING id, location_id, path, commentary, timestamp
      `,
      [location_id, publicPath, commentary || null]
    );

    if (locationResult.rows[0].main_picture_id === null) {
      await client.query(
        'UPDATE location SET main_picture_id = $1 WHERE id = $2',
        [insertResult.rows[0].id, location_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (req.file) {
      await fs.promises.unlink(req.file.path).catch(() => {});
    }
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

router.put('/picture/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { location_id, commentary, path: picturePath } = req.body;

    await client.query('BEGIN');

    const existingResult = await client.query(
      `
        SELECT
          p.id,
          p.location_id,
          p.path,
          p.commentary,
          p.timestamp,
          l.id AS main_location_id
        FROM picture p
        LEFT JOIN location l
          ON l.main_picture_id = p.id
         AND l.id = p.location_id
        WHERE p.id = $1
      `,
      [req.params.id]
    );

    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Picture not found' });
    }

    const existingPicture = existingResult.rows[0];
    const nextLocationId = location_id || existingPicture.location_id;
    const nextCommentary =
      commentary !== undefined ? commentary : existingPicture.commentary;
    const nextPath = picturePath || existingPicture.path;

    if (location_id) {
      const locationResult = await client.query(
        'SELECT id, main_picture_id FROM location WHERE id = $1',
        [location_id]
      );

      if (locationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Location not found' });
      }
    }

    if (
      existingPicture.main_location_id &&
      String(existingPicture.location_id) !== String(nextLocationId)
    ) {
      await client.query(
        'UPDATE location SET main_picture_id = NULL WHERE id = $1',
        [existingPicture.location_id]
      );
    }

    const updateResult = await client.query(
      `
        UPDATE picture
        SET location_id = $1, commentary = $2, path = $3
        WHERE id = $4
        RETURNING id, location_id, path, commentary, timestamp
      `,
      [nextLocationId, nextCommentary, nextPath, req.params.id]
    );

    if (
      String(existingPicture.location_id) !== String(nextLocationId)
    ) {
      const newLocationResult = await client.query(
        'SELECT main_picture_id FROM location WHERE id = $1',
        [nextLocationId]
      );

      if (
        newLocationResult.rows.length > 0 &&
        newLocationResult.rows[0].main_picture_id === null
      ) {
        await client.query(
          'UPDATE location SET main_picture_id = $1 WHERE id = $2',
          [req.params.id, nextLocationId]
        );
      }
    }

    await client.query('COMMIT');

    res.json(updateResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

router.delete('/picture/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const pictureResult = await client.query(
      `
        SELECT
          id,
          location_id,
          path
        FROM picture
        WHERE id = $1
      `,
      [req.params.id]
    );

    if (pictureResult.rows.length === 0) {
      return res.status(404).json({ error: 'Picture not found' });
    }

    const picture = pictureResult.rows[0];
    const filename = path.basename(picture.path);
    const filePath = path.join(uploadsDir, filename);

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await client.query('BEGIN');
    await client.query(
      'UPDATE location SET main_picture_id = NULL WHERE main_picture_id = $1',
      [req.params.id]
    );
    await client.query('DELETE FROM picture WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');

    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

module.exports = router;
