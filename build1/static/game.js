// State
let matrix = [], score = 0, best = 0;
let aiRunning = false, aiTimer = null;
let aiDelay = 300, aiDepth = 4;

// DOM Setup
const boardEl = document.getElementById('board');
const cells = [];

function init() {
  boardEl.innerHTML = '';
  cells.length = 0;
  for (let i = 0; i < 16; i++) {
    const d = document.createElement('div');
    d.className = 'cell';
    boardEl.appendChild(d);
    cells.push(d);
  }
}

// Set tile colors
const TILE_COLORS = {
  2:    { bg: '#eee4da', fg: '#776e65' },
  4:    { bg: '#ede0c8', fg: '#776e65' },
  8:    { bg: '#f2b179', fg: '#f9f6f2' },
  16:   { bg: '#f59563', fg: '#f9f6f2' },
  32:   { bg: '#f67c5f', fg: '#f9f6f2' },
  64:   { bg: '#f65e3b', fg: '#f9f6f2' },
  128:  { bg: '#edcf72', fg: '#f9f6f2' },
  256:  { bg: '#edcc61', fg: '#f9f6f2' },
  512:  { bg: '#edc850', fg: '#f9f6f2' },
  1024: { bg: '#edc53f', fg: '#f9f6f2' },
  2048: { bg: '#edc22e', fg: '#f9f6f2' },
};

// Rendering
function render() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = matrix[r][c];
      const el = cells[r * 4 + c];
      if (!v) {
        el.style.background = '#cdc1b4';
        el.style.color = '';
        el.textContent = '';
        el.style.fontSize = '';
        continue;
      }
      const col = TILE_COLORS[v] || { bg: '#3c3a32', fg: '#f9f6f2' };
      el.style.background = col.bg;
      el.style.color = col.fg;
      el.textContent = v;
      el.style.fontSize = v >= 1024 ? '18px' : v >= 128 ? '22px' : '28px';
    }
  }
}

function updateScore() {
  document.getElementById('score').textContent = score;
  if (score > best) {
    best = score;
    document.getElementById('best').textContent = best;
  }
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

// Game logic
function newGame() {
  matrix = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  score = 0;
  updateScore();
  addTile();
  addTile();
  render();
  setStatus('Use arrow keys to play, or hit AI: play to watch it solve.');
  if (aiRunning) stopAI();
}

function addTile() {
  const empty = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (!matrix[r][c]) empty.push([r, c]);
  if (!empty.length) return false;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  matrix[r][c] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

function cloneMatrix(m) {
  return m.map(r => [...r]);
}

// Stack non-zero values left
function stackLeft(m) {
  const nm = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  for (let r = 0; r < 4; r++) {
    let pos = 0;
    for (let c = 0; c < 4; c++)
      if (m[r][c]) nm[r][pos++] = m[r][c];
  }
  return nm;
}

// Merge equal adjacent pairs leftward
function combineLeft(m) {
  let gained = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      if (m[r][c] && m[r][c] === m[r][c + 1]) {
        m[r][c] *= 2;
        gained += m[r][c];
        m[r][c + 1] = 0;
      }
    }
  }
  return gained;
}

function reverse(m) { return m.map(r => [...r].reverse()); }
function transpose(m) { return m.map((_, i) => m.map(row => row[i])); }

/*
  Directions:
    0 = left
    1 = right
    2 = up
    3 = down
*/
function applyMove(m, dir) {
  let nm = cloneMatrix(m);
  const orig = JSON.stringify(nm);
  let gained = 0;

  if (dir === 0) {
    nm = stackLeft(nm); gained = combineLeft(nm); nm = stackLeft(nm);
  } else if (dir === 1) {
    nm = reverse(nm); nm = stackLeft(nm); gained = combineLeft(nm); nm = stackLeft(nm); nm = reverse(nm);
  } else if (dir === 2) {
    nm = transpose(nm); nm = stackLeft(nm); gained = combineLeft(nm); nm = stackLeft(nm); nm = transpose(nm);
  } else {
    nm = transpose(nm); nm = reverse(nm); nm = stackLeft(nm); gained = combineLeft(nm); nm = stackLeft(nm); nm = reverse(nm); nm = transpose(nm);
  }

  const moved = JSON.stringify(nm) !== orig;
  return { nm, gained, moved };
}

function doMove(dir) {
  const { nm, gained, moved } = applyMove(matrix, dir);
  if (!moved) return false;
  matrix = nm;
  score += gained;
  updateScore();
  addTile();
  render();
  checkEnd();
  return true;
}

function checkEnd() {
  if (matrix.some(r => r.includes(2048))) {
    setStatus('🎉 You reached 2048!');
    stopAI();
    return;
  }
  const hasMoves = [0, 1, 2, 3].some(d => applyMove(matrix, d).moved);
  if (!hasMoves) {
    setStatus('Game over — no moves left!');
    stopAI();
  }
}

// Keyboard control
document.addEventListener('keydown', e => {
  const map = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
  if (e.key in map) {
    e.preventDefault();
    if (aiRunning) return;
    doMove(map[e.key]);
    setStatus('');
  }
});

// AI: Expectimax Solver 

// How smooth the board is (adjacent tiles close in log-value)
function smoothness(m) {
  let s = 0;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++)
      if (m[r][c] && m[r][c + 1])
        s -= Math.abs(Math.log2(m[r][c]) - Math.log2(m[r][c + 1]));
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 3; r++)
      if (m[r][c] && m[r + 1][c])
        s -= Math.abs(Math.log2(m[r][c]) - Math.log2(m[r + 1][c]));
  return s;
}

