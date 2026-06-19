import { query } from '../models/db.js';

export const getAuditLogs = async (req, res) => {
  try {
    const sql = 'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100';
    const result = await query(sql);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('getAuditLogs error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve audit logs' });
  }
};
