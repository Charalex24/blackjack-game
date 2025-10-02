const tbody = document.querySelector("#historyTable tbody");

function loadHistoryTable() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  tbody.innerHTML = "";

  history.forEach(h => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${h.created_at}</td>
      <td>${h.player.map(c => c.rank + c.suit).join(", ")}</td>
      <td>${h.dealer.map(c => c.rank + c.suit).join(", ")}</td>
      <td>${h.result}</td>
      <td>${h.bet}</td>
      <td>${h.payout}</td>
    `;
    tbody.appendChild(tr);
  });
}

loadHistoryTable();
