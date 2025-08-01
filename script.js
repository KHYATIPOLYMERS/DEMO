const sheetURL = 'https://script.google.com/macros/s/AKfycbzgjW8V1rTaBjnpeh1RZ-ieWHlICOPqyaBaoVNzghPluDmAwD_aEb6WnDkkYo11Oztp/exec';

function toggleSection(id) {
  const section = document.getElementById(id);
  section.classList.toggle('open');
}

// Product Modal
function openProductModal(product = null, index = null) {
  document.getElementById('product-modal').style.display = 'flex';
  document.getElementById('product-form').reset();
  document.getElementById('modal-title').innerText = product ? 'Edit Product' : 'Add Product';
  document.getElementById('editIndex').value = index ?? '';

  if (product) {
    ['ItemKeyID', 'ItemName', 'Alias', 'Category', 'Unit', 'PriceList'].forEach(key => {
      document.getElementById(key).value = product[key] || '';
    });
  }
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

document.getElementById('product-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const product = {
    ItemKeyID: document.getElementById('ItemKeyID').value,
    ItemName: document.getElementById('ItemName').value,
    Alias: document.getElementById('Alias').value,
    Category: document.getElementById('Category').value,
    Unit: document.getElementById('Unit').value,
    PriceList: document.getElementById('PriceList').value
  };
  const index = document.getElementById('editIndex').value;
  await fetch(sheetURL + '?action=saveProduct', {
    method: 'POST',
    body: JSON.stringify({ product, index }),
  });
  closeProductModal();
  loadProducts();
});

async function loadProducts() {
  const res = await fetch(sheetURL + '?action=getProducts');
  const products = await res.json();
  const container = document.getElementById('product-table-container');
  container.innerHTML = '';
  products.forEach((product, index) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>${product.ItemName}</strong> - ${product.Category} - ₹${product.PriceList}
      <button onclick='openProductModal(${JSON.stringify(product)}, ${index})'>Edit</button>
      <button onclick='deleteProduct(${index})'>Delete</button>
    `;
    container.appendChild(div);
  });
}

async function deleteProduct(index) {
  if (confirm('Delete this product?')) {
    await fetch(sheetURL + '?action=deleteProduct', {
      method: 'POST',
      body: JSON.stringify({ index }),
    });
    loadProducts();
  }
}

window.onload = function () {
  loadProducts();
};
