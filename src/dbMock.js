// Client-side Database Mock using LocalStorage

const DEFAULT_RULES = {
  rental_fee_default: '5.99',            // re-purposed as flat shipping fee
  deposit_percent_default: '0.08',       // re-purposed as tax rate (8%)
  cleaning_charge_default: '75.00',      // re-purposed as free shipping threshold
  rental_period_default: '5',            // re-purposed as default delivery window in days
  whatsapp_number_default: '+916309571931'
};

const DEFAULT_ORDERS = [
  {
    id: 843102,
    customer_name: "Deepika Padukone",
    phone: "+91 98765 43210",
    email: "deepika@padukone.com",
    occasion: "Reception Party Outfit",
    saree_name: "Emerald Silk Designer Blouse (Qty: 1)",
    saree_category: "Blouses",
    size: "M",
    rental_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
    return_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // due in 2 days
    rental_amount: 85.00,
    deposit_amount: 6.80,
    cleaning_charge: 0.00,
    status: "Active", // "Shipped" mapped to Active style
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 932104,
    customer_name: "Alia Bhatt",
    phone: "+91 98888 77777",
    email: "alia@bhatt.co",
    occasion: "Bespoke Silk Wear Inquiry",
    saree_name: "Pastel Pink Organza Day Dress (Qty: 1), Ivory Lace Designer Blouse (Qty: 1)",
    saree_category: "Dresses, Blouses",
    size: "M, S",
    rental_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
    return_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rental_amount: 200.00,
    deposit_amount: 16.00,
    cleaning_charge: 0.00,
    status: "Pending", // "Pending" status style
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 521093,
    customer_name: "Priyanka Chopra",
    phone: "+1 415 555 2672",
    email: "priyanka@chopra.org",
    occasion: "Gala Event Dress",
    saree_name: "Crimson Linen Tiered Maxi Dress (Qty: 1)",
    saree_category: "Dresses",
    size: "L",
    rental_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
    return_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rental_amount: 110.00,
    deposit_amount: 8.80,
    cleaning_charge: 0.00,
    status: "Returned", // "Delivered" mapped to Returned style
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_AUDIT_LOGS = [
  {
    id: "log-1",
    rental_id: 843102,
    action: "Order marked as Shipped",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-2",
    rental_id: 932104,
    action: "Order registered via checkout",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-3",
    rental_id: 521093,
    action: "Order delivered to customer",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Initialize localStorage if keys do not exist
const initDB = () => {
  if (!localStorage.getItem('jyothi_boutique_rules')) {
    localStorage.setItem('jyothi_boutique_rules', JSON.stringify(DEFAULT_RULES));
  }
  if (!localStorage.getItem('jyothi_boutique_orders')) {
    localStorage.setItem('jyothi_boutique_orders', JSON.stringify(DEFAULT_ORDERS));
  }
  if (!localStorage.getItem('jyothi_boutique_audit_logs')) {
    localStorage.setItem('jyothi_boutique_audit_logs', JSON.stringify(DEFAULT_AUDIT_LOGS));
  }
};

// Run initialization immediately
initDB();

export const dbMock = {
  getRules: () => {
    initDB();
    return JSON.parse(localStorage.getItem('jyothi_boutique_rules'));
  },
  saveRules: (rules) => {
    localStorage.setItem('jyothi_boutique_rules', JSON.stringify(rules));
    dbMock.addAuditLog("System rules updated", null);
  },
  getOrders: (filters = {}) => {
    initDB();
    let orders = JSON.parse(localStorage.getItem('jyothi_boutique_orders'));
    
    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      orders = orders.filter(o => 
        o.customer_name.toLowerCase().includes(searchLower) ||
        o.saree_name.toLowerCase().includes(searchLower) ||
        o.email.toLowerCase().includes(searchLower) ||
        String(o.id).includes(searchLower)
      );
    }
    if (filters.statusFilter && filters.statusFilter !== 'All') {
      orders = orders.filter(o => o.status === filters.statusFilter);
    }
    if (filters.startDate) {
      orders = orders.filter(o => o.rental_date >= filters.startDate);
    }
    if (filters.endDate) {
      orders = orders.filter(o => o.rental_date <= filters.endDate);
    }
    
    return orders;
  },
  saveOrders: (orders) => {
    localStorage.setItem('jyothi_boutique_orders', JSON.stringify(orders));
  },
  addOrder: (order) => {
    initDB();
    const orders = JSON.parse(localStorage.getItem('jyothi_boutique_orders'));
    orders.unshift(order);
    localStorage.setItem('jyothi_boutique_orders', JSON.stringify(orders));
    dbMock.addAuditLog(`Order placed successfully by ${order.customer_name}`, order.id);
  },
  updateOrder: (updatedOrder) => {
    initDB();
    const orders = JSON.parse(localStorage.getItem('jyothi_boutique_orders'));
    const index = orders.findIndex(o => o.id === updatedOrder.id);
    if (index !== -1) {
      const oldOrder = orders[index];
      orders[index] = updatedOrder;
      localStorage.setItem('jyothi_boutique_orders', JSON.stringify(orders));
      
      let changeMsg = `Order details updated`;
      if (oldOrder.status !== updatedOrder.status) {
        changeMsg = `Order status changed from ${oldOrder.status} to ${updatedOrder.status}`;
      }
      dbMock.addAuditLog(changeMsg, updatedOrder.id);
      return true;
    }
    return false;
  },
  deleteOrder: (id) => {
    initDB();
    const orders = JSON.parse(localStorage.getItem('jyothi_boutique_orders'));
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length !== orders.length) {
      localStorage.setItem('jyothi_boutique_orders', JSON.stringify(filtered));
      dbMock.addAuditLog(`Order #${id} deleted from records`, id);
      return true;
    }
    return false;
  },
  getAuditLogs: () => {
    initDB();
    return JSON.parse(localStorage.getItem('jyothi_boutique_audit_logs'));
  },
  addAuditLog: (action, orderId) => {
    initDB();
    const logs = JSON.parse(localStorage.getItem('jyothi_boutique_audit_logs'));
    logs.unshift({
      id: 'log-' + Date.now() + Math.random().toString(36).substr(2, 5),
      rental_id: orderId,
      action,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('jyothi_boutique_audit_logs', JSON.stringify(logs.slice(0, 100))); // Cap logs at 100
  },
  getReports: () => {
    initDB();
    const orders = JSON.parse(localStorage.getItem('jyothi_boutique_orders'));
    
    // Totals calculations
    const totals = {
      activeRentals: orders.filter(o => o.status === 'Active').length,
      returnedRentals: orders.filter(o => o.status === 'Returned').length,
      overdueRentals: orders.filter(o => o.status === 'Overdue').length,
      pendingRentals: orders.filter(o => o.status === 'Pending').length
    };
    
    // Revenue calculations
    // Sum subtotal (rental_amount) + shipping (cleaning_charge) + tax (deposit_amount)
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.rental_amount || 0) + parseFloat(o.cleaning_charge || 0) + parseFloat(o.deposit_amount || 0)), 0);
    
    // Generate daily revenue for last 7 days
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      
      const dayOrders = orders.filter(o => o.rental_date === dateStr);
      const dayRev = dayOrders.reduce((sum, o) => sum + (parseFloat(o.rental_amount || 0) + parseFloat(o.cleaning_charge || 0) + parseFloat(o.deposit_amount || 0)), 0);
      
      dailyRevenue.push({
        label: dateLabel,
        revenue: dayRev,
        rentals: dayOrders.length
      });
    }

    // Weekly revenue for last 4 weeks
    const weeklyRevenue = [];
    for (let i = 3; i >= 0; i--) {
      weeklyRevenue.push({
        label: `Week ${4-i}`,
        revenue: i === 0 ? totalRevenue * 0.4 : totalRevenue * 0.2
      });
    }

    // Monthly revenue for last 6 months
    const monthlyRevenue = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthlyRevenue.push({
        label: months[d.getMonth()],
        revenue: i === 0 ? totalRevenue * 0.6 : totalRevenue * 0.15
      });
    }

    return {
      totals,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue
    };
  }
};
