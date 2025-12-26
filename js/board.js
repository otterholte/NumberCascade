/**
 * Board Class - Manages the game grid and block physics
 */
class Board {
    constructor(cols = 6, rows = 8) {
        this.cols = cols;
        this.rows = rows;
        this.grid = this.createEmptyGrid();
        this.blocks = new Map(); // id -> Block
        this.element = document.getElementById('game-board');
        this.onBlockClick = null;
    }

    /**
     * Create an empty grid
     */
    createEmptyGrid() {
        const grid = [];
        for (let row = 0; row < this.rows; row++) {
            grid[row] = new Array(this.cols).fill(null);
        }
        return grid;
    }

    /**
     * Reset the board
     */
    reset() {
        // Clear all blocks
        this.blocks.forEach(block => {
            block.removeElement();
        });
        this.blocks.clear();
        this.grid = this.createEmptyGrid();
        this.element.innerHTML = '';
    }

    /**
     * Add a block to the board (instant, no animation)
     */
    addBlock(block) {
        if (!this.isValidPosition(block.col, block.row)) return false;
        if (this.grid[block.row][block.col] !== null) return false;

        this.grid[block.row][block.col] = block;
        this.blocks.set(block.id, block);

        // Create and add DOM element
        const el = block.createElement();
        el.addEventListener('click', () => {
            if (this.onBlockClick) {
                this.onBlockClick(block);
            }
        });
        
        // Position instantly for initial placement
        block.setPositionInstant(el);
        this.element.appendChild(el);
        block.playSpawnAnimation();

        return true;
    }

    /**
     * Remove a block from the board
     */
    removeBlock(block) {
        if (!block) return;
        
        if (this.isValidPosition(block.col, block.row)) {
            this.grid[block.row][block.col] = null;
        }
        this.blocks.delete(block.id);
        block.removeElement();
    }

    /**
     * Remove multiple blocks with animation
     */
    async removeBlocks(blocks) {
        // Play clear animations
        const animations = blocks.map(block => block.playClearAnimation());
        await Promise.all(animations);

        // Actually remove the blocks
        blocks.forEach(block => this.removeBlock(block));

        // Apply gravity
        await this.applyGravity();
    }

    /**
     * Get block at position
     */
    getBlockAt(col, row) {
        if (!this.isValidPosition(col, row)) return null;
        return this.grid[row][col];
    }

    /**
     * Check if position is valid
     */
    isValidPosition(col, row) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    /**
     * Check if position is empty
     */
    isEmpty(col, row) {
        return this.isValidPosition(col, row) && this.grid[row][col] === null;
    }

