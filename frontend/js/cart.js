const errorEl = document.getElementById('error');
const itemsEl = document.getElementById('cart-items');
const totalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const confirmationEl = document.getElementById('confirmation');

let productsById = new Map();

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function renderCart(cart) {
  if (cart.items.length === 0) {
    itemsEl.innerHTML = '<p>Your cart is empty.</p>';
    totalEl.textContent = '0.00';
    return;
  }

  let total = 0;
  itemsEl.innerHTML = cart.items
    .map((item) => {
      const product = productsById.get(item.productId);
      const lineTotal = product ? product.price * item.quantity : 0;
      total += lineTotal;
      return `
        <div class="cart-row">
          <img src="${product?.image ?? ''}" alt="${product?.name ?? 'Unknown'}" />
          <span>${product?.name ?? 'Unknown product'}</span>
          <input type="number" min="1" value="${item.quantity}" data-qty-for="${item.productId}" style="width:4rem" />
          <span>$${lineTotal.toFixed(2)}</span>
          <button data-remove="${item.productId}">Remove</button>
        </div>
      `;
    })
    .join('');

  totalEl.textContent = total.toFixed(2);
}

async function loadCart() {
  const [cart, products] = await Promise.all([api.getCart(), api.getProducts()]);
  productsById = new Map(products.map((p) => [p.id, p]));
  renderCart(cart);
}

itemsEl.addEventListener('change', async (e) => {
  const productId = e.target.dataset.qtyFor;
  if (!productId) return;
  const quantity = parseInt(e.target.value, 10);
  if (!Number.isInteger(quantity) || quantity < 1) {
    showError('Quantity must be a whole number of at least 1.');
    await loadCart(); // reset the input back to the last known-good quantity
    return;
  }
  try {
    await api.updateCartItem(productId, quantity);
    await loadCart();
  } catch (err) {
    showError(`Failed to update quantity: ${err.message}`);
  }
});

itemsEl.addEventListener('click', async (e) => {
  const productId = e.target.dataset.remove;
  if (!productId) return;
  try {
    await api.removeCartItem(productId);
    await loadCart();
  } catch (err) {
    showError(`Failed to remove item: ${err.message}`);
  }
});

checkoutBtn.addEventListener('click', async () => {
  try {
    const confirmation = await api.checkout();
    confirmationEl.hidden = false;
    confirmationEl.innerHTML = `
      <h3>Order confirmed</h3>
      <p>Order ID: ${confirmation.orderId}</p>
      <p>Total: $${confirmation.total.toFixed(2)}</p>
      <p>${confirmation.note}</p>
    `;
    await loadCart();
  } catch (err) {
    showError(`Checkout failed: ${err.message}`);
  }
});

loadCart().catch((err) => showError(err.message));
