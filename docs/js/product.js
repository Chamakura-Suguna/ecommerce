const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

const errorEl = document.getElementById('error');
const detailEl = document.getElementById('product-detail');
const pickerRowEl = document.getElementById('wishlist-picker-row');
const wishlistSelectEl = document.getElementById('wishlist-select');
const addToWishlistBtn = document.getElementById('add-to-wishlist-btn');
const noWishlistsMessageEl = document.getElementById('no-wishlists-message');
const quickCreateFormEl = document.getElementById('quick-create-form');
const quickCreateNameEl = document.getElementById('quick-create-name');
const wishlistFeedbackEl = document.getElementById('wishlist-feedback');

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function showFeedback(message, isError = false) {
  wishlistFeedbackEl.textContent = message;
  wishlistFeedbackEl.classList.toggle('feedback-error', isError);
}

function renderProduct(product) {
  detailEl.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="product-detail-image" />
    <div class="product-detail-info">
      <span class="badge badge-category">${product.category}</span>
      <h2>${product.name}</h2>
      <p class="product-detail-description">${product.description}</p>
      <p class="product-detail-price">$${product.price.toFixed(2)}</p>
      <span class="badge ${product.inStock ? 'badge-in-stock' : 'badge-out-of-stock'}">
        ${product.inStock ? 'In stock' : 'Out of stock'}
      </span>
      <div class="product-detail-actions">
        <button id="add-to-cart-btn" ${product.inStock ? '' : 'disabled'}>Add to cart</button>
      </div>
    </div>
  `;
  document.getElementById('add-to-cart-btn').addEventListener('click', async (e) => {
    try {
      await api.addCartItem(product.id, 1);
      e.target.textContent = 'Added!';
      setTimeout(() => (e.target.textContent = 'Add to cart'), 1200);
    } catch (err) {
      showError(`Failed to add to cart: ${err.message}`);
    }
  });
}

let wishlists = [];

async function refreshWishlistPicker() {
  wishlists = await api.getWishlists();

  if (wishlists.length === 0) {
    pickerRowEl.hidden = true;
    noWishlistsMessageEl.hidden = false;
  } else {
    pickerRowEl.hidden = false;
    noWishlistsMessageEl.hidden = true;
    wishlistSelectEl.innerHTML = wishlists.map((w) => `<option value="${w.id}">${w.name}</option>`).join('');
  }
}

const wishlistAddSectionEl = document.querySelector('.wishlist-add-section');

function disableWishlistSection() {
  wishlistAddSectionEl.hidden = true;
}

async function init() {
  if (!productId) {
    detailEl.innerHTML = '<p class="empty-state">No product was selected. Go back to the catalog and click a product to view its details.</p>';
    disableWishlistSection();
    return;
  }
  try {
    const [product] = await Promise.all([api.getProduct(productId), refreshWishlistPicker()]);
    renderProduct(product);
  } catch (err) {
    detailEl.innerHTML = `<p class="empty-state">Could not load this product: ${err.message}</p>`;
    disableWishlistSection();
  }
}

addToWishlistBtn.addEventListener('click', async () => {
  if (!productId) return; // guarded by disableWishlistSection(), but defend anyway
  const wishlistId = wishlistSelectEl.value;
  if (!wishlistId) return;
  try {
    await api.addWishlistItem(wishlistId, productId);
    showFeedback('Added to wishlist!');
  } catch (err) {
    showFeedback(`Error: ${err.message}`, true);
  }
});

quickCreateFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!productId) return; // guarded by disableWishlistSection(), but defend anyway
  const name = quickCreateNameEl.value.trim();
  if (!name) return;

  let newWishlist;
  try {
    newWishlist = await api.createWishlist(name);
  } catch (err) {
    showFeedback(`Error creating wishlist: ${err.message}`, true);
    return;
  }

  try {
    await api.addWishlistItem(newWishlist.id, productId);
    quickCreateNameEl.value = '';
    await refreshWishlistPicker();
    showFeedback(`Created "${newWishlist.name}" and added this product to it!`);
  } catch (err) {
    // Roll back the wishlist we just created so a failed add doesn't leave an orphan.
    await api.deleteWishlist(newWishlist.id).catch(() => {});
    showFeedback(`Error adding product to new wishlist: ${err.message}`, true);
  }
});

init();
