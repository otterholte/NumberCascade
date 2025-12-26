/**
 * Block Class - Represents a single block in the game
 */
class Block {
    static TYPES = {
        NUMBER: 'number',
        OPERATOR: 'operator',
        FRACTION: 'fraction',
        PARENTHESIS: 'parenthesis'
    };

    static OPERATORS = ['+', '-', '×', '÷'];
    static FRACTIONS = ['1/2', '1/3', '1/4', '2/3', '3/4'];
    static PARENTHESES = ['(', ')'];

    constructor(type, value, col, row) {
        this.id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.value = value;
        this.displayValue = this.getDisplayValue();
        this.col = col;
        this.row = row;
        this.selected = false;
        this.element = null;
        this.falling = false;
        this.targetRow = row;
    }

    /**
     * Get the display value for the block
     */
    getDisplayValue() {
        if (this.type === Block.TYPES.OPERATOR) {
            // Convert multiplication and division to display symbols
            if (this.value === '*') return '×';
            if (this.value === '/') return '÷';
            return this.value;
        }
        return this.value.toString();
    }

    /**
     * Get the actual value for calculations
     */
    getCalculationValue() {
        if (this.type === Block.TYPES.OPERATOR) {
            if (this.value === '×') return '*';
            if (this.value === '÷') return '/';
            return this.value;
        }
        if (this.type === Block.TYPES.FRACTION) {
            const [num, den] = this.value.split('/').map(Number);
            return num / den;
        }
        return this.value;
    }

    /**
     * Create the DOM element for this block
     */
    createElement() {
        const el = document.createElement('div');
        el.className = `block ${this.type}`;
        el.id = this.id;
        el.textContent = this.displayValue;
        el.dataset.col = this.col;
        el.dataset.row = this.row;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${this.type} ${this.displayValue}`);
        el.tabIndex = 0;
        
        // Position the block
        this.updatePosition(el);
        
        this.element = el;
        return el;
    }

    /**
     * Update the block's position on the grid
     */
    updatePosition(el = this.element, animate = true) {
        if (!el) return;
        
        // Get block size from CSS variables
        const styles = getComputedStyle(document.documentElement);
        const blockSize = parseFloat(styles.getPropertyValue('--block-size')) || 48;
        const gap = parseFloat(styles.getPropertyValue('--gap')) || 5;
        
        const left = this.col * (blockSize + gap);
        const top = this.row * (blockSize + gap);
        
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        el.dataset.col = this.col;
        el.dataset.row = this.row;
    }

    /**
     * Set position instantly without animation
     */
    setPositionInstant(el = this.element) {
        if (!el) return;
        el.style.transition = 'none';
        this.updatePosition(el);
        // Force reflow to apply instant position
        el.offsetHeight;
        el.style.transition = '';
    }

    /**
     * Toggle selection state
     */
    toggleSelect() {
        this.selected = !this.selected;
        if (this.element) {
            this.element.classList.toggle('selected', this.selected);
        }
        return this.selected;
    }

    /**
     * Set selection state
     */
    setSelected(selected) {
        this.selected = selected;
        if (this.element) {
            this.element.classList.toggle('selected', selected);
        }
    }

    /**
     * Play spawn animation
     */
    playSpawnAnimation() {
        if (this.element) {
            this.element.classList.add('spawning');
            setTimeout(() => {
                if (this.element) {
                    this.element.classList.remove('spawning');
                }
            }, 300);
        }
    }

    /**
     * Play landing animation
     */
    playLandAnimation() {
        if (this.element) {
            this.element.classList.add('landing');
            setTimeout(() => {
                if (this.element) {
                    this.element.classList.remove('landing');
                }
            }, 200);
        }
    }

    /**
     * Play clearing animation
     */
    playClearAnimation() {
        return new Promise(resolve => {
            if (this.element) {
                this.element.classList.add('clearing');
                setTimeout(() => {
                    resolve();
                }, 400);
            } else {
                resolve();
            }
        });
    }

    /**
     * Remove the DOM element
     */
    removeElement() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Static method to generate a random number block
     */
    static createNumber(col, row, maxValue = 12) {
        const value = Math.floor(Math.random() * maxValue) + 1;
        return new Block(Block.TYPES.NUMBER, value, col, row);
    }

    /**
     * Static method to generate a random operator block
     */
    static createOperator(col, row, allowedOperators = Block.OPERATORS) {
        const value = allowedOperators[Math.floor(Math.random() * allowedOperators.length)];
        // Store calculation-friendly version
        let calcValue = value;
        if (value === '×') calcValue = '*';
        if (value === '÷') calcValue = '/';
        const block = new Block(Block.TYPES.OPERATOR, calcValue, col, row);
        block.displayValue = value;
        return block;
    }

    /**
     * Static method to generate a random fraction block
     */
    static createFraction(col, row) {
        const value = Block.FRACTIONS[Math.floor(Math.random() * Block.FRACTIONS.length)];
        return new Block(Block.TYPES.FRACTION, value, col, row);
    }

    /**
     * Static method to generate a parenthesis block
     */
    static createParenthesis(col, row, type = null) {
        const value = type || Block.PARENTHESES[Math.floor(Math.random() * Block.PARENTHESES.length)];
        return new Block(Block.TYPES.PARENTHESIS, value, col, row);
    }

    /**
     * Static method to generate a random block based on level
     * Now only creates number blocks - operators are typed by player
     */
    static createRandom(col, row, level = 1) {
        // Determine max number based on level
        const maxNumber = Math.min(5 + level * 2, 20);
        return Block.createNumber(col, row, maxNumber);
    }
}

