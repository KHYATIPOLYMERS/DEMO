let quotations = [];
let currentIndex = 0;
const batchSize = 15;
const API_URL = https://script.google.com/macros/s/AKfycbzgjW8V1rTaBjnpeh1RZ-ieWHlICOPqyaBaoVNzghPluDmAwD_aEb6WnDkkYo11Oztp/exec; // Replace with actual Web App URL

// Load from Google Apps Script
async function fetchQuotations() {
  try {
    const response = await fetch(`${API_URL}?action=getLatestQuotations`);
    const data = await response.json();
    quotations = data;
    loadMoreQuotations();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function loadMoreQuotations() {
  const listContainer = document.getElementById('quotation-list');
  const nextBatch = quotations.slice(currentIndex, currentIndex + batchSize);

  nextBatch.forEach(q => {
    const item = document.createElement('div');
    item.className = 'quotation-item';
    item.innerText = `${q.QuoteNo} — ${q.CustomerName}`;
    listContainer.appendChild(item);
  });

  currentIndex += batchSize;
  if (currentIndex >= quotations.length) {
    document.getElementById('load-more-btn').style.display = 'none';
  }
}

// Call on page load
window.onload = fetchQuotations;
