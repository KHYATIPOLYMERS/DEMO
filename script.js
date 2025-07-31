// Toggle section open/close
function toggleSection(id) {
  const section = document.getElementById(id);
  section.classList.toggle("open");
}

// Dummy function to handle new quotation creation
function createNewQuotation() {
  alert("Create New Quotation clicked.");
  // You can replace this with form/modal display or redirection logic
}

// Load more quotations (placeholder)
function loadMoreQuotations() {
  alert("Load more quotations...");
  // Fetch more data logic here
}

// On DOM ready, load latest quotations (example only)
document.addEventListener("DOMContentLoaded", () => {
  const quotationList = document.getElementById("quotations-list");
  quotationList.innerHTML = ""; // clear dummy

  // Fetch actual data if needed
});
