import { query } from '../models/db.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const sql = 'SELECT status, rental_amount, cleaning_charge, return_date FROM saree_rental_occasion_styling_servi';
    const result = await query(sql);
    const rentals = result.rows;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalRentals = rentals.length;
    let activeRentals = 0;
    let returnedRentals = 0;
    let overdueRentals = 0;
    let totalRevenue = 0;

    rentals.forEach(r => {
      // Calculate revenue as rental_amount + cleaning_charge
      const amt = parseFloat(r.rental_amount || 0);
      const clean = parseFloat(r.cleaning_charge || 0);
      totalRevenue += (amt + clean);

      // Count statuses
      if (r.status === 'Active') {
        // Double check if it has gone overdue dynamically
        const retDate = new Date(r.return_date);
        if (retDate < today) {
          overdueRentals++;
        } else {
          activeRentals++;
        }
      } else if (r.status === 'Returned') {
        returnedRentals++;
      } else if (r.status === 'Overdue') {
        overdueRentals++;
      } else if (r.status === 'Pending') {
        // Treat pending separately or group? Let's count it as pending if needed,
        // but let's stick to the prompt's statuses: Active, Returned, Pending, Overdue.
      }
    });

    res.json({
      success: true,
      data: {
        totalRentals,
        activeRentals,
        returnedRentals,
        overdueRentals,
        totalRevenue
      }
    });
  } catch (err) {
    console.error('getDashboardSummary error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve dashboard summary' });
  }
};
