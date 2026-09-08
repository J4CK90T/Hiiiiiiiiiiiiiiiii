// ---------- CONFIG: paste your Formspree endpoint here ----------
// Sign up at https://formspree.io, create a form, and paste the
// "https://formspree.io/f/xxxxxxxx" URL it gives you below.
const FORM_ENDPOINT = "https://formspree.io/f/meaqpowo";

// ---------- Scene switching ----------
const scenes = document.querySelectorAll(".scene");
let currentScene = null;

function goToScene(id) {
  scenes.forEach((s) => s.classList.remove("active"));
  const target = document.getElementById(id);
  target.classList.add("active");
  currentScene = id;
}

// ---------- Start overlay (unlocks audio) ----------
const overlay = document.getElementById("overlay-start");
const btnStart = document.getElementById("btn-start");
const music = document.getElementById("bg-music");

btnStart.addEventListener("click", () => {
  music.volume = 0.6;
  music.play().catch(() => {
    // Autoplay can still fail silently on some browsers; that's fine,
    // the rest of the site still works without music.
  });
  overlay.classList.add("hidden");
  goToScene("scene-ask");
  positionNoButton(); // place it next to Yes once it's visible
});

// ---------- The runaway "No" button ----------
const noBtn = document.getElementById("btn-no");
const yesBtn = document.getElementById("btn-yes");

function positionNoButton() {
  const yesRect = yesBtn.getBoundingClientRect();
  noBtn.style.left = `${yesRect.right + 16}px`;
  noBtn.style.top = `${yesRect.top}px`;
}

function moveNoButtonAwayFrom(x, y) {
  const w = noBtn.offsetWidth;
  const h = noBtn.offsetHeight;
  const margin = 16;
  const maxX = window.innerWidth - w - margin;
  const maxY = window.innerHeight - h - margin;

  let bestX = Math.random() * (maxX - margin) + margin;
  let bestY = Math.random() * (maxY - margin) + margin;

  // try a few times to land somewhere far from the cursor
  for (let i = 0; i < 10; i++) {
    const candX = Math.random() * (maxX - margin) + margin;
    const candY = Math.random() * (maxY - margin) + margin;
    const dist = Math.hypot(candX - x, candY - y);
    const bestDist = Math.hypot(bestX - x, bestY - y);
    if (dist > bestDist) {
      bestX = candX;
      bestY = candY;
    }
  }

  noBtn.style.left = `${bestX}px`;
  noBtn.style.top = `${bestY}px`;
}

const EVADE_RADIUS = 130;

function evadeIfNear(x, y) {
  if (currentScene !== "scene-ask") return;
  const rect = noBtn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dist = Math.hypot(x - cx, y - cy);
  if (dist < EVADE_RADIUS) {
    moveNoButtonAwayFrom(x, y);
  }
}

// Mouse / trackpad
document.addEventListener("pointermove", (e) => evadeIfNear(e.clientX, e.clientY));

// Touch: there's no "hover" on phones, so evade the moment a finger
// lands anywhere near it, before the tap can register as a click.
noBtn.addEventListener(
  "touchstart",
  (e) => {
    const touch = e.touches[0];
    e.preventDefault();
    moveNoButtonAwayFrom(touch.clientX, touch.clientY);
  },
  { passive: false }
);

// Safety net: if it's ever somehow clicked, just dodge instead of doing anything.
noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  moveNoButtonAwayFrom(e.clientX, e.clientY);
});

window.addEventListener("resize", () => {
  if (currentScene === "scene-ask") positionNoButton();
});

// ---------- Yes -> Yay -> Date ----------
yesBtn.addEventListener("click", () => {
  goToScene("scene-yay");
  setTimeout(() => goToScene("scene-date"), 1800);
});

// ---------- Date scene ----------
const dateInput = document.getElementById("date-input");
const btnDateNext = document.getElementById("btn-date-next");

dateInput.addEventListener("change", () => {
  btnDateNext.disabled = !dateInput.value;
});

btnDateNext.addEventListener("click", () => {
  goToScene("scene-meal");
});

// ---------- Meal scene -> submit to Formspree ----------
const mealInput = document.getElementById("meal-input");
const btnSubmit = document.getElementById("btn-submit");
const submitStatus = document.getElementById("submit-status");

btnSubmit.addEventListener("click", async () => {
  const meal = mealInput.value.trim();
  if (!meal) {
    submitStatus.textContent = "type something first!";
    return;
  }

  btnSubmit.disabled = true;
  submitStatus.textContent = "sending...";

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: dateInput.value,
        meal: meal,
      }),
    });

    if (res.ok) {
      goToScene("scene-bye");
    } else {
      submitStatus.textContent = "hmm, that didn't send. try again?";
      btnSubmit.disabled = false;
    }
  } catch (err) {
    submitStatus.textContent = "hmm, that didn't send. try again?";
    btnSubmit.disabled = false;
  }
});
