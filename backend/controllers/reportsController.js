import { query } from '../models/db.js';

export const getReportsSummary = async (req, res) => {
  try {
    const result = await query('SELECT * FROM saree_rental_occasion_styling_servi');
    const rentals = result.rows;

    const statusDistribution = { Active: 0, Returned: 0, Overdue: 0, Pending: 0 };
    
    // Grouping variables
    const dailyRevenue = {};
    const monthlyRevenue = {};
    const weeklyRevenue = {};
    const dailyRentalCount = {};
    
    const today = new Date();
    
    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyRevenue[dateStr] = 0;
      dailyRentalCount[dateStr] = 0;
    }

    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const monthStr = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyRevenue[monthStr] = 0;
    }

    // Initialize past 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStr = `Wk -${i}`;
      weeklyRevenue[weekStr] = 0;
    }

    rentals.forEach(r => {
      // Status
      const st = r.status || 'Active';
      if (statusDistribution[st] !== undefined) {
        statusDistribution[st]++;
      } else {
        statusDistribution[st] = 1;
      }

      const rentAmount = parseFloat(r.rental_amount || 0);
      const cleanCharge = parseFloat(r.cleaning_charge || 0);
      const revenue = rentAmount + cleanCharge;

      const createdDate = new Date(r.created_at || r.rental_date);
      const dateStr = createdDate.toISOString().split('T')[0];

      // Daily grouping (if within past 7 days)
      if (dailyRevenue[dateStr] !== undefined) {
        dailyRevenue[dateStr] += revenue;
        dailyRentalCount[dateStr]++;
      }

      // Monthly grouping (if within past 6 months)
      const monthStr = createdDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyRevenue[monthStr] !== undefined) {
        monthlyRevenue[monthStr] += revenue;
      }

      // Weekly grouping (past 4 weeks)
      const diffTime = Math.abs(today - createdDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 28) {
        const weekIndex = Math.floor((diffDays - 1) / 7); // 0 = this week, 1 = last week, etc.
        const weekStr = `Wk -${weekIndex}`;
        if (weeklyRevenue[weekStr] !== undefined) {
          weeklyRevenue[weekStr] += revenue;
        }
      }
    });

    // Format reports data for frontend
    const dailyRevenueArray = Object.keys(dailyRevenue).map(date => ({
      label: date.split('-').slice(1).join('/'), // e.g. "06/12"
      revenue: parseFloat(dailyRevenue[date].toFixed(2)),
      rentals: dailyRentalCount[date]
    }));

    const weeklyRevenueArray = Object.keys(weeklyRevenue).reverse().map(week => ({
      label: week === 'Wk -0' ? 'This Wk' : week === 'Wk -1' ? '1 Wk Ago' : week === 'Wk -2' ? '2 Wks Ago' : '3 Wks Ago',
      revenue: parseFloat(weeklyRevenue[week].toFixed(2))
    }));

    const monthlyRevenueArray = Object.keys(monthlyRevenue).map(month => ({
      label: month,
      revenue: parseFloat(monthlyRevenue[month].toFixed(2))
    }));

    res.json({
      success: true,
      data: {
        statusDistribution,
        dailyRevenue: dailyRevenueArray,
        weeklyRevenue: weeklyRevenueArray,
        monthlyRevenue: monthlyRevenueArray,
        totals: {
          activeRentals: statusDistribution.Active || 0,
          returnedRentals: statusDistribution.Returned || 0,
          overdueRentals: statusDistribution.Overdue || 0,
          pendingRentals: statusDistribution.Pending || 0
        }
      }
    });
  } catch (err) {
    console.error('getReportsSummary error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate reports' });
  }
};
