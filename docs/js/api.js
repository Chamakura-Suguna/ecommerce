async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = (body && body.error) || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body;
}

const api = {
  getProducts: () => apiRequest('/products'),
  getProduct: (id) => apiRequest(`/products/${id}`),

  getWishlists: () => apiRequest('/wishlists'),
  createWishlist: (name) =>
    apiRequest('/wishlists', { method: 'POST', body: JSON.stringify({ name }) }),
  addWishlistItem: (wishlistId, productId) =>
    apiRequest(`/wishlists/${wishlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  removeWishlistItem: (wishlistId, productId) =>
    apiRequest(`/wishlists/${wishlistId}/items/${productId}`, { method: 'DELETE' }),
  deleteWishlist: (wishlistId) => apiRequest(`/wishlists/${wishlistId}`, { method: 'DELETE' }),
  mergeWishlists: (sourceId, targetId) =>
    apiRequest('/wishlists/merge', {
      method: 'POST',
      body: JSON.stringify({ sourceId, targetId }),
    }),

  getCart: () => apiRequest('/cart'),
  addCartItem: (productId, quantity = 1) =>
    apiRequest('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (productId, quantity) =>
    apiRequest(`/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (productId) => apiRequest(`/cart/items/${productId}`, { method: 'DELETE' }),

  checkout: () => apiRequest('/checkout', { method: 'POST' }),
};
