import { query } from '../models/db.js';

export const logAction = async (rentalId, action) => {
  try {
    const text = 'INSERT INTO audit_logs (rental_id, action) VALUES ($1, $2) RETURNING *';
    const params = [rentalId, action];
    await query(text, params);
  } catch (err) {
    console.error('[AuditService] Failed to create audit log:', err.message);
  }
};
