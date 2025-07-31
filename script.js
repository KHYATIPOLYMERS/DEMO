document.addEventListener("DOMContentLoaded", function () {
  const quoteItemsList = document.getElementById("quoteItems");
  const quoteFormSection = document.getElementById("quoteForm");
  const quoteForm = document.getElementById("form");
  const showFormBtn = document.getElementById("showFormBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  // Fetch and list existing quotations
  fetchQuotes();

  // Show the form for a new quotation
  showFormBtn.addEventListener("click", () => {
    quoteForm.reset();
    quoteFormSection.classList.remove("hidden");
    quoteForm.scrollIntoView({ behavior: "smooth" });
  });

  // Cancel form
  cancelBtn.addEventListener("click", () => {
    quoteFormSection.classList.add("hidden");
  });

  // Handle form submit
  quoteForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = {
      quoteNo: document.getElementById("quoteNo").value,
      customerName: document.getElementById("customerName").value,
      quoteDate: document.getElementById("quoteDate").value,
      amount: document.getElementById("amount").value,
      remarks: document.getElementById("remarks").value,
    };

    google.script.run
      .withSuccessHandler(() => {
        alert("Quotation saved successfully.");
        fetchQuotes();
        quoteFormSection.classList.add("hidden");
      })
      .saveQuote(data);
  });

  // Load existing quotes from Google Sheets
  function fetchQuotes() {
    google.script.run.withSuccessHandler(renderQuotes).getQuotes();
  }

  // Render quotes to the list
  function renderQuotes(quotes) {
    quoteItemsList.innerHTML = "";
    quotes.forEach((q) => {
      const li = document.createElement("li");
      li.textContent = `${q.quoteNo} - ${q.customerName} - ₹${q.amount}`;
      quoteItemsList.appendChild(li);
    });
  }
});
