import React, { useState, useEffect, useRef } from 'react';
import { database } from '../utils/database';
import { 
  Lock, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Settings, 
  Package, 
  DollarSign,
  Check,
  X,
  Volume2,
  Trash2,
  Phone,
  Clock,
  LogOut,
  BellRing
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
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'inventory', 'settings'
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const prevOrdersCount = useRef(0);

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

  // Load database values
  const loadAdminData = () => {
    const currentOrders = database.getOrders();
    setOrders(currentOrders);
    setProducts(database.getProducts());
    setToppings(database.getToppings());
    
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

    // If orders count increases and audio is enabled, play chime!
    if (prevOrdersCount.current > 0 && currentOrders.length > prevOrdersCount.current) {
      if (audioEnabled) {
        playOrderChime();
        // Visual alert or toast could be added here
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
      
      // First chime (Note E5)
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

      // Second chime (Note A5, slightly delayed)
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
      console.warn('Web Audio Playback blocked by browser policy until user click', e);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === 'zohar123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('zohar_admin_authed', 'true');
      setAuthError('');
      // Auto-trigger audio context activation
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

  // Toggle order state
  const handleUpdateStatus = (orderId, newStatus) => {
    database.updateOrderStatus(orderId, newStatus);
  };

  // Toggle inventory
  const handleToggleProduct = (id) => {
    database.toggleProductStock(id);
  };

  const handleToggleTopping = (id) => {
    database.toggleToppingStock(id);
  };

  // Save admin settings
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

  // Enable audio system manually
  const enableAudioFeedback = () => {
    setAudioEnabled(true);
    playOrderChime();
  };

  // Statistics Calculations
  const completedOrders = orders.filter(o => o.status === 'Completed');
  const activeOrdersList = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing');
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
        <div className="admin-logo">
          🍦 Zohar Admin
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
              className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              <span>Shop Settings</span>
            </button>
          </li>
        </ul>

        {/* Audio Ring Switch */}
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
        {/* Header bar */}
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

        {/* Dashboard Analytics Widgets (Only on Orders/Home) */}
        {activeTab === 'orders' && (
          <div className="admin-stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Revenue (Completed)</div>
              <div className="stat-value">₦{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-label">Pending / Preparing</div>
              <div className="stat-value">{activeOrdersList.length} Orders</div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-label">Completed Orders</div>
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
                                📍 {order.deliveryAddress}
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
                          <td style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            ₦{order.total.toLocaleString()}
                          </td>
                          <td>
                            <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '')}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                              {order.status === 'Pending' && (
                                <button 
                                  className="btn btn-primary"
                                  onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                                >
                                  Start Preparing 🍳
                                </button>
                              )}
                              {(order.status === 'Preparing' || order.status === 'Out for Delivery') && (
                                <button 
                                  className="btn"
                                  onClick={() => handleUpdateStatus(order.id, 'Completed')}
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--color-secondary)', color: 'white' }}
                                >
                                  Mark Completed ✓
                                </button>
                              )}
                              {order.status === 'Preparing' && order.deliveryMethod === 'delivery' && (
                                <button 
                                  className="btn btn-outline"
                                  onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
                                >
                                  Dispatch Courier 🚀
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
              {/* Product Inventory */}
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '2px solid var(--color-primary-light)', paddingBottom: '8px' }}>
                  Menu Items Stock
                </h3>
                <div className="inventory-list">
                  {products.map(product => (
                    <div key={product.id} className="inventory-item">
                      <div className="inventory-info">
                        <h4>{product.name}</h4>
                        <p style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          {product.category.toUpperCase()}
                        </p>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={product.inStock} 
                          onChange={() => handleToggleProduct(product.id)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topping Inventory */}
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '2px solid var(--color-primary-light)', paddingBottom: '8px' }}>
                  Custom Parfait Toppings
                </h3>
                <div className="inventory-list">
                  {toppings.map(topping => (
                    <div key={topping.id} className="inventory-item">
                      <div className="inventory-info">
                        <h4>{topping.name}</h4>
                        <p style={{ fontWeight: 600, color: 'var(--color-accent-dark)' }}>
                          ₦{topping.price} / portion
                        </p>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={topping.inStock} 
                          onChange={() => handleToggleTopping(topping.id)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Store Configuration & Settings override */}
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
          </div>
        )}
      </main>
    </div>
  );
}
