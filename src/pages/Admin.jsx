import React, { useState, useEffect, useRef } from 'react';
import { database } from '../utils/database';
import { 
  Lock, 
  ShoppingBag, 
  Settings, 
  Package, 
  Volume2,
  Phone,
  LogOut,
  BellRing,
  Eye,
  X,
  Upload,
  Star
} from 'lucide-react';

export default function Admin({ onNavigateToStorefront }) {
  // Authentication State
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('zohar_admin_authed') === 'true'
  );
  const [authError, setAuthError] = useState('');

  // Dashboard Data State
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'inventory', 'reviews', 'settings'

  // Topping edit/add states
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState(null);
  const [toppingFormName, setToppingFormName] = useState('');
  const [toppingFormPrice, setToppingFormPrice] = useState(500);

  // Review add states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewFormName, setReviewFormName] = useState('');
  const [reviewFormRating, setReviewFormRating] = useState(5);
  const [reviewFormComment, setReviewFormComment] = useState('');
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const prevOrdersCount = useRef(0);

  // Modal view for payment screenshots
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Form states for settings
  const [whatsapp1, setWhatsapp1] = useState('');
  const [whatsapp2, setWhatsapp2] = useState('');
  const [opayNumber, setOpayNumber] = useState('');
  const [opayName, setOpayName] = useState('');
  const [opayBank, setOpayBank] = useState('');
  const [address, setAddress] = useState('');
  const [weekdayStart, setWeekdayStart] = useState('09:00');
  const [weekdayEnd, setWeekdayEnd] = useState('17:00');
  const [saturdayStart, setSaturdayStart] = useState('12:00');
  const [saturdayEnd, setSaturdayEnd] = useState('17:00');

  // Product edit/add states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('parfaits');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formPriceRegular, setFormPriceRegular] = useState(0);
  const [formPriceGreek, setFormPriceGreek] = useState(0);
  const [formPack6Price, setFormPack6Price] = useState(0);
  const [formPack12Price, setFormPack12Price] = useState(0);
  const [formHasBaseOptions, setFormHasBaseOptions] = useState(false);
  const [formHasPackOptions, setFormHasPackOptions] = useState(false);

  // Load database values
  const loadAdminData = () => {
    const currentOrders = database.getOrders();
    setOrders(currentOrders);
    setProducts(database.getProducts());
    setToppings(database.getToppings());
    setReviews(database.getReviews());
    
    const currentSettings = database.getSettings();
    setSettings(currentSettings);
    
    // Bind setting form values
    setWhatsapp1(currentSettings.whatsapp1);
    setWhatsapp2(currentSettings.whatsapp2);
    setOpayNumber(currentSettings.opayNumber);
    setOpayName(currentSettings.opayName);
    setOpayBank(currentSettings.opayBank);
    setAddress(currentSettings.address);
    setWeekdayStart(currentSettings.openHours.weekdays.start);
    setWeekdayEnd(currentSettings.openHours.weekdays.end);
    setSaturdayStart(currentSettings.openHours.saturday.start);
    setSaturdayEnd(currentSettings.openHours.saturday.end);

    // Play chime on new order
    if (prevOrdersCount.current > 0 && currentOrders.length > prevOrdersCount.current) {
      if (audioEnabled) {
        playOrderChime();
      }
    }
    prevOrdersCount.current = currentOrders.length;
  };

  useEffect(() => {
    loadAdminData();

    const handleUpdate = () => {
      loadAdminData();
    };

    window.addEventListener('zohar-db-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('zohar-db-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [audioEnabled]);

  // Audio double-chime synthesizer (Web Audio API)
  const playOrderChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.value = 659.25; // E5
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.value = 880.00; // A5
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.12);
      gain2.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.warn('Web Audio blocked', e);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === 'zohar123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('zohar_admin_authed', 'true');
      setAuthError('');
      setAudioEnabled(true);
      setTimeout(playOrderChime, 100);
    } else {
      setAuthError('Incorrect passcode. Try again!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('zohar_admin_authed');
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    database.updateOrderStatus(orderId, newStatus);
  };

  const handleToggleProduct = (id) => {
    database.toggleProductStock(id);
  };

  const handleToggleTopping = (id) => {
    database.toggleToppingStock(id);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const updatedSettings = {
      whatsapp1,
      whatsapp2,
      opayNumber,
      opayName,
      opayBank,
      address,
      openHours: {
        weekdays: { start: weekdayStart, end: weekdayEnd },
        saturday: { start: saturdayStart, end: saturdayEnd }
      }
    };
    database.saveSettings(updatedSettings);
    alert('Store configurations saved successfully!');
  };

  const handleClearOrders = () => {
    if (window.confirm("Are you sure you want to delete ALL order history? This cannot be undone.")) {
      database.clearAllOrders();
      alert("All order history cleared!");
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm("Are you sure you want to reset ALL configurations, settings, and stock levels to defaults? This will clear all data.")) {
      database.resetDatabase();
      window.location.reload();
    }
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setFormName(product.name || '');
    setFormCategory(product.category || 'parfaits');
    setFormDescription(product.description || '');
    setFormImage(product.image || '');
    setFormPrice(product.price || 0);
    setFormPriceRegular(product.priceRegular || 0);
    setFormPriceGreek(product.priceGreek || 0);
    setFormPack6Price(product.pack6Price || 0);
    setFormPack12Price(product.pack12Price || 0);
    setFormHasBaseOptions(product.hasBaseOptions || false);
    setFormHasPackOptions(product.hasPackOptions || false);
    setIsProductModalOpen(true);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('parfaits');
    setFormDescription('');
    setFormImage('/parfait_cup.jpg');
    setFormPrice(1000);
    setFormPriceRegular(1000);
    setFormPriceGreek(1500);
    setFormPack6Price(5000);
    setFormPack12Price(10000);
    setFormHasBaseOptions(false);
    setFormHasPackOptions(false);
    setIsProductModalOpen(true);
  };

  const handleProductFormSubmit = (e) => {
    e.preventDefault();
    const productData = {
      name: formName,
      category: formCategory,
      description: formDescription,
      image: formImage,
      price: Number(formPrice),
      priceRegular: Number(formPriceRegular),
      priceGreek: Number(formPriceGreek),
      pack6Price: Number(formPack6Price),
      pack12Price: Number(formPack12Price),
      hasBaseOptions: formHasBaseOptions,
      hasPackOptions: formHasPackOptions
    };

    if (editingProduct) {
      database.updateProduct({ id: editingProduct.id, ...productData });
      alert('Product updated successfully!');
    } else {
      database.addProduct(productData);
      alert('Product added successfully!');
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      database.deleteProduct(id);
      alert('Product deleted successfully!');
    }
  };

  // Topping Handlers
  const handleOpenAddTopping = () => {
    setEditingTopping(null);
    setToppingFormName('');
    setToppingFormPrice(500);
    setIsToppingModalOpen(true);
  };

  const handleOpenEditTopping = (topping) => {
    setEditingTopping(topping);
    setToppingFormName(topping.name || '');
    setToppingFormPrice(topping.price || 500);
    setIsToppingModalOpen(true);
  };

  const handleToppingFormSubmit = (e) => {
    e.preventDefault();
    if (editingTopping) {
      database.updateTopping({ id: editingTopping.id, name: toppingFormName, price: Number(toppingFormPrice) });
      alert('Topping updated successfully!');
    } else {
      database.addTopping({ name: toppingFormName, price: Number(toppingFormPrice) });
      alert('Topping added successfully!');
    }
    setIsToppingModalOpen(false);
  };

  const handleDeleteTopping = (id) => {
    if (window.confirm('Are you sure you want to delete this topping?')) {
      database.deleteTopping(id);
      alert('Topping deleted successfully!');
    }
  };

  // Review Handlers
  const handleOpenAddReview = () => {
    setReviewFormName('');
    setReviewFormRating(5);
    setReviewFormComment('');
    setIsReviewModalOpen(true);
  };

  const handleReviewFormSubmit = (e) => {
    e.preventDefault();
    database.addReview({
      name: reviewFormName,
      rating: Number(reviewFormRating),
      comment: reviewFormComment
    });
    alert('Review added successfully!');
    setIsReviewModalOpen(false);
  };

  const handleToggleReviewApproval = (id) => {
    database.toggleReviewApproval(id);
  };

  const handleDeleteReview = (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      database.deleteReview(id);
      alert('Review deleted!');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const enableAudioFeedback = () => {
    setAudioEnabled(true);
    playOrderChime();
  };

  const completedOrders = orders.filter(o => o.status === 'Completed');
  const activeOrdersList = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

  if (!isAuthenticated) {
    return (
      <div className="passcode-overlay">
        <div className="passcode-box">
          <div className="passcode-icon">
            <Lock size={32} />
          </div>
          <h3>Staff Dashboard</h3>
          <p>Please enter the staff passcode to access order management & inventory controls.</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••"
              className="passcode-input"
              maxLength={10}
              required
            />
            {authError && <div className="passcode-error">{authError}</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Verify Access
              </button>
              <button 
                type="button" 
                className="btn btn-text"
                onClick={onNavigateToStorefront}
              >
                Back to Shop
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.jpg" alt="Logo" style={{ height: '30px', width: '30px', borderRadius: '50%', objectFit: 'cover' }} /> Zohar Admin
        </div>

        <ul className="admin-nav">
          <li>
            <button 
              className={`admin-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingBag size={18} />
              <span>Incoming Orders</span>
            </button>
          </li>
          <li>
            <button 
              className={`admin-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Package size={18} />
              <span>Stock Control</span>
            </button>
          </li>
          <li>
            <button 
              className={`admin-nav-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <Star size={18} />
              <span>Customer Reviews</span>
            </button>
          </li>
          <li>
            <button 
              className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              <span>Shop Settings</span>
            </button>
          </li>
        </ul>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {audioEnabled ? (
            <div className="chime-indicator">
              <Volume2 size={16} />
              <span>Order ringers ACTIVE</span>
            </div>
          ) : (
            <button 
              className="btn btn-accent btn-sm" 
              onClick={enableAudioFeedback}
              style={{ width: '100%', fontSize: '11px', padding: '6px' }}
            >
              Enable Order Ringers 🔊
            </button>
          )}
        </div>

        <button 
          onClick={onNavigateToStorefront} 
          className="btn btn-outline"
          style={{ marginTop: '16px', color: 'white', borderColor: 'rgba(255,255,255,0.3)', width: '100%' }}
        >
          Customer View
        </button>

        <button 
          onClick={handleLogout} 
          className="btn btn-text"
          style={{ marginTop: '12px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main Panel Content Area */}
      <main className="admin-content">
        <div className="admin-header-row">
          <div>
            <h1 style={{ fontSize: '28px' }}>
              {activeTab === 'orders' && 'Live Orders Manager'}
              {activeTab === 'inventory' && 'Stock & Inventory Management'}
              {activeTab === 'settings' && 'Storefront Configurations'}
            </h1>
            <p style={{ color: 'var(--color-gray-dark)', fontSize: '14px' }}>
              {activeTab === 'orders' && 'Process customer orders and track kitchen status.'}
              {activeTab === 'inventory' && 'Mark parfaits, waffle options, and cup toppings as out of stock.'}
              {activeTab === 'settings' && 'Update OPay details, WhatsApp routing, and shop hours.'}
            </p>
          </div>
          
          {activeTab === 'orders' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-open" style={{ animation: 'none' }}>
                <BellRing size={14} /> Live Sync Active
              </span>
            </div>
          )}
        </div>

        {activeTab === 'orders' && (
          <div className="admin-stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Revenue (Completed)</div>
              <div className="stat-value">₦{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-label">Active Orders</div>
              <div className="stat-value">{activeOrdersList.length} Orders</div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-label">Completed Sales</div>
              <div className="stat-value">{completedOrders.length} Sales</div>
            </div>
          </div>
        )}

        {/* Tab 1: Orders Dashboard */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="glass" style={{ padding: '60px', borderRadius: '16px', textAlign: 'center', color: 'var(--color-gray-medium)' }}>
                <ShoppingBag size={48} style={{ margin: '0 auto 16px auto', display: 'block' }} />
                <h3>No orders placed yet.</h3>
                <p style={{ fontSize: '14px' }}>All client orders placed on the storefront will appear here instantly with chime sounds.</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Details</th>
                      <th>Delivery Type</th>
                      <th>Ordered Items</th>
                      <th>Receipt Screenshot</th>
                      <th>Total Amount</th>
                      <th>Status Badge</th>
                      <th>Control Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const orderDate = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <tr key={order.id}>
                          <td>
                            <span className="order-id-badge">{order.id}</span>
                            <div style={{ fontSize: '11px', color: 'var(--color-gray-medium)', marginTop: '2px' }}>{orderDate}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                            <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Phone size={10} />
                              <a href={`https://wa.me/${order.customerPhone.replace('+', '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
                                {order.customerPhone}
                              </a>
                            </div>
                          </td>
                          <td>
                            <div>{order.deliveryMethod === 'delivery' ? '🚀 Delivery' : '🏪 Pickup'}</div>
                            {order.deliveryMethod === 'delivery' && (
                              <div style={{ fontSize: '11px', color: 'var(--color-gray-dark)', maxWidth: '160px', marginTop: '4px' }}>
                                {order.deliveryAddress}
                              </div>
                            )}
                          </td>
                          <td>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                              {order.items.map((item, i) => (
                                <li key={i} style={{ fontSize: '13px', marginBottom: '6px' }}>
                                  <strong>{item.name}</strong> x{item.quantity}
                                  {item.options && (
                                    <div style={{ fontSize: '11px', color: 'var(--color-gray-dark)', fontStyle: 'italic', paddingLeft: '8px' }}>
                                      {item.options}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                            {order.notes && (
                              <div style={{ fontSize: '11px', backgroundColor: 'var(--color-cream)', padding: '6px', borderRadius: '4px', borderLeft: '3px solid var(--color-accent)', marginTop: '6px', maxWidth: '240px' }}>
                                <strong>Notes:</strong> {order.notes}
                              </div>
                            )}
                          </td>
                          <td>
                            {/* Receipt Proof Screenshot Button */}
                            {order.receiptImage ? (
                              <button 
                                type="button" 
                                className="btn btn-outline" 
                                onClick={() => setSelectedReceipt(order.receiptImage)}
                                style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={12} /> View Receipt
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--color-gray-medium)', fontStyle: 'italic' }}>No Receipt</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            ₦{order.total.toLocaleString()}
                          </td>
                          <td>
                            <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '')}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            {/* Upgraded linear status transitions flow */}
                            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                              {order.status === 'Pending' && (
                                <button 
                                  className="btn"
                                  onClick={() => handleUpdateStatus(order.id, 'Confirmed')}
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--color-accent)', color: 'var(--color-primary-dark)', fontWeight: 700 }}
                                >
                                  Confirm Payment ✓
                                </button>
                              )}
                              {order.status === 'Confirmed' && (
                                <button 
                                  className="btn btn-primary"
                                  onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                                >
                                  Start Preparing 🍳
                                </button>
                              )}
                              {order.status === 'Preparing' && (
                                <button 
                                  className="btn"
                                  onClick={() => handleUpdateStatus(order.id, 'Ready')}
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--color-secondary)', color: 'white', fontWeight: 700 }}
                                >
                                  Mark Ready 🚀
                                </button>
                              )}
                              {order.status === 'Ready' && (
                                <button 
                                  className="btn"
                                  onClick={() => handleUpdateStatus(order.id, 'Completed')}
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 700 }}
                                >
                                  Mark Completed ✓
                                </button>
                              )}
                              
                              {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                                <button 
                                  className="btn btn-text"
                                  onClick={() => handleUpdateStatus(order.id, 'Cancelled')}
                                  style={{ padding: '4px', fontSize: '10px', color: 'var(--color-danger)', textAlign: 'left' }}
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Inventory & Stock Status Switcher */}
        {activeTab === 'inventory' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid var(--color-primary-light)', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>
                    Menu Items Stock & Customization
                  </h3>
                  <button 
                    onClick={handleOpenAddProduct} 
                    className="btn btn-accent btn-sm"
                    style={{ fontSize: '12px', padding: '6px 12px', height: 'auto', width: 'auto' }}
                  >
                    Add Menu Item ➕
                  </button>
                </div>
                <div className="inventory-list">
                  {products.map(product => (
                    <div key={product.id} className="inventory-item" style={{ flexWrap: 'wrap', gap: '10px' }}>
                      <div className="inventory-info" style={{ minWidth: '150px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={product.image} alt="" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--color-gray-medium)' }} />
                          {product.name}
                        </h4>
                        <p style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '11px' }}>
                          {product.category.toUpperCase()}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleOpenEditProduct(product)}
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                        >
                          Edit ✏️
                        </button>
                        <button 
                          className="btn btn-text" 
                          onClick={() => handleDeleteProduct(product.id)}
                          style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--color-danger)' }}
                        >
                          Delete 🗑️
                        </button>
                        
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={product.inStock} 
                            onChange={() => handleToggleProduct(product.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid var(--color-primary-light)', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>
                    Custom Parfait Toppings
                  </h3>
                  <button 
                    onClick={handleOpenAddTopping} 
                    className="btn btn-accent btn-sm"
                    style={{ fontSize: '12px', padding: '6px 12px', height: 'auto', width: 'auto' }}
                  >
                    Add Extra Topping ➕
                  </button>
                </div>
                <div className="inventory-list">
                  {toppings.map(topping => (
                    <div key={topping.id} className="inventory-item" style={{ flexWrap: 'wrap', gap: '10px' }}>
                      <div className="inventory-info" style={{ minWidth: '130px' }}>
                        <h4>{topping.name}</h4>
                        <p style={{ fontWeight: 600, color: 'var(--color-accent-dark)', fontSize: '11px' }}>
                          ₦{topping.price} / portion
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleOpenEditTopping(topping)}
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
                        >
                          Edit ✏️
                        </button>
                        <button 
                          className="btn btn-text" 
                          onClick={() => handleDeleteTopping(topping.id)}
                          style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--color-danger)' }}
                        >
                          Delete 🗑️
                        </button>
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={topping.inStock} 
                            onChange={() => handleToggleTopping(topping.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Reviews Manager */}
        {activeTab === 'reviews' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '24px', color: 'var(--color-primary-dark)', margin: 0 }}>Customer Reviews</h2>
                <p style={{ color: 'var(--color-gray-dark)', fontSize: '13px', margin: 0 }}>Manage customer testimonials on your storefront catalog.</p>
              </div>
              <button 
                onClick={handleOpenAddReview} 
                className="btn btn-accent"
                style={{ padding: '10px 18px', fontSize: '13px', borderRadius: '8px' }}
              >
                Add Review ➕
              </button>
            </div>

            <div className="inventory-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {reviews.map(rev => (
                <div key={rev.id} className="glass" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--color-gray-medium)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '15px' }}>{rev.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--color-gray-dark)' }}>{rev.date}</span>
                    </div>
                    <div style={{ color: '#ffb703', marginBottom: '8px', fontSize: '14px' }}>
                      {'⭐'.repeat(rev.rating)} ({rev.rating}/5)
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-gray-dark)', fontStyle: 'italic', marginBottom: '16px' }}>
                      "{rev.comment}"
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-gray-light)', paddingTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={rev.isApproved} 
                        onChange={() => handleToggleReviewApproval(rev.id)}
                      />
                      <span>{rev.isApproved ? 'Visible on Storefront' : 'Hidden'}</span>
                    </label>
                    <button 
                      className="btn btn-text" 
                      onClick={() => handleDeleteReview(rev.id)}
                      style={{ color: 'var(--color-danger)', fontSize: '12px' }}
                    >
                      Delete 🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Store Configuration & Settings override */}
        {activeTab === 'settings' && (
          <div className="glass" style={{ padding: '32px', borderRadius: '16px', maxWidth: '700px' }}>
            <form onSubmit={handleSaveSettings} className="checkout-form">
              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--color-gray-light)', paddingBottom: '8px', marginBottom: '16px' }}>
                WhatsApp Contacts
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Primary WhatsApp Line *</label>
                  <input 
                    type="text" 
                    value={whatsapp1}
                    onChange={(e) => setWhatsapp1(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Secondary WhatsApp Line</label>
                  <input 
                    type="text" 
                    value={whatsapp2}
                    onChange={(e) => setWhatsapp2(e.target.value)}
                  />
                </div>
              </div>

              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--color-gray-light)', paddingBottom: '8px', marginBottom: '16px', marginTop: '24px' }}>
                Billing (OPay Transfer Accounts)
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label>OPay Account Number *</label>
                  <input 
                    type="text" 
                    value={opayNumber}
                    onChange={(e) => setOpayNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>OPay Bank Name</label>
                  <input 
                    type="text" 
                    value={opayBank}
                    onChange={(e) => setOpayBank(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>OPay Account Name *</label>
                <input 
                  type="text" 
                  value={opayName}
                  onChange={(e) => setOpayName(e.target.value)}
                  required
                />
              </div>

              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--color-gray-light)', paddingBottom: '8px', marginBottom: '16px', marginTop: '24px' }}>
                Opening Hours
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Monday - Friday Start Hour</label>
                  <input 
                    type="time" 
                    value={weekdayStart}
                    onChange={(e) => setWeekdayStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Monday - Friday End Hour</label>
                  <input 
                    type="time" 
                    value={weekdayEnd}
                    onChange={(e) => setWeekdayEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Saturday Start Hour</label>
                  <input 
                    type="time" 
                    value={saturdayStart}
                    onChange={(e) => setSaturdayStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Saturday End Hour</label>
                  <input 
                    type="time" 
                    value={saturdayEnd}
                    onChange={(e) => setSaturdayEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--color-gray-light)', paddingBottom: '8px', marginBottom: '16px', marginTop: '24px' }}>
                Store Location Details
              </h3>
              <div className="form-group">
                <label>Physical Store Address *</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="2"
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', marginTop: '20px' }}
              >
                Save Store Settings overrides
              </button>
            </form>

            <div style={{ marginTop: '36px', borderTop: '2px dashed #ff6b6b', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '18px', color: '#ff6b6b', marginBottom: '8px' }}>
                Danger Zone (Handover & Reset)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-gray-dark)', marginBottom: '16px' }}>
                Use these buttons to wipe demo/test data before handing the application over to the client.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={handleClearOrders}
                  className="btn"
                  style={{ backgroundColor: '#ff6b6b', color: 'white', fontSize: '13px', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear All Order History 🗑️
                </button>
                <button 
                  type="button" 
                  onClick={handleResetDatabase}
                  className="btn btn-outline"
                  style={{ borderColor: '#ff6b6b', color: '#ff6b6b', fontSize: '13px', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Reset Settings & Stock to Defaults 🔄
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL OVERLAY: FULL-SCREEN RECEIPT SCREENSHOT VIEWER */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)} style={{ zIndex: 99999 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '10px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', padding: '12px 16px' }}>
              <h4 style={{ fontSize: '16px' }}>Payment Receipt Proof</h4>
              <button className="modal-close" onClick={() => setSelectedReceipt(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: '12px', overflow: 'hidden', padding: '10px' }}>
              <img 
                src={selectedReceipt} 
                alt="OPay Payment Proof Screenshot" 
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--color-gray-medium)' }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY: PRODUCT EDIT / ADD FORM */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)} style={{ zIndex: 99998 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Menu Item ✏️' : 'Add New Menu Item ➕'}</h2>
              <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', padding: '20px' }}>
              <form onSubmit={handleProductFormSubmit} className="checkout-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="pName">Item Name *</label>
                  <input 
                    type="text" 
                    id="pName" 
                    required 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Strawberry Supreme" 
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="pCategory">Category *</label>
                    <select 
                      id="pCategory" 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{ padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-gray-medium)' }}
                    >
                      <option value="parfaits">Parfaits</option>
                      <option value="yoghurts">Bottled Yoghurts</option>
                      <option value="waffles">Waffles</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Picture (Upload or Link) *</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        id="product-image-upload"
                      />
                      <label 
                        htmlFor="product-image-upload"
                        className="btn btn-outline"
                        style={{ padding: '8px 12px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', margin: 0, whiteSpace: 'nowrap' }}
                      >
                        <Upload size={12} /> Upload File 📸
                      </label>
                      {formImage && (
                        <img 
                          src={formImage} 
                          alt="" 
                          style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--color-gray-medium)' }} 
                        />
                      )}
                    </div>
                    <input 
                      type="text" 
                      required
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="Or paste link: /parfait_cup.jpg"
                      style={{ marginTop: '6px', padding: '6px 10px', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="pDescription">Description / Ingredients *</label>
                  <textarea 
                    id="pDescription" 
                    required 
                    rows="3"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="List the ingredients and base details..."
                  ></textarea>
                </div>

                {formCategory === 'parfaits' && (
                  <div style={{ border: '1px solid var(--color-gray-medium)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--color-primary)' }}>Parfait Options & Pricing</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formHasBaseOptions}
                        onChange={(e) => setFormHasBaseOptions(e.target.checked)}
                      />
                      Enable Yoghurt Base Upgrades (Regular vs Greek)
                    </label>
                    {formHasBaseOptions ? (
                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Regular Base Price (₦) *</label>
                          <input 
                            type="number" 
                            required 
                            value={formPriceRegular}
                            onChange={(e) => setFormPriceRegular(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Greek Base Price (₦) *</label>
                          <input 
                            type="number" 
                            required 
                            value={formPriceGreek}
                            onChange={(e) => setFormPriceGreek(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>Flat Price (₦) *</label>
                        <input 
                          type="number" 
                          required 
                          value={formPrice}
                          onChange={(e) => { setFormPrice(e.target.value); setFormPriceRegular(e.target.value); }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {formCategory === 'yoghurts' && (
                  <div style={{ border: '1px solid var(--color-gray-medium)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--color-primary)' }}>Yoghurt Options & Bundles</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formHasPackOptions}
                        onChange={(e) => setFormHasPackOptions(e.target.checked)}
                      />
                      Enable Pack Pricing (Single, Pack 6, Pack 12)
                    </label>
                    <div className="form-group">
                      <label>Single Bottle Price (₦) *</label>
                      <input 
                        type="number" 
                        required 
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                      />
                    </div>
                    {formHasPackOptions && (
                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Pack 6 Price (₦) *</label>
                          <input 
                            type="number" 
                            required 
                            value={formPack6Price}
                            onChange={(e) => setFormPack6Price(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Pack 12 Price (₦) *</label>
                          <input 
                            type="number" 
                            required 
                            value={formPack12Price}
                            onChange={(e) => setFormPack12Price(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formCategory === 'waffles' && (
                  <div className="form-group">
                    <label>Waffle Flat Price (₦) *</label>
                    <input 
                      type="number" 
                      required 
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', marginTop: '12px' }}
                >
                  {editingProduct ? 'Save Changes ✓' : 'Add Product ➕'}
                </button>
              </form>
            </div>
           </div>
        </div>
      )}

      {/* MODAL OVERLAY: EXTRA TOPPING FORM */}
      {isToppingModalOpen && (
        <div className="modal-overlay" onClick={() => setIsToppingModalOpen(false)} style={{ zIndex: 99998 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>{editingTopping ? 'Edit Extra Topping ✏️' : 'Add Extra Topping ➕'}</h2>
              <button className="modal-close" onClick={() => setIsToppingModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <form onSubmit={handleToppingFormSubmit} className="checkout-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Topping Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={toppingFormName}
                    onChange={(e) => setToppingFormName(e.target.value)}
                    placeholder="e.g. Sliced Strawberries" 
                  />
                </div>
                <div className="form-group">
                  <label>Price per Portion (₦) *</label>
                  <input 
                    type="number" 
                    required 
                    value={toppingFormPrice}
                    onChange={(e) => setToppingFormPrice(e.target.value)}
                    placeholder="500" 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                  {editingTopping ? 'Save Changes ✓' : 'Add Topping ➕'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY: ADMIN ADD REVIEW FORM */}
      {isReviewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReviewModalOpen(false)} style={{ zIndex: 99998 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Add Customer Review ✍️</h2>
              <button className="modal-close" onClick={() => setIsReviewModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <form onSubmit={handleReviewFormSubmit} className="checkout-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={reviewFormName}
                    onChange={(e) => setReviewFormName(e.target.value)}
                    placeholder="e.g. Joy N." 
                  />
                </div>
                <div className="form-group">
                  <label>Rating *</label>
                  <select 
                    value={reviewFormRating}
                    onChange={(e) => setReviewFormRating(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--color-gray-medium)' }}
                  >
                    <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                    <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                    <option value={3}>3 Stars ⭐⭐⭐</option>
                    <option value={2}>2 Stars ⭐⭐</option>
                    <option value={1}>1 Star ⭐</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Review Comment *</label>
                  <textarea 
                    required 
                    rows="3"
                    value={reviewFormComment}
                    onChange={(e) => setReviewFormComment(e.target.value)}
                    placeholder="Customer testimonial..."
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                  Post Review 🚀
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
