import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',             
  host: 'localhost',
  database: 'employee_db',
  password: process.env.DB_PASSWORD,  
  port: 5432,
});

export default pool;
