// Cart functionality helpers
function loadCart() {
    const stored = localStorage.getItem('taste-cart');
    return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
    localStorage.setItem('taste-cart', JSON.stringify(cart));
}

function formatPrice(amount) {
    return `LKR ${amount}`;
}

function updateCartBadge(cart, bump=false) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badgeEls = document.querySelectorAll('.cart-count');
    badgeEls.forEach(badge => {
        badge.textContent = count;
        if (bump) {
            badge.classList.add('bump');
            badge.addEventListener('animationend', () => {
                badge.classList.remove('bump');
            }, { once: true });
        }
    });
}

function animateBadge() {
    const badge = document.querySelector('.cart-count');
    if (badge) {
        badge.classList.add('bump');
        setTimeout(() => badge.classList.remove('bump'), 300);
    }
}

function updateCartPanel(cart) {
    const container = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('cart-total-price');
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        cart.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            row.innerHTML = `
                <div class="info">
                    <strong>${item.name}</strong><br>
                    <small>${formatPrice(item.price)}</small>
                </div>
                <div class="controls">
                    <button class="decrease" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase" data-index="${index}">+</button>
                    <button class="remove" data-index="${index}">x</button>
                </div>
            `;
            container.appendChild(row);
        });
    }

    totalPriceEl.textContent = formatPrice(total);
}

function showCart() {
    document.getElementById('cart-panel').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
}

function hideCart() {
    document.getElementById('cart-panel').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function addToCart(item) {
    let cart = loadCart();
    const existing = cart.find(i => i.name === item.name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    saveCart(cart);
    updateCartBadge(cart, true);
    animateBadge();
    showToast('Item added to cart');
}

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const cards = document.querySelectorAll('.food-card');
    const browseBtn = document.querySelector('.browse-menu-btn');
    const cartBtn = document.querySelector('.cart-btn');
    const floatingCart = document.getElementById('floating-cart-btn');
    const closeBtn = document.getElementById('close-cart');
    const overlay = document.getElementById('cart-overlay');
    const searchBar = document.querySelector('.search-bar');
    const modeToggle = document.querySelector('.mode-toggle');
    let cart = loadCart();

    // theme initialization
    const savedTheme = localStorage.getItem('taste-theme');
    function applyThemeClass(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    }
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        applyThemeClass(savedTheme);
    }
    // update toggle text according to theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    modeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        applyThemeClass(next);
        localStorage.setItem('taste-theme', next);
        modeToggle.classList.add('rotated');
        modeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
        setTimeout(() => modeToggle.classList.remove('rotated'), 500);
    }
    modeToggle.addEventListener('click', toggleTheme);

    updateCartBadge(cart);
    updateCartPanel(cart);

    // search handling
    function filterCards() {
        const term = searchBar.value.trim().toLowerCase();
        cards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const matches = name.includes(term);
            const category = card.getAttribute('data-category');
            const activeCat = document.querySelector('.tab.active').getAttribute('data-category');
            const catMatch = (activeCat === 'All' || category === activeCat);
            card.style.display = (matches && catMatch) ? 'flex' : 'none';
        });
    }
    searchBar.addEventListener('input', () => {
        filterCards();
    });

    // intersection observer for cards
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    cards.forEach(card => {
        observer.observe(card);
        const img = card.querySelector('img');
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
        // trigger load in case cached
        if (img.complete) img.classList.add('loaded');
    });


    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // smooth transition
            const cardContainer = document.querySelector('.cards');
            cardContainer.classList.add('hiding');
            setTimeout(() => {
                // update active class
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const category = tab.getAttribute('data-category');
                cards.forEach(card => {
                    const name = card.querySelector('h3').textContent.toLowerCase();
                    const searchTerm = searchBar.value.trim().toLowerCase();
                    const matchesSearch = name.includes(searchTerm);
                    if ((category === 'All' || card.getAttribute('data-category') === category) && matchesSearch) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
                cardContainer.classList.remove('hiding');
            }, 300);
        });
    });

    // add to cart buttons
    cards.forEach(card => {
        const btn = card.querySelector('.add-btn');
        btn.addEventListener('click', () => {
            const name = card.querySelector('h3').textContent;
            const priceText = card.querySelector('.price').textContent.replace('LKR', '').trim();
            const price = parseFloat(priceText);
            addToCart({ name, price });
            cart = loadCart();
            updateCartPanel(cart);
        });
    });

    // cart panel open/close
    function openCartPanel() {
        cart = loadCart();
        updateCartPanel(cart);
        showCart();
    }
    if (cartBtn) {
        cartBtn.addEventListener('click', openCartPanel);
    }
    if (floatingCart) {
        floatingCart.addEventListener('click', openCartPanel);
    }
    if (closeBtn) closeBtn.addEventListener('click', hideCart);
    if (overlay) overlay.addEventListener('click', hideCart);

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            hideCart();
            window.location.href = 'checkout.html';
        });
    }

    // panel controls (increase, decrease, remove)
    document.getElementById('cart-items').addEventListener('click', (e) => {
        let index = e.target.getAttribute('data-index');
        if (index === null) return;
        index = parseInt(index, 10);
        cart = loadCart();
        if (e.target.classList.contains('increase')) {
            cart[index].quantity += 1;
        } else if (e.target.classList.contains('decrease')) {
            cart[index].quantity = Math.max(1, cart[index].quantity - 1);
        } else if (e.target.classList.contains('remove')) {
            cart.splice(index, 1);
        }
        saveCart(cart);
        updateCartBadge(cart);
        updateCartPanel(cart);
    });

    // scroll to menu when browse button clicked
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            const menuSection = document.getElementById('menu');
            if (menuSection) {
                menuSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});