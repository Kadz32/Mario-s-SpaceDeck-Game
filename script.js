document.addEventListener("DOMContentLoaded", () => {
  /* === MUSIC === */
  const bgm = document.getElementById("bgm");
  let musicOn = false; // ? Start OFF
  bgm.volume = 0.4;

  // --- Safe playback after user gesture ---
  const tryPlay = () => {
    bgm.play().catch(() => console.log("? Waiting for user gesture to start audio"));
  };
  document.addEventListener("click", tryPlay, { once: true });
  document.addEventListener("keydown", tryPlay, { once: true });

  // --- Music Toggle Buttons (Front + Game) ---
  const musicToggleFront = document.createElement("button");
  musicToggleFront.textContent = "▶ Play Music";
  musicToggleFront.className = "music-control-btn music-off";
  document.body.appendChild(musicToggleFront);

  const musicToggleGame = document.createElement("button");
  musicToggleGame.textContent = "▶ Play Music";
  musicToggleGame.className = "music-control-btn music-off";
  musicToggleGame.style.display = "none";
  document.body.appendChild(musicToggleGame);

  // --- Shared Toggle Logic ---
  function toggleMusic(btn) {
    musicOn = !musicOn;
    if (musicOn) {
      bgm.play();
      btn.textContent = "⏸ Stop Music";
      bgm.loop = true;
      musicToggleFront.classList.add("music-on");
      musicToggleFront.classList.remove("music-off");
      musicToggleGame.classList.add("music-on");
      musicToggleGame.classList.remove("music-off");
    } else {
      bgm.pause();
      bgm.currentTime = 0;
      btn.textContent = "▶ Play Music";
      musicToggleFront.classList.add("music-off");
      musicToggleFront.classList.remove("music-on");
      musicToggleGame.classList.add("music-off");
      musicToggleGame.classList.remove("music-on");
    }
  }

  // --- Button Events ---
  musicToggleFront.addEventListener("click", () => toggleMusic(musicToggleFront));
  musicToggleGame.addEventListener("click", () => toggleMusic(musicToggleGame));

  /* === PAGE SWITCH === */
  const home = document.getElementById("home-screen");
  const game = document.getElementById("game-screen");

  document.getElementById("playBtn").onclick = () => {
    home.style.display = "none";
    game.style.display = "block";
    musicToggleFront.style.display = "none";
    musicToggleGame.style.display = "block";
    tryPlay();
    startGame();
  };

  document.getElementById("returnBtn").onclick = () => {
    game.style.display = "none";
    home.style.display = "block";
    musicToggleFront.style.display = "block";
    musicToggleGame.style.display = "none";
    bgm.currentTime = 0;
    bgm.pause();
  };

  /* === REVIEWS === */
  const KEY = "spaceDeckReviews";
  const stars = document.querySelectorAll(".stars label");
  const inputs = document.querySelectorAll(".stars input");
  const list = document.getElementById("reviewList");
  const input = document.getElementById("reviewInput");
  const btn = document.getElementById("submitReview");

  stars.forEach((star, i) => {
    star.addEventListener("mouseover", () => {
      stars.forEach((s, j) =>
        s.classList.toggle("hovered", j >= stars.length - 1 - i)
      );
    });
    star.addEventListener("mouseout", () =>
      stars.forEach((s) => s.classList.remove("hovered"))
    );
  });

  inputs.forEach((inp) => {
    inp.addEventListener("change", () => {
      const v = parseInt(inp.value);
      stars.forEach((s, i) => s.classList.toggle("selected", 5 - i <= v));
    });
  });

  function addReviewDOM(text, ts, rate) {
    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `
      <time>${new Date(ts).toLocaleString()}</time>
      <div class="review-stars">${"&#9733;".repeat(rate)}${"&#9734;".repeat(
      5 - rate
    )}</div>
      <p>${text}</p>
    `;
    list.prepend(div);
  }

  function loadReviews() {
    (JSON.parse(localStorage.getItem(KEY) || "[]")).forEach((r) =>
      addReviewDOM(r.text, r.ts, r.rate)
    );
  }

  function saveReview(t, r) {
    const d = JSON.parse(localStorage.getItem(KEY) || "[]");
    d.unshift({ text: t, rate: r, ts: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(d));
  }

  btn.onclick = () => {
    const t = input.value.trim(),
      r = document.querySelector('input[name="rating"]:checked');
    if (!t || !r) return alert("Please select a rating and enter text!");
    saveReview(t, r.value);
    addReviewDOM(t, Date.now(), r.value);
    input.value = "";
    document.getElementById("reviewForm").reset();
    stars.forEach((s) => s.classList.remove("selected"));
  };
  loadReviews();

  /* === GAME LOGIC === */
  let deck = [],
    players = [],
    current = 0;
  const msg = document.getElementById("message");

  function initDeck() {
    const s = ["H", "D", "C", "S"],
      r = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    deck = [];
    for (let rr of r)
      for (let ss of s)
        deck.push({
          r: rr,
          s: ss,
          value: ["J", "Q", "K"].includes(rr) ? 10 : rr === "A" ? 1 : parseInt(rr),
          img: `https://deckofcardsapi.com/static/img/${rr}${ss}.png`,
        });
    deck.sort(() => Math.random() - 0.5);
  }

  function drawCard() {
    return deck.pop();
  }

  function setupPlayers() {
    players = [
      { id: "player1", name: "Mario", cards: [], total: 0, stand: false },
      { id: "player2", name: "Luigi", cards: [], total: 0, stand: false },
      { id: "player3", name: "Yoshi", cards: [], total: 0, stand: false },
      { id: "dealer", name: "Dealer", cards: [], total: 0, stand: false },
    ];
    current = 0;
  }

  function updateDisplay() {
    players.forEach((p) => {
      const cdiv = document.querySelector(`#${p.id} .cards`);
      const t = document.querySelector(`#${p.id} .total`);
      cdiv.innerHTML = "";
      p.cards.forEach((c) => {
        const i = document.createElement("img");
        i.src = c.img;
        cdiv.appendChild(i);
      });
      t.textContent = p.total;
    });
  }

  document.getElementById("dealBtn").onclick = () => {
    const p = players[current];
    if (p.stand) return;
    const c = drawCard();
    p.cards.push(c);
    p.total += c.value;
    updateDisplay();
    msg.textContent =
      p.total > 21 ? `? ${p.name} Loses!` : `? ${p.name} drew a card!`;
    if (p.total > 21) p.stand = true;
  };

  document.getElementById("passBtn").onclick = () => {
    msg.textContent = `⏭ ${players[current].name} passes.`;
    nextPlayer();
  };

  document.getElementById("standBtn").onclick = () => {
    players[current].stand = true;
    msg.textContent = `? ${players[current].name} stands.`;
    nextPlayer();
  };

  document.getElementById("restartBtn").onclick = startGame;

  function nextPlayer() {
    if (players.every((p) => p.stand)) {
      endRound();
      return;
    }
    do {
      current = (current + 1) % players.length;
    } while (players[current].stand);
    msg.textContent = `? ${players[current].name}'s turn!`;
  }

  function endRound() {
    const v = players.filter((p) => p.total <= 21);
    let w = null;
    if (v.length > 0) w = v.reduce((a, b) => (a.total > b.total ? a : b));
    msg.textContent = w
      ? `? ${w.name} wins with ${w.total}!`
      : `? All players Lose!`;
  }

  function startGame() {
    initDeck();
    setupPlayers();
    updateDisplay();
    msg.textContent = " Game started! Mario’s turn first.";
  }
});
