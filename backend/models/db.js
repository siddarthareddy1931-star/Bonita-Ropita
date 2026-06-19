import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_DB_PATH = path.join(__dirname, '..', 'data.json');

// Check if PostgreSQL config is provided
const hasPostgres = !!(process.env.DATABASE_URL || process.env.PGHOST);

let pool = null;
let useJsonFallback = !hasPostgres;
let jsonData = { saree_rental_occasion_styling_servi: [], audit_logs: [], system_rules: {} };

// Helper to load JSON database
const loadJsonDb = () => {
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const raw = fs.readFileSync(JSON_DB_PATH, 'utf8');
      jsonData = JSON.parse(raw);

      let migrated = false;

      // Migrate old rentals table key if exists
      if (jsonData.rentals && !jsonData.saree_rental_occasion_styling_servi) {
        jsonData.saree_rental_occasion_styling_servi = jsonData.rentals;
        delete jsonData.rentals;
        migrated = true;
      }

      if (!jsonData.saree_rental_occasion_styling_servi) {
        jsonData.saree_rental_occasion_styling_servi = [];
        migrated = true;
      }

      if (!jsonData.audit_logs) {
        jsonData.audit_logs = [];
        migrated = true;
      }

      if (!jsonData.system_rules) {
        jsonData.system_rules = {
          rental_fee_default: '50.00',
          deposit_percent_default: '0.50',
          cleaning_charge_default: '5.00',
          rental_period_default: '7',
          whatsapp_number_default: '+916309571931'
        };
        migrated = true;
      } else if (!jsonData.system_rules.whatsapp_number_default) {
        jsonData.system_rules.whatsapp_number_default = '+916309571931';
        migrated = true;
      }

      if (migrated) {
        saveJsonDb();
      }
    } else {
      jsonData = {
        saree_rental_occasion_styling_servi: [],
        audit_logs: [],
        system_rules: {
          rental_fee_default: '50.00',
          deposit_percent_default: '0.50',
          cleaning_charge_default: '5.00',
          rental_period_default: '7',
          whatsapp_number_default: '+916309571931'
        }
      };
      saveJsonDb();
    }
  } catch (err) {
    console.error('Error loading local JSON DB:', err.message);
  }
};

// Helper to save JSON database
const saveJsonDb = () => {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(jsonData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local JSON DB:', err.message);
  }
};

// Initialize DB
const initDb = async () => {
  if (hasPostgres) {
    console.log('[DB] Database URL or PG Host found. Attempting PostgreSQL connection...');
    const config = process.env.DATABASE_URL 
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.PGHOST,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
          port: parseInt(process.env.PGPORT || '5432', 10),
          ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
        };

    pool = new Pool(config);

    try {
      // Test connection
      const client = await pool.connect();
      console.log('[DB] PostgreSQL connected successfully.');
      client.release();

      // Create main Saree Rental table with new name
      await pool.query(`
        CREATE TABLE IF NOT EXISTS saree_rental_occasion_styling_servi (
          id SERIAL PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          email VARCHAR(255) NOT NULL,
          occasion VARCHAR(255) NOT NULL,
          saree_name VARCHAR(255) NOT NULL,
          saree_category VARCHAR(100) NOT NULL,
          size VARCHAR(50) NOT NULL,
          rental_date DATE NOT NULL,
          return_date DATE NOT NULL,
          rental_amount DECIMAL(10,2) NOT NULL,
          deposit_amount DECIMAL(10,2) NOT NULL,
          cleaning_charge DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Add PostgreSQL indexes for optimized lookups
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_sross_status ON saree_rental_occasion_styling_servi(status);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_sross_customer_name ON saree_rental_occasion_styling_servi(customer_name);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_sross_return_date ON saree_rental_occasion_styling_servi(return_date);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_sross_rental_date ON saree_rental_occasion_styling_servi(rental_date);`);

      // Create Audit Logs table referencing the renamed table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          rental_id INTEGER REFERENCES saree_rental_occasion_styling_servi(id) ON DELETE SET NULL,
          action VARCHAR(255) NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_rental_id ON audit_logs(rental_id);`);

      // Create System Rules config table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_rules (
          key VARCHAR(100) PRIMARY KEY,
          value VARCHAR(255) NOT NULL
        );
      `);

      // Seed default rules if not exist
      await pool.query(`
        INSERT INTO system_rules (key, value) VALUES
        ('rental_fee_default', '50.00'),
        ('deposit_percent_default', '0.50'),
        ('cleaning_charge_default', '5.00'),
        ('rental_period_default', '7'),
        ('whatsapp_number_default', '+916309571931')
        ON CONFLICT (key) DO NOTHING;
      `);
      
      console.log('[DB] PostgreSQL tables and indexes verified/created.');
    } catch (err) {
      console.error('[DB] PostgreSQL connection/setup failed. Error:', err.message);
      console.warn('[DB] Falling back to local JSON file database for this session.');
      useJsonFallback = true;
      loadJsonDb();
    }
  } else {
    console.log('[DB] No PostgreSQL variables configured. Using local JSON database (data.json).');
    loadJsonDb();
  }
};

// Start DB Initialization
initDb();

