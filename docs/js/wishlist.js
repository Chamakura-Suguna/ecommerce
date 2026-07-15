const errorEl = document.getElementById('error');
const columnsEl = document.getElementById('wishlist-columns');
const createFormEl = document.getElementById('create-wishlist-form');
const newNameEl = document.getElementById('new-wishlist-name');
const mergeSourceEl = document.getElementById('merge-source');
const mergeTargetEl = document.getElementById('merge-target');
const mergeBtn = document.getElementById('merge-btn');
const mergeSectionEl = document.getElementById('merge-section');
const modalEl = document.getElementById('merge-confirm-modal');
const modalTextEl = document.getElementById('merge-confirm-text');
const modalYesBtn = document.getElementById('merge-confirm-yes');
const modalNoBtn = document.getElementById('merge-confirm-no');

let wishlists = [];
let productsById = new Map();
let pendingMerge = null;

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function renderColumns() {
  if (wishlists.length === 0) {
    columnsEl.innerHTML = '<p class="empty-state">You don\'t have any wishlists yet. Create one above.</p>';
    return;
  }

  columnsEl.innerHTML = wishlists
    .map(
      (w) => `
      <div class="wishlist-column">
        <h3>${w.name}</h3>
        ${
          w.items.length === 0
            ? '<p>No items yet.</p>'
            : w.items
                .map((item) => {
                  const product = productsById.get(item.productId);
                  return `
                    <div class="wishlist-item-row">
                      <img src="${product?.image ?? ''}" alt="${product?.name ?? 'Unknown'}" />
                      <span>${product?.name ?? 'Unknown product'}</span>
                      <button data-remove-from="${w.id}" data-product="${item.productId}">Remove</button>
                    </div>
                  `;
                })
                .join('')
        }
      </div>
    `
    )
    .join('');
}

function renderMergeSelects() {
  const canMerge = wishlists.length >= 2;
  mergeSectionEl.hidden = !canMerge;

  if (!canMerge) return;

  const options = wishlists.map((w) => `<option value="${w.id}">${w.name}</option>`).join('');
  mergeSourceEl.innerHTML = options;
  mergeTargetEl.innerHTML = options;
}

async function loadAll() {
  const [fetchedWishlists, products] = await Promise.all([api.getWishlists(), api.getProducts()]);
  wishlists = fetchedWishlists;
  productsById = new Map(products.map((p) => [p.id, p]));
  renderColumns();
  renderMergeSelects();
}

createFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = newNameEl.value.trim();
  if (!name) return;
  try {
    await api.createWishlist(name);
    newNameEl.value = '';
    await loadAll();
  } catch (err) {
    showError(`Failed to create wishlist: ${err.message}`);
  }
});

columnsEl.addEventListener('click', async (e) => {
  const wishlistId = e.target.dataset.removeFrom;
  const productId = e.target.dataset.product;
  if (!wishlistId || !productId) return;
  try {
    await api.removeWishlistItem(wishlistId, productId);
    await loadAll();
  } catch (err) {
    showError(`Failed to remove item: ${err.message}`);
  }
});

mergeBtn.addEventListener('click', () => {
  const sourceId = mergeSourceEl.value;
  const targetId = mergeTargetEl.value;

  if (!sourceId || !targetId) {
    showError('Select both a source and a target wishlist before merging.');
    return;
  }
  if (sourceId === targetId) {
    showError('Source and target must be different lists.');
    return;
  }

  const sourceName = wishlists.find((w) => w.id === sourceId)?.name;
  const targetName = wishlists.find((w) => w.id === targetId)?.name;

  pendingMerge = { sourceId, targetId };
  modalTextEl.textContent = `Merge "${sourceName}" into "${targetName}"? "${sourceName}" will be permanently deleted. This cannot be undone.`;
  modalEl.hidden = false;
});

modalNoBtn.addEventListener('click', () => {
  pendingMerge = null;
  modalEl.hidden = true;
});

modalYesBtn.addEventListener('click', async () => {
  if (!pendingMerge) {
    modalEl.hidden = true;
    showError('Merge could not proceed: no pending merge was set.');
    return;
  }
  try {
    await api.mergeWishlists(pendingMerge.sourceId, pendingMerge.targetId);
    modalEl.hidden = true;
    pendingMerge = null;
    await loadAll();
  } catch (err) {
    modalEl.hidden = true;
    showError(`Merge failed: ${err.message}`);
  }
});

loadAll().catch((err) => showError(err.message));
