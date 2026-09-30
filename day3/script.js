let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. Search notes
function searchNotes(word) {
  const searchWord = word.toLowerCase();

  return notes.filter((note) =>
    note.text.toLowerCase().includes(searchWord)
  );
}

// 2. Find the longest note
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }

  return longest;
}

// 3. Count notes by category
function countByCategory() {
  const counts = {};

  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }

  return counts;
}

// 4. Get notes summary
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;

  const noteWord = total === 1 ? "note" : "notes";

  return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

// 5. Check for duplicate notes
function isDuplicate(text) {
  const normalizedText = text.trim().toLowerCase();

  return notes.some(
    (note) => note.text.trim().toLowerCase() === normalizedText
  );
}

// 6. Add a new note
function addNote(text, category) {
  const trimmedText = text.trim();
  const validCategories = ["personal", "work", "study"];

  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Note was not added: text must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(trimmedText)) {
    console.log("Note was not added: duplicate note.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log(
      "Note was not added: category must be personal, work, or study."
    );
    return false;
  }

  const newNote = {
    id: notes.length > 0 ? Math.max(...notes.map((note) => note.id)) + 1 : 1,
    text: trimmedText,
    category: category,
  };

  notes.push(newNote);

  console.log("Note added successfully.");
  return true;
}

// TESTS


// searchNotes - normal case
console.log(searchNotes("javascript"));

console.log(searchNotes("holiday"));

// longestNote - normal case
console.log(longestNote());

const savedNotes = notes;
notes = [];
console.log(longestNote());

notes = savedNotes;


console.log(countByCategory());

notes = [];
console.log(countByCategory());
// Expected: {}
notes = savedNotes;

// getSummary - normal case
console.log(getSummary());

notes = [
  { id: 1, text: "Read", category: "study" }
];
console.log(getSummary());

notes = savedNotes;

// isDuplicate - normal case
console.log(isDuplicate("  BUY MILK AND BREAD  "));

console.log(isDuplicate("Buy apples"));

console.log(addNote("Prepare for the JavaScript quiz", "study"));

console.log(addNote("  prepare for the javascript quiz  ", "study"));

console.log(addNote("Go for a walk", "health"));

console.log(addNote("", "personal"));


console.log(notes);
