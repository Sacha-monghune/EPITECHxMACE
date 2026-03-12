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
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname) || '.bin';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed.'));
      return;
    }

    cb(null, true);
  },
});

function normalizePicture(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    altitude: row.altitude,
    path: row.path,
    originalName: row.original_name,
    mimeType: row.mime_type,
    commentary: row.commentary,
    timestamp: row.timestamp,
  };
}

async function deleteFileIfExists(filePath) {
  if (!filePath) {
    return;
  }

  const absolutePath = path.join(__dirname, filePath.replace(/^\/+/, ''));

  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

router.get('/picture', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM picture ORDER BY id DESC');
    res.json(result.rows.map(normalizePicture));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/picture/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM picture WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Picture not found' });
      return;
    }

    res.json(normalizePicture(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/picture', upload.single('picture'), async (req, res) => {
  try {
    const { latitude, longitude, altitude, commentary } = req.body;

    if (!req.file) {
      res.status(400).json({ error: 'Picture file is required' });
      return;
    }

    if (!latitude || !longitude) {
      await deleteFileIfExists(`/uploads/${req.file.filename}`);
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const storedPath = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      `INSERT INTO picture (latitude, longitude, altitude, path, original_name, mime_type, commentary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        latitude,
        longitude,
        altitude || null,
        storedPath,
        req.file.originalname,
        req.file.mimetype,
        commentary || null,
      ]
    );

    res.status(201).json(normalizePicture(result.rows[0]));
  } catch (err) {
    if (req.file) {
      await deleteFileIfExists(`/uploads/${req.file.filename}`);
    }

    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/picture/:id', upload.single('picture'), async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM picture WHERE id = $1', [req.params.id]);

    if (existing.rows.length === 0) {
      if (req.file) {
        await deleteFileIfExists(`/uploads/${req.file.filename}`);
      }
      res.status(404).json({ error: 'Picture not found' });
      return;
    }

    const current = existing.rows[0];
    const nextPath = req.file ? `/uploads/${req.file.filename}` : current.path;
    const nextOriginalName = req.file ? req.file.originalname : current.original_name;
    const nextMimeType = req.file ? req.file.mimetype : current.mime_type;

    const result = await pool.query(
      `UPDATE picture
       SET latitude = $1,
           longitude = $2,
           altitude = $3,
           path = $4,
           original_name = $5,
           mime_type = $6,
           commentary = $7
       WHERE id = $8
       RETURNING *`,
      [
        req.body.latitude ?? current.latitude,
        req.body.longitude ?? current.longitude,
        req.body.altitude ?? current.altitude,
        nextPath,
        nextOriginalName,
        nextMimeType,
        req.body.commentary ?? current.commentary,
        req.params.id,
      ]
    );

    if (req.file && current.path !== nextPath) {
      await deleteFileIfExists(current.path);
    }

    res.json(normalizePicture(result.rows[0]));
  } catch (err) {
    if (req.file) {
      await deleteFileIfExists(`/uploads/${req.file.filename}`);
    }

    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/picture/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM picture WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Picture not found' });
      return;
    }

    await deleteFileIfExists(result.rows[0].path);
    res.status(200).json({ message: 'Picture deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = router;
