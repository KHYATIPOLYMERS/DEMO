// Configuration
const apiUrl = "https://script.google.com/macros/s/AKfycbzgjW8V1rTaBjnpeh1RZ-ieWHlICOPqyaBaoVNzghPluDmAwD_aEb6WnDkkYo11Oztp/exec";

// State management
let quotations = [];
let customers = [];
let products = [];
let currentIndex = 0;
const batchSize = 15;

// Section toggle functionality
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  const isOpen = section.classList.contains('open');
  
  if (isOpen) {
    section.classList.remove('open');
  } else {
    section.classList.add('open');
    
    // Load data when section is opened for the first time
    if (sectionId === 'customers-section' && customers.length === 0) {
      loadData('customers');
    } else if (sectionId === 'products-section' && products.length === 0) {
      loadData('products');
    }
  }
}

// Data loading functionality
async function loadData(type) {
  const listId = `${type}-list`;
  const container = document.getElementById(listId);
  
  // Show loading state
  container.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner"></i>
      Loading ${type}...
    </div>
  `;

  try {
    const response = await fetch(`${apiUrl}?type=${type}`);
    const data = await response.json();
    
    if (type === 'quotations') {
      quotations = data || [];
      displayQuotations();
    } else if (type === 'customers') {
      customers = data || [];
      displayCustomers();
    } else if (type === 'products') {
      products = data || [];
      displayProducts();
    }
  } catch (error) {
    console.error(`Error loading ${type}:`, error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading ${type}. Please try again.</p>
      </div>
    `;
  }
}

// Display functions
function displayQuotations() {
  const container = document.getElementById('quotations-list');
  container.innerHTML = '';
  
  if (quotations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-alt"></i>
        <p>No quotations found</p>
      </div>
    `;
    return;
  }

  const batch = quotations.slice(0, currentIndex + batchSize);
  batch.forEach((quote, index) => {
    const item = document.createElement('div');
    item.className = 'content-item';
    item.innerHTML = `
      <div class="item-header">
        <div class="item-title">${quote.QuoteNo || `Quote #${index + 1}`}</div>
        <div class="item-status">Active</div>
      </div>
      <div class="item-meta">${quote.CustomerName || 'Customer Name'}</div>
    `;
    container.appendChild(item);
  });

  currentIndex += batchSize;
  const loadMoreBtn = document.getElementById('load-more-btn');
  loadMoreBtn.style.display = currentIndex < quotations.length ? 'block' : 'none';
}

function displayCustomers() {
  const container = document.getElementById('customers-list');
  container.innerHTML = '';
  
  if (customers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>No customers found</p>
      </div>
    `;
    return;
  }

  customers.forEach((customer, index) => {
    const item = document.createElement('div');
    item.className = 'content-item';
    item.innerHTML = `
      <div class="item-title">${customer}</div>
      <div class="item-meta">Customer #${index + 1}</div>
    `;
    container.appendChild(item);
  });
}

function displayProducts() {
  const container = document.getElementById('products-list');
  container.innerHTML = '';
  
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-boxes"></i>
        <p>No products found</p>
      </div>
    `;
    return;
  }

  products.forEach((product, index) => {
    const item = document.createElement('div');
    item.className = 'content-item';
    item.innerHTML = `
      <div class="item-title">${product}</div>
      <div class="item-meta">Product #${index + 1}</div>
    `;
    container.appendChild(item);
  });
}

// Load more quotations
function loadMoreQuotations() {
  displayQuotations();
}

// Action functions
function createNewQuotation() {
  alert("New Quotation Form (Coming Soon)");
  // TODO: Implement new quotation form
}

function showCustomerList() {
  const section = document.getElementById('customers-section');
  if (!section.classList.contains('open')) {
    toggleSection('customers-section');
  }
  section.scrollIntoView({ behavior: 'smooth' });
}

function showProductList() {
  const section = document.getElementById('products-section');
  if (!section.classList.contains('open')) {
    toggleSection('products-section');
  }
  section.scrollIntoView({ behavior: 'smooth' });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Load quotations on page load
  loadData('quotations');
});
