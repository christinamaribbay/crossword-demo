// script.js
const solution = {
  // Row 1: CONTRAST
  'cell-0': 'C',  'cell-1': 'O',  'cell-2': 'N',  'cell-3': 'T',
  'cell-4': 'R',  'cell-5': 'A',  'cell-6': 'S',  'cell-7': 'T',

  // Row 2: A, O
  'cell-8': 'A',  'cell-12': 'O',

  // Row 3: P, B
  'cell-16': 'P', 'cell-20': 'B',

  // Row 4: T, AUDIT
  'cell-24': 'T', 'cell-27': 'A', 'cell-28': 'U', 'cell-29': 'D',
  'cell-30': 'I', 'cell-31': 'T',

  // Row 5: I, S
  'cell-32': 'I', 'cell-36': 'S',

  // Row 6: O, TAB
  'cell-40': 'O', 'cell-44': 'T', 'cell-45': 'A', 'cell-46': 'B',

  // Row 7: NVDA, D
  'cell-48': 'N', 'cell-49': 'V', 'cell-50': 'D', 'cell-51': 'A',
  'cell-53': 'D',

  // Row 8: S, A
  'cell-56': 'S', 'cell-61': 'A'
};
// 1. Core State
// Tracks whether the user is currently typing horizontally or vertically
let currentDirection = 'across'; 
const board = document.getElementById('crossword-board');
const announcer = document.getElementById('sr-announcer');

// 2. Highlighting & Accessibility Sync
function updateHighlights(focusedInput) {
  // Clear all previous highlights from the board and clue lists
  document.querySelectorAll('.word-highlight').forEach(el => el.classList.remove('word-highlight'));
  document.querySelectorAll('[aria-pressed="true"]').forEach(el => el.setAttribute('aria-pressed', 'false'));

  // Grab the ID (like "1A" or "2D") based on the current direction state
  const activeId = focusedInput.getAttribute(`data-${currentDirection}`);
  
  if (activeId) {
    // Visually highlight all inputs belonging to the current word
    document.querySelectorAll(`[data-${currentDirection}="${activeId}"]`).forEach(cell => {
      cell.classList.add('word-highlight');
    });

    // Find the corresponding clue button, highlight it, and update the screen reader
    const activeClueBtn = document.querySelector(`#clue-${activeId} button`);
    if (activeClueBtn) {
      activeClueBtn.setAttribute('aria-pressed', 'true');
      // Push the active context directly to the aria-live region
      announcer.textContent = `${currentDirection} direction. ${activeClueBtn.textContent}`;
    }
  }
}

// 3. Event Listeners (Attached to the parent board via Event Delegation)
board.addEventListener('focusin', (e) => {
  if (e.target.classList.contains('cell-input')) {
    updateHighlights(e.target);
  }
});

board.addEventListener('keydown', (e) => {
  if (!e.target.classList.contains('cell-input')) return;

  // Spacebar toggles the typing direction
  if (e.key === ' ') {
    e.preventDefault(); 
    currentDirection = currentDirection === 'across' ? 'down' : 'across';
    updateHighlights(e.target); 
  }
  
  // Arrow Keys for spatial navigation
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault(); 
    navigateGrid(e.key, e.target);
  }

  // Backspace: Clear current cell and move backward
  if (e.key === 'Backspace') {
    e.preventDefault(); // Stop the browser's default deletion
    e.target.value = ''; // Manually clear the letter
    autoRetreat(e.target); // Move focus to the previous cell
  }
});

board.addEventListener('input', (e) => {
  if (!e.target.classList.contains('cell-input')) return;

  // Real-time filtering: strip out numbers/symbols, force uppercase
  e.target.value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();

  // If a valid letter was just typed, advance the cursor
  if (e.target.value !== '') {
    autoAdvance(e.target);
  }
});

