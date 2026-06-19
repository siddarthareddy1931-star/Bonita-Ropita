import { query } from '../models/db.js';

// Get all system rules
export const getSystemRules = async (req, res) => {
  try {
    const result = await query('SELECT * FROM system_rules');
    // Format response as a clean key-value object
    const rulesObj = {};
    result.rows.forEach(row => {
      rulesObj[row.key] = row.value;
    });

    res.json({
      success: true,
      data: rulesObj
    });
  } catch (err) {
    console.error('getSystemRules error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve system rules' });
  }
};

// Update system rules
export const updateSystemRules = async (req, res) => {
  try {
    const rules = req.body; // Expects format: { key: value, key2: value2 }
    
    if (!rules || typeof rules !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid rules body' });
    }

    const promises = Object.keys(rules).map(async (key) => {
      const value = String(rules[key]);
      
      // In PostgreSQL we do upsert: INSERT INTO system_rules (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      // In db.js queryJson, we handle UPDATE system_rules/INSERT system_rules with params [value, key]
      // Let's execute the query. To be fully compatible with our queryJson mapper and PostgreSQL:
      // PostgreSQL handles standard UPDATE key: UPDATE system_rules SET value = $1 WHERE key = $2
      // Let's check: does it exist first? Or just do an UPDATE. If rows affected is 0, do INSERT.
      const updateSql = 'UPDATE system_rules SET value = $1 WHERE key = $2 RETURNING *';
      const updateResult = await query(updateSql, [value, key]);
      
      if (updateResult.rows.length === 0) {
        const insertSql = 'INSERT INTO system_rules (key, value) VALUES ($2, $1) RETURNING *';
        await query(insertSql, [value, key]);
      }
    });

    await Promise.all(promises);

    // Fetch the updated set
    const finalResult = await query('SELECT * FROM system_rules');
    const rulesObj = {};
    finalResult.rows.forEach(row => {
      rulesObj[row.key] = row.value;
    });

    res.json({
      success: true,
      message: 'System rules updated successfully',
      data: rulesObj
    });
  } catch (err) {
    console.error('updateSystemRules error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update system rules' });
  }
};
