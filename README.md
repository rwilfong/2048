# 2048
Working on a few builds of 2048. 

## Build 1: 2048 + AI Solver (Flask)

A browser-based 2048 game with a built-in [Expectimax AI](https://github.com/cczhong11/2048-ai) solver that can be ran via Flask.

### Setup

#### 1. Install dependencies

```bash
pip install -r requirements.txt
```

#### 2. Run the app

```bash
python app.py
```

#### 3. Open in your browser

```
http://127.0.0.1:5000
```

---

### How to play

- **Arrow keys** - move tiles manually
- **AI: play** - let the AI solve it automatically
- **AI: stop** - pause the AI and take over
- **Speed slider** - 50ms (fast) to 800ms (slow, easy to follow)
- **AI depth slider** - higher = smarter but slower (depth 4 is the sweet spot)

---

### How the AI works

The solver uses **Expectimax search**, the standard algorithm for 2048:

- **Max nodes** — the AI picks the direction with the highest expected score
- **Chance nodes** — the algorithm averages over random tile spawns
  (90% chance of a `2`, 10% chance of a `4`)

Each board position is scored with a heuristic combining four factors:

| Factor | Weight | What it measures |
|--------|--------|-----------------|
| Monotonicity | 27 | Tiles decrease smoothly toward a corner |
| Empty tiles | 270 | More open space means more future options |
| Smoothness | 11 | Adjacent tiles are close in value |
| Corner bias | ~1.5 | Big tile stays anchored in a corner |

At **depth 4** (default) the AI reliably reaches **512–1024** and often hits **2048**.
At **depth 5–6** it hits 2048 more consistently but thinks a little longer per move.

---

### Project structure

```
2048-flask/
├── app.py              # Flask server (one route: GET /)
├── requirements.txt    # pip dependencies
├── templates/
│   └── index.html      # HTML shell
└── static/
    ├── style.css       # All styles for game
    └── game.js         # Game logic + Expectimax AI
```

## Build 2: Programming 2048 from scratch in Python using Tkinter