board.addEventListener('mousedown', (e) => {
  if (!e.target.classList.contains('cell-input')) return;

  // Check if the cell being clicked is ALREADY the currently focused element
  if (document.activeElement === e.target) {
    currentDirection = currentDirection === 'across' ? 'down' : 'across';
    updateHighlights(e.target);
  }
});

// 4. Traversal Logic (Typing)
function autoAdvance(currentInput) {
  const activeId = currentInput.getAttribute(`data-${currentDirection}`);
  if (!activeId) return;

  const wordCells = Array.from(document.querySelectorAll(`[data-${currentDirection}="${activeId}"]`));
  const currentIndex = wordCells.indexOf(currentInput);

  if (currentIndex < wordCells.length - 1) {
    wordCells[currentIndex + 1].focus();
  }
}

function autoRetreat(currentInput) {
  const activeId = currentInput.getAttribute(`data-${currentDirection}`);
  if (!activeId) return;

  const wordCells = Array.from(document.querySelectorAll(`[data-${currentDirection}="${activeId}"]`));
  const currentIndex = wordCells.indexOf(currentInput);

  // If there is a cell before this one in the current word, focus it
  if (currentIndex > 0) {
    wordCells[currentIndex - 1].focus();
  }
}

// 5. Spatial Navigation (Arrow Keys)
function navigateGrid(key, currentInput) {
  let row = parseInt(currentInput.getAttribute('data-row'), 10);
  let col = parseInt(currentInput.getAttribute('data-col'), 10);

  if (key === 'ArrowUp') row--;
  if (key === 'ArrowDown') row++;
  if (key === 'ArrowLeft') col--;
  if (key === 'ArrowRight') col++;

  const targetCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

  if (targetCell) {
    targetCell.focus();
  }
}

const cluesContainer = document.querySelector('.clues-container');

cluesContainer.addEventListener('click', (e) => {
  // Find the clicked button (in case the user clicked the <strong> tag inside it)
  const clueBtn = e.target.closest('button');
  if (!clueBtn) return;

  const clueLi = clueBtn.closest('li');
  if (!clueLi || !clueLi.id.startsWith('clue-')) return;

  // Extract "1A" from "clue-1A"
  const clueId = clueLi.id.replace('clue-', '');

  // Set direction based on the trailing letter ('A' or 'D')
  currentDirection = clueId.endsWith('A') ? 'across' : 'down';

  // Find the first input cell belonging to this clue
  const firstCell = document.querySelector(`[data-${currentDirection}="${clueId}"]`);
  if (firstCell) {
    firstCell.focus();
    // Explicitly call updateHighlights in case firstCell was already focused
    // (e.g., switching from 1A to 1D on the same starting square)
    updateHighlights(firstCell);
  }
});

// Map each cell's ID to its correct uppercase letter

const checkBtn = document.getElementById('check-puzzle-btn');

checkBtn.addEventListener('click', () => {
  let correctCount = 0;
  let incorrectCount = 0;
  let emptyCount = 0;
  const totalCells = Object.keys(solution).length;

  for (const [cellId, expectedLetter] of Object.entries(solution)) {
    const input = document.getElementById(cellId);
    if (!input) continue;

    // Reset previous validation states
    input.classList.remove('cell-correct', 'cell-incorrect');
    input.removeAttribute('aria-invalid');

    const userValue = input.value.trim().toUpperCase();

    if (userValue === '') {
      emptyCount++;
    } else if (userValue === expectedLetter) {
      input.classList.add('cell-correct');
      correctCount++;
    } else {
      input.classList.add('cell-incorrect');
      input.setAttribute('aria-invalid', 'true');
      incorrectCount++;
    }
  }

  // Announce the results to screen readers
  if (correctCount === totalCells) {
    announcer.textContent = 'Congratulations! You solved the entire crossword puzzle.';
  } else {
    announcer.textContent = `Check complete: ${correctCount} correct, ${incorrectCount} incorrect, and ${emptyCount} empty.`;
  }
});