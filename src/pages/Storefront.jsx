import React, { useState, useEffect, useRef } from 'react';
import { database } from '../utils/database';
import Customizer from '../components/Customizer';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Clock, 
  MapPin, 
  MessageCircle, 
  ChevronRight, 
  Info,
  CheckCircle,
  Menu,
  X,
  CreditCard
} from 'lucide-react';

// Canvas-based Custom Confetti Particle Simulation (pure react + local canvas, zero dependencies)
function Confetti({ active }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrame;
    
    // Set fullscreen sizing
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    const colors = ['#f5b041', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#d4af37', '#e9828c'];
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: Math.random() * 4 - 2,
      speedY: Math.random() * 5 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 4 - 2
    }));
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
        
        if (p.y < canvas.height) {
          alive = true;
        }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      
      if (alive) {
        animationFrame = requestAnimationFrame(draw);
      }
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);
  
  if (!active) return null;
  return <canvas ref={canvasRef} className="confetti-canvas" />;
}

export default function Storefront({ onNavigateToAdmin }) {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('delivery'); // 'pickup', 'delivery'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Store status and settings state
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [settings, setSettings] = useState({});
  const [hoursDisplay, setHoursDisplay] = useState({});

  // Product configurations (for selectors in cards)
  const [productConfigs, setProductConfigs] = useState({});

  // Audio Pop synthesizer for clicking add-to-cart
  const playPopSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  };

  // Load initial database data
  const loadData = () => {
    setProducts(database.getProducts());
    setIsStoreOpen(database.isStoreOpen());
    setSettings(database.getSettings());
    setHoursDisplay(database.getHoursDisplay());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('zohar-db-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('zohar-db-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Initialize config states for product cards
  useEffect(() => {
    if (products.length > 0) {
      const configs = {};
      products.forEach(p => {
        configs[p.id] = {
          base: 'regular',
          pack: 'single'
        };
      });
      setProductConfigs(configs);
    }
  }, [products]);

  const handleConfigChange = (productId, key, value) => {
    playPopSound();
    setProductConfigs(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [key]: value
      }
    }));
  };

  // Add standard product to cart
  const handleAddToCart = (product) => {
    playPopSound();
    const config = productConfigs[product.id] || { base: 'regular', pack: 'single' };
    let itemName = product.name;
    let itemPrice = product.price;
    let itemOptions = '';

    if (product.hasBaseOptions) {
      const isGreek = config.base === 'greek';
      itemPrice = isGreek ? product.priceGreek : product.priceRegular;
      itemOptions = isGreek ? 'Greek Yoghurt Base' : 'Regular Yoghurt Base';
      itemName = `${product.name} (${isGreek ? 'Greek' : 'Regular'})`;
    } else if (product.hasPackOptions) {
      if (config.pack === 'pack6') {
        itemPrice = product.pack6Price;
        itemOptions = 'Pack of 6';
        itemName = `${product.name} (${itemOptions})`;
      } else if (config.pack === 'pack12') {
        itemPrice = product.pack12Price;
        itemOptions = 'Pack of 12';
        itemName = `${product.name} (${itemOptions})`;
      } else {
        itemPrice = product.price;
        itemOptions = 'Single Bottle';
      }
    }

    const cartId = `${product.id}-${config.base}-${config.pack}`;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.cartId === cartId);
      if (existingItem) {
        return prevCart.map(item => 
          item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, {
          cartId,
          productId: product.id,
          name: itemName,
          price: itemPrice,
          image: product.image,
          options: itemOptions,
          quantity: 1
        }];
      }
    });

    setIsCartOpen(true);
  };

  // Add custom parfait to cart
  const handleAddCustomToCart = (customItem) => {
    playPopSound();
    setCart(prevCart => {
      return [...prevCart, {
        cartId: customItem.id,
        productId: 'custom',
        name: customItem.name,
        price: customItem.price,
        image: customItem.image,
        options: customItem.options,
        quantity: 1,
        isCustom: true,
        customDetails: customItem.customDetails
      }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (cartId, delta) => {
    playPopSound();
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (cartId) => {
    playPopSound();
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = deliveryMethod === 'delivery' ? 1000 : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  // Handle Checkout Submit
  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const orderData = {
      customerName,
      customerPhone,
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : 'Store Pickup',
      notes,
      items: cart,
      subtotal: cartSubtotal,
      deliveryFee,
      total: cartTotal,
    };

    const savedOrder = database.createOrder(orderData);
    setSubmittedOrder(savedOrder);
    setCart([]); // Clear cart
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
  };

  // Generate WhatsApp message receipt
  const handleWhatsAppRedirect = () => {
    if (!submittedOrder) return;
    
    let message = `*ZOHAR GOURMET ORDER RECEIPT*\n`;
    message += `-------------------------------\n`;
    message += `*Order ID:* ${submittedOrder.id}\n`;
    message += `*Customer Name:* ${submittedOrder.customerName}\n`;
    message += `*WhatsApp Number:* ${submittedOrder.customerPhone}\n`;
    message += `*Delivery Type:* ${submittedOrder.deliveryMethod === 'delivery' ? '🚀 Delivery' : '🏪 Pickup'}\n`;
    
    if (submittedOrder.deliveryMethod === 'delivery') {
      message += `*Address:* ${submittedOrder.deliveryAddress}\n`;
    }
    if (submittedOrder.notes) {
      message += `*Order Notes:* ${submittedOrder.notes}\n`;
    }
    message += `-------------------------------\n`;
    message += `*ITEMS ORDERED:*\n`;
    
    submittedOrder.items.forEach((item, index) => {
      message += `${index + 1}. *${item.name}* (x${item.quantity})\n`;
      if (item.options) {
        message += `   _Details: ${item.options}_\n`;
      }
      message += `   _Price: ₦${(item.price * item.quantity).toLocaleString()}_\n`;
    });
    
    message += `-------------------------------\n`;
    message += `*Subtotal:* ₦${submittedOrder.subtotal.toLocaleString()}\n`;
    if (submittedOrder.deliveryFee > 0) {
      message += `*Delivery Fee:* ₦${submittedOrder.deliveryFee.toLocaleString()}\n`;
    }
    message += `*TOTAL AMOUNT:* ₦${submittedOrder.total.toLocaleString()}\n`;
    message += `-------------------------------\n`;
    message += `*PAYMENT STATUS:* Pending OPay Transfer Confirmation\n`;
    message += `_OPay Account: ${settings.opayNumber} (${settings.opayName})_\n`;
    message += `Please find my attached payment receipt screenshot below.`;

    const encodedText = encodeURIComponent(message);
    const whatsappNum = settings.whatsapp1 ? settings.whatsapp1.replace('+', '') : '2348121040943';
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
    setIsSuccessOpen(false);
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div>
      {/* Interactive Background Blobs */}
      <div className="bg-blobs-container">
        <div className="floating-blob blob-1"></div>
        <div className="floating-blob blob-2"></div>
        <div className="floating-blob blob-3"></div>
      </div>

      {/* Confetti Explosion Component */}
      <Confetti active={isSuccessOpen} />

      {/* Dynamic Header / Navbar */}
      <header className="header glass">
        <div className="container header-container">
          <a href="#" className="logo-link">
            <span className="logo-emoji">🍦</span>
            <span>Zohar<span className="logo-gold">Gourmet</span></span>
          </a>
          
          <ul className="nav-links">
            <li><a href="#menu" className="nav-link active">Our Menu</a></li>
            <li><a href="#about" className="nav-link">About Us</a></li>
            <li><a href="#guide" className="nav-link">Guide & FAQs</a></li>
            <li><a href="#contact" className="nav-link">Contact</a></li>
          </ul>

          <div className="header-actions">
            {isStoreOpen ? (
              <span className="badge badge-open">
                <Clock size={14} /> Open Now
              </span>
            ) : (
              <span className="badge badge-closed">
                <Clock size={14} /> Closed
              </span>
            )}

            <button className="cart-icon-btn" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag size={20} />
              {cart.length > 0 && <span className="cart-badge">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="anim-fade-in">
            <div className="hero-tag">Gourmet Treats & Yoghurt</div>
            <h1 className="hero-title">
              Craft Your Own <br />
              <span className="text-gold">Heavenly Parfait</span>
            </h1>
            <p className="hero-desc">
              Experience the premium layers of rich, creamy Greek yogurt, fresh fruits, crunchy granola, and toasted nuts. Customizable just the way you like it!
            </p>
            <div className="hero-ctas">
              <button className="btn btn-accent" onClick={() => setIsCustomizerOpen(true)}>
                Build Your Own Cup 🍨
              </button>
              <a href="#menu" className="btn btn-outline">
                Explore Menu
              </a>
            </div>
          </div>

          <div className="hero-image-container anim-float">
            <div className="hero-circle-bg"></div>
            {/* Real client 4 yogurt bottles image */}
            <img 
              src="/yogurt_bottles_4.jpg" 
              alt="Premium Zohar Yogurt Bottles" 
              className="hero-main-img" 
            />
            <div className="hero-floating-card">
              <span className="floating-avatar">🍓</span>
              <div className="floating-card-info">
                <h4>Fresh Ingredients</h4>
                <p>100% Organic & Healthy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Store Closed Banner Warning */}
      {!isStoreOpen && (
        <div style={{ backgroundColor: 'var(--color-strawberry-light)', borderY: '1px solid var(--color-strawberry)', padding: '16px 0', color: 'var(--color-primary-dark)', textAlign: 'center' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <Info size={16} color="var(--color-danger)" />
            <span>We are currently closed. You can still order, and we will prepare and deliver it as soon as we open!</span>
          </div>
        </div>
      )}

      {/* Product Catalog Section */}
      <section id="menu" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Indulge in Our Menu</h2>
            <p>Freshly prepared parfaits, natural probiotic yoghurts, and crisp golden waffles.</p>
          </div>

          {/* Category Tabs */}
          <div className="menu-tabs">
            <button 
              className={`menu-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => { playPopSound(); setActiveCategory('all'); }}
            >
              All Delights
            </button>
            <button 
              className={`menu-tab ${activeCategory === 'parfaits' ? 'active' : ''}`}
              onClick={() => { playPopSound(); setActiveCategory('parfaits'); }}
            >
              Parfaits
            </button>
            <button 
              className={`menu-tab ${activeCategory === 'yoghurts' ? 'active' : ''}`}
              onClick={() => { playPopSound(); setActiveCategory('yoghurts'); }}
            >
              Bottled Yoghurts
            </button>
            <button 
              className={`menu-tab ${activeCategory === 'waffles' ? 'active' : ''}`}
              onClick={() => { playPopSound(); setActiveCategory('waffles'); }}
            >
              Waffles
            </button>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {/* Custom Parfait Visual Card Trigger */}
            {activeCategory === 'all' || activeCategory === 'parfaits' ? (
              <div className="product-card" style={{ border: '2px dashed var(--color-accent)' }}>
                <div className="product-img-wrapper">
                  {/* Real client parfait cup image */}
                  <img 
                    src="/parfait_cup.jpg" 
                    alt="Custom Parfait Creator" 
                    className="product-img"
                  />
                  <div className="product-tag" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary-dark)' }}>Custom</div>
                </div>
                <div className="product-info">
                  <h3 className="product-title">Build Your Own Parfait</h3>
                  <p className="product-desc">
                    Unleash your creativity! Choose your cup size (330ml, 500ml, 1L), select a yogurt base, and stack premium toppings.
                  </p>
                  <div className="product-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                    <div className="product-price">
                      <span className="price-label">Starts from</span>
                      <span className="price-amount">₦1,200</span>
                    </div>
                    <button className="btn btn-accent btn-sm" onClick={() => setIsCustomizerOpen(true)}>
                      Customize 🎨
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {filteredProducts.map(product => {
              const config = productConfigs[product.id] || { base: 'regular', pack: 'single' };
              const isOutOfStock = !product.inStock;

              let displayPrice = product.price;
              if (product.hasBaseOptions) {
                displayPrice = config.base === 'greek' ? product.priceGreek : product.priceRegular;
              } else if (product.hasPackOptions) {
                displayPrice = config.pack === 'pack6' 
                  ? product.pack6Price 
                  : config.pack === 'pack12' 
                    ? product.pack12Price 
                    : product.price;
              }

              return (
                <div key={product.id} className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
                  <div className="product-img-wrapper">
                    <img src={product.image} alt={product.name} className="product-img" />
                    {isOutOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}
                    {!isOutOfStock && product.category === 'waffles' && <div className="product-tag">Fresh Baked</div>}
                    {!isOutOfStock && product.category === 'yoghurts' && <div className="product-tag">Healthy</div>}
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-title">{product.name}</h3>
                    <p className="product-desc">{product.description}</p>
                    
                    {!isOutOfStock && product.hasBaseOptions && (
                      <div style={{ marginBottom: '16px' }}>
                        <div className="price-label" style={{ marginBottom: '6px' }}>Select Yoghurt Base</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className={`btn ${config.base === 'regular' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => handleConfigChange(product.id, 'base', 'regular')}
                            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '15px' }}
                          >
                            Regular
                          </button>
                          <button 
                            className={`btn ${config.base === 'greek' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => handleConfigChange(product.id, 'base', 'greek')}
                            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '15px' }}
                          >
                            Greek Base
                          </button>
                        </div>
                      </div>
                    )}

                    {!isOutOfStock && product.hasPackOptions && (
                      <div style={{ marginBottom: '16px' }}>
                        <div className="price-label" style={{ marginBottom: '6px' }}>Select Bundle Option</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button 
                            className={`btn ${config.pack === 'single' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => handleConfigChange(product.id, 'pack', 'single')}
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '12px' }}
                          >
                            Single Bottle
                          </button>
                          <button 
                            className={`btn ${config.pack === 'pack6' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => handleConfigChange(product.id, 'pack', 'pack6')}
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '12px' }}
                          >
                            Pack of 6
                          </button>
                          <button 
                            className={`btn ${config.pack === 'pack12' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => handleConfigChange(product.id, 'pack', 'pack12')}
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '12px' }}
                          >
                            Pack of 12
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="product-footer">
                      <div className="product-price">
                        <span className="price-label">Price</span>
                        <span className="price-amount">₦{displayPrice.toLocaleString()}</span>
                      </div>
                      <button 
                        className="btn-card-add" 
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(product)}
                        title="Add to Cart"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About & Info Section */}
      <section id="about" className="section section-bg-cream">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '56px', alignItems: 'center' }}>
          <div>
            {/* Real client waffles stack image */}
            <img 
              src="/waffles.jpg" 
              alt="Golden Waffles Stack" 
              className="anim-float"
              style={{ width: '100%', height: '380px', objectFit: 'cover', borderRadius: '24px', boxShadow: 'var(--shadow-md)', border: '5px solid white' }}
            />
          </div>
          <div>
            <div className="hero-tag">Handcrafted Gourmet</div>
            <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Freshly Whipped, <br />Lovingly Layered</h2>
            <p style={{ color: 'var(--color-gray-dark)', marginBottom: '24px' }}>
              At Zohar Gourmet, we craft the finest probiotic yogurts and parfait cups in Umuahia. Our ingredients are sourced fresh daily—from sweet hand-picked grapes to premium roasted cashews and crunchy high-fiber granola. Paired with our golden, crispy waffles, we promise an explosion of taste and pure nutrition in every serving!
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <CheckCircle size={20} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '15px' }}>Probiotic Rich</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-gray-dark)' }}>Healthy active gut bacteria cultures.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <CheckCircle size={20} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '15px' }}>Premium Toppings</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-gray-dark)' }}>Gourmet roasted cashew, almond, coconut shavings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gourmet Guide & FAQs (Docs Section) */}
      <section id="guide" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Gourmet Guide & FAQs</h2>
            <p>Everything you need to know about our premium probiotic yoghurts and delivery policies.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: '20px' }}>
            {/* Guide column */}
            <div className="glass" style={{ padding: '32px', borderRadius: 'var(--border-radius-md)' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🥛 Probiotic Yoghurt Guide
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-gray-dark)', marginBottom: '16px' }}>
                Not all yoghurts are created equal! Here is a simple comparison to help you choose the perfect base for your parfait cup:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--color-gray-light)' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--color-primary)' }}>Regular Probiotic Yoghurt</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-gray-dark)' }}>
                    Lighter in consistency, smooth, and naturally rich in active probiotic cultures. It has a mild, refreshing tang that pairs beautifully with crunchy granola and fresh grapes.
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', color: 'var(--color-primary)' }}>Gourmet Greek Yoghurt</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-gray-dark)' }}>
                    Strained multiple times to remove excess whey, resulting in a thick, velvety texture. It is packed with double the protein, has lower lactose levels, and offers a luxurious, premium mouthfeel.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQs column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '16px', color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
                  🚀 How does the OPay + WhatsApp checkout work?
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--color-gray-dark)' }}>
                  Simply choose your treats, head to checkout, and note our OPay account details. Send the bank transfer, submit your order on our site, and click "Send Receipt". This opens a pre-filled WhatsApp message where you can attach your receipt screenshot!
                </p>
              </div>
              
              <div style={{ borderTop: '1px solid var(--color-gray-light)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '16px', color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
                  📍 Where do you deliver within Umuahia?
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--color-gray-dark)' }}>
                  We offer swift delivery all across Umuahia, including Ify Jones Junction, Afara Majestic, and surrounding residential zones for a flat fee of ₦1,000. You can also pick up for free at our physical location.
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--color-gray-light)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '16px', color: 'var(--color-primary-dark)', marginBottom: '6px' }}>
                  🎉 Do you support bulk orders or party catering?
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--color-gray-dark)' }}>
                  Yes! We cater for birthdays, weddings, school programs, and corporate events. We offer bulk pricing on our 6-packs and 12-packs. Message us directly on WhatsApp to get a custom quote.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sliding Sidebar Cart Drawer */}
      <div className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="cart-header">
            <h2><ShoppingBag /> My Cart</h2>
            <button className="btn-close-cart" onClick={() => setIsCartOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="cart-body">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag className="cart-empty-icon" />
                <p>Your cart is looking empty.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setIsCartOpen(false)}>
                  Browse Delights
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.cartId} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                  <div className="cart-item-details">
                    <h4 className="cart-item-name">{item.name}</h4>
                    {item.options && <div className="cart-item-options">{item.options}</div>}
                    
                    <div className="cart-item-actions">
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => updateCartQty(item.cartId, -1)}><Minus size={12} /></button>
                        <span className="qty-val">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateCartQty(item.cartId, 1)}><Plus size={12} /></button>
                      </div>
                      <span className="cart-item-price">₦{(item.price * item.quantity).toLocaleString()}</span>
                      <button className="cart-item-remove" onClick={() => removeFromCart(item.cartId)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₦{cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="cart-summary-row">
                <span>Delivery Option</span>
                <span style={{ fontWeight: 600 }}>{deliveryMethod === 'delivery' ? '₦1,000 (Flat Delivery)' : 'Free Pickup'}</span>
              </div>
              <div className="cart-total-row">
                <span>Total Amount</span>
                <span>₦{cartTotal.toLocaleString()}</span>
              </div>
              <button 
                className="btn btn-primary btn-checkout"
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Parfait Customizer */}
      {isCustomizerOpen && (
        <div className="modal-overlay" onClick={() => setIsCustomizerOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🍧 Create Your Signature Cup</h2>
              <button className="modal-close" onClick={() => setIsCustomizerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <Customizer 
                onAddToCart={handleAddCustomToCart}
                onClose={() => setIsCustomizerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Checkout */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Checkout Order</h2>
              <button className="modal-close" onClick={() => setIsCheckoutOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                <div className="form-group">
                  <label htmlFor="cName">Your Full Name *</label>
                  <input 
                    type="text" 
                    id="cName" 
                    required 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cPhone">WhatsApp Number *</label>
                  <input 
                    type="tel" 
                    id="cPhone" 
                    required 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +2348121040943" 
                  />
                </div>

                <div className="form-group">
                  <label>Delivery Method *</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button"
                      className={`btn ${deliveryMethod === 'delivery' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => { playPopSound(); setDeliveryMethod('delivery'); }}
                      style={{ flex: 1, borderRadius: '8px', padding: '10px' }}
                    >
                      🚀 Delivery (₦1,000)
                    </button>
                    <button 
                      type="button"
                      className={`btn ${deliveryMethod === 'pickup' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => { playPopSound(); setDeliveryMethod('pickup'); }}
                      style={{ flex: 1, borderRadius: '8px', padding: '10px' }}
                    >
                      🏪 Store Pickup (Free)
                    </button>
                  </div>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div className="form-group">
                    <label htmlFor="cAddress">Delivery Address *</label>
                    <textarea 
                      id="cAddress" 
                      required 
                      rows="3"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Street address, apartment info, landmark in Umuahia"
                    ></textarea>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="cNotes">Special Requests / Ingredient Removals</label>
                  <input 
                    type="text" 
                    id="cNotes" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. No apple shavings, extra spoon" 
                  />
                </div>

                {/* Manual OPay Payment Details */}
                <div className="billing-details-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CreditCard size={18} color="var(--color-primary)" />
                    <h4 className="billing-details-title">Bank Transfer Details (OPay)</h4>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-gray-dark)', marginBottom: '8px' }}>
                    Please make a transfer of *₦{cartTotal.toLocaleString()}* to our OPay account below. Click 'Confirm Order' when done to message us on WhatsApp with receipt.
                  </p>
                  <div className="billing-grid">
                    <span className="billing-label">Bank Name:</span>
                    <span className="billing-val">{settings.opayBank || 'OPay'}</span>
                    
                    <span className="billing-label">Account No:</span>
                    <span className="billing-val">{settings.opayNumber || '8121040943'}</span>
                    
                    <span className="billing-label">Account Name:</span>
                    <span className="billing-val">{settings.opayName || 'Zohar Gourmet'}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px', marginTop: '10px' }}
                >
                  Confirm & Submit Order (₦{cartTotal.toLocaleString()})
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Success Order / Send WhatsApp */}
      {isSuccessOpen && submittedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ color: 'var(--color-secondary)', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <CheckCircle size={64} />
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Order Submitted!</h3>
              <p style={{ color: 'var(--color-gray-dark)', fontSize: '14px', marginBottom: '24px' }}>
                Your order <span className="order-id-badge">{submittedOrder.id}</span> has been logged. Let's send the invoice and receipt screenshot to us on WhatsApp to finalize preparation!
              </p>

              <button 
                className="btn btn-primary"
                onClick={handleWhatsAppRedirect}
                style={{ width: '100%', padding: '14px', backgroundColor: '#25D366', borderColor: '#25D366' }}
              >
                <MessageCircle size={18} /> Send Receipt to WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <footer id="contact" className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <h3>Zohar Gourmet</h3>
            <p>Premium handcrafted parfait cups, natural probiotic yoghurts, and delicious golden waffles.</p>
            <div className="social-links">
              <a href="https://instagram.com/Zohar_gourmet" target="_blank" rel="noreferrer" className="social-link" title="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://tiktok.com/@Zohar.gourmet" target="_blank" rel="noreferrer" className="social-link" title="TikTok">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 448 512" style={{ transform: 'translateY(-1px)' }}><path d="M448,209.91a210.06,210.06,0,0,1-122-37.89V349.38A162.55,162.55,0,1,1,185,188.38v86.88a75.66,75.66,0,1,0,76,74.12V0h86.88a104.84,104.84,0,0,0,100.12,100.12Z"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h4>Opening Hours</h4>
            <ul className="footer-links" style={{ color: 'var(--color-gray-medium)' }}>
              <li className="footer-link-item">{hoursDisplay.weekdays}</li>
              <li className="footer-link-item">{hoursDisplay.saturday}</li>
              <li className="footer-link-item">{hoursDisplay.sunday}</li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact Details</h4>
            <ul className="footer-links" style={{ color: 'var(--color-gray-medium)' }}>
              <li className="footer-link-item">📍 {settings.address}</li>
              <li className="footer-link-item">📞 WhatsApp: {settings.whatsapp1}</li>
              <li className="footer-link-item">📞 Secondary: {settings.whatsapp2}</li>
            </ul>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} Zohar Gourmet. All rights reserved.</p>

        </div>
      </footer>

      {/* Premium Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <a href="#menu" className="mobile-nav-item active">
          <span>🍨</span>
          <span>Menu</span>
        </a>
        <button className="mobile-nav-item" onClick={() => { playPopSound(); setIsCustomizerOpen(true); }}>
          <span>🎨</span>
          <span>Build Cup</span>
        </button>
        <button className="mobile-nav-item" onClick={() => { playPopSound(); setIsCartOpen(true); }}>
          <span>🛍️</span>
          <span>Cart</span>
          {cart.length > 0 && <span className="mobile-nav-badge">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
        </button>

      </nav>
    </div>
  );
}
