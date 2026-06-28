import { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import './AdminDashboard.css';
import { dbMock } from './dbMock';

export default function AdminDashboard({ onClose, onLogout }) {
  // Navigation tabs: 'overview', 'rentals', 'reports', 'notifications', 'audit', 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Backend data states
  const [rentals, setRentals] = useState([]);
  const [summary, setSummary] = useState({
    totalRentals: 0,
    activeRentals: 0,
    returnedRentals: 0,
    overdueRentals: 0,
    totalRevenue: 0
  });
  const [reportsData, setReportsData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // System Rules Configuration State
  const [systemRules, setSystemRules] = useState({
    rental_fee_default: '50.00',
    deposit_percent_default: '0.50',
    cleaning_charge_default: '5.00',
    rental_period_default: '7'
  });
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Chart canvas refs
  const revenueChartRef = useRef(null);
  const volumeChartRef = useRef(null);
  const distributionChartRef = useRef(null);

  // Filters for Rentals table
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);

  // Form State for Create/Edit
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    occasion: '',
    saree_name: '',
    saree_category: 'Blouses',
    size: 'M',
    rental_date: new Date().toISOString().split('T')[0],
    return_date: '',
    rental_amount: '50.00',
    deposit_amount: '25.00',
    cleaning_charge: '5.00',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch all dashboard data
  const fetchAllData = () => {
    setIsLoading(true);
    try {
      const ordersData = dbMock.getOrders({ search, statusFilter, startDate, endDate });
      setRentals(ordersData);

      const allOrders = dbMock.getOrders();
      const totals = dbMock.getReports().totals;
      const totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.rental_amount || 0) + parseFloat(o.cleaning_charge || 0) + parseFloat(o.deposit_amount || 0)), 0);

      setSummary({
        totalRentals: allOrders.length,
        activeRentals: totals.activeRentals,
        returnedRentals: totals.returnedRentals,
        overdueRentals: totals.overdueRentals,
        totalRevenue
      });

      // Fetch reports
      const repData = dbMock.getReports();
      setReportsData(repData);

      // Fetch audit logs
      const auditData = dbMock.getAuditLogs();
      setAuditLogs(auditData);

      // Fetch system rules
      const rulesData = dbMock.getRules();
      setSystemRules(rulesData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial fetch and fetch when filters change
  useEffect(() => {
    fetchAllData();
  }, [search, statusFilter, startDate, endDate]);

  // Compute notifications alerts dynamically
  useEffect(() => {
    if (rentals.length === 0) return;

    const today = new Date();
    today.setHours(0,0,0,0);
    const alerts = [];

    rentals.forEach(r => {
      const returnDate = new Date(r.return_date);
      const createdDate = new Date(r.created_at || r.rental_date);
      const diffTime = returnDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 1. Delivery Delayed Alerts
      if (r.status === 'Pending' && returnDate < today) {
        alerts.push({
          id: `overdue-${r.id}`,
          type: 'danger',
          title: `Delivery Delayed (ID: ${r.id})`,
          desc: `Order for ${r.customer_name} should have arrived on ${new Date(r.return_date).toLocaleDateString()}. Contact: ${r.phone}`,
          time: returnDate
        });
      }
      // 2. Delivery Due Alerts (within 2 days)
      else if (r.status === 'Pending' && diffDays >= 0 && diffDays <= 2) {
        alerts.push({
          id: `upcoming-${r.id}`,
          type: 'warning',
          title: `Delivery Approaching (ID: ${r.id})`,
          desc: `Order for ${r.customer_name} is scheduled for delivery on ${new Date(r.return_date).toLocaleDateString()}.`,
          time: returnDate
        });
      }

      // 3. New Order Registration alerts (past 2 days)
      const ageTime = today - createdDate;
      const ageDays = Math.ceil(ageTime / (1000 * 60 * 60 * 24));
      if (ageDays <= 2) {
        alerts.push({
          id: `new-${r.id}`,
          type: 'info',
          title: 'New Order Registered',
          desc: `Order ID: ${r.id} for ${r.customer_name} has been successfully registered.`,
          time: createdDate
        });
      }
    });

    // Sort alerts by type priority (danger, warning, info)
    alerts.sort((a, b) => {
      const priority = { danger: 1, warning: 2, info: 3 };
      return priority[a.type] - priority[b.type];
    });

    setNotifications(alerts);
  }, [rentals]);

  // Chart.js render effect
  useEffect(() => {
    if (activeTab !== 'reports' || !reportsData) return;

    let revenueChartInstance = null;
    let volumeChartInstance = null;
    let distributionChartInstance = null;

    // 1. Revenue Trend Line Chart
    if (revenueChartRef.current) {
      const ctx = revenueChartRef.current.getContext('2d');
      revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: reportsData.monthlyRevenue.map(m => m.label),
          datasets: [{
            label: 'Monthly Revenue ($)',
            data: reportsData.monthlyRevenue.map(m => m.revenue),
            borderColor: '#d48c70',
            backgroundColor: 'rgba(212, 140, 112, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#d48c70',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#e5dfd8' },
              ticks: { color: '#7a6f6d' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#7a6f6d' }
            }
          }
        }
      });
    }

    // 2. Daily Rental Volumes Bar Chart
    if (volumeChartRef.current) {
      const ctx = volumeChartRef.current.getContext('2d');
      volumeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: reportsData.dailyRevenue.map(d => d.label),
          datasets: [{
            label: 'Rentals Count',
            data: reportsData.dailyRevenue.map(d => d.rentals),
            backgroundColor: '#8ea885',
            borderColor: '#4a3e3d',
            borderWidth: 1.5,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: '#7a6f6d' },
              grid: { color: '#e5dfd8' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#7a6f6d' }
            }
          }
        }
      });
    }

    // 3. Status Distribution Donut Chart
    if (distributionChartRef.current) {
      const ctx = distributionChartRef.current.getContext('2d');
      const { activeRentals, returnedRentals, overdueRentals, pendingRentals } = reportsData.totals;
      distributionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Returned', 'Overdue', 'Pending'],
          datasets: [{
            data: [activeRentals, returnedRentals, overdueRentals, pendingRentals],
            backgroundColor: ['#e6c15c', '#8ea885', '#d9534f', '#a39996'],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#4a3e3d',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
              }
            }
          }
        }
      });
    }

    // Clean up
    return () => {
      if (revenueChartInstance) revenueChartInstance.destroy();
      if (volumeChartInstance) volumeChartInstance.destroy();
      if (distributionChartInstance) distributionChartInstance.destroy();
    };
  }, [activeTab, reportsData]);

  // Form validations
  const validateForm = () => {
    const errors = {};
    if (!formData.customer_name.trim()) errors.customer_name = 'Customer name is required';
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{7,20}$/.test(formData.phone.trim())) {
      errors.phone = 'Enter a valid phone number (at least 7 digits)';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!formData.occasion.trim()) errors.occasion = 'Occasion is required';
    if (!formData.saree_name.trim()) errors.saree_name = 'Garment/Design name is required';

    if (!formData.rental_date) {
      errors.rental_date = 'Rental date is required';
    }
    if (!formData.return_date) {
      errors.return_date = 'Return date is required';
    }
    if (formData.rental_date && formData.return_date) {
      if (new Date(formData.return_date) < new Date(formData.rental_date)) {
        errors.return_date = 'Return date must be on or after rental date';
      }
    }

    const validatePrice = (val, fieldName) => {
      if (val === undefined || val === null || String(val).trim() === '') {
        errors[fieldName] = 'Field is required';
      } else if (isNaN(parseFloat(val)) || parseFloat(val) < 0) {
        errors[fieldName] = 'Must be a valid positive amount';
      }
    };

    validatePrice(formData.rental_amount, 'rental_amount');
    validatePrice(formData.deposit_amount, 'deposit_amount');
    validatePrice(formData.cleaning_charge, 'cleaning_charge');

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Automatically recalculate deposit if rental_amount is changing
    if (name === 'rental_amount') {
      const amt = parseFloat(value || 0);
      const depositPct = parseFloat(systemRules.deposit_percent_default || '0.50');
      const depositVal = (amt * depositPct).toFixed(2);
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        deposit_amount: String(depositVal)
      }));
    } else if (name === 'rental_date') {
      // Recalculate return date dynamically if rental_date changes
      const rentalPeriod = parseInt(systemRules.rental_period_default || '7', 10);
      const rentDate = new Date(value);
      rentDate.setDate(rentDate.getDate() + rentalPeriod);
      const returnDateStr = rentDate.toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        [name]: value,
        return_date: returnDateStr
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Open Form Modal (Create Mode)
  const handleOpenCreateModal = () => {
    setFormMode('create');

    const defaultPeriod = parseInt(systemRules.rental_period_default || '7', 10);
    const rentalDateStr = new Date().toISOString().split('T')[0];
    const rentDateObj = new Date();
    rentDateObj.setDate(rentDateObj.getDate() + defaultPeriod);
    const returnDateStr = rentDateObj.toISOString().split('T')[0];

    const defaultFee = parseFloat(systemRules.rental_fee_default || '50.00').toFixed(2);
    const depositPct = parseFloat(systemRules.deposit_percent_default || '0.50');
    const defaultDeposit = (parseFloat(defaultFee) * depositPct).toFixed(2);
    const defaultCleaning = parseFloat(systemRules.cleaning_charge_default || '5.00').toFixed(2);

    setFormData({
      customer_name: '',
      phone: '',
      email: '',
      occasion: '',
      saree_name: '',
      saree_category: 'Blouses',
      size: 'M',
      rental_date: rentalDateStr,
      return_date: returnDateStr,
      rental_amount: defaultFee,
      deposit_amount: defaultDeposit,
      cleaning_charge: defaultCleaning,
      status: 'Active'
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Form Modal (Edit Mode)
  const handleOpenEditModal = (rental) => {
    setFormMode('edit');
    // Format dates correctly (YYYY-MM-DD)
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toISOString().split('T')[0];
    };
    
    setFormData({
      ...rental,
      rental_date: formatDate(rental.rental_date),
      return_date: formatDate(rental.return_date),
      rental_amount: String(rental.rental_amount),
      deposit_amount: String(rental.deposit_amount),
      cleaning_charge: String(rental.cleaning_charge)
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Submit form handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (formMode === 'create') {
      const newOrder = {
        ...formData,
        id: Math.floor(100000 + Math.random() * 900000),
        created_at: new Date().toISOString()
      };
      dbMock.addOrder(newOrder);
    } else {
      dbMock.updateOrder(formData);
    }
    
    setIsFormModalOpen(false);
    fetchAllData();
  };

  // Delete rental handler
  const handleDeleteRental = (id) => {
    if (!window.confirm('Are you sure you want to delete this order? This will also log this deletion in the audit records.')) return;
    dbMock.deleteOrder(id);
    fetchAllData();
  };

  // Open View Details Modal
  const handleOpenViewModal = (rental) => {
    setSelectedRental(rental);
    setIsViewModalOpen(true);
  };

  // Export rentals to CSV
  const handleExportRentalsCSV = () => {
    if (rentals.length === 0) {
      alert('No rentals available to export');
      return;
    }

    const headers = [
      'Rental ID', 'Customer Name', 'Phone', 'Email', 'Occasion', 
      'Garment Name', 'Category', 'Size', 'Rental Date', 'Return Date', 
      'Rental Amount ($)', 'Deposit Amount ($)', 'Cleaning Charge ($)', 'Status'
    ];

    const rows = rentals.map(r => [
      r.id,
      `"${r.customer_name.replace(/"/g, '""')}"`,
      r.phone,
      r.email,
      `"${r.occasion.replace(/"/g, '""')}"`,
      `"${r.saree_name.replace(/"/g, '""')}"`,
      r.saree_category,
      r.size,
      new Date(r.rental_date).toLocaleDateString(),
      new Date(r.return_date).toLocaleDateString(),
      r.rental_amount,
      r.deposit_amount,
      r.cleaning_charge,
      r.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jyothi_Reddy_Boutique_Rentals_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export reports to CSV
  const handleExportReportsCSV = () => {
    if (!reportsData) {
      alert('Reports data not loaded');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';

    // Section 1: Revenue Summaries
    csvContent += 'REVENUE REPORT\n';
    csvContent += 'Daily Revenue (Past 7 Days)\n';
    csvContent += 'Date,Revenue ($),Rentals Count\n';
    reportsData.dailyRevenue.forEach(d => {
      csvContent += `${d.label},${d.revenue},${d.rentals}\n`;
    });

    csvContent += '\nWeekly Revenue (Past 4 Weeks)\n';
    csvContent += 'Week,Revenue ($)\n';
    reportsData.weeklyRevenue.forEach(w => {
      csvContent += `${w.label},${w.revenue}\n`;
    });

    csvContent += '\nMonthly Revenue (Past 6 Months)\n';
    csvContent += 'Month,Revenue ($)\n';
    reportsData.monthlyRevenue.forEach(m => {
      csvContent += `${m.label},${m.revenue}\n`;
    });

    // Section 2: Rentals counts
    csvContent += '\nRENTAL STATUS SUMMARY\n';
    csvContent += 'Status,Count\n';
    csvContent += `Active,${reportsData.totals.activeRentals}\n`;
    csvContent += `Returned,${reportsData.totals.returnedRentals}\n`;
    csvContent += `Overdue,${reportsData.totals.overdueRentals}\n`;
    csvContent += `Pending,${reportsData.totals.pendingRentals}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jyothi_Reddy_Boutique_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  // Quick helper to format currency
  const formatCurrency = (val) => {
    return '$' + parseFloat(val || 0).toFixed(2);
  };

  return (
    <div className="admin-portal-container">
      {/* Title block */}
      <div className="section-header">
        <div>
          <h2>Rental System & Occasion Styling Management</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Track your boutique inventories, customers, return statuses, and business reports.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>
            ◀ Back to Boutique Shop
          </button>
          <button className="btn-secondary" onClick={onLogout} style={{ borderColor: 'var(--accent-coral)' }}>
            🚪 Logout
          </button>
          <button className="btn-primary" onClick={handleOpenCreateModal}>
            ➕ New Order
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </button>
        <button className={`admin-tab-btn ${activeTab === 'rentals' ? 'active' : ''}`} onClick={() => setActiveTab('rentals')}>
          🛍️ Manage Orders
        </button>
        <button className={`admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          📈 Reports & Charts
        </button>
        <button className={`admin-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
          🔔 Notifications {notifications.length > 0 && <span className="cart-count-badge" style={{ display: 'inline-flex', verticalAlign: 'middle', width: '20px', height: '20px', fontSize: '0.7rem', marginLeft: '6px' }}>{notifications.length}</span>}
        </button>
        <button className={`admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          📜 Audit Trail
        </button>
        <button className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          ⚙️ Settings Rules
        </button>
      </div>

      {/* STAT CARDS ROW */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Total Orders</span>
          <span className="stat-card-value">{isLoading ? '...' : summary.totalRentals}</span>
          <span className="stat-card-icon">📂</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-mustard)' }}>
          <span className="stat-card-label">Shipped Orders</span>
          <span className="stat-card-value" style={{ color: '#906d00' }}>{isLoading ? '...' : summary.activeRentals}</span>
          <span className="stat-card-icon">⏳</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-sage)' }}>
          <span className="stat-card-label">Delivered Orders</span>
          <span className="stat-card-value" style={{ color: '#3f5933' }}>{isLoading ? '...' : summary.returnedRentals}</span>
          <span className="stat-card-icon">✓</span>
        </div>
        <div className="stat-card overdue">
          <span className="stat-card-label">Cancelled Orders</span>
          <span className="stat-card-value">{isLoading ? '...' : summary.overdueRentals}</span>
          <span className="stat-card-icon">🚨</span>
        </div>
        <div className="stat-card revenue">
          <span className="stat-card-label">Total Revenue</span>
          <span className="stat-card-value">{isLoading ? '...' : formatCurrency(summary.totalRevenue)}</span>
          <span className="stat-card-icon">💰</span>
        </div>
      </div>

      {/* TABS CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="fadeIn">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
            {/* Quick overview dashboard */}
            <div className="report-summary-box">
              <h3>Quick Controls</h3>
              <p>Welcome to the Jyothi Reddy Boutique back-office admin system. From here you can check off shipped orders, update boutique rules, print invoices, and view sales statistics.</p>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button className="btn-primary" onClick={() => setActiveTab('rentals')}>
                  🛍️ Go to Orders List
                </button>
                <button className="btn-secondary" onClick={() => setActiveTab('reports')}>
                  📈 Check Revenue Reports
                </button>
              </div>

              <div className="stitched-divider" style={{ margin: '30px 0 20px 0' }}></div>
              
              <h4 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 12px 0' }}>Active Shipments Overview</h4>
              {isLoading ? (
                <div>
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                </div>
              ) : rentals.filter(r => r.status === 'Active').length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No active shipments currently.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Item</th>
                        <th>Est. Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentals.filter(r => r.status === 'Active').slice(0, 5).map(r => (
                        <tr key={r.id}>
                          <td>#{r.id}</td>
                          <td><strong>{r.customer_name}</strong></td>
                          <td>{r.saree_name}</td>
                          <td><span style={{ color: new Date(r.return_date) < new Date() ? 'red' : 'inherit' }}>{new Date(r.return_date).toLocaleDateString()}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent audit logs */}
            <div className="report-summary-box">
              <h3>Recent System Logs</h3>
              {isLoading ? (
                <div>
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                  <div className="skeleton-row"></div>
                </div>
              ) : auditLogs.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No logs recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {auditLogs.slice(0, 6).map(l => (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-cozy)', paddingBottom: '8px', fontSize: '0.88rem' }}>
                      <div>
                        <span className="audit-log-badge">Rental #{l.rental_id || 'System'}</span>
                        <span style={{ marginLeft: '8px', color: 'var(--text-primary)' }}>{l.action}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  <button className="btn-secondary" style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('audit')}>
                    View All Audit Trails
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. RENTALS CRUD TAB */}
      {activeTab === 'rentals' && (
        <div className="fadeIn">
          {/* Filters */}
          <div className="filters-bar">
            <div className="search-input-wrapper">
              <span className="icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search by name, occasion, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="filter-select-wrapper">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Active">Shipped</option>
                <option value="Returned">Delivered</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Cancelled</option>
              </select>
            </div>

            <div className="filter-date-wrapper">
              <span>Dates:</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span>to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <button className="btn-secondary" onClick={handleClearFilters}>
              Reset
            </button>

            <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={handleExportRentalsCSV}>
              📥 Export CSV
            </button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px' }}>
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
            </div>
          ) : rentals.length === 0 ? (
            <div className="empty-state card">
              <span className="empty-state-icon">🧵</span>
              <h3>No orders found.</h3>
              <p>Try clearing filters or register a new order.</p>
              <button className="btn-primary" onClick={handleOpenCreateModal}>
                Create First Order
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Details</th>
                    <th>Occasion</th>
                    <th>Item Details</th>
                    <th>Order & Delivery Dates</th>
                    <th>Financials</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map(r => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>
                        <div>
                          <strong>{r.customer_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.phone}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.email}</div>
                        </div>
                      </td>
                      <td>{r.occasion}</td>
                      <td>
                        <div>
                          <strong>{r.saree_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category: {r.saree_category} | Size: {r.size}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>Order: {new Date(r.rental_date).toLocaleDateString()}</div>
                          <div>Est: {new Date(r.return_date).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>Subtotal: {formatCurrency(r.rental_amount)}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tax: {formatCurrency(r.deposit_amount)}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${r.status.toLowerCase()}`}>
                          {r.status === 'Active' ? 'Shipped' : r.status === 'Returned' ? 'Delivered' : r.status === 'Overdue' ? 'Cancelled' : r.status}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn-icon" title="View details & Timeline" onClick={() => handleOpenViewModal(r)}>
                            👁️
                          </button>
                          <button className="btn-icon" title="Edit rental details" onClick={() => handleOpenEditModal(r)}>
                            ✏️
                          </button>
                          <button className="btn-icon delete" title="Delete rental" onClick={() => handleDeleteRental(r.id)}>
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. REPORTS TAB (WITH CHART.JS CHARTS) */}
      {activeTab === 'reports' && (
        <div className="fadeIn">
          <div className="section-header">
            <h3>Revenue Reports & Distribution Analytics</h3>
            <button className="btn-secondary" onClick={handleExportReportsCSV}>
              📥 Export Reports CSV
            </button>
          </div>

          {reportsData ? (
            <div className="reports-grid">
              {/* Summary Lists */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="report-summary-box">
                  <h3>Revenue Summary</h3>
                  <div className="detail-row">
                    <span>Daily Revenue (Past 7 days)</span>
                    <strong>{formatCurrency(reportsData.dailyRevenue.reduce((a, b) => a + b.revenue, 0))}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Weekly Revenue (Past 4 weeks)</span>
                    <strong>{formatCurrency(reportsData.weeklyRevenue.reduce((a, b) => a + b.revenue, 0))}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Monthly Revenue (Past 6 months)</span>
                    <strong>{formatCurrency(reportsData.monthlyRevenue.reduce((a, b) => a + b.revenue, 0))}</strong>
                  </div>
                </div>

                <div className="report-summary-box">
                  <h3>Order Volumes by Status</h3>
                  <div className="detail-row">
                    <span>Shipped Orders</span>
                    <span>{reportsData.totals.activeRentals}</span>
                  </div>
                  <div className="detail-row">
                    <span>Delivered Orders</span>
                    <span>{reportsData.totals.returnedRentals}</span>
                  </div>
                  <div className="detail-row">
                    <span>Cancelled Orders</span>
                    <span style={{ color: 'red', fontWeight: 'bold' }}>{reportsData.totals.overdueRentals}</span>
                  </div>
                  <div className="detail-row">
                    <span>Pending Orders</span>
                    <span>{reportsData.totals.pendingRentals}</span>
                  </div>
                </div>
              </div>

              {/* Charts Panel using Chart.js */}
              <div className="reports-charts-container">
                {/* A. REVENUE LINE CHART */}
                <div className="chart-card">
                  <h4>Revenue Trend (Monthly)</h4>
                  <div style={{ height: '220px', position: 'relative' }}>
                    <canvas ref={revenueChartRef}></canvas>
                  </div>
                </div>

                {/* B. RENTAL TREND BAR CHART */}
                <div className="chart-card">
                  <h4>Daily Rental Volumes (Past 7 Days)</h4>
                  <div style={{ height: '220px', position: 'relative' }}>
                    <canvas ref={volumeChartRef}></canvas>
                  </div>
                </div>

                {/* C. STATUS DISTRIBUTION */}
                <div className="chart-card">
                  <h4>Status Distribution</h4>
                  <div style={{ height: '220px', position: 'relative' }}>
                    <canvas ref={distributionChartRef}></canvas>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>Loading reports charts data...</p>
          )}
        </div>
      )}

      {/* 4. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="fadeIn">
          <div className="notifications-panel">
            <h3 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 16px 0', borderBottom: '1px dashed var(--border-cozy)', paddingBottom: '12px' }}>
              System Alerts
            </h3>
            
            {notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <span style={{ fontSize: '2.5rem' }}>🎉</span>
                <h4 style={{ margin: '12px 0 0 0' }}>No pending alerts!</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem' }}>All returns are up-to-date and there are no overdue accounts.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map(alert => (
                  <div key={alert.id} className={`alert-item ${alert.type}`}>
                    <div className="alert-icon-badge">
                      {alert.type === 'danger' ? '🚨' : alert.type === 'warning' ? '⏳' : '✨'}
                    </div>
                    <div className="alert-text-content">
                      <h4 className="alert-title">{alert.title}</h4>
                      <p className="alert-desc">{alert.desc}</p>
                      <div className="alert-time">
                        Recorded/Due: {new Date(alert.time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. AUDIT TRAIL TAB */}
      {activeTab === 'audit' && (
        <div className="fadeIn">
          <div className="section-header">
            <h3>Audit Action History Logs</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Tracks rental additions, editing, deletions, and status transitions.</p>
          </div>

          {isLoading ? (
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px' }}>
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <p>No audit trail logs recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Rental Reference</th>
                    <th>Action Actioned</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(l => (
                    <tr key={l.id}>
                      <td>#{l.id}</td>
                      <td>
                        {l.rental_id ? (
                          <span className="audit-log-badge" style={{ cursor: 'pointer' }} onClick={() => {
                            // Find rental in lists to view
                            const r = rentals.find(x => x.id === l.rental_id);
                            if (r) handleOpenViewModal(r);
                            else alert(`Rental ID #${l.rental_id} no longer exists.`);
                          }}>
                            Rental Contract #{l.rental_id}
                          </span>
                        ) : (
                          <span className="audit-log-badge" style={{ background: 'rgba(217, 83, 79, 0.1)', color: '#d9534f' }}>
                            Deleted Rental Reference
                          </span>
                        )}
                      </td>
                      <td><strong>{l.action}</strong></td>
                      <td>{new Date(l.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. SYSTEM CONFIGURATION RULES TAB */}
      {activeTab === 'settings' && (
        <div className="fadeIn">
          <div className="settings-card">
            <h3 style={{ fontFamily: 'var(--font-serif)', margin: '0 0 12px 0', borderBottom: '1px dashed var(--border-cozy)', paddingBottom: '12px' }}>
              ⚙️ System Rules Configuration
            </h3>
            <p className="settings-description">
              Adjust default rules for boutique rental calculations. These variables govern automatic pricing during new rental creations and customer checkouts.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              setIsSavingRules(true);
              dbMock.saveRules(systemRules);
              alert('Boutique configurations saved successfully!');
              setIsSavingRules(false);
            }} className="settings-form-grid">
              
              <div className="admin-form-group">
                <label>Flat Shipping Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={systemRules.rental_fee_default}
                  onChange={(e) => setSystemRules(prev => ({ ...prev, rental_fee_default: e.target.value }))}
                  required
                  style={{ border: '2px solid var(--text-primary)', borderRadius: '8px' }}
                />
              </div>

              <div className="admin-form-group">
                <label>Tax Rate (decimal, e.g., 0.08 = 8%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={systemRules.deposit_percent_default}
                  onChange={(e) => setSystemRules(prev => ({ ...prev, deposit_percent_default: e.target.value }))}
                  required
                  style={{ border: '2px solid var(--text-primary)', borderRadius: '8px' }}
                />
              </div>

              <div className="admin-form-group">
                <label>Free Shipping Minimum Threshold ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={systemRules.cleaning_charge_default}
                  onChange={(e) => setSystemRules(prev => ({ ...prev, cleaning_charge_default: e.target.value }))}
                  required
                  style={{ border: '2px solid var(--text-primary)', borderRadius: '8px' }}
                />
              </div>

              <div className="admin-form-group">
                <label>Default Delivery Dispatch Window (Days)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={systemRules.rental_period_default}
                  onChange={(e) => setSystemRules(prev => ({ ...prev, rental_period_default: e.target.value }))}
                  required
                  style={{ border: '2px solid var(--text-primary)', borderRadius: '8px' }}
                />
              </div>

              <div className="admin-form-group">
                <label>Default WhatsApp Inquiry Number (with country code, e.g., +916309571931)</label>
                <input
                  type="text"
                  value={systemRules.whatsapp_number_default || ''}
                  onChange={(e) => setSystemRules(prev => ({ ...prev, whatsapp_number_default: e.target.value }))}
                  required
                  style={{ border: '2px solid var(--text-primary)', borderRadius: '8px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }} disabled={isSavingRules}>
                {isSavingRules ? 'Saving Settings...' : '💾 Save Configurations'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* FORM MODAL (CREATE / EDIT RENTAL) */}
      {isFormModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsFormModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{formMode === 'create' ? 'Register New Rental Contract' : `Edit Rental Contract #${formData.id}`}</h3>
              <button className="close-cart-btn" onClick={() => setIsFormModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  {/* Customer name */}
                  <div className="admin-form-group">
                    <label>Customer Name *</label>
                    <input 
                      type="text" 
                      name="customer_name" 
                      value={formData.customer_name} 
                      onChange={handleInputChange} 
                      className={formErrors.customer_name ? 'error' : ''} 
                    />
                    {formErrors.customer_name && <p className="error-text">{formErrors.customer_name}</p>}
                  </div>

                  {/* Phone */}
                  <div className="admin-form-group">
                    <label>Phone Number *</label>
                    <input 
                      type="text" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="+34 600 000 000"
                      className={formErrors.phone ? 'error' : ''} 
                    />
                    {formErrors.phone && <p className="error-text">{formErrors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div className="admin-form-group">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      placeholder="customer@example.com"
                      className={formErrors.email ? 'error' : ''} 
                    />
                    {formErrors.email && <p className="error-text">{formErrors.email}</p>}
                  </div>

                  {/* Occasion */}
                  <div className="admin-form-group">
                    <label>Occasion *</label>
                    <input 
                      type="text" 
                      name="occasion" 
                      value={formData.occasion} 
                      onChange={handleInputChange} 
                      placeholder="Wedding, Gala, Party, etc."
                      className={formErrors.occasion ? 'error' : ''} 
                    />
                    {formErrors.occasion && <p className="error-text">{formErrors.occasion}</p>}
                  </div>

                  {/* Saree Name */}
                  <div className="admin-form-group">
                    <label>Garment / Design Name *</label>
                    <input 
                      type="text" 
                      name="saree_name" 
                      value={formData.saree_name} 
                      onChange={handleInputChange} 
                      placeholder="Emerald Silk Blouse, Crimson Linen Dress, etc."
                      className={formErrors.saree_name ? 'error' : ''} 
                    />
                    {formErrors.saree_name && <p className="error-text">{formErrors.saree_name}</p>}
                  </div>

                  {/* Saree Category */}
                  <div className="admin-form-group">
                    <label>Category</label>
                    <select name="saree_category" value={formData.saree_category} onChange={handleInputChange}>
                      <option value="Blouses">Blouses</option>
                      <option value="Dresses">Dresses</option>
                    </select>
                  </div>

                  {/* Size */}
                  <div className="admin-form-group">
                    <label>Size</label>
                    <select name="size" value={formData.size} onChange={handleInputChange}>
                      <option value="S">Small (S)</option>
                      <option value="M">Medium (M)</option>
                      <option value="L">Large (L)</option>
                      <option value="OS">One Size (OS)</option>
                    </select>
                  </div>

                  {/* Status (Only in edit, or defaults to active) */}
                  <div className="admin-form-group">
                    <label>Order Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="Active">Shipped</option>
                      <option value="Returned">Delivered</option>
                      <option value="Pending">Pending</option>
                      <option value="Overdue">Cancelled</option>
                    </select>
                  </div>

                  {/* Rental Date */}
                  <div className="admin-form-group">
                    <label>Order Date *</label>
                    <input 
                      type="date" 
                      name="rental_date" 
                      value={formData.rental_date} 
                      onChange={handleInputChange} 
                      className={formErrors.rental_date ? 'error' : ''} 
                    />
                    {formErrors.rental_date && <p className="error-text">{formErrors.rental_date}</p>}
                  </div>

                  {/* Return Date */}
                  <div className="admin-form-group">
                    <label>Est. Delivery Date *</label>
                    <input 
                      type="date" 
                      name="return_date" 
                      value={formData.return_date} 
                      onChange={handleInputChange} 
                      className={formErrors.return_date ? 'error' : ''} 
                    />
                    {formErrors.return_date && <p className="error-text">{formErrors.return_date}</p>}
                  </div>

                  {/* Rental Amount */}
                  <div className="admin-form-group">
                    <label>Subtotal ($) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="rental_amount" 
                      value={formData.rental_amount} 
                      onChange={handleInputChange} 
                      className={formErrors.rental_amount ? 'error' : ''} 
                    />
                    {formErrors.rental_amount && <p className="error-text">{formErrors.rental_amount}</p>}
                  </div>

                  {/* Deposit Amount */}
                  <div className="admin-form-group">
                    <label>Tax Amount ($) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="deposit_amount" 
                      value={formData.deposit_amount} 
                      onChange={handleInputChange} 
                      className={formErrors.deposit_amount ? 'error' : ''} 
                    />
                    {formErrors.deposit_amount && <p className="error-text">{formErrors.deposit_amount}</p>}
                  </div>

                  {/* Cleaning Charge */}
                  <div className="admin-form-group">
                    <label>Shipping Charge ($) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="cleaning_charge" 
                      value={formData.cleaning_charge} 
                      onChange={handleInputChange} 
                      className={formErrors.cleaning_charge ? 'error' : ''} 
                    />
                    {formErrors.cleaning_charge && <p className="error-text">{formErrors.cleaning_charge}</p>}
                  </div>
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsFormModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {formMode === 'create' ? 'Save Order' : 'Update Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* DETAIL VIEW MODAL (RENTAL DETAILS, PAYMENT, TIMELINE, PRINT) */}
      {isViewModalOpen && selectedRental && (
        <div className="admin-modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="admin-modal wide print-only-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Order Invoice & Shipping Details (Order #{selectedRental.id})</h3>
              <button className="close-cart-btn" onClick={() => setIsViewModalOpen(false)}>×</button>
            </div>
            
            <div className="admin-modal-body">
              <div className="detail-grid">
                
                {/* Info Blocks */}
                <div>
                  <div className="detail-section">
                    <h4>Customer Information</h4>
                    <div className="detail-row">
                      <span>Customer Name:</span>
                      <span>{selectedRental.customer_name}</span>
                    </div>
                    <div className="detail-row">
                      <span>Phone Contact:</span>
                      <span>{selectedRental.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span>Email Contact:</span>
                      <span>{selectedRental.email}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Garment Details</h4>
                    <div className="detail-row">
                      <span>Garment/Design:</span>
                      <span>{selectedRental.saree_name}</span>
                    </div>
                    <div className="detail-row">
                      <span>Category:</span>
                      <span>{selectedRental.saree_category}</span>
                    </div>
                    <div className="detail-row">
                      <span>Size Dimension:</span>
                      <span>{selectedRental.size}</span>
                    </div>
                    <div className="detail-row">
                      <span>Occasion Wear:</span>
                      <span>{selectedRental.occasion}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Pricing & Payments</h4>
                    <div className="detail-row">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedRental.rental_amount)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Shipping Charge:</span>
                      <span>{formatCurrency(selectedRental.cleaning_charge)}</span>
                    </div>
                    <div className="detail-row" style={{ borderBottom: '1px dashed #ccc', paddingBottom: '6px' }}>
                      <span>Tax Amount:</span>
                      <span>{formatCurrency(selectedRental.deposit_amount)}</span>
                    </div>
                    <div className="detail-row" style={{ fontSize: '1.05rem', fontWeight: 'bold', paddingTop: '6px' }}>
                      <span>Total Amount Billed:</span>
                      <span>{formatCurrency(parseFloat(selectedRental.rental_amount) + parseFloat(selectedRental.cleaning_charge) + parseFloat(selectedRental.deposit_amount))}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline and History */}
                <div>
                  <div className="detail-section">
                    <h4>Order Status & Shipping Timeline</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <span>Current Status:</span>
                      <span className={`status-badge ${selectedRental.status.toLowerCase()}`}>
                        {selectedRental.status === 'Active' ? 'Shipped' : selectedRental.status === 'Returned' ? 'Delivered' : selectedRental.status === 'Overdue' ? 'Cancelled' : selectedRental.status}
                      </span>
                    </div>

                    <div className="timeline-container">
                      <div className="timeline-item completed">
                        <div className="timeline-marker"></div>
                        <h5 className="timeline-title">Order Placed</h5>
                        <span className="timeline-date">{new Date(selectedRental.created_at || selectedRental.rental_date).toLocaleString()}</span>
                      </div>
                      
                      <div className={`timeline-item ${selectedRental.status !== 'Pending' ? 'completed' : 'active'}`}>
                        <div className="timeline-marker"></div>
                        <h5 className="timeline-title">Package Shipped</h5>
                        <span className="timeline-date">Shipped On: {new Date(selectedRental.rental_date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className={`timeline-item ${selectedRental.status === 'Overdue' ? 'active' : selectedRental.status === 'Returned' ? 'completed' : ''}`}>
                        <div className="timeline-marker"></div>
                        <h5 className="timeline-title">Estimated Delivery</h5>
                        <span className="timeline-date">Est. Date: {new Date(selectedRental.return_date).toLocaleDateString()}</span>
                      </div>
                      
                      {selectedRental.status === 'Returned' && (
                        <div className="timeline-item completed">
                          <div className="timeline-marker"></div>
                          <h5 className="timeline-title">Successfully Delivered</h5>
                          <span className="timeline-date">Arrival Confirmed</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Admin Quick Actions</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedRental.status === 'Pending' && (
                        <button className="btn-primary" style={{ background: 'var(--accent-mustard)', borderColor: 'var(--text-primary)', color: 'var(--text-primary)' }} onClick={() => {
                          const updated = { ...selectedRental, status: 'Active' };
                          dbMock.updateOrder(updated);
                          setSelectedRental(updated);
                          fetchAllData();
                        }}>
                          ✓ Mark Shipped
                        </button>
                      )}
                      
                      {selectedRental.status === 'Active' && (
                        <button className="btn-primary" style={{ background: 'var(--accent-sage)', borderColor: 'var(--text-primary)' }} onClick={() => {
                          const updated = { ...selectedRental, status: 'Returned' };
                          dbMock.updateOrder(updated);
                          setSelectedRental(updated);
                          fetchAllData();
                        }}>
                          ✓ Mark Delivered
                        </button>
                      )}

                      {(selectedRental.status === 'Pending' || selectedRental.status === 'Active') && (
                        <button className="btn-secondary" style={{ borderColor: 'red', color: 'red' }} onClick={() => {
                          if (window.confirm("Are you sure you want to cancel this order?")) {
                            const updated = { ...selectedRental, status: 'Overdue' };
                            dbMock.updateOrder(updated);
                            setSelectedRental(updated);
                            fetchAllData();
                          }
                        }}>
                          ❌ Cancel Order
                        </button>
                      )}
                      
                      {(selectedRental.status === 'Returned' || selectedRental.status === 'Overdue') && (
                        <button className="btn-secondary" onClick={() => {
                          const updated = { ...selectedRental, status: 'Pending' };
                          dbMock.updateOrder(updated);
                          setSelectedRental(updated);
                          fetchAllData();
                        }}>
                          ↩ Reopen to Pending
                        </button>
                      )}

                      <button className="btn-secondary" onClick={handlePrintReceipt}>
                        🖨️ Print Invoice
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="admin-modal-footer">
              <button className="btn-secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
