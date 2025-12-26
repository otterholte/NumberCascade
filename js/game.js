/**
 * Game Class - Main game controller
 */
class Game {
    constructor() {
        this.board = new Board(6, 7);
        this.ui = new UI();
        this.equation = new Equation();
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.target = 10;
        this.combo = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.isSpawning = false;
        
        // Navigation state
        this.focusedBlock = null;
        this.focusedRow = 0;
        this.focusedCol = 0;
        this.operatorCycle = ['+', '−', '×', '÷'];
        this.currentOperatorIndex = 0;
        
        // Timing
        this.lastDropTime = 0;
        this.dropInterval = 5000; // ms between drops (5 seconds)
        this.baseDropInterval = 5000;
        this.minDropInterval = 1500;
        
        // Level progression
        this.scoreToNextLevel = 500;
        this.blocksCleared = 0;
        
        // High score
        this.highScore = this.loadHighScore();
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleBlockClick = this.handleBlockClick.bind(this);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show start screen
        this.ui.showScreen('start');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Start screen
        this.ui.startBtn.addEventListener('click', () => this.startGame());
        this.ui.howToPlayBtn.addEventListener('click', () => this.ui.showScreen('tutorial'));
        this.ui.tutorialBackBtn.addEventListener('click', () => this.ui.showScreen('start'));
        
        // Game controls
        this.ui.pauseBtn.addEventListener('click', () => this.togglePause());
        this.ui.submitBtn.addEventListener('click', () => this.submitEquation());
        this.ui.clearBtn.addEventListener('click', () => this.clearEquation());
        
        // Pause screen
        this.ui.resumeBtn.addEventListener('click', () => this.togglePause());
        this.ui.quitBtn.addEventListener('click', () => this.quitToMenu());
        
        // Game over screen
        this.ui.playAgainBtn.addEventListener('click', () => this.startGame());
        this.ui.menuBtn.addEventListener('click', () => this.quitToMenu());
        
        // Equation input field
        this.ui.equationInput.addEventListener('input', (e) => this.handleEquationInput(e));
        this.ui.equationInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.equation.isValid) {
                e.preventDefault();
                this.submitEquation();
            }
        });
        
        // Operator buttons
        document.querySelectorAll('.op-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const op = btn.dataset.op;
                this.addOperatorToInput(op);
            });
        });
        
        // Keyboard controls (for when input isn't focused)
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Board click handler
        this.board.onBlockClick = this.handleBlockClick;
    }

    /**
     * Handle keyboard input
     */
    handleKeyPress(e) {
        if (!this.isRunning || this.isPaused) return;
        
        // Always handle these keys
        switch(e.key) {
            case 'Escape':
                this.togglePause();
                return;
            case 'Enter':
                e.preventDefault();
                // Always submit if equation is valid
                if (!this.equation.isEmpty() && this.equation.isValid) {
                    this.submitEquation();
                } else if (this.focusedBlock && !this.focusedBlock.selected) {
                    // Otherwise select focused block if we have one
                    this.handleBlockClick(this.focusedBlock);
                }
                return;
            case ' ': // Spacebar - cycle operators
                e.preventDefault();
                this.cycleOperator();
                return;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                e.preventDefault();
                this.navigateBlocks(e.key);
                return;
            case 'Backspace':
                e.preventDefault();
                this.backspaceEquation();
                return;
        }
        
        // If typing in the input field, let it handle naturally for other keys
        if (document.activeElement === this.ui.equationInput) {
            return;
        }
    }

    /**
     * Cycle through operators with spacebar
     */
    cycleOperator() {
        const ops = this.operatorCycle;
        
        if (this.equation.endsWithOperator()) {
            // Replace the last operator with the next one
            this.currentOperatorIndex = (this.currentOperatorIndex + 1) % ops.length;
            const newOp = ops[this.currentOperatorIndex];
            this.equation.replaceLastOperator(newOp);
        } else if (!this.equation.isEmpty()) {
            // Add the first operator
            this.currentOperatorIndex = 0;
            this.equation.appendOperator(ops[0]);
        }
        
        this.ui.equationInput.value = this.equation.expression;
        this.ui.updateEquation(this.equation);
    }

    /**
     * Navigate blocks with arrow keys
     */
    navigateBlocks(direction) {
        const allBlocks = this.board.getAllBlocks();
        if (allBlocks.length === 0) return;
        
        // Build a grid map of blocks
        const grid = {};
        let maxRow = 0, maxCol = 0;
        
        allBlocks.forEach(block => {
            const key = `${block.row},${block.col}`;
            grid[key] = block;
            maxRow = Math.max(maxRow, block.row);
            maxCol = Math.max(maxCol, block.col);
        });
        
        // If no block is focused, start from the first one
        if (!this.focusedBlock) {
            const firstBlock = allBlocks.find(b => grid[`${maxRow},0`]) || allBlocks[0];
            this.focusedRow = firstBlock.row;
            this.focusedCol = firstBlock.col;
            this.highlightFocusedBlock(firstBlock);
            return;
        }
        
        // Move in the direction
        let newRow = this.focusedRow;
        let newCol = this.focusedCol;
        
        switch(direction) {
            case 'ArrowUp': newRow--; break;
            case 'ArrowDown': newRow++; break;
            case 'ArrowLeft': newCol--; break;
            case 'ArrowRight': newCol++; break;
        }
        
        // Wrap around
        if (newCol < 0) newCol = this.board.cols - 1;
        if (newCol >= this.board.cols) newCol = 0;
        if (newRow < 0) newRow = maxRow;
        if (newRow > maxRow) newRow = 0;
        
        // Find a block at or near this position
        let targetBlock = grid[`${newRow},${newCol}`];
        
        // If no block there, search nearby
        if (!targetBlock) {
            for (let r = newRow; r <= maxRow; r++) {
                if (grid[`${r},${newCol}`]) {
                    targetBlock = grid[`${r},${newCol}`];
                    newRow = r;
                    break;
                }
            }
        }
        
        if (targetBlock) {
            this.focusedRow = newRow;
            this.focusedCol = newCol;
            this.highlightFocusedBlock(targetBlock);
        }
    }

    /**
     * Highlight the focused block
     */
    highlightFocusedBlock(block) {
        // Remove focus from previous block
        document.querySelectorAll('.block.focused').forEach(el => {
            el.classList.remove('focused');
        });
        
        // Add focus to new block
        if (block && block.element) {
            block.element.classList.add('focused');
            this.focusedBlock = block;
        }
    }

    /**
     * Select the currently focused block (called on Enter or click)
     */
    selectFocusedBlock() {
        if (this.focusedBlock) {
            this.handleBlockClick(this.focusedBlock);
        }
    }

    /**
     * Handle input in the equation text field
     * Only parse if user manually types - preserve block selections
     */
    handleEquationInput(e) {
        if (!this.isRunning || this.isPaused) return;
        
        const input = e.target.value;
        
        // If input matches the current expression, nothing changed programmatically
        // This happens when we set the value from code
        if (input === this.equation.expression) {
            return;
        }
        
        // Check if user just added an operator
        const currentExpr = this.equation.expression;
        if (input.startsWith(currentExpr) && /^[+\-−×÷*/()]$/.test(input.slice(currentExpr.length))) {
            // User typed an operator - just append it
            const op = input.slice(currentExpr.length);
            this.equation.appendOperator(op);
            this.ui.updateEquation(this.equation);
            return;
        }
        
        // Otherwise, full re-parse (user typed something else or deleted)
        const availableBlocks = this.board.getAllBlocks();
        this.equation.parseInput(input, availableBlocks);
        this.ui.updateEquation(this.equation, input);
    }

    /**
     * Add an operator to the input field
     */
    addOperatorToInput(op) {
        if (!this.isRunning || this.isPaused) return;
        
        // Convert to display operator
        let displayOp = op;
        if (op === '*') displayOp = '×';
        if (op === '/') displayOp = '÷';
        
        // Directly append to equation (don't re-parse)
        this.equation.appendOperator(displayOp);
        this.ui.equationInput.value = this.equation.expression;
        this.ui.updateEquation(this.equation);
        
        // Focus the input
        this.ui.focusEquationInput();
    }

    /**
     * Start a new game
     */
    startGame() {
        // Reset state
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        this.blocksCleared = 0;
        this.isRunning = true;
        this.isPaused = false;
        this.gameOver = false;
        this.isSpawning = false;
        
        // Reset timing
        this.dropInterval = this.baseDropInterval;
        this.lastDropTime = performance.now();
        
        // Reset board and equation
        this.board.reset();
        this.equation.clear();
        
        // Fill initial blocks (only 2 rows to give player room)
        this.board.fillInitial(this.level, 2);
        
        // Generate first target
        this.generateNewTarget();
        
        // Update UI
        this.ui.updateScore(this.score);
        this.ui.updateLevel(this.level);
        this.ui.clearEquationInput();
        this.ui.updateEquation(this.equation, '');
        this.ui.showScreen('game');
        
        // Focus the equation input
        setTimeout(() => this.ui.focusEquationInput(), 100);
        
        // Start game loop
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Main game loop
     */
    gameLoop(timestamp) {
        if (!this.isRunning || this.gameOver) return;
        if (this.isPaused) {
            requestAnimationFrame(this.gameLoop);
            return;
        }
        
        // Drop new blocks periodically
        if (timestamp - this.lastDropTime >= this.dropInterval) {
            this.spawnNewBlock();
            this.lastDropTime = timestamp;
        }
        
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Spawn a new block
     */
    async spawnNewBlock() {
        if (this.isSpawning) return; // Prevent overlapping spawns
        this.isSpawning = true;
        
        try {
            // Check if we can spawn (at least one column has room)
            const canSpawn = this.board.canSpawnBlock();
            
            if (!canSpawn) {
                // No room to spawn - game over
                this.endGame();
                return;
            }
            
            // Spawn block with falling animation
            const block = await this.board.spawnBlock(this.level);
            
            if (block) {
                // Check if danger zone is breached after block lands
                if (this.board.isDangerZoneBreached()) {
                    this.endGame();
                }
            }
        } finally {
            this.isSpawning = false;
        }
    }

    /**
     * Handle block click - adds the specific clicked block to equation
     */
    handleBlockClick(block) {
        if (!this.isRunning || this.isPaused || this.gameOver) return;
        
        // Only allow number blocks
        if (block.type !== Block.TYPES.NUMBER && block.type !== Block.TYPES.FRACTION) {
            return;
        }
        
        if (block.selected) {
            // Deselect this specific block
            block.setSelected(false);
            this.equation.removeBlock(block);
            this.ui.equationInput.value = this.equation.expression;
            this.ui.updateEquation(this.equation);
        } else {
            // Select this specific block and add to equation
            block.setSelected(true);
            this.equation.addBlockDirect(block);
            this.ui.equationInput.value = this.equation.expression;
            this.ui.updateEquation(this.equation);
        }
        
        // Set this as the focused block for arrow navigation
        this.focusedBlock = block;
    }

    /**
     * Submit the current equation
     */
    async submitEquation() {
        if (this.equation.isEmpty() || !this.equation.isValid) return;
        
        const matches = this.equation.matchesTarget(this.target);
        this.ui.showResultMatch(matches);
        
        if (matches) {
            // Success! Clear the blocks
            const blocks = this.equation.getBlocks();
            this.blocksCleared += blocks.length;
            
            // Calculate score
            const baseScore = 100 * blocks.length;
            const comboMultiplier = Math.min(this.combo + 1, 5);
            const levelBonus = this.level * 10;
            const pointsEarned = baseScore * comboMultiplier + levelBonus;
            
            // Update combo
            this.combo++;
            if (this.combo > 1) {
                this.ui.showCombo(this.combo);
            }
            
            // Update score
            this.score += pointsEarned;
            this.ui.updateScore(this.score);
            
            // Create particle effects
            const boardRect = this.board.element.getBoundingClientRect();
            blocks.forEach(block => {
                if (block.element) {
                    const rect = block.element.getBoundingClientRect();
                    this.ui.createParticles(
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2,
                        8
                    );
                }
            });
            
            // Clear equation and remove blocks
            this.equation.clear();
            this.ui.clearEquationInput();
            await this.board.removeBlocks(blocks);
            
            // Clear focused block to prevent it from being re-selected
            this.focusedBlock = null;
            
            // Check for level up
            if (this.score >= this.scoreToNextLevel * this.level) {
                this.levelUp();
            }
            
            // Generate new target
            this.generateNewTarget();
            
            this.ui.updateEquation(this.equation);
        } else {
            // Wrong answer - shake and reset combo
            this.ui.shakeBoard();
            this.combo = 0;
        }
    }

    /**
     * Clear the current equation
     */
    clearEquation() {
        this.equation.clear();
        this.ui.clearEquationInput();
        this.ui.updateEquation(this.equation, '');
        this.ui.focusEquationInput();
    }

    /**
     * Backspace - remove last character from equation
     */
    backspaceEquation() {
        this.equation.backspace();
        // Re-parse the expression to update block selections
        const newExpr = this.equation.expression;
        const availableBlocks = this.board.getAllBlocks();
        this.equation.parseInput(newExpr, availableBlocks);
        this.ui.equationInput.value = this.equation.expression;
        this.ui.updateEquation(this.equation);
        this.ui.focusEquationInput();
    }

    /**
     * Generate a new target number
     */
    generateNewTarget() {
        const allBlocks = this.board.getAllBlocks();
        this.target = Equation.generateTarget(allBlocks, this.level);
        this.ui.updateTarget(this.target);
    }

    /**
     * Level up
     */
    levelUp() {
        this.level++;
        this.ui.updateLevel(this.level);
        this.ui.showLevelUp();
        this.ui.createConfetti(30);
        
        // Increase difficulty gradually (300ms faster per level)
        this.dropInterval = Math.max(
            this.minDropInterval,
            this.baseDropInterval - (this.level - 1) * 300
        );
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        if (!this.isRunning || this.gameOver) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.ui.showScreen('pause');
            // Keep game screen visible but show overlay
            this.ui.gameScreen.classList.remove('hidden');
        } else {
            this.ui.pauseScreen.classList.add('hidden');
            this.lastDropTime = performance.now(); // Reset drop timer
        }
    }

    /**
     * Quit to main menu
     */
    quitToMenu() {
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.board.reset();
        this.equation.clear();
        this.ui.showScreen('start');
    }

    /**
     * End the game
     */
    endGame() {
        this.gameOver = true;
        this.isRunning = false;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        // Show game over screen
        this.ui.updateGameOverStats(this.score, this.level, this.highScore);
        this.ui.showScreen('gameover');
        // Keep game screen visible
        this.ui.gameScreen.classList.remove('hidden');
    }

    /**
     * Load high score from localStorage
     */
    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('numberCascadeHighScore')) || 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Save high score to localStorage
     */
    saveHighScore() {
        try {
            localStorage.setItem('numberCascadeHighScore', this.highScore.toString());
        } catch (e) {
            // localStorage not available
        }
    }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

