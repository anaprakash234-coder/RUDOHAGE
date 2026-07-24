// ============ CART STATE ============
const CART_STATE = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  updatedAt: null
};

// ============ CART FUNCTIONS ============
const Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  updatedAt: null,

  addItem(productId, name, price, image, quantity = 1) {
    const existing = this.items.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ productId, name, price, image, quantity });
    }
    this._recalculate();
    this._save();
    this._sync();
    this._updateUI();
    this._showToast(`${name} added to cart! 🛒`);
    // ✅ Update buy buttons on product page
    if (typeof window.updateBuyButtons === 'function') {
      setTimeout(window.updateBuyButtons, 200);
    }
    // ✅ FORCE UI UPDATE - REAL TIME
    this._forceUpdate();
    return this;
  },

  removeItem(productId) {
    this.items = this.items.filter(item => item.productId !== productId);
    this._recalculate();
    this._save();
    this._sync();
    this._updateUI();
    if (typeof window.updateBuyButtons === 'function') {
      setTimeout(window.updateBuyButtons, 200);
    }
    this._forceUpdate();
    return this;
  },

  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return this;
    }
    const item = this.items.find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
      this._recalculate();
      this._save();
      this._sync();
      this._updateUI();
    }
    this._forceUpdate();
    return this;
  },

  getItems() {
    return this.items;
  },

  getTotalItems() {
    return this.totalItems;
  },

  getTotalPrice() {
    return this.totalPrice;
  },

  clearCart() {
    this.items = [];
    this.totalItems = 0;
    this.totalPrice = 0;
    this._save();
    this._updateUI();
    this._renderSidebar();
    this._updateBadge();
    if (document.getElementById('cartContent')) {
      this._renderCartPage();
    }
    if (typeof window.updateBuyButtons === 'function') {
      setTimeout(window.updateBuyButtons, 100);
    }
    this._showToast('Cart cleared! 🗑️');
    this._forceUpdate();
    return this;
  },

  clearAfterCheckout() {
    this.clearCart();
    this._showToast('Order placed successfully! 🎉');
    this._forceUpdate();
  },

  _save() {
    try {
      const data = {
        items: this.items,
        totalItems: this.totalItems,
        totalPrice: this.totalPrice,
        updatedAt: Date.now()
      };
      localStorage.setItem('rudohage_cart', JSON.stringify(data));
      console.log('💾 Cart saved:', data);
    } catch (e) {
      console.log('Cart save error:', e);
    }
  },

  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('rudohage_cart');
      if (data) {
        const parsed = JSON.parse(data);
        this.items = parsed.items || [];
        this.totalItems = parsed.totalItems || 0;
        this.totalPrice = parsed.totalPrice || 0;
        this.updatedAt = parsed.updatedAt || null;
        this._updateUI();
        this._forceUpdate();
        console.log('📦 Cart loaded:', this.items.length, 'items');
      } else {
        console.log('📦 No cart found in localStorage');
      }
    } catch (e) {
      console.log('Cart load error:', e);
    }
    return this;
  },

  async syncToFirebase(userId) {
    if (!userId) return;
    try {
      const response = await fetch(`/api/cart/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cart: {
            items: this.items,
            totalItems: this.totalItems,
            totalPrice: this.totalPrice,
            updatedAt: Date.now()
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Cart synced to Firebase');
      }
    } catch (e) {
      console.log('Firebase sync error:', e);
    }
  },

  async loadFromFirebase(userId) {
    if (!userId) return;
    try {
      const response = await fetch(`/api/cart/${userId}`);
      const data = await response.json();
      if (data.success && data.cart) {
        this._merge(data.cart);
        this._save();
        this._updateUI();
        this._forceUpdate();
        console.log('✅ Cart loaded from Firebase');
      }
    } catch (e) {
      console.log('Firebase load error:', e);
    }
  },

  _merge(firebaseCart) {
    const fbItems = firebaseCart.items || [];
    const combined = [...this.items];
    fbItems.forEach(fbItem => {
      const existing = combined.find(i => i.productId === fbItem.productId);
      if (existing) {
        existing.quantity = Math.max(existing.quantity, fbItem.quantity);
      } else {
        combined.push(fbItem);
      }
    });
    this.items = combined;
    this._recalculate();
  },

  _sync() {
    const userId = this._getUserId();
    if (userId) {
      this.syncToFirebase(userId);
    }
  },

  _getUserId() {
    try {
      if (typeof window !== 'undefined' && window.auth && window.auth.currentUser) {
        return window.auth.currentUser.uid;
      }
      if (typeof auth !== 'undefined' && auth.currentUser) {
        return auth.currentUser.uid;
      }
    } catch (e) {
      console.log('Auth not available yet');
    }
    return null;
  },

  // ===== 🔥 FORCE UPDATE - REAL TIME FIX =====
  _forceUpdate() {
    // Update badge immediately
    this._updateBadge();
    // Update sidebar immediately
    this._renderSidebar();
    // Update cart page if open
    this._renderCartPage();
    // Trigger storage event for other tabs
    try {
      localStorage.setItem('rudohage_cart_updated', Date.now().toString());
    } catch(e) {}
  },

  _updateUI() {
    this._updateBadge();
    this._renderSidebar();
    this._renderCartPage();
  },

  _updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      badge.textContent = this.totalItems;
      badge.style.display = this.totalItems > 0 ? 'flex' : 'none';
      console.log('🔄 Badge updated:', this.totalItems);
    } else {
      console.log('⚠️ Badge element not found');
    }
  },

  _renderSidebar() {
    const sidebar = document.getElementById('cartSidebar');
    const list = sidebar?.querySelector('.cart-sidebar-list');
    const total = sidebar?.querySelector('.cart-sidebar-total');
    const count = sidebar?.querySelector('.cart-sidebar-count');

    if (!list) {
      console.log('⚠️ Sidebar list not found');
      return;
    }

    if (this.items.length === 0) {
      list.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p><a href="/#catalog" class="cart-empty-btn">Start Shopping</a></div>`;
      if (total) total.textContent = '₹0';
      if (count) count.textContent = '0 items';
      return;
    }

    list.innerHTML = this.items.map(item => `
      <div class="cart-sidebar-item" data-id="${item.productId}">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='/logo.png'">
        <div class="cart-sidebar-item-info">
          <h4>${item.name}</h4>
          <p>₹${item.price.toLocaleString()}</p>
          <div class="cart-sidebar-qty">
            <button onclick="Cart.updateQuantity('${item.productId}', ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="Cart.updateQuantity('${item.productId}', ${item.quantity + 1})">+</button>
          </div>
        </div>
        <button class="cart-sidebar-remove" onclick="Cart.removeItem('${item.productId}')"><i class="fas fa-times"></i></button>
      </div>
    `).join('');

    if (total) total.textContent = `₹${this.totalPrice.toLocaleString()}`;
    if (count) count.textContent = `${this.totalItems} items`;
    console.log('🔄 Sidebar updated:', this.items.length, 'items');
  },

  _renderCartPage() {
    const container = document.getElementById('cartContent');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-page-empty">
          <i class="fas fa-shopping-bag"></i>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any pieces yet.</p>
          <a href="/#catalog" class="continue-shop">Start Shopping</a>
        </div>
      `;
      return;
    }

    const totalPrice = this.totalPrice;
    const gst = Math.round(totalPrice * 0.12);
    const grandTotal = Math.round(totalPrice * 1.12);

    container.innerHTML = `
      <div class="cart-page-grid">
        <div class="cart-page-items">
          ${this.items.map(item => `
            <div class="cart-page-item" data-id="${item.productId}">
              <img src="${item.image}" alt="${item.name}" onerror="this.src='/logo.png'">
              <div class="cart-page-item-info">
                <h3>${item.name}</h3>
                <p class="cart-page-item-price">₹${item.price.toLocaleString()}</p>
                <div class="cart-page-item-qty">
                  <button onclick="Cart.updateQuantity('${item.productId}', ${item.quantity - 1})">−</button>
                  <span>${item.quantity}</span>
                  <button onclick="Cart.updateQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                </div>
              </div>
              <button class="cart-page-item-remove" onclick="Cart.removeItem('${item.productId}')">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="cart-page-summary">
          <h3>Order Summary</h3>
          <div class="cart-summary-row"><span class="label">Subtotal (${this.totalItems} items)</span><span class="value">₹${totalPrice.toLocaleString()}</span></div>
          <div class="cart-summary-row"><span class="label">GST (12%)</span><span class="value">₹${gst.toLocaleString()}</span></div>
          <div class="cart-summary-row total"><span class="label">Total</span><span class="value accent">₹${grandTotal.toLocaleString()}</span></div>
          <a href="/checkout/" class="cart-page-checkout-btn">Proceed to Checkout</a>
        </div>
      </div>
    `;
  },

  _showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  _recalculate() {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.updatedAt = Date.now();
  },

  getCheckoutData() {
    return {
      items: this.items,
      totalItems: this.totalItems,
      totalPrice: this.totalPrice,
      subtotal: this.totalPrice,
      gst: Math.round(this.totalPrice * 0.12),
      grandTotal: Math.round(this.totalPrice * 1.12)
    };
  }
};

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  console.log('🛒 Cart.js loaded');
  
  Cart.loadFromLocalStorage();

  const cartIcon = document.getElementById('cartIcon');
  const sidebar = document.getElementById('cartSidebar');
  const sidebarOverlay = document.getElementById('cartSidebarOverlay');
  const sidebarClose = document.getElementById('cartSidebarClose');

  if (cartIcon && sidebar) {
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      sidebar.classList.toggle('open');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    });
  }

  if (sidebarClose && sidebar) {
    sidebarClose.addEventListener('click', () => {
      sidebar.classList.remove('open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  if (!document.getElementById('toastContainer')) {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // ✅ Listen for storage changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'rudohage_cart_updated') {
      Cart.loadFromLocalStorage();
      Cart._forceUpdate();
    }
  });

  if (typeof auth !== 'undefined') {
    if (typeof onAuthStateChanged === 'function') {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          await Cart.loadFromFirebase(user.uid);
        }
      });
    }
  } else {
    setTimeout(() => {
      if (typeof auth !== 'undefined' && auth.currentUser) {
        Cart.loadFromFirebase(auth.currentUser.uid);
      }
    }, 2000);
  }
});

// ============ EXPOSE ============
window.Cart = Cart;

console.log('✅ Cart object ready');
