// App Configuration
const CONFIG = {
    // Replace with your Google Apps Script Web App URL
    GOOGLE_SHEET_URL: 'https://script.google.com/macros/s/AKfycbz9ERI8T6p-2mYRuC340dQw5bSdNMvyjTFZwGYEtW6U8mjoMJFd7CMmcB28HzqA4OeF/exec',
    QUOTATIONS_PER_PAGE: 15,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// App State
const AppState = {
    currentTab: 'home',
    quotations: [],
    products: [],
    customers: [],
    quotationsOffset: 0,
    isLoading: false,
    cache: new Map()
};

// DOM Elements
const DOM = {
    loadingScreen: document.getElementById('loading-screen'),
    app: document.getElementById('app'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    quotationsList: document.getElementById('quotations-list'),
    productsList: document.getElementById('products-list'),
    customersList: document.getElementById('customers-list'),
    modal: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalFooter: document.getElementById('modal-footer'),
    toast: document.getElementById('toast'),
    installPrompt: document.getElementById('install-prompt')
};

// Utility Functions
const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },

    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// API Functions
const API = {
    async makeRequest(action, data = {}) {
        const payload = {
            action,
            ...data,
            timestamp: Date.now()
        };

        try {
            const response = await fetch(CONFIG.GOOGLE_SHEET_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Request failed:', error);
            UI.showToast('Connection error. Please check your internet connection.', 'error');
            throw error;
        }
    },

    async getQuotations(offset = 0, limit = CONFIG.QUOTATIONS_PER_PAGE) {
        const cacheKey = `quotations_${offset}_${limit}`;
        if (AppState.cache.has(cacheKey)) {
            const cached = AppState.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
                return cached.data;
            }
        }

        const data = await this.makeRequest('getQuotations', { offset, limit });
        AppState.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    },

    async getProducts() {
        const cacheKey = 'products';
        if (AppState.cache.has(cacheKey)) {
            const cached = AppState.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
                return cached.data;
            }
        }

        const data = await this.makeRequest('getProducts');
        AppState.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    },

    async getCustomers() {
        const cacheKey = 'customers';
        if (AppState.cache.has(cacheKey)) {
            const cached = AppState.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
                return cached.data;
            }
        }

        const data = await this.makeRequest('getCustomers');
        AppState.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    },

    async saveQuotation(quotationData) {
        AppState.cache.clear(); // Clear cache to force refresh
        return await this.makeRequest('saveQuotation', quotationData);
    },

    async saveProduct(productData) {
        AppState.cache.clear();
        return await this.makeRequest('saveProduct', productData);
    },

    async saveCustomer(customerData) {
        AppState.cache.clear();
        return await this.makeRequest('saveCustomer', customerData);
    },

    async deleteQuotation(id) {
        AppState.cache.clear();
        return await this.makeRequest('deleteQuotation', { id });
    },

    async deleteProduct(id) {
        AppState.cache.clear();
        return await this.makeRequest('deleteProduct', { id });
    },

    async deleteCustomer(id) {
        AppState.cache.clear();
        return await this.makeRequest('deleteCustomer', { id });
    }
};

