/* ---------- mobile menu ---------- */
function toggleMenu() {
  document.getElementById("mobileMenu").classList.toggle("open");
}

/* ---------- render destination cards ---------- */
function cardHTML(p) {
  return `
  <article class="card">
    <img src="${p.image}" alt="${p.name}" loading="lazy" />
    <div class="card-shade"></div>
    <div class="opt">
      <button class="opt-btn" aria-label="Options for ${p.name}"
              onclick="toggleOptions(this)">+</button>
      <div class="opt-menu">
        <a href="place.html?slug=${p.slug}">View details</a>
        <a href="book.html?slug=${p.slug}">Book this trip</a>
      </div>
    </div>
    <div class="card-body">
      <h3>${p.name}</h3>
      <p class="region">${p.region}</p>
      <div class="card-row">
        <span>&#9733; ${p.rating}</span>
        <span class="price">$${p.price}</span>
      </div>
    </div>
  </article>`;
}

function renderPlaces(targetId, list) {
  const el = document.getElementById(targetId);
  if (el) el.innerHTML = (list || PLACES).map(cardHTML).join("");
}

/* the small box: click to reveal 2 options */
function toggleOptions(btn) {
  const menu = btn.nextElementSibling;
  document.querySelectorAll(".opt-menu.open").forEach(m => { if (m !== menu) m.classList.remove("open"); });
  menu.classList.toggle("open");
}
document.addEventListener("click", e => {
  if (!e.target.closest(".opt")) {
    document.querySelectorAll(".opt-menu.open").forEach(m => m.classList.remove("open"));
  }
});

/* ---------- home search ---------- */
function handleSearch(e) {
  e.preventDefault();
  const q = e.target.querySelector("input").value.trim().toLowerCase();
  const list = q ? PLACES.filter(p => (p.name + p.region).toLowerCase().includes(q)) : PLACES;
  renderPlaces("placeGrid", list);
}

/* ---------- detail page ---------- */
function renderDetail() {
  const p = getPlace(queryParam("slug"));
  const el = document.getElementById("detail");
  if (!el) return;
  if (!p) { el.innerHTML = "<h1>Destination not found</h1>"; return; }
  document.title = `${p.name} — Wanderly`;
  el.innerHTML = `
    <img src="${p.image}" alt="${p.name}" style="border-radius:24px;height:340px;width:100%;object-fit:cover" />
    <h1 style="margin:20px 0 4px">${p.name}</h1>
    <p class="sub">${p.region} &middot; ${p.days} &middot; best ${p.best} &middot; &#9733; ${p.rating}</p>
    <p>${p.description}</p>
    <h2 class="section-title" style="margin-top:24px">Highlights</h2>
    <ul class="tags">${p.highlights.map(h => `<li>${h}</li>`).join("")}</ul>
    <p style="margin-top:24px"><a class="btn" href="book.html?slug=${p.slug}">Book this trip — $${p.price}</a></p>`;
}

/* ---------- booking page ---------- */
function renderBooking() {
  const p = getPlace(queryParam("slug"));
  const el = document.getElementById("booking");
  if (!el) return;
  if (!p) { el.innerHTML = "<h1>Trip not found</h1>"; return; }
  document.title = `Book ${p.name} — Wanderly`;
  el.innerHTML = `
    <a href="place.html?slug=${p.slug}" style="color:var(--primary);font-size:14px">&larr; Back to ${p.name}</a>
    <h1 style="margin:10px 0 2px">Book ${p.name}</h1>
    <p class="sub">${p.days} &middot; from $${p.price} per person</p>
    <form class="panel" onsubmit="submitBooking(event)">
      <input class="field" required placeholder="Full name" />
      <input class="field" required type="email" placeholder="Email" />
      <input class="field" required type="date" />
      <input class="field" id="guests" type="number" min="1" max="12" value="2"
             oninput="updateTotal(${p.price})" />
      <div class="total"><span>Estimated total</span><span id="total">$${p.price * 2}</span></div>
      <button class="btn btn-block">Request booking</button>
      <p class="ok" id="bookingOk" hidden>Request received — we'll confirm availability by email.</p>
    </form>`;
}
function updateTotal(price) {
  const n = Number(document.getElementById("guests").value) || 1;
  document.getElementById("total").textContent = "$" + price * n;
}
function submitBooking(e) {
  e.preventDefault();
  document.getElementById("bookingOk").hidden = false;
}

/* ---------- contact page ---------- */
async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[placeholder="Your name"]').value;
  const email = form.querySelector('input[placeholder="Email address"]').value;
  const message = form.querySelector('textarea').value;
  
  const fullMessage = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;
  
  try {
    const response = await fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt: fullMessage,
        strategy: "semantic"
      })
    });
    const data = await response.json();
    document.getElementById("contactOk").hidden = false;
  } catch (error) {
    alert("Error sending message. Please try again.");
  }
}

/* ---------- AI chat ---------- */
const CHAT_ENDPOINT = "http://localhost:8000/ask"; // change to your backend URL
const history = [];

function addMessage(role, text) {
  const box = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "user" : "bot");
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

function askChip(text) {
  document.getElementById("chatInput").value = text;
  document.getElementById("chatForm").requestSubmit();
}

async function sendChat(e) {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMessage("user", text);
  const pending = addMessage("bot", "Typing…");
  
  try {
    let url = "http://localhost:8000/ask";
    let body = { prompt: text, strategy: "semantic" };
    
    // Different modes
    if (currentMode === "stream") {
      url = "http://localhost:8000/stream";
      body = { prompt: text };
    } else if (currentMode === "telemetry") {
      url = "http://localhost:8000/metrics/models";
      body = {};
    }
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    
    if (currentMode === "telemetry") {
      let stats = "📊 Model Stats:\n";
      data.forEach(m => {
        stats += `\n${m.model}: ${m.calls} calls, ${m.wins} wins, ${m.win_rate} win rate`;
      });
      pending.textContent = stats;
    } else {
      pending.textContent = data.answer || data.reply || data.delta || "Got it!";
    }
  } catch (err) {
    pending.textContent = "Error connecting to backend.";
  }
}