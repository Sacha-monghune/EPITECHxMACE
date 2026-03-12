const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: Number(process.env.POSTGRES_PORT || 5432),
    });

module.exports = { pool };
