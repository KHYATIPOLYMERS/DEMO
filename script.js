function fetchQuotations() {
  google.script.run.withSuccessHandler(displayQuotations).getQuotations;
}

function displayQuotations(data) {
  const container = document.getElementById("quoteList");
  container.innerHTML = "";

  if (data.length === 0) {
    container.textContent = "No quotations found.";
    return;
  }

  data.forEach((row) => {
    const div = document.createElement("div");
    div.className = "quote-item";
    div.innerHTML = `
      <div class="quote-no">Quote No: ${row[0]}</div>
      <div>Customer: ${row[1]}</div>
      <div>Date: ${row[2]}</div>
    `;
    container.appendChild(div);
  });
}

window.onload = fetchQuotations;
