const state = { products: [], search: '', category: '' };

const errorEl = document.getElementById('error');
const gridEl = document.getElementById('product-grid');
const searchEl = document.getElementById('search');
const categoryEl = document.getElementById('category-filter');

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function renderGrid() {
  const filtered = state.products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(state.search.toLowerCase());
    const matchesCategory = !state.category || p.category === state.category;
    return matchesSearch && matchesCategory;
  });

  gridEl.innerHTML = filtered
    .map(
      (p) => `
      <div class="product-card">
        <a href="product.html?id=${p.id}">
          <img src="${p.image}" alt="${p.name}" />
          <span class="badge badge-category">${p.category}</span>
          <h3>${p.name}</h3>
        </a>
        <p class="product-card-price">$${p.price.toFixed(2)}</p>
        <span class="badge ${p.inStock ? 'badge-in-stock' : 'badge-out-of-stock'}">
          ${p.inStock ? 'In stock' : 'Out of stock'}
        </span>
        <button data-add-to-cart="${p.id}" ${p.inStock ? '' : 'disabled'}>Add to cart</button>
      </div>
    `
    )
    .join('');
}

function populateCategoryFilter() {
  const categories = [...new Set(state.products.map((p) => p.category))].sort();
  categoryEl.innerHTML =
    '<option value="">All categories</option>' +
    categories.map((c) => `<option value="${c}">${c}</option>`).join('');
}

async function init() {
  try {
    state.products = await api.getProducts();
    populateCategoryFilter();
    renderGrid();
  } catch (err) {
    showError(`Failed to load products: ${err.message}`);
  }
}

searchEl.addEventListener('input', (e) => {
  state.search = e.target.value;
  renderGrid();
});

categoryEl.addEventListener('change', (e) => {
  state.category = e.target.value;
  renderGrid();
});

gridEl.addEventListener('click', async (e) => {
  const productId = e.target.dataset.addToCart;
  if (!productId) return;
  try {
    await api.addCartItem(productId, 1);
    e.target.textContent = 'Added!';
    setTimeout(() => (e.target.textContent = 'Add to cart'), 1000);
  } catch (err) {
    showError(`Failed to add to cart: ${err.message}`);
  }
});

init();
