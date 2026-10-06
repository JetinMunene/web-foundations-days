const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const DRAFT_KEY = "day4-note-draft";
const THEME_KEY = "day4-theme";

// Update character and word counters
function updateCounts() {
  const text = noteText.value;
  const characters = text.length;

  const words = text.trim() === ""
    ? 0
    : text.trim().split(/\s+/).length;

  charCount.textContent = `${characters} / 200 characters`;
  wordCount.textContent = `${words} words`;

  // Remove previous warning classes
  charCount.classList.remove("warning", "over");

  // Add the correct class
  if (characters > 200) {
    charCount.classList.add("over");
  } else if (characters > 180) {
    charCount.classList.add("warning");
  }
}

// Save the current note as a draft
function saveDraft() {
  localStorage.setItem(DRAFT_KEY, noteText.value);
}

// Clear the note, counters, and saved draft
function clearEverything() {
  noteText.value = "";

  localStorage.removeItem(DRAFT_KEY);

  updateCounts();
}

// Toggle between light and dark themes
function toggleTheme() {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  if (isDark) {
    themeToggle.textContent = "Light mode";
    localStorage.setItem(THEME_KEY, "dark");
  } else {
    themeToggle.textContent = "Dark mode";
    localStorage.setItem(THEME_KEY, "light");
  }
}

// Handle typing in the textarea
noteText.addEventListener("input", () => {
  updateCounts();
  saveDraft();
});

// Clear button
clearBtn.addEventListener("click", () => {
  clearEverything();
});

// Pressing Escape inside the textarea clears everything
noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearEverything();
  }
});

// Theme button
themeToggle.addEventListener("click", () => {
  toggleTheme();
});

// Restore saved draft and theme when the page loads
const savedDraft = localStorage.getItem(DRAFT_KEY);

if (savedDraft !== null) {
  noteText.value = savedDraft;
}

const savedTheme = localStorage.getItem(THEME_KEY);

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "Light mode";
} else {
  document.body.classList.remove("dark");
  themeToggle.textContent = "Dark mode";
}

// Set the correct counters after restoring saved data
updateCounts();