// UI Functions
const UI = {
    showLoading(container) {
        container.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
            </div>
        `;
    },

    showEmpty(container, message, icon = 'fas fa-inbox') {
        container.innerHTML = `
            <div class="empty-state">
                <i class="${icon}"></i>
                <p>${message}</p>
            </div>
        `;
    },

    showToast(message, type = 'success') {
        const toast = DOM.toast;
        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');

        toast.className = `toast ${type}`;
        icon.className = `toast-icon fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`;
        messageEl.textContent = message;

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    },

    showModal(title, content, buttons = []) {
        DOM.modalTitle.textContent = title;
        DOM.modalBody.innerHTML = content;
        DOM.modalFooter.innerHTML = buttons.map(btn => 
            `<button class="btn ${btn.class || 'btn-secondary'}" onclick="${btn.action}">${btn.text}</button>`
        ).join('');
        DOM.modal.classList.add('active');
    },

    hideModal() {
        DOM.modal.classList.remove('active');
    },

    switchTab(tabName) {
        // Update tab buttons
        DOM.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panes
        DOM.tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });

        AppState.currentTab = tabName;

        // Load data for the tab if not already loaded
        switch (tabName) {
            case 'home':
                if (AppState.quotations.length === 0) {
                    QuotationManager.loadQuotations();
                }
                break;
            case 'products':
                if (AppState.products.length === 0) {
                    ProductManager.loadProducts();
                }
                break;
            case 'customers':
                if (AppState.customers.length === 0) {
                    CustomerManager.loadCustomers();
                }
                break;
        }
    }
};

// Quotation Manager
const QuotationManager = {
    async loadQuotations(loadMore = false) {
        if (AppState.isLoading) return;
        AppState.isLoading = true;

        const container = DOM.quotationsList;
        const loadMoreBtn = document.getElementById('load-more-quotations');

        if (!loadMore) {
            UI.showLoading(container);
            AppState.quotationsOffset = 0;
        }

        try {
            const data = await API.getQuotations(AppState.quotationsOffset);
            
            if (data.quotations && data.quotations.length > 0) {
                if (!loadMore) {
                    AppState.quotations = data.quotations;
                    this.renderQuotations();
                } else {
                    AppState.quotations.push(...data.quotations);
                    this.renderQuotations();
                }

                AppState.quotationsOffset += data.quotations.length;
                loadMoreBtn.style.display = data.hasMore ? 'block' : 'none';
            } else if (!loadMore) {
                UI.showEmpty(container, 'No quotations found', 'fas fa-file-alt');
                loadMoreBtn.style.display = 'none';
            }
        } catch (error) {
            if (!loadMore) {
                UI.showEmpty(container, 'Failed to load quotations', 'fas fa-exclamation-triangle');
            }
            loadMoreBtn.style.display = 'none';
        } finally {
            AppState.isLoading = false;
        }
    },

    renderQuotations() {
        const container = DOM.quotationsList;
        container.innerHTML = AppState.quotations.map(quotation => `
            <div class="item-card" onclick="QuotationManager.viewQuotation('${quotation.id}')">
                <div class="item-header">
                    <div>
                        <div class="item-title">${quotation.quotationNumber}</div>
                        <div class="item-subtitle">${quotation.customerName}</div>
                    </div>
                    <div class="item-status">${quotation.status}</div>
                </div>
                <div class="item-details">
                    <div class="item-detail">
                        <span class="item-detail-label">Date:</span>
                        <span class="item-detail-value">${Utils.formatDate(quotation.date)}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">Amount:</span>
                        <span class="item-detail-value">${Utils.formatCurrency(quotation.totalAmount)}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">Items:</span>
                        <span class="item-detail-value">${quotation.items?.length || 0} items</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-icon btn-secondary" onclick="event.stopPropagation(); QuotationManager.viewPDF('${quotation.id}')" title="View PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary" onclick="event.stopPropagation(); QuotationManager.editQuotation('${quotation.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary" onclick="event.stopPropagation(); QuotationManager.deleteQuotation('${quotation.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    showQuotationForm(quotation = null) {
        const isEdit = !!quotation;
        const title = isEdit ? 'Edit Quotation' : 'New Quotation';
        
        const formContent = `
            <form id="quotation-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Quotation Number</label>
                        <input type="text" class="form-input" name="quotationNumber" value="${quotation?.quotationNumber || ''}" ${isEdit ? 'readonly' : ''} required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date</label>
                        <input type="date" class="form-input" name="date" value="${quotation?.date || new Date().toISOString().split('T')[0]}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Customer</label>
                        <select class="form-select" name="customerId" required>
                            <option value="">Select Customer</option>
                            ${AppState.customers.map(customer => `
                                <option value="${customer.id}" ${quotation?.customerId === customer.id ? 'selected' : ''}>
                                    ${customer.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="status" required>
                            <option value="Draft" ${quotation?.status === 'Draft' ? 'selected' : ''}>Draft</option>
                            <option value="Sent" ${quotation?.status === 'Sent' ? 'selected' : ''}>Sent</option>
                            <option value="Approved" ${quotation?.status === 'Approved' ? 'selected' : ''}>Approved</option>
                            <option value="Rejected" ${quotation?.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-textarea" name="notes" placeholder="Additional notes...">${quotation?.notes || ''}</textarea>
                </div>
                <div id="quotation-items">
                    <label class="form-label">Items</label>
                    ${this.renderQuotationItems(quotation?.items || [])}
                </div>
                <button type="button" class="btn btn-secondary" onclick="QuotationManager.addQuotationItem()">
                    <i class="fas fa-plus"></i> Add Item
                </button>
            </form>
        `;

        const buttons = [
            { text: 'Cancel', action: 'UI.hideModal()' },
            { text: isEdit ? 'Update' : 'Create', class: 'btn-primary', action: 'QuotationManager.saveQuotation()' }
        ];

        UI.showModal(title, formContent, buttons);
    },

    renderQuotationItems(items) {
        return items.map((item, index) => `
            <div class="quotation-item" data-index="${index}">
                <div class="form-row">
                    <div class="form-group">
                        <select class="form-select" name="items[${index}][productId]" required>
                            <option value="">Select Product</option>
                            ${AppState.products.map(product => `
                                <option value="${product.id}" ${item.productId === product.id ? 'selected' : ''}>
                                    ${product.name} - ${Utils.formatCurrency(product.price)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <input type="number" class="form-input" name="items[${index}][quantity]" placeholder="Quantity" value="${item.quantity || ''}" min="1" required>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-secondary" onclick="QuotationManager.removeQuotationItem(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    addQuotationItem() {
        const container = document.getElementById('quotation-items');
        const items = container.querySelectorAll('.quotation-item');
        const newIndex = items.length;
        
        const newItem = document.createElement('div');
        newItem.className = 'quotation-item';
        newItem.dataset.index = newIndex;
        newItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <select class="form-select" name="items[${newIndex}][productId]" required>
                        <option value="">Select Product</option>
                        ${AppState.products.map(product => `
                            <option value="${product.id}">${product.name} - ${Utils.formatCurrency(product.price)}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <input type="number" class="form-input" name="items[${newIndex}][quantity]" placeholder="Quantity" min="1" required>
                </div>
                <div class="form-group">
                    <button type="button" class="btn btn-secondary" onclick="QuotationManager.removeQuotationItem(${newIndex})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(newItem);
    },

    removeQuotationItem(index) {
        const item = document.querySelector(`[data-index="${index}"]`);
        if (item) {
            item.remove();
        }
    },

    async saveQuotation() {
        const form = document.getElementById('quotation-form');
        const formData = new FormData(form);
        
        const quotationData = {
            id: Utils.generateId(),
            quotationNumber: formData.get('quotationNumber'),
            date: formData.get('date'),
            customerId: formData.get('customerId'),
            customerName: AppState.customers.find(c => c.id === formData.get('customerId'))?.name,
            status: formData.get('status'),
            notes: formData.get('notes'),
            items: [],
            totalAmount: 0
        };

        // Process items
        const items = form.querySelectorAll('.quotation-item');
        items.forEach((item, index) => {
            const productId = formData.get(`items[${index}][productId]`);
            const quantity = parseInt(formData.get(`items[${index}][quantity]`));
            
            if (productId && quantity) {
                const product = AppState.products.find(p => p.id === productId);
                if (product) {
                    const itemTotal = product.price * quantity;
                    quotationData.items.push({
                        productId,
                        productName: product.name,
                        quantity,
                        unitPrice: product.price,
                        total: itemTotal
                    });
                    quotationData.totalAmount += itemTotal;
                }
            }
        });

        try {
            await API.saveQuotation(quotationData);
            UI.hideModal();
            UI.showToast('Quotation saved successfully!');
            this.loadQuotations();
        } catch (error) {
            UI.showToast('Failed to save quotation', 'error');
        }
    },

    viewQuotation(id) {
        const quotation = AppState.quotations.find(q => q.id === id);
        if (!quotation) return;

        const content = `
            <div class="quotation-view">
                <div class="form-row">
                    <div><strong>Quotation Number:</strong> ${quotation.quotationNumber}</div>
                    <div><strong>Date:</strong> ${Utils.formatDate(quotation.date)}</div>
                </div>
                <div class="form-row">
                    <div><strong>Customer:</strong> ${quotation.customerName}</div>
                    <div><strong>Status:</strong> ${quotation.status}</div>
                </div>
                <div><strong>Items:</strong></div>
                <table style="width: 100%; margin-top: 1rem; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <th style="text-align: left; padding: 0.5rem;">Product</th>
                            <th style="text-align: right; padding: 0.5rem;">Qty</th>
                            <th style="text-align: right; padding: 0.5rem;">Price</th>
                            <th style="text-align: right; padding: 0.5rem;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quotation.items?.map(item => `
                            <tr>
                                <td style="padding: 0.5rem;">${item.productName}</td>
                                <td style="text-align: right; padding: 0.5rem;">${item.quantity}</td>
                                <td style="text-align: right; padding: 0.5rem;">${Utils.formatCurrency(item.unitPrice)}</td>
                                <td style="text-align: right; padding: 0.5rem;">${Utils.formatCurrency(item.total)}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4">No items</td></tr>'}
                    </tbody>
                    <tfoot>
                        <tr style="border-top: 1px solid var(--border); font-weight: bold;">
                            <td colspan="3" style="text-align: right; padding: 0.5rem;">Total:</td>
                            <td style="text-align: right; padding: 0.5rem;">${Utils.formatCurrency(quotation.totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>
                ${quotation.notes ? `<div style="margin-top: 1rem;"><strong>Notes:</strong><br>${quotation.notes}</div>` : ''}
            </div>
        `;

        const buttons = [
            { text: 'Close', action: 'UI.hideModal()' },
            { text: 'Edit', class: 'btn-primary', action: `QuotationManager.editQuotation('${id}')` }
        ];

        UI.showModal('View Quotation', content, buttons);
    },

    editQuotation(id) {
        const quotation = AppState.quotations.find(q => q.id === id);
        if (quotation) {
            UI.hideModal();
            setTimeout(() => this.showQuotationForm(quotation), 100);
        }
    },

    async deleteQuotation(id) {
        if (confirm('Are you sure you want to delete this quotation?')) {
            try {
                await API.deleteQuotation(id);
                UI.showToast('Quotation deleted successfully!');
                this.loadQuotations();
            } catch (error) {
                UI.showToast('Failed to delete quotation', 'error');
            }
        }
    },

    viewPDF(id) {
        // This would generate and show PDF - implementation depends on your PDF generation method
        UI.showToast('PDF generation feature coming soon!');
    }
};

// Product Manager
const ProductManager = {
    async loadProducts() {
        if (AppState.isLoading) return;
        AppState.isLoading = true;

        const container = DOM.productsList;
        UI.showLoading(container);

        try {
            const data = await API.getProducts();
            AppState.products = data.products || [];
            
            if (AppState.products.length > 0) {
                this.renderProducts(AppState.products);
            } else {
                UI.showEmpty(container, 'No products found', 'fas fa-boxes');
            }
        } catch (error) {
            UI.showEmpty(container, 'Failed to load products', 'fas fa-exclamation-triangle');
        } finally {
            AppState.isLoading = false;
        }
    },

    renderProducts(products) {
        const container = DOM.productsList;
        container.innerHTML = products.map(product => `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <div class="item-title">${product.name}</div>
                        <div class="item-subtitle">${product.category}</div>
                    </div>
                    <div class="item-status">${product.inStock ? 'In Stock' : 'Out of Stock'}</div>
                </div>
                <div class="item-details">
                    <div class="item-detail">
                        <span class="item-detail-label">Price:</span>
                        <span class="item-detail-value">${Utils.formatCurrency(product.price)}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">SKU:</span>
                        <span class="item-detail-value">${product.sku}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">Stock:</span>
                        <span class="item-detail-value">${product.stockQuantity}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-icon btn-secondary" onclick="ProductManager.editProduct('${product.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary" onclick="ProductManager.deleteProduct('${product.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    showProductForm(product = null) {
        const isEdit = !!product;
        const title = isEdit ? 'Edit Product' : 'New Product';
        
        const formContent = `
            <form id="product-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Product Name</label>
                        <input type="text" class="form-input" name="name" value="${product?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <input type="text" class="form-input" name="category" value="${product?.category || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">SKU</label>
                        <input type="text" class="form-input" name="sku" value="${product?.sku || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Price (₹)</label>
                        <input type="number" class="form-input" name="price" value="${product?.price || ''}" min="0" step="0.01" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Stock Quantity</label>
                        <input type="number" class="form-input" name="stockQuantity" value="${product?.stockQuantity || ''}" min="0" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Unit</label>
                        <input type="text" class="form-input" name="unit" value="${product?.unit || ''}" placeholder="e.g., kg, pcs, m">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" name="description" placeholder="Product description...">${product?.description || ''}</textarea>
                </div>
            </form>
        `;

        const buttons = [
            { text: 'Cancel', action: 'UI.hideModal()' },
            { text: isEdit ? 'Update' : 'Create', class: 'btn-primary', action: 'ProductManager.saveProduct()' }
        ];

        UI.showModal(title, formContent, buttons);
    },

    async saveProduct() {
        const form = document.getElementById('product-form');
        const formData = new FormData(form);
        
        const productData = {
            id: Utils.generateId(),
            name: formData.get('name'),
            category: formData.get('category'),
            sku: formData.get('sku'),
            price: parseFloat(formData.get('price')),
            stockQuantity: parseInt(formData.get('stockQuantity')),
            unit: formData.get('unit'),
            description: formData.get('description'),
            inStock: parseInt(formData.get('stockQuantity')) > 0
        };

        try {
            await API.saveProduct(productData);
            UI.hideModal();
            UI.showToast('Product saved successfully!');
            this.loadProducts();
        } catch (error) {
            UI.showToast('Failed to save product', 'error');
        }
    },

    editProduct(id) {
        const product = AppState.products.find(p => p.id === id);
        if (product) {
            this.showProductForm(product);
        }
    },

    async deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await API.deleteProduct(id);
                UI.showToast('Product deleted successfully!');
                this.loadProducts();
            } catch (error) {
                UI.showToast('Failed to delete product', 'error');
            }
        }
    },

    filterProducts: Utils.debounce((searchTerm) => {
        const filtered = AppState.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
        ProductManager.renderProducts(filtered);
    }, 300)
};

// Customer Manager
const CustomerManager = {
    async loadCustomers() {
        if (AppState.isLoading) return;
        AppState.isLoading = true;

        const container = DOM.customersList;
        UI.showLoading(container);

        try {
            const data = await API.getCustomers();
            AppState.customers = data.customers || [];
            
            if (AppState.customers.length > 0) {
                this.renderCustomers(AppState.customers);
            } else {
                UI.showEmpty(container, 'No customers found', 'fas fa-users');
            }
        } catch (error) {
            UI.showEmpty(container, 'Failed to load customers', 'fas fa-exclamation-triangle');
        } finally {
            AppState.isLoading = false;
        }
    },

    renderCustomers(customers) {
        const container = DOM.customersList;
        container.innerHTML = customers.map(customer => `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <div class="item-title">${customer.name}</div>
                        <div class="item-subtitle">${customer.email}</div>
                    </div>
                    <div class="item-status">${customer.active ? 'Active' : 'Inactive'}</div>
                </div>
                <div class="item-details">
                    <div class="item-detail">
                        <span class="item-detail-label">Phone:</span>
                        <span class="item-detail-value">${customer.phone}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">Company:</span>
                        <span class="item-detail-value">${customer.company || 'N/A'}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-label">GST:</span>
                        <span class="item-detail-value">${customer.gstNumber || 'N/A'}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-icon btn-secondary" onclick="CustomerManager.editCustomer('${customer.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary" onclick="CustomerManager.deleteCustomer('${customer.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    showCustomerForm(customer = null) {
        const isEdit = !!customer;
        const title = isEdit ? 'Edit Customer' : 'New Customer';
        
        const formContent = `
            <form id="customer-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Customer Name</label>
                        <input type="text" class="form-input" name="name" value="${customer?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" name="email" value="${customer?.email || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="tel" class="form-input" name="phone" value="${customer?.phone || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Company</label>
                        <input type="text" class="form-input" name="company" value="${customer?.company || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">GST Number</label>
                        <input type="text" class="form-input" name="gstNumber" value="${customer?.gstNumber || ''}" placeholder="Optional">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="active">
                            <option value="true" ${customer?.active !== false ? 'selected' : ''}>Active</option>
                            <option value="false" ${customer?.active === false ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea class="form-textarea" name="address" placeholder="Full address...">${customer?.address || ''}</textarea>
                </div>
            </form>
        `;

        const buttons = [
            { text: 'Cancel', action: 'UI.hideModal()' },
            { text: isEdit ? 'Update' : 'Create', class: 'btn-primary', action: 'CustomerManager.saveCustomer()' }
        ];

        UI.showModal(title, formContent, buttons);
    },

    async saveCustomer() {
        const form = document.getElementById('customer-form');
        const formData = new FormData(form);
        
        const customerData = {
            id: Utils.generateId(),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            gstNumber: formData.get('gstNumber'),
            address: formData.get('address'),
            active: formData.get('active') === 'true'
        };

        try {
            await API.saveCustomer(customerData);
            UI.hideModal();
            UI.showToast('Customer saved successfully!');
            this.loadCustomers();
        } catch (error) {
            UI.showToast('Failed to save customer', 'error');
        }
    },

    editCustomer(id) {
        const customer = AppState.customers.find(c => c.id === id);
        if (customer) {
            this.showCustomerForm(customer);
        }
    },

    async deleteCustomer(id) {
        if (confirm('Are you sure you want to delete this customer?')) {
            try {
                await API.deleteCustomer(id);
                UI.showToast('Customer deleted successfully!');
                this.loadCustomers();
            } catch (error) {
                UI.showToast('Failed to delete customer', 'error');
            }
        }
    },

    filterCustomers: Utils.debounce((searchTerm) => {
        const filtered = AppState.customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm) ||
            (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        CustomerManager.renderCustomers(filtered);
    }, 300)
};

// PWA Functions
const PWA = {
    deferredPrompt: null,

    init() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }

        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallPrompt();
        });
    },

    showInstallPrompt() {
        DOM.installPrompt.style.display = 'block';
    },

    hideInstallPrompt() {
        DOM.installPrompt.style.display = 'none';
    },

    async installApp() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        
        this.deferredPrompt = null;
        this.hideInstallPrompt();
    }
};

// App Initialization
const App = {
    async init() {
        // Initialize PWA
        PWA.init();

        // Set up event listeners
        this.setupEventListeners();

        // Show loading screen
        DOM.loadingScreen.style.display = 'flex';

        try {
            // Load initial data
            await Promise.all([
                CustomerManager.loadCustomers(),
                ProductManager.loadProducts()
            ]);

            // Load quotations for home tab
            await QuotationManager.loadQuotations();

            // Hide loading screen and show app
            DOM.loadingScreen.style.display = 'none';
            DOM.app.style.display = 'block';

        } catch (error) {
            console.error('App initialization failed:', error);
            DOM.loadingScreen.innerHTML = `
                <div class="loading-content">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                    <p style="color: white;">Failed to load app. Please check your internet connection and try again.</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: white; color: var(--primary-color); border: none; border-radius: 0.5rem; cursor: pointer;">Retry</button>
                </div>
            `;
        }
    },

    setupEventListeners() {
        // Tab navigation
        DOM.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                UI.switchTab(btn.dataset.tab);
            });
        });

        // Modal close
        document.getElementById('modal-close').addEventListener('click', UI.hideModal);
        DOM.modal.addEventListener('click', (e) => {
            if (e.target === DOM.modal) {
                UI.hideModal();
            }
        });

        // New buttons
        document.getElementById('new-quotation-btn').addEventListener('click', () => {
            QuotationManager.showQuotationForm();
        });

        document.getElementById('new-product-btn').addEventListener('click', () => {
            ProductManager.showProductForm();
        });

        document.getElementById('new-customer-btn').addEventListener('click', () => {
            CustomerManager.showCustomerForm();
        });

        // Load more quotations
        document.getElementById('load-more-quotations').addEventListener('click', () => {
            QuotationManager.loadQuotations(true);
        });

        // Search functionality
        document.getElementById('product-search').addEventListener('input', (e) => {
            ProductManager.filterProducts(e.target.value);
        });

        document.getElementById('customer-search').addEventListener('input', (e) => {
            CustomerManager.filterCustomers(e.target.value);
        });

        // Sync button
        document.getElementById('sync-btn').addEventListener('click', async () => {
            AppState.cache.clear();
            UI.showToast('Syncing data...');
            
            try {
                await Promise.all([
                    QuotationManager.loadQuotations(),
                    ProductManager.loadProducts(),
                    CustomerManager.loadCustomers()
                ]);
                UI.showToast('Data synced successfully!');
            } catch (error) {
                UI.showToast('Sync failed', 'error');
            }
        });

        // PWA install
        document.getElementById('install-btn').addEventListener('click', () => {
            PWA.installApp();
        });

        document.getElementById('dismiss-install').addEventListener('click', () => {
            PWA.hideInstallPrompt();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        if (AppState.currentTab === 'home') {
                            QuotationManager.showQuotationForm();
                        } else if (AppState.currentTab === 'products') {
                            ProductManager.showProductForm();
                        } else if (AppState.currentTab === 'customers') {
                            CustomerManager.showCustomerForm();
                        }
                        break;
                    case 'r':
                        e.preventDefault();
                        document.getElementById('sync-btn').click();
                        break;
                }
            }

            // Escape to close modal
            if (e.key === 'Escape') {
                UI.hideModal();
            }
        });

        // Online/offline detection
        window.addEventListener('online', () => {
            UI.showToast('Connection restored');
        });

        window.addEventListener('offline', () => {
            UI.showToast('Connection lost. App requires internet connection.', 'error');
        });
    }
};

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Global error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    UI.showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    UI.showToast('Connection error occurred', 'error');
});

// Expose global functions for inline event handlers
window.QuotationManager = QuotationManager;
window.ProductManager = ProductManager;
window.CustomerManager = CustomerManager;
window.UI = UI;
