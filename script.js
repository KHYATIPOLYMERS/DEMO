const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzgjW8V1rTaBjnpeh1RZ-ieWHlICOPqyaBaoVNzghPluDmAwD_aEb6WnDkkYo11Oztp/exec"; // Replace with your deployed Web App URL

function loadQuotations() {
  fetch(`${WEB_APP_URL}?action=getQuotations`)
    .then(res => res.json())
    .then(data => {
      const listArea = document.getElementById("listArea");
      listArea.innerHTML = "";
      data.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.QuoteNo} - ${item.CustomerName} (${item.QuoteDate})`;
        listArea.appendChild(li);
      });
    });
}

function loadCustomers() {
  fetch(`${WEB_APP_URL}?action=getCustomers`)
    .then(res => res.json())
    .then(data => {
      const listArea = document.getElementById("listArea");
      listArea.innerHTML = "<h2>Customer List</h2>";
      data.forEach(c => {
        const li = document.createElement("li");
        li.textContent = `${c.CustomerName} - ${c.Contact}`;
        listArea.appendChild(li);
      });
    });
}

function loadProducts() {
  fetch(`${WEB_APP_URL}?action=getProducts`)
    .then(res => res.json())
    .then(data => {
      const listArea = document.getElementById("listArea");
      listArea.innerHTML = "<h2>Product List</h2>";
      data.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.ProductName} - ${p.Size} - ${p.Price}`;
        listArea.appendChild(li);
      });
    });
}

function newQuotation() {
  alert("Form UI for new quotation coming soon!");
}
