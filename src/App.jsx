import { useState, useEffect } from 'react';
import { dbMock } from './dbMock';
import './App.css';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';

// Product images
import emeraldSilkBlouse from './assets/emerald_silk_blouse.png';
import indigoCottonDress from './assets/indigo_cotton_dress.png';
import ivoryLaceBlouse from './assets/ivory_lace_blouse.png';
import crimsonLinenDress from './assets/crimson_linen_dress.png';
import mustardGeorgetteBlouse from './assets/mustard_georgette_blouse.png';
import pinkOrganzaDress from './assets/pink_organza_dress.png';

// Mock Product Database
const PRODUCTS = [
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

function App() {
  // Navigation & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  // Selected Product for Details Modal
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);

  // Coupon / Discount State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code: string, discountType: 'percentage'|'fixed', value: number }
  const [couponError, setCouponError] = useState('');

  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [systemRules, setSystemRules] = useState({
    rental_fee_default: '5.99',
    deposit_percent_default: '0.08',
    cleaning_charge_default: '75.00',
    rental_period_default: '5'
  });

  // Load system rules from local DB
  useEffect(() => {
    setSystemRules(dbMock.getRules());
  }, []);

  // Checkout Modal Step Wizard
  // 0 = Close, 1 = Shipping Info, 2 = Simulated Payment, 3 = Order Success!
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [shippingForm, setShippingForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [simulatedOrderNum, setSimulatedOrderNum] = useState('');

  // Handle Cart Operations
  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prevCart; // Max stock reached
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    // Automatically slide cart open
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            const maxStock = item.product.stock;
            if (nextQty <= 0) return null;
            if (nextQty > maxStock) return item; // Can't exceed stock limit
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleWhatsAppInquiry = (product) => {
    const number = (systemRules.whatsapp_number_default || '+916309571931').replace(/[^\d+]/g, '');
    const message = `Hello Jyothi Reddy Boutique! I am interested in inquiring about this boutique design from your catalogue:
- *Name:* ${product.title} (ID: ${product.id})
- *Price:* $${product.price}
- *Fabric:* ${product.fabric}
- *Condition:* ${product.condition}
- *Availability:* ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}

Is it available for booking/purchase? Thanks!`;
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppBagInquiry = () => {
    if (cart.length === 0) return;
    const number = (systemRules.whatsapp_number_default || '+916309571931').replace(/[^\d+]/g, '');
    
    let itemsText = cart.map((item, idx) => {
      return `${idx + 1}. *${item.product.title}* (Qty: ${item.quantity}, Fabric: ${item.product.fabric}) - $${item.product.price * item.quantity}`;
    }).join('\n');
    
    const message = `Hello Jyothi Reddy Boutique! I would like to inquire about these items in my shopping bag:

${itemsText}

*Subtotal:* $${subtotal.toFixed(2)}
*Total (with shipping):* $${total.toFixed(2)}
${orderNote ? `*My Note:* "${orderNote}"` : ''}

Are these items available for booking/purchase?`;
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Cart Calculations
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = subtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.discountType === 'fixed') {
      discountAmount = Math.min(appliedCoupon.value, subtotal);
    }
  }
  
  const shippingFlatRate = parseFloat(systemRules.rental_fee_default || '5.99');
  const taxRate = parseFloat(systemRules.deposit_percent_default || '0.08');
  const shippingThreshold = parseFloat(systemRules.cleaning_charge_default || '75.00');

  const discountVal = discountAmount;
  const taxAmount = parseFloat(((subtotal - discountVal) * taxRate).toFixed(2));
  const shippingCost = (subtotal - discountVal) >= shippingThreshold || subtotal === 0 ? 0 : shippingFlatRate;
  const total = Math.max(0, subtotal - discountVal + taxAmount + shippingCost);

  // Apply Coupon Code
  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (code === 'JYOTHI10') {
      setAppliedCoupon({ code, discountType: 'percentage', value: 10 });
      setCouponError('');
      setCouponInput('');
    } else if (code === 'SLOWFASHION') {
      setAppliedCoupon({ code, discountType: 'fixed', value: 15 });
      setCouponError('');
      setCouponInput('');
    } else if (code === '') {
      setCouponError('Please enter a coupon code.');
    } else {
      setCouponError('Oops! That coupon is invalid.');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Filter Logic
  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.fabric.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSize = selectedSize === 'All' || product.size === selectedSize;
    const matchesCondition = selectedCondition === 'All' || product.condition === selectedCondition;

    return matchesSearch && matchesCategory && matchesSize && matchesCondition;
  });

  // Shipping & Payment validations
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateShipping = () => {
    const errors = {};
    if (!shippingForm.name.trim()) errors.name = 'Full name is required';
    if (!shippingForm.email.trim() || !/\S+@\S+\.\S+/.test(shippingForm.email)) {
      errors.email = 'A valid email is required';
    }
    if (!shippingForm.phone || !shippingForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{7,20}$/.test(shippingForm.phone.trim())) {
      errors.phone = 'Please enter a valid phone number (at least 7 digits)';
    }
    if (!shippingForm.address.trim()) errors.address = 'Shipping address is required';
    if (!shippingForm.city.trim()) errors.city = 'City is required';
    if (!shippingForm.zip.trim()) errors.zip = 'ZIP code is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitRentalFromCheckout = () => {
    const sareeName = cart.map(item => `${item.product.title} (Qty: ${item.quantity})`).join(', ');
    const sareeCategory = cart.map(item => item.product.category).join(', ');
    const size = cart.map(item => item.product.size).join(', ');
    
    const todayStr = new Date().toISOString().split('T')[0];
    const deliveryDate = new Date();
    const deliveryPeriod = parseInt(systemRules.rental_period_default || '5', 10);
    deliveryDate.setDate(deliveryDate.getDate() + deliveryPeriod);
    const deliveryDateStr = deliveryDate.toISOString().split('T')[0];
    
    const shippingFlatRate = parseFloat(systemRules.rental_fee_default || '5.99');
    const taxRate = parseFloat(systemRules.deposit_percent_default || '0.08');
    const shippingThreshold = parseFloat(systemRules.cleaning_charge_default || '75.00');

    const discountVal = discountAmount;
    const taxVal = parseFloat(((subtotal - discountVal) * taxRate).toFixed(2));
    const shippingFee = (subtotal - discountVal) >= shippingThreshold ? 0 : shippingFlatRate;

    const orderData = {
      id: Math.floor(100000 + Math.random() * 900000),
      customer_name: shippingForm.name,
      phone: shippingForm.phone || '+91 63095 71931',
      email: shippingForm.email,
      occasion: orderNote.trim() || 'General Purchase',
      saree_name: sareeName,
      saree_category: sareeCategory,
      size: size,
      rental_date: todayStr,
      return_date: deliveryDateStr,
      rental_amount: subtotal - discountVal,
      deposit_amount: taxVal,
      cleaning_charge: shippingFee,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    dbMock.addOrder(orderData);
  };

  const validatePayment = () => {
    const errors = {};
    if (!shippingForm.cardNumber.trim() || shippingForm.cardNumber.replace(/\s/g, '').length < 16) {
      errors.cardNumber = 'Card number must be 16 digits';
    }
    if (!shippingForm.expiry.trim() || !/^\d{2}\/\d{2}$/.test(shippingForm.expiry)) {
      errors.expiry = 'Expiry format MM/YY is required';
    }
    if (!shippingForm.cvv.trim() || shippingForm.cvv.length < 3) {
      errors.cvv = 'CVV code must be 3 or 4 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const triggerCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setCheckoutStep(1); // Go to step 1 (Shipping Info)
  };

  const handleNextStep = () => {
    if (checkoutStep === 1) {
      if (validateShipping()) {
        setCheckoutStep(2);
      }
    } else if (checkoutStep === 2) {
      if (validatePayment()) {
        // Submit rental to DB
        submitRentalFromCheckout();
        // Order Successful! Generate order number and jump to step 3.
        const orderNum = 'JR-' + Math.floor(100000 + Math.random() * 900000);
        setSimulatedOrderNum(orderNum);
        setCheckoutStep(3);
      }
    }
  };

  const handleCloseCheckout = () => {
    if (checkoutStep === 3) {
      // Clear cart on success
      setCart([]);
      setOrderNote('');
      removeCoupon();
    }
    setCheckoutStep(0);
    setShippingForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      zip: '',
      cardNumber: '',
      expiry: '',
      cvv: ''
    });
    setFormErrors({});
  };

  return (
    <div>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <span>✨ Designer Blouses & Bespoke Outfits. Free shipping over $75!</span>
        <span className="highlight">Each design is a unique, hand-crafted work of art.</span>
      </div>

      <div className="app-container">
        {/* Header Section */}
        <header className="site-header">
          <div className="header-top">
            <a href="/" className="brand-title" onClick={(e) => { e.preventDefault(); setSelectedCategory('All'); setSearchQuery(''); }}>
              Jyothi Reddy Boutique
              <span className="brand-subtitle">curated designer blouses & dresses</span>
            </a>

            {/* Search */}
            <div className="search-bar-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search blouses, dresses, fabrics, designers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            {/* Cart trigger */}
            <button
              className="cart-button-trigger"
              onClick={() => setIsCartOpen(true)}
              aria-label="Shopping Cart"
            >
              <span>🛒 Bag</span>
              <div className="cart-count-badge">{cartItemCount}</div>
            </button>

            {/* Admin Switcher */}
            <button
              className="cart-button-trigger"
              onClick={() => setIsAdminView(!isAdminView)}
              style={{
                marginLeft: '12px',
                borderColor: isAdminView ? 'var(--accent-coral)' : 'var(--text-primary)',
                background: isAdminView ? 'var(--accent-coral-light)' : 'var(--bg-card)'
              }}
            >
              <span>{isAdminView ? '👗 Boutique Shop' : '⚙️ Admin Portal'}</span>
            </button>
          </div>
        </header>

        {isAdminView ? (
          !isAdminLoggedIn ? (
            <AdminLogin
              onLoginSuccess={(token) => {
                setIsAdminLoggedIn(true);
                setAdminToken(token);
              }}
              onClose={() => setIsAdminView(false)}
            />
          ) : (
            <AdminDashboard
              onClose={() => setIsAdminView(false)}
              onLogout={() => {
                setIsAdminLoggedIn(false);
                setAdminToken('');
              }}
            />
          )
        ) : (
          <>
            {/* Philosophy Intro Card */}
            <section className="story-section hand-drawn-border">
          <div className="story-content">
            <h2>Our Slow Fashion Philosophy</h2>
            <p>
              At <strong>Jyothi Reddy Boutique</strong>, we believe every bespoke garment holds a heritage worth honoring. 
              We curate hand-crafted designer blouses, elegant occasion dresses, and custom tailored outfits, 
              preserving the legacy of premium Indian craftsmanship.
            </p>
            <p>
              By choosing curated and custom-made garments, you celebrate slow fashion, support artisans, and wear 
              a unique hand-crafted history. Styled in beauty and sustainability.
            </p>
          </div>
          <div className="story-stamp">
            <p className="story-stamp-title">100% Curated</p>
            <p className="story-stamp-sub">artisan designs</p>
          </div>
        </section>

        {/* Filter controls */}
        <section className="shop-controls">
          <div className="category-tabs">
            {['All', 'Blouses', 'Dresses'].map((cat) => (
              <button
                key={cat}
                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <div>
                <span className="filter-label">Size: </span>
                <select
                  className="filter-select"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <option value="All">All Sizes</option>
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                  <option value="OS">One Size (OS)</option>
                </select>
              </div>

              <div>
                <span className="filter-label">Condition: </span>
                <select
                  className="filter-select"
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                >
                  <option value="All">All Conditions</option>
                  <option value="Vintage Gem">Vintage Gem</option>
                  <option value="Gently Loved">Gently Loved</option>
                  <option value="Handmade New">Handmade New</option>
                  <option value="Upcycled Gem">Upcycled Gem</option>
                </select>
              </div>
            </div>

            <div className="results-count">
              Showing {filteredProducts.length} unique {filteredProducts.length === 1 ? 'piece' : 'pieces'}
            </div>
          </div>
        </section>

        {/* Product Catalog Grid */}
        <main>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '3rem' }}>🧵</span>
              <h3>No matching garments found.</h3>
              <p>Try resetting the search or category filters.</p>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const cartQty = cart.find(item => item.product.id === product.id)?.quantity || 0;
                const outOfStock = cartQty >= product.stock;

                return (
                  <article 
                    key={product.id} 
                    className="product-card hand-drawn-border-subtle"
                    onClick={() => setSelectedProductForDetails(product)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-image-wrapper">
                      <img src={product.image} alt={product.title} className="product-image" />
                      <span className="product-badge-condition">{product.condition}</span>
                      
                      {product.stock === 1 ? (
                        <span className="product-badge-stock">Only 1 Available!</span>
                      ) : (
                        <span className="product-badge-stock">{product.stock} in stock</span>
                      )}

                      <div className="hanging-price-tag">
                        <span className="hanging-price-val">${product.price}</span>
                      </div>
                    </div>

                    <div className="product-info">
                      <div className="product-title-row">
                        <h3 className="product-title">{product.title}</h3>
                      </div>
                      
                      <p className="product-description">{product.description}</p>
                      
                      <div className="product-meta-row">
                        <span className="meta-tag size">Size: {product.size}</span>
                        <span className="meta-tag fabric">{product.fabric}</span>
                      </div>

                      <button
                        className={`add-to-bag-btn ${outOfStock ? 'added' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!outOfStock) handleAddToCart(product);
                        }}
                        disabled={outOfStock}
                      >
                        {outOfStock ? '✓ In Your Bag' : 'Add to Bag'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
          </>
        )}
      </div>

      {/* Footer Section */}
      <footer className="site-footer">
        <div className="app-container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Jyothi Reddy Boutique</h3>
              <p>
                We curate, sew, mend, and ship our items from our home studio. 
                Our packaging is 100% compostable and made of recycled fibers.
              </p>
            </div>

            <div className="footer-links">
              <h4>Slow Fashion Resources</h4>
              <ul>
                <li><a href="https://fashionrevolution.org" target="_blank" rel="noopener noreferrer">Fashion Revolution</a></li>
                <li><a href="https://goodonyou.eco" target="_blank" rel="noopener noreferrer">Good On You Brand Ratings</a></li>
                <li><a href="#philosophy" onClick={(e) => e.preventDefault()}>Our Caring Guide</a></li>
                <li><a href="#custom" onClick={(e) => e.preventDefault()}>Custom Crochet Requests</a></li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4>Visit Our Studio</h4>
              <p>
                Calle de la Moda 108,<br />
                Boutique Barrio, CP 28004
              </p>
              <p>
                📧 hello@jyothireddyboutique.com<br />
                📞 +34 912 345 678
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Jyothi Reddy Boutique. Stitched together by hands, not assembly lines.</p>
            <div className="footer-socials">
              <a href="https://instagram.com" className="social-icon-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">📸</a>
              <a href="https://pinterest.com" className="social-icon-link" aria-label="Pinterest" target="_blank" rel="noopener noreferrer">📌</a>
              <a href="https://tiktok.com" className="social-icon-link" aria-label="TikTok" target="_blank" rel="noopener noreferrer">🎵</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Shopping Cart Drawer Side Panel */}
      <div 
        className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
      >
        <div 
          className="cart-drawer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cart-header">
            <h2>Your Shopping Bag ({cartItemCount})</h2>
            <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>×</button>
          </div>

          <div className="cart-items-container">
            {cart.length === 0 ? (
              <div className="empty-cart-view">
                <span className="empty-cart-icon">🧶</span>
                <p>Your bag is currently empty.</p>
                <button 
                  className="checkout-back-btn" 
                  style={{ borderRadius: '20px' }}
                  onClick={() => setIsCartOpen(false)}
                >
                  Start Browsing
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="cart-item">
                  <img src={item.product.image} alt={item.product.title} className="cart-item-image" />
                  <div className="cart-item-details">
                    <div>
                      <h4 className="cart-item-name">{item.product.title}</h4>
                      <div className="cart-item-meta">
                        Size: {item.product.size} | {item.product.condition}
                      </div>
                    </div>
                    
                    <div className="cart-item-qty-row">
                      <button 
                        className="qty-btn"
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      >
                        -
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock}
                        title={item.quantity >= item.product.stock ? "Maximum stock reached" : ""}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="cart-item-price-col">
                    <button 
                      className="remove-item-btn"
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                    <span className="cart-item-price">${item.product.price * item.quantity}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-footer">
              {/* Handwritten Order Note */}
              <div className="order-note-container">
                <label className="order-note-label">Include a handwritten note or gift request?</label>
                <textarea
                  className="order-note-textarea"
                  placeholder="Tell us if this is a gift, or request custom sewing alterations..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </div>

              {/* Summary prices */}
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Estimated Tax ({parseFloat(systemRules.deposit_percent_default || '0.08') * 100}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
              </div>

              <div className="summary-row total">
                <span>Total Amount</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="checkout-btn" onClick={triggerCheckout} style={{ width: '100%', padding: '12px', background: 'var(--accent-coral)', color: 'white', border: '2px solid var(--text-primary)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  🛍️ Secure Checkout
                </button>
                <button className="whatsapp-cart-inquire-btn" onClick={handleWhatsAppBagInquiry}>
                  💬 Inquire Bag via WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-step Checkout Wizard Modal */}
      {checkoutStep > 0 && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal">
            <div className="checkout-modal-header">
              <h3>Secure Checkout</h3>
              <button className="close-cart-btn" onClick={handleCloseCheckout}>×</button>
            </div>

            <div className="checkout-modal-body">
              {/* Checkout Progress Bar */}
              <div className="checkout-steps">
                <div className={`checkout-step-dot ${checkoutStep >= 1 ? 'active' : ''} ${checkoutStep > 1 ? 'completed' : ''}`}>1</div>
                <div className={`checkout-step-dot ${checkoutStep >= 2 ? 'active' : ''} ${checkoutStep > 2 ? 'completed' : ''}`}>2</div>
                <div className={`checkout-step-dot ${checkoutStep === 3 ? 'completed' : ''}`}>3</div>
              </div>

              {/* Step 1: Shipping Form */}
              {checkoutStep === 1 && (
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginTop: 0 }}>Shipping Address</h4>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      name="name"
                      value={shippingForm.name}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                    />
                    {formErrors.name && <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', margin: '4px 0 0' }}>{formErrors.name}</p>}
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      name="email"
                      value={shippingForm.email}
                      onChange={handleInputChange}
                      placeholder="jane@example.com"
                    />
                    {formErrors.email && <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', margin: '4px 0 0' }}>{formErrors.email}</p>}
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      name="phone"
                      value={shippingForm.phone}
                      onChange={handleInputChange}
                      placeholder="+34 600 000 000"
                    />
                    {formErrors.phone && <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', margin: '4px 0 0' }}>{formErrors.phone}</p>}
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      className="form-input"
                      name="address"
                      value={shippingForm.address}
                      onChange={handleInputChange}
                      placeholder="123 Cozy Lane"
                    />
                    {formErrors.address && <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', margin: '4px 0 0' }}>{formErrors.address}</p>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        className="form-input"
                        name="city"
                        value={shippingForm.city}
                        onChange={handleInputChange}
                        placeholder="Boutique Town"
                      />
                      {formErrors.city && <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', margin: '4px 0 0' }}>{formErrors.city}</p>}
                    </div>

                    <div className="form-group">
                      <label>ZIP / Postal Code</label>
                      <input
                        type="text"
                        className="form-input"
                        name="zip"
                        value={shippingForm.zip}
                        onChange={handleInputChange}
                        placeholder="12345"
                      />
                      {formErrors.zip && <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', margin: '4px 0 0' }}>{formErrors.zip}</p>}
                    </div>
                  </div>

                  <div className="checkout-action-row">
                    <button className="checkout-back-btn" onClick={() => setCheckoutStep(0)}>Cancel</button>
                    <button className="checkout-next-btn" onClick={handleNextStep}>Continue to Payment</button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment simulated form */}
              {checkoutStep === 2 && (
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginTop: 0 }}>Simulated Payment</h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Payment is simulated. Do not enter real credit card details.
                  </p>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Jane Doe"
                      defaultValue={shippingForm.name}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Card Number (16 digits)</label>
                    <input
                      type="text"
                      className="form-input"
                      name="cardNumber"
                      value={shippingForm.cardNumber}
                      onChange={handleInputChange}
                      placeholder="4000 1234 5678 9010"
                    />
                    {formErrors.cardNumber && <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', margin: '4px 0 0' }}>{formErrors.cardNumber}</p>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        className="form-input"
                        name="expiry"
                        value={shippingForm.expiry}
                        onChange={handleInputChange}
                        placeholder="12/28"
                      />
                      {formErrors.expiry && <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', margin: '4px 0 0' }}>{formErrors.expiry}</p>}
                    </div>

                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="password"
                        className="form-input"
                        name="cvv"
                        value={shippingForm.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="4"
                      />
                      {formErrors.cvv && <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', margin: '4px 0 0' }}>{formErrors.cvv}</p>}
                    </div>
                  </div>

                  <div className="checkout-action-row">
                    <button className="checkout-back-btn" onClick={() => setCheckoutStep(1)}>Back</button>
                    <button className="checkout-next-btn" onClick={handleNextStep}>Submit Order (${total.toFixed(2)})</button>
                  </div>
                </div>
              )}

              {/* Step 3: Success Screen */}
              {checkoutStep === 3 && (
                <div className="success-message-container">
                  <div className="success-icon-badge">✨</div>
                  <h4 className="success-title">Thank you, {shippingForm.name}!</h4>
                  <p className="success-order-num">{simulatedOrderNum}</p>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0 }}>
                    We've received your order! We'll carefully pack your pre-loved gems in recycled materials 
                    and ship them to:
                  </p>
                  
                  <div className="success-details-card">
                    <div className="success-details-row">
                      <strong>Ship To:</strong>
                      <span>{shippingForm.address}, {shippingForm.city}</span>
                    </div>
                    {orderNote && (
                      <div className="success-details-row" style={{ flexDirection: 'column', gap: '4px', borderTop: '1px dashed var(--border-cozy)', paddingTop: '8px', marginTop: '8px' }}>
                        <strong>Gift Note / Request:</strong>
                        <span style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.2rem', color: 'var(--accent-coral)' }}>"{orderNote}"</span>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--accent-sage)', fontWeight: '600' }}>
                    🌿 By buying pre-loved, you just saved carbon emissions equivalent to planting 3 trees!
                  </p>

                  <button className="success-close-btn" onClick={handleCloseCheckout}>
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProductForDetails && (
        <div className="details-modal-overlay" onClick={() => setSelectedProductForDetails(null)}>
          <div className="details-modal hand-drawn-border" onClick={(e) => e.stopPropagation()}>
            <button className="close-details-btn" onClick={() => setSelectedProductForDetails(null)}>×</button>
            <div className="details-modal-content">
              <div className="details-modal-image-wrapper">
                <img src={selectedProductForDetails.image} alt={selectedProductForDetails.title} className="details-modal-image" />
                <span className="details-badge-condition">{selectedProductForDetails.condition}</span>
              </div>
              <div className="details-modal-info">
                <span className="details-category">{selectedProductForDetails.category}</span>
                <h2 className="details-title">{selectedProductForDetails.title}</h2>
                <div className="details-price-tag">
                  <span>${selectedProductForDetails.price}</span>
                </div>
                
                <p className="details-description">{selectedProductForDetails.description}</p>
                
                <div className="details-meta-section">
                  <div className="details-meta-item">
                    <strong>Fabric:</strong>
                    <span>{selectedProductForDetails.fabric}</span>
                  </div>
                  <div className="details-meta-item">
                    <strong>Size:</strong>
                    <span>{selectedProductForDetails.size} Standard</span>
                  </div>
                  <div className="details-meta-item">
                    <strong>Availability:</strong>
                    <span className={selectedProductForDetails.stock > 0 ? "avail-in-stock" : "avail-out-stock"}>
                      {selectedProductForDetails.stock > 0 ? `${selectedProductForDetails.stock} Available` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
                
                <div className="details-actions">
                  <button 
                    className="whatsapp-inquire-btn"
                    onClick={() => handleWhatsAppInquiry(selectedProductForDetails)}
                  >
                    💬 Inquire via WhatsApp
                  </button>
                  
                  <button 
                    className={`details-add-btn ${cart.find(item => item.product.id === selectedProductForDetails.id)?.quantity >= selectedProductForDetails.stock ? 'added' : ''}`}
                    onClick={() => {
                      const cartQty = cart.find(item => item.product.id === selectedProductForDetails.id)?.quantity || 0;
                      if (cartQty < selectedProductForDetails.stock) {
                        handleAddToCart(selectedProductForDetails);
                      }
                    }}
                    disabled={cart.find(item => item.product.id === selectedProductForDetails.id)?.quantity >= selectedProductForDetails.stock}
                  >
                    {cart.find(item => item.product.id === selectedProductForDetails.id)?.quantity >= selectedProductForDetails.stock ? '✓ In Your Bag' : 'Add to Bag'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
