# 🎮 Tic-Tac-Toe Royale

A modern, responsive, zero-dependency Tic-Tac-Toe web game built with **Pure HTML5, CSS3, and Vanilla JavaScript (ES6+)**. Play against an unbeatable **Minimax AI**, challenge friends locally via **Pass & Play**, or connect in real-time across devices using **WebRTC Peer-to-Peer Multiplayer**—all without requiring a database, Node.js backend, or build step!

---

## ✨ Key Features

- 🧠 **AI Opponent with Minimax Engine**:
  - **Easy**: Casual, randomized moves with occasional blocks.
  - **Medium**: Smart heuristics with immediate win/block detection and strategic center/corner control.
  - **Unbeatable**: Mathematically optimal Minimax algorithm with alpha-beta pruning for an unbeatable challenge.
- 👥 **Pass & Play (Local 2-Player)**:
  - Play side-by-side on mobile, tablet, or desktop with turn indicators and score tracking.
- 🌐 **WebRTC P2P Multiplayer (Zero Database Required)**:
  - Connect directly browser-to-browser via WebRTC (PeerJS) and BroadcastChannel.
  - Instant 6-digit room codes and one-click shareable invite links (`?room=XYZ123`).
  - Real-time move sync, rematch negotiations, and floating emoji reactions.
- 🎨 **Responsive Modern UI**:
  - **Desktop 3-Column Dashboard**: Left controls & difficulty, center interactive arena & scoreboard, right career stats & history.
  - **Mobile & Tablet Optimized**: Streamlined touch layout.
  - **Automatic Theme Adaptation**: Seamlessly adapts to device preference (`prefers-color-scheme: dark` / `light`).
  - **Refined Aesthetics**: Tailored Emerald Green (`#10b981`) and Coral (`#f97316`) color palette, Lucide vector icons, SVG win-strike line, and confetti celebrations.
- 🔊 **Procedural Web Audio Synthesizer**:
  - Real-time synthesized chimes, pops, fanfare chords, and defeat tones generated dynamically using the native Web Audio API (zero audio files needed).
- 💾 **Persistent Stats & History**:
  - Automatically tracks player name, custom avatar, match history logs, win streaks, and career win rate in `localStorage`.

---

## 🚀 Quick Start

Zero installation or build step is required. Open [`index.html`](./index.html) directly in any modern web browser:

```bash
# Option 1: Open directly in default browser
start index.html

# Option 2: Run with any local static HTTP server
npx serve .
# or
python -m http.server 3000
```

---

## 📁 Project Structure

```
tic-tac-toe-game/
├── index.html          # Semantic HTML5 structure, dashboard layout, and modals
├── style.css           # Modern design system, responsive grids, and animations
├── js/
│   ├── audio.js        # Web Audio API procedural sound synthesizer
│   ├── ai.js           # Minimax AI algorithm with difficulty levels
│   ├── game.js         # Core 3x3 board engine, scoring, and win strike calculations
│   ├── multiplayer.js  # WebRTC PeerJS + BroadcastChannel P2P networking engine
│   ├── storage.js      # LocalStorage manager for stats, history, and preferences
│   └── app.js          # Application controller & event orchestrator
├── CONTRIBUTING.md     # Contribution guidelines
├── CODE_OF_CONDUCT.md  # Community standards and code of conduct
└── README.md           # Documentation and overview
```

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Structure** | HTML5 | Semantic markup, modal dialogs, and SVG strike line |
| **Styling** | Vanilla CSS3 | CSS custom properties, responsive 3-column grid, glassmorphism |
| **Logic** | Vanilla JavaScript (ES6+) | Minimax AI algorithm, state machine, event listeners |
| **Audio** | Web Audio API | Procedural sound generation without audio files |
| **Multiplayer** | WebRTC (PeerJS) & BroadcastChannel | Real-time direct P2P data exchange |
| **Icons & VFX** | Lucide Icons & Canvas Confetti | Modern vector icons and particle celebrations |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Please check out the [CONTRIBUTING.md](./CONTRIBUTING.md) guide before submitting a pull request.

---

## 📬 Contact & Support

If you have any questions, feedback, or suggestions, feel free to reach out:

- **Email**: [ichshakib@gmail.com](mailto:ichshakib@gmail.com)
- **GitHub**: [@ichshakib](https://github.com/ichshakib)
- **Repository**: [https://github.com/ichshakib/tic-tac-toe-game](https://github.com/ichshakib/tic-tac-toe-game)

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).