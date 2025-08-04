// === App Configuration ===
const CONFIG = {
  GOOGLE_SHEET_URL: 'https://script.google.com/macros/s/AKfycbz9ERI8T6p-2mYRuC340dQw5bSdNMvyjTFZwGYEtW6U8mjoMJFd7CMmcB28HzqA4OeF/exec',
};

// === Utility & UI Handlers (borrowed unchanged from your script) ===
// ... (your existing Utils, API, UI, and Quotation, Customer code remains unchanged) ...

// === Product Manager Overrides ===

const ProductManager = {
  currentPage: 0,
  pageSize: 10,
  async loadProducts() {
    const container = DOM.productsList;
    UI.showLoading(container);

    const payload = { action: 'getProducts' };
    const res = await API.makeRequest('getProducts');
    const data = res.products || [];

    AppState.products = data;
    this.renderProductsPage();
  },

  renderProductsPage() {
    const container = DOM.productsList;
    container.innerHTML = '';

    const start = this.currentPage * this.pageSize;
    const pageItems = AppState.products.slice(start, start + this.pageSize);
    if (!pageItems.length) {
      return UI.showEmpty(container, 'No products found', 'fas fa-boxes');
    }

    // Table building
    const table = document.createElement('table');
    table.className = 'product-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>#</th><th>ItemKeyID</th><th>ItemName</th><th>Alias</th><th>Category</th><th>Unit</th><th>PriceList</th><th>Actions</th>
        </tr>
      </thead>
    `;
    const tbody = document.createElement('tbody');

    pageItems.forEach((prod, index) => {
      const globalIndex = start + index;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${globalIndex + 1}</td>
        <td>${prod.ItemKeyID || ''}</td>
        <td>${prod.ItemName || ''}</td>
        <td>${prod.Alias || ''}</td>
        <td>${prod.Category || ''}</td>
        <td>${prod.Unit || ''}</td>
        <td>${prod.PriceList || ''}</td>
        <td class="actions">
          <button class="btn btn-icon" onclick="ProductManager.openProductForm(${globalIndex})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-icon" onclick="ProductManager.deleteProduct('${prod.ItemKeyID}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // Pagination controls
    document.getElementById('prevPage').style.display = this.currentPage > 0 ? 'inline-block' : 'none';
    document.getElementById('nextPage').style.display = (start + this.pageSize) < AppState.products.length ? 'inline-block' : 'none';
  },

  openProductForm(index = null) {
    const product = index != null ? AppState.products[index] : null;
    const title = product ? 'Edit Product' : 'New Product';

    const formHTML = `
      <form id="product-form">
        <input type="hidden" id="prod-index" value="${index != null ? index : ''}">
        <label>ItemKeyID<input type="text" id="prod-id" class="form-input" value="${product?.ItemKeyID || ''}" required></label>
        <label>ItemName<input type="text" id="prod-name" class="form-input" value="${product?.ItemName || ''}" required></label>
        <label>Alias<input type="text" id="prod-alias" class="form-input" value="${product?.Alias || ''}"></label>
        <label>Category<input type="text" id="prod-category" class="form-input" value="${product?.Category || ''}"></label>
        <label>Unit<input type="text" id="prod-unit" class="form-input" value="${product?.Unit || ''}"></label>
        <label>PriceList<input type="number" id="prod-price" class="form-input" step="0.01" value="${product?.PriceList || ''}"></label>
      </form>
    `;

    UI.showModal(title, formHTML, [
      { text: 'Cancel', action: 'UI.hideModal()' },
      { text: product ? 'Update' : 'Create', class: 'btn-primary', action: 'ProductManager.saveProduct()' }
    ]);
  },

  async saveProduct() {
    const idx = +document.getElementById('prod-index').value;
    const product = {
      ItemKeyID: document.getElementById('prod-id').value.trim(),
      ItemName: document.getElementById('prod-name').value.trim(),
      Alias: document.getElementById('prod-alias').value.trim(),
      Category: document.getElementById('prod-category').value.trim(),
      Unit: document.getElementById('prod-unit').value.trim(),
      PriceList: parseFloat(document.getElementById('prod-price').value) || 0
    };

    try {
      await API.makeRequest('saveProduct', product);
      UI.hideModal();
      UI.showToast('Product saved successfully');
      this.loadProducts();
    } catch {
      UI.showToast('Error saving product', 'error');
    }
  },

  async deleteProduct(itemKeyId) {
    if (!confirm('Are you sure?')) return;

    try {
      await API.makeRequest('deleteProduct', { id: itemKeyId });
      UI.showToast('Product deleted');
      this.loadProducts();
    } catch {
      UI.showToast('Delete failed', 'error');
    }
  },

  changePage(delta) {
    const pages = Math.ceil(AppState.products.length / this.pageSize);
    this.currentPage = Math.max(0, Math.min(this.currentPage + delta, pages - 1));
    this.renderProductsPage();
  }
};

// === Hook up Pagination Buttons ===
window.changeProductPage = (d) => ProductManager.changePage(d);
window.ProductManager = ProductManager;

// === Ensure repeat of Sales tab opens trigger loadProducts via toggleSection logic ===
