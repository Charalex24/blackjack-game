let playerHand = [];
let dealerHand = [];

const dealerDiv = document.getElementById("dealerHand");
const playerDiv = document.getElementById("playerHand");
const resultDiv = document.getElementById("result");
const chipDisplay = document.getElementById("chipCount");
const aiSuggestionDiv = document.getElementById("aiSuggestion");

// Initialize chips
function loadChips() {
  let chips = parseInt(localStorage.getItem("chips") || "1000");
  chipDisplay.textContent = chips;
  return chips;
}

function saveChips(chips) {
  localStorage.setItem("chips", chips);
  chipDisplay.textContent = chips;
}

// Load game history
function loadHistory() {
  let history = JSON.parse(localStorage.getItem("history") || "[]");
  return history;
}

function saveHistory(entry) {
  let history = loadHistory();
  history.unshift(entry); // newest first
  localStorage.setItem("history", JSON.stringify(history));
}

// Card utilities
function randomCard() {
  const suits = ["♠","♥","♦","♣"];
  const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  return { suit: suits[Math.floor(Math.random()*suits.length)],
           rank: ranks[Math.floor(Math.random()*ranks.length)] };
}

function cardValue(rank) {
  if (["K","Q","J"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank);
}

function handValue(hand) {
  let val = 0, aces = 0;
  hand.forEach(c => {
    val += cardValue(c.rank);
    if (c.rank === "A") aces++;
  });
  while (val > 21 && aces > 0) { val -= 10; aces--; }
  return val;
}

// Render cards
function renderHand(div, hand, hideFirst=false) {
  div.innerHTML = "";
  hand.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "card";
    el.textContent = (i === 0 && hideFirst) ? "?" : c.rank + c.suit;
    div.appendChild(el);
  });
}

// Start game
function startGame() {
  playerHand = [randomCard(), randomCard()];
  dealerHand = [randomCard(), randomCard()];

  renderHand(playerDiv, playerHand);
  renderHand(dealerDiv, dealerHand, true);
  resultDiv.textContent = "";
  aiSuggestionDiv.textContent = "";

  document.getElementById("hitBtn").disabled = false;
  document.getElementById("standBtn").disabled = false;
  document.getElementById("aiBtn").disabled = false;
}

// Player hits
function playerHit() {
  playerHand.push(randomCard());
  renderHand(playerDiv, playerHand);

  if (handValue(playerHand) > 21) {
    endGame("You busted! Dealer wins.", "lose");
  }
}

// Player stands
async function playerStand() {
  renderHand(dealerDiv, dealerHand); // reveal dealer

  // Dealer draws until 17+
  while (handValue(dealerHand) < 17) {
    await delay(500);
    dealerHand.push(randomCard());
    renderHand(dealerDiv, dealerHand);
  }

  const playerTotal = handValue(playerHand);
  const dealerTotal = handValue(dealerHand);
  let message = "";
  let result = "";

  if (playerTotal > 21) {
    message = "You busted! Dealer wins.";
    result = "lose";
  } else if (dealerTotal > 21) {
    message = "Dealer busted! You win!";
    result = "win";
  } else if (playerTotal > dealerTotal) {
    message = "You win!";
    result = "win";
  } else if (playerTotal < dealerTotal) {
    message = "Dealer wins.";
    result = "lose";
  } else {
    message = "Push.";
    result = "push";
  }

  endGame(message, result);
}

// End game
function endGame(msg, result = null) {
  renderHand(dealerDiv, dealerHand); // show dealer hand
  resultDiv.textContent = msg;

  document.getElementById("hitBtn").disabled = true;
  document.getElementById("standBtn").disabled = true;
  document.getElementById("aiBtn").disabled = true;

  if (result) {
    const bet = 10;
    let chips = loadChips();
    let payout = 0;
    if (result === "win") payout = bet;
    if (result === "lose") payout = -bet;
    chips += payout;
    saveChips(chips);

    saveHistory({
      created_at: new Date().toLocaleString(),
      player: playerHand,
      dealer: dealerHand,
      result,
      bet,
      payout
    });
  }
}

// AI suggestion (simple threshold)
function askAI() {
  const total = handValue(playerHand);
  let suggestion = "stand";
  let reason = "";

  // Basic Blackjack strategy (super simplified)
  if (total <= 11) {
    suggestion = "hit";
    reason = "Your hand is low, so hitting is safe.";
  } else if (total >= 17) {
    suggestion = "stand";
    reason = "Your hand is high, so standing avoids busting.";
  } else {
    // Dealer up card consideration (very basic)
    const dealerVal = cardValue(dealerHand[0].rank);
    if (dealerVal >= 7) {
      suggestion = "hit";
      reason = "Dealer has a strong up card, better to try improving your hand.";
    } else {
      suggestion = "stand";
      reason = "Dealer has a weak up card, safer to stand.";
    }
  }

  aiSuggestionDiv.textContent = `AI Suggestion: ${suggestion.toUpperCase()} — ${reason}`;
}

// Small delay helper
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Hook buttons
document.getElementById("dealBtn").onclick = startGame;
document.getElementById("hitBtn").onclick = playerHit;
document.getElementById("standBtn").onclick = playerStand;
document.getElementById("aiBtn").onclick = askAI;
document.getElementById("historyBtn").onclick = () => {
  window.location.href = "history.html";
};

// Initialize
loadChips();