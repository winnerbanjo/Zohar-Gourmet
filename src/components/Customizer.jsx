import React, { useState, useEffect } from 'react';
import { database } from '../utils/database';
import { Info, ShieldAlert, Plus, Minus } from 'lucide-react';

const EMOJI_MAP = {
  apple: '🍏',
  granola: '🌾',
  coconut: '🥥',
  cashew: '🥜',
  almond: '🌰',
  grape: '🍇',
  regular: '🥛',
  greek: '🍦'
};

export default function Customizer({ onAddToCart, onClose }) {
  const [size, setSize] = useState('500ml'); // '330ml', '500ml', '1L'
  const [base, setBase] = useState('regular'); // 'regular', 'greek'
  const [toppingsList, setToppingsList] = useState([]);
  
  // Track portion sizes: { apple: 0, granola: 0, ... }
  const [portions, setPortions] = useState({});
  const [fallingParticles, setFallingParticles] = useState([]);

  // Load toppings and set initial portions
  useEffect(() => {
    const list = database.getToppings();
    setToppingsList(list);
    
    const initialPortions = {};
    list.forEach(t => {
      initialPortions[t.id] = 0;
    });
    setPortions(initialPortions);
  }, []);

  const playPopSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  };

  const spawnParticle = (typeKey) => {
    const emoji = EMOJI_MAP[typeKey] || '✨';
    const newParticle = {
      id: Date.now() + Math.random(),
      emoji,
      style: {
        left: `${20 + Math.random() * 60}%`,
        animationDelay: '0s'
      }
    };
    
    setFallingParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setFallingParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 850);
  };

  // Portion Increment/Decrement Handlers
  const handleIncreasePortion = (toppingId) => {
    playPopSound();
    setPortions(prev => ({
      ...prev,
      [toppingId]: (prev[toppingId] || 0) + 1
    }));
    spawnParticle(toppingId);
  };

  const handleDecreasePortion = (toppingId) => {
    if ((portions[toppingId] || 0) === 0) return;
    playPopSound();
    setPortions(prev => ({
      ...prev,
      [toppingId]: Math.max(0, (prev[toppingId] || 0) - 1)
    }));
  };

  const getBasePrice = () => {
    if (size === '330ml') return base === 'greek' ? 1700 : 1200;
    if (size === '500ml') return base === 'greek' ? 2500 : 1800;
    return base === 'greek' ? 4500 : 3500; // 1L
  };

  const getToppingsPrice = () => {
    return Object.keys(portions).reduce((total, id) => {
      const topping = toppingsList.find(t => t.id === id);
      const qty = portions[id] || 0;
      if (topping && qty > 0) {
        return total + (topping.price * qty);
      }
      return total;
    }, 0);
  };

  const totalPrice = getBasePrice() + getToppingsPrice();

  const handleBaseChange = (selectedBase) => {
    playPopSound();
    setBase(selectedBase);
    spawnParticle(selectedBase);
  };

  const handleSizeChange = (selectedSize) => {
    playPopSound();
    setSize(selectedSize);
  };

  const handleAdd = () => {
    const sizeLabel = size === '330ml' ? '330mls' : size === '500ml' ? '500mls' : 'Biggy 1 Litre';
    const baseLabel = base === 'greek' ? 'Greek Yoghurt Base' : 'Regular Yoghurt Base';
    
    // Compile details of portion sizes
    const activeToppings = [];
    Object.keys(portions).forEach(id => {
      const qty = portions[id];
      if (qty > 0) {
        const topping = toppingsList.find(t => t.id === id);
        if (topping) {
          activeToppings.push(`${topping.name} (x${qty})`);
        }
      }
    });

    const item = {
      id: 'custom-' + Date.now(),
      name: `Custom Parfait (${sizeLabel})`,
      price: totalPrice,
      image: '/parfait_cup.jpg',
      options: `${baseLabel} with toppings: ${activeToppings.join(', ') || 'No toppings'}`,
      isCustom: true,
      customDetails: {
        size,
        base,
        portions: { ...portions }
      }
    };
    
    onAddToCart(item);
    onClose();
  };

  // Graphical height layers mapping
  const totalPortions = 1 + Object.values(portions).reduce((sum, val) => sum + val, 0);
  const heightPercent = 100 / totalPortions;

  return (
    <div className="customizer-split anim-scale-up">
      {/* Left Column: Visual Cup Representation */}
      <div className="cup-visual-section">
        <h4 className="visual-cup-tag">My Custom Parfait</h4>
        <div className="parfait-cup-container">
          <div className="cup-rim"></div>
          <div className="cup-glass-border"></div>
          
          {fallingParticles.map(p => (
            <div key={p.id} className="falling-topping" style={p.style}>
              {p.emoji}
            </div>
          ))}

          <div className="cup-content-fill" style={{ height: '90%' }}>
            {/* Base Yogurt Layer */}
            <div 
              className={`cup-layer ${base === 'greek' ? 'layer-yoghurt-greek' : 'layer-yoghurt-regular'}`}
              style={{ height: `${heightPercent}%` }}
            >
              {base === 'greek' ? 'Greek Yogurt' : 'Regular Yogurt'}
            </div>

            {/* Selected Toppings Layers (Render proportional height per portion) */}
            {Object.keys(portions).map((toppingId) => {
              const qty = portions[toppingId];
              if (qty === 0) return null;
              const topping = toppingsList.find(t => t.id === toppingId);
              return (
                <div 
                  key={toppingId} 
                  className={`cup-layer layer-${toppingId}`}
                  style={{ height: `${heightPercent * qty}%` }}
                >
                  {topping ? `${topping.name.split(' ')[1] || topping.name.split(' ')[0]} x${qty}` : toppingId}
                </div>
              );
            })}
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-gray-dark)', textAlign: 'center', marginTop: '8px' }}>
          *Click "+" to stack multiple portions of toppings! 🍓
        </p>
      </div>

      {/* Right Column: Customizer Selector UI */}
      <div className="customizer-options">
        {/* 1. Size Selection */}
        <div>
          <h5 className="option-group-title">1. Choose Cup Size</h5>
          <div className="options-grid">
            <button 
              className={`option-card-btn ${size === '330ml' ? 'active' : ''}`}
              onClick={() => handleSizeChange('330ml')}
            >
              <span>330mls</span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>₦{base === 'greek' ? '1,700' : '1,200'}</span>
            </button>
            <button 
              className={`option-card-btn ${size === '500ml' ? 'active' : ''}`}
              onClick={() => handleSizeChange('500ml')}
            >
              <span>500mls</span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>₦{base === 'greek' ? '2,500' : '1,800'}</span>
            </button>
            <button 
              className={`option-card-btn ${size === '1L' ? 'active' : ''}`}
              onClick={() => handleSizeChange('1L')}
            >
              <span>1 Litre</span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>₦{base === 'greek' ? '4,500' : '3,500'}</span>
            </button>
          </div>
        </div>

        {/* 2. Base Selection */}
        <div>
          <h5 className="option-group-title">2. Choose Yoghurt Base</h5>
          <div className="options-grid">
            <button 
              className={`option-card-btn ${base === 'regular' ? 'active' : ''}`}
              onClick={() => handleBaseChange('regular')}
            >
              <span>Regular</span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>Included</span>
            </button>
            <button 
              className={`option-card-btn ${base === 'greek' ? 'active' : ''}`}
              onClick={() => handleBaseChange('greek')}
            >
              <span>Greek Yoghurt</span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>
                +{size === '330ml' ? '₦500' : size === '500ml' ? '₦700' : '₦1,000'}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Toppings Portion Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h5 className="option-group-title" style={{ margin: 0 }}>3. Add Toppings & Portions</h5>
            <span style={{ fontSize: '11px', color: 'var(--color-gray-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Info size={12} /> Cashew: ₦700 | Others: ₦500
            </span>
          </div>

          <div className="toppings-flex">
            {toppingsList.map((topping) => {
              const qty = portions[topping.id] || 0;
              const isDisabled = !topping.inStock;

              return (
                <div
                  key={topping.id}
                  className={`topping-checkbox-row ${qty > 0 ? 'checked' : ''}`}
                  style={{ width: '100%', opacity: isDisabled ? 0.45 : 1 }}
                >
                  <span className="topping-checkbox-label">
                    {topping.name}
                    {isDisabled && (
                      <span style={{ fontSize: '10px', color: 'var(--color-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        Out of Stock
                      </span>
                    )}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="topping-price-badge" style={{ marginRight: '6px' }}>
                      +₦{topping.price}
                    </span>
                    
                    {!isDisabled && (
                      <div className="qty-controls" style={{ padding: '2px 8px', borderRadius: '15px' }}>
                        <button 
                          type="button"
                          className="qty-btn" 
                          onClick={() => handleDecreasePortion(topping.id)}
                          disabled={qty === 0}
                          style={{ opacity: qty === 0 ? 0.3 : 1 }}
                        >
                          <Minus size={11} />
                        </button>
                        <span className="qty-val" style={{ fontSize: '12px', minWidth: '14px', textAlign: 'center' }}>
                          {qty}
                        </span>
                        <button 
                          type="button"
                          className="qty-btn" 
                          onClick={() => handleIncreasePortion(topping.id)}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Price and Add */}
        <div className="customizer-footer">
          <div>
            <div className="price-label">Estimated Total</div>
            <div className="customizer-total-price">₦{totalPrice.toLocaleString()}</div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={totalPrice === 0}
          >
            Add to Cup
          </button>
        </div>
      </div>
    </div>
  );
}