// How monotonic the board is (tiles decrease toward a corner)
function monotonicity(m) {
  const totals = [0, 0, 0, 0];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const a = m[r][c]     ? Math.log2(m[r][c])     : 0;
      const b = m[r][c + 1] ? Math.log2(m[r][c + 1]) : 0;
      if (a > b) totals[0] += (b - a); else totals[1] += (a - b);
    }
  }
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 3; r++) {
      const a = m[r][c]     ? Math.log2(m[r][c])     : 0;
      const b = m[r + 1][c] ? Math.log2(m[r + 1][c]) : 0;
      if (a > b) totals[2] += (b - a); else totals[3] += (a - b);
    }
  }
  return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3]);
}

function emptyCount(m) { return m.flat().filter(v => !v).length; }
function maxTile(m)    { return Math.max(...m.flat()); }

// Weight matrix biasing big tiles into the top-left corner
const CORNER_WEIGHTS = [
  [7, 6, 5, 4],
  [6, 5, 4, 3],
  [5, 4, 3, 2],
  [4, 3, 2, 1],
];

function cornerScore(m) {
  let best = -Infinity;
  // Try all 4 rotations/reflections so any corner works
  const variants = [
    m,
    reverse(m),
    transpose(m),
    reverse(transpose(m)),
    transpose(reverse(m)),
  ];
  for (const v of variants) {
    let s = 0;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        s += v[r][c] * CORNER_WEIGHTS[r][c];
    if (s > best) best = s;
  }
  return best;
}

// Combined heuristic: weights tuned for 2048
function heuristic(m) {
  const empty = emptyCount(m);
  if (!empty && ![0,1,2,3].some(d => applyMove(m, d).moved)) return -Infinity;
  return (
    27   * monotonicity(m) +
    270  * Math.log(empty + 1) +
    11   * smoothness(m) +
    0.0015 * cornerScore(m) +
    10   * Math.log2(maxTile(m) + 1)
  );
}

/*
  Expectimax search:
    - Max nodes  --> AI picks the best direction
    - Chance nodes --> average over random tile spawns (2 with p=0.9, 4 with p=0.1)
  Samples up to 4 random empty cells per chance node to keep it fast
*/
function expectimax(m, depth, isMax) {
  if (depth === 0) return heuristic(m);

  if (isMax) {
    let best = -Infinity;
    for (const d of [0, 1, 2, 3]) {
      const { nm, moved } = applyMove(m, d);
      if (!moved) continue;
      const v = expectimax(nm, depth - 1, false);
      if (v > best) best = v;
    }
    return best === -Infinity ? heuristic(m) : best;
  } else {
    let empty = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (!m[r][c]) empty.push([r, c]);
    if (!empty.length) return expectimax(m, depth, true);

    // Sample to keep runtime bounded
    if (empty.length > 4)
      empty = empty.sort(() => Math.random() - 0.5).slice(0, 4);

    let total = 0;
    for (const [r, c] of empty) {
      for (const [val, prob] of [[2, 0.9], [4, 0.1]]) {
        const nm = cloneMatrix(m);
        nm[r][c] = val;
        total += prob * expectimax(nm, depth - 1, true);
      }
    }
    return total / empty.length;
  }
}

function bestMove(m) {
  let best = -Infinity, bestDir = -1;
  for (const d of [0, 1, 2, 3]) {
    const { nm, moved } = applyMove(m, d);
    if (!moved) continue;
    const v = expectimax(nm, aiDepth - 1, false);
    if (v > best) { best = v; bestDir = d; }
  }
  return bestDir;
}

//  AI controls 
const DIR_NAMES = ['left', 'right', 'up', 'down'];

function aiStep() {
  const dir = bestMove(matrix);
  if (dir === -1) { stopAI(); setStatus('No moves left — game over!'); return; }

  doMove(dir);
  setStatus(`AI played: ${DIR_NAMES[dir]}  |  score: ${score}`);

  if (matrix.some(r => r.includes(2048))) { stopAI(); setStatus('AI reached 2048! 🎉'); return; }
  if (![0,1,2,3].some(d => applyMove(matrix, d).moved)) { stopAI(); setStatus('Game over!'); }
}

function toggleAI() {
  aiRunning ? stopAI() : startAI();
}

function startAI() {
  aiRunning = true;
  const btn = document.getElementById('ai-btn');
  btn.textContent = 'AI: stop';
  btn.classList.add('active');
  setStatus('AI is thinking…');
  scheduleAI();
}

function stopAI() {
  aiRunning = false;
  clearTimeout(aiTimer);
  const btn = document.getElementById('ai-btn');
  btn.textContent = 'AI: play';
  btn.classList.remove('active');
}

function scheduleAI() {
  if (!aiRunning) return;
  aiTimer = setTimeout(() => { aiStep(); if (aiRunning) scheduleAI(); }, aiDelay);
}

function updateSpeed() {
  const v = parseInt(document.getElementById('speed').value);
  aiDelay = v;
  document.getElementById('speed-val').textContent = v + 'ms';
}

function updateDepth() {
  const v = parseInt(document.getElementById('depth').value);
  aiDepth = v;
  document.getElementById('depth-val').textContent = v;
}

// Boot
init();
newGame();