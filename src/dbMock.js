// Client-side Database Mock using LocalStorage
import emeraldSilkBlouse from './assets/emerald_silk_blouse.png';
import indigoCottonDress from './assets/indigo_cotton_dress.png';
import ivoryLaceBlouse from './assets/ivory_lace_blouse.png';
import crimsonLinenDress from './assets/crimson_linen_dress.png';
import mustardGeorgetteBlouse from './assets/mustard_georgette_blouse.png';
import pinkOrganzaDress from './assets/pink_organza_dress.png';

const DEFAULT_RULES = {
  rental_fee_default: '5.99',            // re-purposed as flat shipping fee
  deposit_percent_default: '0.08',       // re-purposed as tax rate (8%)
  cleaning_charge_default: '75.00',      // re-purposed as free shipping threshold
  rental_period_default: '5',            // re-purposed as default delivery window in days
  whatsapp_number_default: '+916309571931'
};

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    title: "Emerald Silk Designer Blouse",
    category: "Blouses",
    price: 85,
    image: emeraldSilkBlouse,
    size: "M",
    fabric: "Raw Silk & Zardosi",
    condition: "Handmade New",
    description: "A luxury emerald green raw silk blouse featuring hand-embroidered floral zardosi work and a sophisticated sweetheart neckline.",
    stock: 5
  },
  {
    id: 2,
    title: "Indigo Cotton Handblock Print Dress",
    category: "Dresses",
    price: 95,
    image: indigoCottonDress,
    size: "M",
    fabric: "Organic Hand-spun Cotton",
    condition: "Gently Loved",
    description: "An elegant, breathable midi dress adorned with indigo handblock floral prints, a tiered skirt, and puff sleeves.",
    stock: 5
  },
  {
    id: 3,
    title: "Ivory Lace Designer Blouse",
    category: "Blouses",
    price: 75,
    image: ivoryLaceBlouse,
    size: "S",
    fabric: "Chantilly Lace & Satin",
    condition: "Handmade New",
    description: "A delicate cream Chantilly lace blouse with a sheer high neckline, buttoned back, and comfortable satin lining.",
    stock: 5
  },
  {
    id: 4,
    title: "Crimson Linen Tiered Maxi Dress",
    category: "Dresses",
    price: 110,
    image: crimsonLinenDress,
    size: "L",
    fabric: "Pure Italian Linen",
    condition: "Gently Loved",
    description: "A vibrant crimson tiered maxi dress with adjustable tie-up shoulder straps and a relaxed yet flattering silhouette.",
    stock: 5
  },
  {
    id: 5,
    title: "Mustard Georgette Peplum Blouse",
    category: "Blouses",
    price: 65,
    image: mustardGeorgetteBlouse,
    size: "OS",
    fabric: "Georgette & Mirror Work",
    condition: "Upcycled Gem",
    description: "A stylish peplum blouse featuring intricate mirror embroidery on the yoke and a flared hemline, perfect for occasions.",
    stock: 5
  },
  {
    id: 6,
    title: "Pastel Pink Organza Day Dress",
    category: "Dresses",
    price: 125,
    image: pinkOrganzaDress,
    size: "M",
    fabric: "Premium Organza & Crepe",
    condition: "Handmade New",
    description: "A romantic pastel pink dress in lightweight organza, featuring a hand-painted floral pattern, wrap bodice, and ruffled hem.",
    stock: 5
  }
];

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
    rental_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    return_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rental_amount: 85.00,
    deposit_amount: 6.80,
    cleaning_charge: 0.00,
    status: "Active",
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
    rental_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    return_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rental_amount: 200.00,
    deposit_amount: 16.00,
    cleaning_charge: 0.00,
    status: "Pending",
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
    rental_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    return_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rental_amount: 110.00,
    deposit_amount: 8.80,
    cleaning_charge: 0.00,
    status: "Returned",
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
  if (!localStorage.getItem('jyothi_boutique_products')) {
    localStorage.setItem('jyothi_boutique_products', JSON.stringify(DEFAULT_PRODUCTS));
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
  getProducts: () => {
    initDB();
    return JSON.parse(localStorage.getItem('jyothi_boutique_products'));
  },
  saveProducts: (products) => {
    localStorage.setItem('jyothi_boutique_products', JSON.stringify(products));
  },
  addProduct: (product) => {
    initDB();
    const products = JSON.parse(localStorage.getItem('jyothi_boutique_products'));
    const newProduct = {
      ...product,
      id: Date.now()
    };
    products.push(newProduct);
    localStorage.setItem('jyothi_boutique_products', JSON.stringify(products));
    dbMock.addAuditLog(`New product added: ${product.title}`, null);
    return newProduct;
  },
  updateProduct: (updatedProduct) => {
    initDB();
    const products = JSON.parse(localStorage.getItem('jyothi_boutique_products'));
    const idx = products.findIndex(p => p.id === updatedProduct.id);
    if (idx !== -1) {
      products[idx] = updatedProduct;
      localStorage.setItem('jyothi_boutique_products', JSON.stringify(products));
      dbMock.addAuditLog(`Product updated: ${updatedProduct.title}`, null);
      return true;
    }
    return false;
  },
  deleteProduct: (id) => {
    initDB();
    const products = JSON.parse(localStorage.getItem('jyothi_boutique_products'));
    const productToDelete = products.find(p => p.id === id);
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length !== products.length) {
      localStorage.setItem('jyothi_boutique_products', JSON.stringify(filtered));
      if (productToDelete) {
        dbMock.addAuditLog(`Product deleted: ${productToDelete.title}`, null);
      }
      return true;
    }
    return false;
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
