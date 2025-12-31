/**
 * UI Class - Manages all UI updates and interactions
 */
class UI {
    constructor() {
        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.tutorialScreen = document.getElementById('tutorial-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        
        // Stats
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.targetEl = document.getElementById('target');
        
        // Equation display
        this.equationInput = document.getElementById('equation-input');
        this.equationDisplay = document.getElementById('equation-display');
        this.equationResult = document.getElementById('equation-result');
        
        // Buttons
        this.startBtn = document.getElementById('start-btn');
        this.howToPlayBtn = document.getElementById('how-to-play-btn');
        this.tutorialBackBtn = document.getElementById('tutorial-back-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resumeBtn = document.getElementById('resume-btn');
        this.quitBtn = document.getElementById('quit-btn');
        this.submitBtn = document.getElementById('submit-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.menuBtn = document.getElementById('menu-btn');
        
        // Final stats
        this.finalScore = document.getElementById('final-score');
        this.finalLevel = document.getElementById('final-level');
        this.highScore = document.getElementById('high-score');
        
        // Effects
        this.comboDisplay = document.getElementById('combo-display');
        this.comboCount = document.getElementById('combo-count');
        this.levelUpDisplay = document.getElementById('level-up');
        this.particlesContainer = document.getElementById('particles');
    }

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        this.startScreen.classList.add('hidden');
        this.tutorialScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        
        // Show requested screen
        switch(screenName) {
            case 'start':
                this.startScreen.classList.remove('hidden');
                break;
            case 'tutorial':
                this.tutorialScreen.classList.remove('hidden');
                break;
            case 'game':
                this.gameScreen.classList.remove('hidden');
                break;
            case 'pause':
                this.pauseScreen.classList.remove('hidden');
                break;
            case 'gameover':
                this.gameoverScreen.classList.remove('hidden');
                break;
        }
    }

    /**
     * Update the score display
     */
    updateScore(score) {
        this.scoreEl.textContent = score.toLocaleString();
        this.scoreEl.style.animation = 'none';
        this.scoreEl.offsetHeight; // Trigger reflow
        this.scoreEl.style.animation = 'targetPop 0.2s ease-out';
    }

    /**
     * Update the level display
     */
    updateLevel(level) {
        this.levelEl.textContent = level;
    }

    /**
     * Update the target display
     */
    updateTarget(target) {
        this.targetEl.textContent = target;
        this.targetEl.style.animation = 'none';
        this.targetEl.offsetHeight; // Trigger reflow
        this.targetEl.style.animation = 'targetPop 0.3s ease-out';
    }

    /**
     * Update the equation display
     */
    updateEquation(equation, inputValue = null) {
        // Update input field if value provided
        if (inputValue !== null && this.equationInput.value !== inputValue) {
            this.equationInput.value = inputValue;
        }
        
        if (equation.isEmpty()) {
            this.equationResult.textContent = '=';
            this.equationResult.className = 'equation-result';
            this.submitBtn.disabled = true;
            return;
        }

        // Update result
        if (equation.isValid) {
            this.equationResult.textContent = `= ${equation.getResultString()}`;
            this.equationResult.className = 'equation-result valid';
            this.submitBtn.disabled = false;
        } else {
            this.equationResult.textContent = '= ?';
            this.equationResult.className = 'equation-result';
            this.submitBtn.disabled = true;
        }
    }

    /**
     * Clear the equation input
     */
    clearEquationInput() {
        if (this.equationInput) {
            this.equationInput.value = '';
        }
    }

    /**
     * Focus the equation input (desktop only - skip on touch devices to prevent keyboard)
     */
    focusEquationInput() {
        // Skip focus on touch devices to prevent mobile keyboard from opening
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (this.equationInput && !isTouchDevice) {
            this.equationInput.focus();
        }
    }

    /**
     * Show result match feedback
     */
    showResultMatch(matches) {
        this.equationResult.className = `equation-result ${matches ? 'correct' : 'incorrect'}`;
        if (matches) {
            this.equationResult.textContent = '= ' + this.equationResult.textContent.replace('= ', '') + ' ✓';
        }
    }

    /**
     * Show combo notification
     */
    showCombo(count) {
        this.comboCount.textContent = count;
        this.comboDisplay.classList.remove('hidden');
        this.comboDisplay.style.animation = 'none';
        this.comboDisplay.offsetHeight;
        this.comboDisplay.style.animation = 'comboPop 0.5s ease-out';
        
        setTimeout(() => {
            this.comboDisplay.classList.add('hidden');
        }, 1000);
    }

    /**
     * Show level up notification
     */
    showLevelUp() {
        this.levelUpDisplay.classList.remove('hidden');
        this.levelUpDisplay.style.animation = 'none';
        this.levelUpDisplay.offsetHeight;
        this.levelUpDisplay.style.animation = 'levelUp 1s ease-out forwards';
        
        setTimeout(() => {
            this.levelUpDisplay.classList.add('hidden');
        }, 1000);
    }

    /**
     * Update game over screen stats
     */
    updateGameOverStats(score, level, highScore) {
        this.finalScore.textContent = score.toLocaleString();
        this.finalLevel.textContent = level;
        this.highScore.textContent = highScore.toLocaleString();
    }

    /**
     * Create particle effect at position
     */
    createParticles(x, y, count = 10, colors = null) {
        const defaultColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A06CD5', '#95E1D3', '#FF9FF3'];
        colors = colors || defaultColors;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = (Math.PI * 2 / count) * i;
            const velocity = Math.random() * 50 + 50;
            
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.background = color;
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            // Custom animation
            particle.style.setProperty('--dx', Math.cos(angle) * velocity + 'px');
            particle.style.setProperty('--dy', Math.sin(angle) * velocity - 50 + 'px');
            particle.style.animation = `particleExplode 0.6s ease-out forwards`;
            
            this.particlesContainer.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 600);
        }
    }

    /**
     * Create confetti celebration
     */
    createConfetti(count = 50) {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A06CD5', '#95E1D3', '#FF9FF3', '#74B9FF'];
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                
                const color = colors[Math.floor(Math.random() * colors.length)];
                const x = Math.random() * window.innerWidth;
                const delay = Math.random() * 0.5;
                const rotation = Math.random() * 360;
                const scale = Math.random() * 0.5 + 0.5;
                
                confetti.style.background = color;
                confetti.style.left = x + 'px';
                confetti.style.top = '-10px';
                confetti.style.transform = `rotate(${rotation}deg) scale(${scale})`;
                confetti.style.animationDelay = delay + 's';
                
                // Random shape
                if (Math.random() > 0.5) {
                    confetti.style.borderRadius = '50%';
                }
                
                this.particlesContainer.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 2000);
            }, i * 20);
        }
    }

    /**
     * Shake the game board (for errors/warnings)
     */
    shakeBoard() {
        const board = document.getElementById('game-board');
        board.style.animation = 'none';
        board.offsetHeight;
        board.style.animation = 'shake 0.3s ease-out';
    }
}

// Add custom particle animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes particleExplode {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(var(--dx), var(--dy)) scale(0);
            opacity: 0;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-5px); }
        40% { transform: translateX(5px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(3px); }
    }
`;
document.head.appendChild(styleSheet);