// Simulated JSON database query evaluator
const queryJson = (text, params = []) => {
  const normalizedText = text.trim().replace(/\s+/g, ' ').toUpperCase();

  // 1. INSERT INTO SAREE_RENTAL_OCCASION_STYLING_SERVI
  if (normalizedText.startsWith('INSERT INTO SAREE_RENTAL_OCCASION_STYLING_SERVI')) {
    const rental = {
      id: jsonData.saree_rental_occasion_styling_servi.length > 0 
        ? Math.max(...jsonData.saree_rental_occasion_styling_servi.map(r => r.id)) + 1 
        : 1,
      customer_name: params[0],
      phone: params[1],
      email: params[2],
      occasion: params[3],
      saree_name: params[4],
      saree_category: params[5],
      size: params[6],
      rental_date: params[7],
      return_date: params[8],
      rental_amount: parseFloat(params[9]),
      deposit_amount: parseFloat(params[10]),
      cleaning_charge: parseFloat(params[11]),
      status: params[12] || 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    jsonData.saree_rental_occasion_styling_servi.push(rental);
    saveJsonDb();
    return { rows: [rental] };
  }

  // 2. INSERT INTO AUDIT_LOGS
  if (normalizedText.startsWith('INSERT INTO AUDIT_LOGS')) {
    const log = {
      id: jsonData.audit_logs.length > 0 ? Math.max(...jsonData.audit_logs.map(l => l.id)) + 1 : 1,
      rental_id: params[0],
      action: params[1],
      timestamp: new Date().toISOString()
    };
    jsonData.audit_logs.push(log);
    saveJsonDb();
    return { rows: [log] };
  }

  // 3. SELECT FROM SAREE_RENTAL_OCCASION_STYLING_SERVI WHERE ID = $1
  if (normalizedText.startsWith('SELECT * FROM SAREE_RENTAL_OCCASION_STYLING_SERVI WHERE ID =') || 
      (normalizedText.includes('FROM SAREE_RENTAL_OCCASION_STYLING_SERVI WHERE ID =') && params.length === 1)) {
    const id = parseInt(params[0], 10);
    const rental = jsonData.saree_rental_occasion_styling_servi.find(r => r.id === id);
    return { rows: rental ? [rental] : [] };
  }

  // 4. SELECT FROM SAREE_RENTAL_OCCASION_STYLING_SERVI
  if (normalizedText.includes('FROM SAREE_RENTAL_OCCASION_STYLING_SERVI')) {
    const sortedRentals = [...jsonData.saree_rental_occasion_styling_servi]
      .sort((a, b) => new Date(b.created_at || b.rental_date) - new Date(a.created_at || a.rental_date));
    return { rows: sortedRentals };
  }

  // 5. SELECT FROM AUDIT_LOGS
  if (normalizedText.includes('FROM AUDIT_LOGS')) {
    const sortedLogs = [...jsonData.audit_logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { rows: sortedLogs };
  }

  // 6. UPDATE SAREE_RENTAL_OCCASION_STYLING_SERVI
  if (normalizedText.startsWith('UPDATE SAREE_RENTAL_OCCASION_STYLING_SERVI')) {
    const id = parseInt(params[params.length - 1], 10);
    const index = jsonData.saree_rental_occasion_styling_servi.findIndex(r => r.id === id);
    if (index !== -1) {
      jsonData.saree_rental_occasion_styling_servi[index] = {
        ...jsonData.saree_rental_occasion_styling_servi[index],
        customer_name: params[0],
        phone: params[1],
        email: params[2],
        occasion: params[3],
        saree_name: params[4],
        saree_category: params[5],
        size: params[6],
        rental_date: params[7],
        return_date: params[8],
        rental_amount: parseFloat(params[9]),
        deposit_amount: parseFloat(params[10]),
        cleaning_charge: parseFloat(params[11]),
        status: params[12],
        updated_at: new Date().toISOString()
      };
      saveJsonDb();
      return { rows: [jsonData.saree_rental_occasion_styling_servi[index]] };
    }
    return { rows: [] };
  }

  // 7. DELETE FROM SAREE_RENTAL_OCCASION_STYLING_SERVI
  if (normalizedText.startsWith('DELETE FROM SAREE_RENTAL_OCCASION_STYLING_SERVI')) {
    const id = parseInt(params[0], 10);
    const index = jsonData.saree_rental_occasion_styling_servi.findIndex(r => r.id === id);
    if (index !== -1) {
      const deleted = jsonData.saree_rental_occasion_styling_servi.splice(index, 1)[0];
      // Soft-delete references in audit logs
      jsonData.audit_logs = jsonData.audit_logs.map(l => l.rental_id === id ? { ...l, rental_id: null } : l);
      saveJsonDb();
      return { rows: [deleted] };
    }
    return { rows: [] };
  }

  // 8. SELECT FROM SYSTEM_RULES
  if (normalizedText.includes('FROM SYSTEM_RULES')) {
    const rows = Object.keys(jsonData.system_rules).map(k => ({
      key: k,
      value: jsonData.system_rules[k]
    }));
    return { rows };
  }

  // 9. INSERT/UPDATE SYSTEM_RULES
  if (normalizedText.startsWith('INSERT INTO SYSTEM_RULES') || normalizedText.startsWith('UPDATE SYSTEM_RULES')) {
    // Expect UPDATE system_rules SET value = $1 WHERE key = $2
    const value = String(params[0]);
    const key = String(params[1]);
    jsonData.system_rules[key] = value;
    saveJsonDb();
    return { rows: [{ key, value }] };
  }

  return { rows: [] };
};

// Main unified query exporter
export const query = async (text, params = []) => {
  if (useJsonFallback) {
    return queryJson(text, params);
  } else {
    return pool.query(text, params);
  }
};
