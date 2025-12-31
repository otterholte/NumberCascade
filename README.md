# 🎮 Number Cascade

A fast-paced math puzzle game where you match equations, clear blocks, and beat the clock!

## 🎯 [Play Now!](https://otterholte.github.io/NumberCascade/)

![Number Cascade](https://img.shields.io/badge/Game-Play%20Now-4ECDC4?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

---

## 🕹️ How to Play

1. **Number blocks fall from above** - Watch as colorful number blocks cascade down the board
2. **Build equations** - Click blocks or type numbers to create math expressions
3. **Match the TARGET** - Your equation's result must equal the target number
4. **Clear blocks & score points** - Correct equations clear the blocks you used
5. **Don't let blocks reach the top!** - Game over if the board fills up

## ⌨️ Controls

| Control | Action |
|---------|--------|
| **Click** | Select/deselect number blocks |
| **Type** | Enter numbers and operators directly |
| **Space** | Cycle through operators (+, −, ×, ÷) |
| **Enter** | Submit equation |
| **Backspace** | Delete last character |
| **Arrow Keys** | Navigate between blocks |
| **Escape** | Pause game |

## ✨ Features

- 🎨 **Beautiful UI** - Candy-bright colors with smooth animations
- 📱 **Mobile Friendly** - Works great on phones and tablets
- 🎯 **Dynamic Targets** - Targets are always solvable with available blocks
- 🔥 **Combo System** - Chain correct answers for bonus points
- 📈 **Progressive Difficulty** - Game speeds up as you level up
- 💾 **High Score** - Your best score is saved locally

## 🛠️ Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, flexbox, grid, animations
- **Vanilla JavaScript** - No frameworks, pure JS
- **Google Fonts** - Fredoka font family

## 🚀 Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/otterholte/NumberCascade.git
   ```

2. Open `index.html` in your browser, or start a local server:
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Then open http://localhost:8080
   ```

## 📁 Project Structure

```
NumberCascade/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # All styles and animations
├── js/
│   ├── block.js        # Block class and types
│   ├── board.js        # Game board logic
│   ├── equation.js     # Equation parsing and validation
│   ├── game.js         # Main game controller
│   └── ui.js           # UI updates and effects
└── README.md
```

## 🎮 Game Mechanics

- **Scoring**: Base points × combo multiplier + level bonus
- **Combos**: Chain correct answers without mistakes
- **Levels**: Every 500 points advances you to the next level
- **Speed**: Block drop interval decreases each level (min 1.5s)

## 📜 License

MIT License - feel free to use, modify, and share!

---

<p align="center">
  Made with ❤️ and math
</p>

