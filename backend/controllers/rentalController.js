import { query } from '../models/db.js';
import { logAction } from '../services/auditService.js';

// Get all rentals with search and filtering
export const getRentals = async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query;

    // Fetch all rentals sorted by created_at DESC
    const sql = 'SELECT * FROM saree_rental_occasion_styling_servi';
    const result = await query(sql);
    let rentals = result.rows;

    // Filter in JS for database mode consistency (PostgreSQL & JSON Fallback)
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      rentals = rentals.filter(r => 
        String(r.id).includes(q) ||
        (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
        (r.occasion && r.occasion.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'All') {
      rentals = rentals.filter(r => r.status === status);
    }

    if (startDate) {
      const start = new Date(startDate);
      rentals = rentals.filter(r => new Date(r.rental_date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      rentals = rentals.filter(r => new Date(r.rental_date) <= end);
    }

    res.json({ success: true, count: rentals.length, data: rentals });
  } catch (err) {
    console.error('getRentals error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve rentals' });
  }
};

// Get single rental details
export const getRentalById = async (req, res) => {
  try {
    const id = req.params.id;
    const sql = 'SELECT * FROM saree_rental_occasion_styling_servi WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rental not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('getRentalById error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve rental' });
  }
};

// Create a new rental
export const createRental = async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      email,
      occasion,
      saree_name,
      saree_category,
      size,
      rental_date,
      return_date,
      rental_amount,
      deposit_amount,
      cleaning_charge,
      status
    } = req.body;

    const sql = `
      INSERT INTO saree_rental_occasion_styling_servi (
        customer_name, phone, email, occasion,
        saree_name, saree_category, size,
        rental_date, return_date,
        rental_amount, deposit_amount, cleaning_charge,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const params = [
      customer_name,
      phone,
      email,
      occasion,
      saree_name,
      saree_category,
      size,
      rental_date,
      return_date,
      parseFloat(rental_amount),
      parseFloat(deposit_amount),
      parseFloat(cleaning_charge),
      status || 'Active'
    ];

    const result = await query(sql, params);
    const newRental = result.rows[0];

    // Log action to audit logs
    await logAction(newRental.id, `Rental created for ${customer_name} (${saree_name})`);

    res.status(201).json({ success: true, data: newRental });
  } catch (err) {
    console.error('createRental error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create rental' });
  }
};

// Update a rental
export const updateRental = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      customer_name,
      phone,
      email,
      occasion,
      saree_name,
      saree_category,
      size,
      rental_date,
      return_date,
      rental_amount,
      deposit_amount,
      cleaning_charge,
      status
    } = req.body;

    // Fetch existing rental to log status changes specifically
    const selectSql = 'SELECT * FROM saree_rental_occasion_styling_servi WHERE id = $1';
    const oldResult = await query(selectSql, [id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rental not found' });
    }

    const oldRental = oldResult.rows[0];

    const updateSql = `
      UPDATE saree_rental_occasion_styling_servi SET
        customer_name = $1,
        phone = $2,
        email = $3,
        occasion = $4,
        saree_name = $5,
        saree_category = $6,
        size = $7,
        rental_date = $8,
        return_date = $9,
        rental_amount = $10,
        deposit_amount = $11,
        cleaning_charge = $12,
        status = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `;

    const params = [
      customer_name,
      phone,
      email,
      occasion,
      saree_name,
      saree_category,
      size,
      rental_date,
      return_date,
      parseFloat(rental_amount),
      parseFloat(deposit_amount),
      parseFloat(cleaning_charge),
      status,
      id
    ];

    const result = await query(updateSql, params);
    const updatedRental = result.rows[0];

    // Audit Log tracking
    let auditMsg = `Rental details updated for ${customer_name}`;
    if (oldRental.status !== status) {
      auditMsg = `Rental status changed from '${oldRental.status}' to '${status}'`;
    }
    await logAction(id, auditMsg);

    res.json({ success: true, data: updatedRental });
  } catch (err) {
    console.error('updateRental error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update rental' });
  }
};

// Delete a rental
export const deleteRental = async (req, res) => {
  try {
    const id = req.params.id;

    // Get customer name first for audit logging
    const selectSql = 'SELECT * FROM saree_rental_occasion_styling_servi WHERE id = $1';
    const getResult = await query(selectSql, [id]);

    if (getResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rental not found' });
    }

    const rentalToDelete = getResult.rows[0];

    const deleteSql = 'DELETE FROM saree_rental_occasion_styling_servi WHERE id = $1 RETURNING *';
    await query(deleteSql, [id]);

    // Log deletion
    await logAction(id, `Rental deleted for customer ${rentalToDelete.customer_name} (ID: ${id})`);

    res.json({ success: true, message: 'Rental deleted successfully', deletedRentalId: id });
  } catch (err) {
    console.error('deleteRental error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete rental' });
  }
};
