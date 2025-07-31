const scriptURL = "https://script.google.com/macros/s/AKfycbzIW2miqVjRwF2kkopwLrGtMD94oiI8BYdQz88NXVX8QxWOe4w11Lz08P5RZq5WQt3Ekg/exec";

// Load quotations from backend
async function loadQuotations() {
  const response = await fetch(scriptURL + "?action=getQuotes");
  const data = await response.json();
  displayQuotes(data);
}

// Submit a new quotation to backend
async function submitQuote(e) {
  e.preventDefault();

  const formData = {
    quoteNo: document.getElementById("quoteNo").value.trim(),
    customerName: document.getElementById("customerName").value.trim(),
    quoteDate: document.getElementById("quoteDate").value.trim(),
    amount: document.getElementById("amount").value.trim(),
    remarks: document.getElementById("remarks").value.trim()
  };

  const response = await fetch(scriptURL + "?action=saveQuote", {
    method: "POST",
    body: JSON.stringify(formData),
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.ok) {
    alert("Quotation saved!");
    document.getElementById("quoteForm").reset();
    loadQuotations();
  } else {
    alert("Error saving quotation.");
  }
}