    /**
     * Get the lowest empty row in a column
     */
    getLowestEmptyRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.isEmpty(col, row)) {
                return row;
            }
        }
        return -1; // Column is full
    }

    /**
     * Check if a column is full
     */
    isColumnFull(col) {
        return this.grid[0][col] !== null;
    }

    /**
     * Check if any column has reached the top (game over condition)
     */
    isOverflowing() {
        for (let col = 0; col < this.cols; col++) {
            if (this.grid[0][col] !== null) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if we can spawn a new block (at least one column has space)
     */
    canSpawnBlock() {
        for (let col = 0; col < this.cols; col++) {
            // Check if column has room (at least top 2 rows empty for spawning + falling)
            if (this.grid[0][col] === null && this.grid[1][col] === null) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if danger zone is breached (blocks have settled in top rows)
     */
    isDangerZoneBreached() {
        // Game over if row 1 (second from top) has any blocks
        // This gives player time to react since blocks spawn at row 0
        for (let col = 0; col < this.cols; col++) {
            if (this.grid[1][col] !== null) {
                return true;
            }
        }
        return false;
    }

    /**
     * Spawn a new block in a random column with falling animation
     */
    spawnBlock(level = 1) {
        // Find available columns (columns that have space)
        const availableCols = [];
        for (let col = 0; col < this.cols; col++) {
            const lowestRow = this.getLowestEmptyRow(col);
            if (lowestRow >= 0) {
                availableCols.push({ col, targetRow: lowestRow });
            }
        }

        if (availableCols.length === 0) return null;

        // Pick a random available column
        const choice = availableCols[Math.floor(Math.random() * availableCols.length)];
        const col = choice.col;
        const targetRow = choice.targetRow;

        // Create a random block - start at row -1 (above the board) for animation
        const block = Block.createRandom(col, -1, level);
        block.targetRow = targetRow;
        
        // Add to blocks map but not to grid yet
        this.blocks.set(block.id, block);
        
        // Create DOM element at starting position (above board)
        const el = block.createElement();
        el.addEventListener('click', () => {
            if (this.onBlockClick) {
                this.onBlockClick(block);
            }
        });
        
        // Position above the board initially
        block.setPositionInstant(el);
        this.element.appendChild(el);
        
        // Animate falling to target position
        return this.animateBlockFall(block, targetRow);
    }

    /**
     * Animate a block falling to its target row
     */
    async animateBlockFall(block, targetRow) {
        return new Promise(resolve => {
            // Small delay to ensure DOM is ready
            requestAnimationFrame(() => {
                // Update to target position (CSS transition will animate)
                block.row = targetRow;
                block.updatePosition();
                
                // Add to grid at target position
                this.grid[targetRow][block.col] = block;
                
                // Wait for animation to complete
                const animDuration = 400 + (targetRow * 30); // Longer fall = longer animation
                setTimeout(() => {
                    block.playLandAnimation();
                    resolve(block);
                }, animDuration);
            });
        });
    }

    /**
     * Move a block to a new position
     */
    moveBlock(block, newCol, newRow) {
        if (!this.isValidPosition(newCol, newRow)) return false;
        if (!this.isEmpty(newCol, newRow)) return false;

        // Remove from old position
        this.grid[block.row][block.col] = null;

        // Update block position
        block.col = newCol;
        block.row = newRow;
        block.updatePosition();

        // Add to new position
        this.grid[newRow][newCol] = block;

        return true;
    }

    /**
     * Apply gravity - make blocks fall to fill gaps with animation
     */
    async applyGravity() {
        let moved = false;
        const animations = [];
        
        // Process columns from bottom to top
        for (let col = 0; col < this.cols; col++) {
            for (let row = this.rows - 2; row >= 0; row--) {
                const block = this.grid[row][col];
                if (block) {
                    const targetRow = this.getLowestEmptyRow(col);
                    if (targetRow > row) {
                        // Move block down
                        this.grid[row][col] = null;
                        this.grid[targetRow][col] = block;
                        
                        // Add gravity-fall class for faster animation
                        if (block.element) {
                            block.element.classList.add('gravity-fall');
                        }
                        
                        block.row = targetRow;
                        block.updatePosition();
                        
                        moved = true;
                        
                        // Track animation completion
                        animations.push(new Promise(resolve => {
                            setTimeout(() => {
                                if (block.element) {
                                    block.element.classList.remove('gravity-fall');
                                }
                                block.playLandAnimation();
                                resolve();
                            }, 250);
                        }));
                    }
                }
            }
        }

        // Wait for all animations to complete
        if (animations.length > 0) {
            await Promise.all(animations);
        }

        return moved;
    }

    /**
     * Drop all blocks down one row
     */
    dropBlocks() {
        // Process from bottom to top
        for (let col = 0; col < this.cols; col++) {
            for (let row = this.rows - 1; row >= 0; row--) {
                const block = this.grid[row][col];
                if (block && row < this.rows - 1 && this.isEmpty(col, row + 1)) {
                    this.grid[row][col] = null;
                    block.row = row + 1;
                    block.updatePosition();
                    this.grid[row + 1][col] = block;
                }
            }
        }
    }

    /**
     * Get all blocks on the board
     */
    getAllBlocks() {
        return Array.from(this.blocks.values());
    }

    /**
     * Get selected blocks
     */
    getSelectedBlocks() {
        return Array.from(this.blocks.values()).filter(b => b.selected);
    }

    /**
     * Clear all selections
     */
    clearSelections() {
        this.blocks.forEach(block => {
            block.setSelected(false);
        });
    }

    /**
     * Get block count
     */
    getBlockCount() {
        return this.blocks.size;
    }

    /**
     * Fill board with initial blocks
     */
    fillInitial(level = 1, fillRows = 3) {
        for (let row = this.rows - fillRows; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const block = Block.createRandom(col, row, level);
                this.addBlock(block);
            }
        }
    }
}

