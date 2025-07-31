document.getElementById("new-quote-btn").addEventListener("click", function () {
  document.getElementById("quote-form").style.display = "block";
  document.getElementById("quote-list").style.display = "none";
});

document.getElementById("quote-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const quoteNo = document.getElementById("quoteNo").value;
  const customer = document.getElementById("customerName").value;

  const list = document.getElementById("quote-list");
  const newItem = document.createElement("div");
  newItem.className = "quote-item";
  newItem.innerHTML = `<strong>${quoteNo}</strong><br>${customer}`;
  list.appendChild(newItem);

  document.getElementById("quote-form").reset();
  document.getElementById("quote-form").style.display = "none";
  list.style.display = "block";
});
