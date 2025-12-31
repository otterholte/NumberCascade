/**
 * Equation Class - Handles equation building, parsing, and validation
 * Supports both typed input and block selection
 */
class Equation {
    constructor() {
        this.expression = '';    // The raw expression string
        this.blocks = [];        // Blocks used from the board
        this.result = null;
        this.isValid = false;
    }

    /**
     * Set the equation from typed input, matching numbers to available blocks
     * @param {string} input - The typed equation string
     * @param {Block[]} availableBlocks - Blocks available on the board
     * @returns {Object} - { success, unmatchedNumbers }
     */
    parseInput(input, availableBlocks) {
        // Clear previous state
        this.blocks.forEach(b => b.setSelected(false));
        this.blocks = [];
        this.expression = '';
        this.result = null;
        this.isValid = false;

        if (!input || input.trim() === '') {
            return { success: true, unmatchedNumbers: [] };
        }

        // Normalize input: replace × with *, ÷ with /, x with *, − with -
        let normalized = input
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/x/gi, '*')
            .replace(/\s+/g, ''); // Remove spaces

        // Only allow valid characters
        if (!/^[\d+\-*/().]+$/.test(normalized)) {
            return { success: false, unmatchedNumbers: [] };
        }

        // Extract all numbers from the expression
        const numberMatches = normalized.match(/\d+/g) || [];
        const numbers = numberMatches.map(n => parseInt(n, 10));

        // Track which blocks are available (copy to avoid modifying original)
        const available = availableBlocks
            .filter(b => b.type === Block.TYPES.NUMBER || b.type === Block.TYPES.FRACTION)
            .map(b => ({ block: b, used: false }));

        const matchedBlocks = [];
        const unmatchedNumbers = [];

        // Try to match each number to an available block
        for (const num of numbers) {
            const match = available.find(a => !a.used && a.block.value === num);
            if (match) {
                match.used = true;
                matchedBlocks.push(match.block);
            } else {
                unmatchedNumbers.push(num);
            }
        }

        // If all numbers matched, set up the equation
        if (unmatchedNumbers.length === 0) {
            this.expression = normalized;
            this.blocks = matchedBlocks;
            
            // Select the matched blocks
            this.blocks.forEach(b => b.setSelected(true));
            
            // Calculate the result
            this.calculate();
            
            return { success: true, unmatchedNumbers: [] };
        }

        return { success: false, unmatchedNumbers };
    }

    /**
     * Add a block to the equation (appends its value to expression)
     */
    addBlock(block, availableBlocks) {
        // Append the block's value to the expression
        const newExpression = this.expression + block.value;
        return this.parseInput(newExpression, availableBlocks);
    }

    /**
     * Add an operator to the equation
     */
    addOperator(op) {
        this.expression += op;
        this.calculate();
    }

    /**
     * Add a specific block directly (not by parsing)
     */
    addBlockDirect(block) {
        this.blocks.push(block);
        this.rebuildExpression();
    }

    /**
     * Remove a specific block
     */
    removeBlock(block) {
        const index = this.blocks.findIndex(b => b.id === block.id);
        if (index !== -1) {
            this.blocks.splice(index, 1);
            this.rebuildExpression();
        }
    }

    /**
     * Rebuild expression from current blocks and operators
     */
    rebuildExpression() {
        if (this.blocks.length === 0) {
            this.expression = '';
            this.result = null;
            this.isValid = false;
            return;
        }
        
        // Keep track of operators between numbers
        // Extract operators from current expression
        // Note: includes both − (U+2212 minus sign) and - (U+002D hyphen-minus)
        const operators = this.expression.match(/[+\-−×÷*/()]/g) || [];
        
        // Rebuild: number, operator, number, operator, ...
        let newExpr = '';
        this.blocks.forEach((block, i) => {
            newExpr += block.value;
            // Add operator after each number except the last
            if (i < this.blocks.length - 1 && operators[i]) {
                newExpr += operators[i];
            }
        });
        
        this.expression = newExpr;
        this.calculate();
    }

    /**
     * Add operator to the end of expression
     */
    appendOperator(op) {
        if (this.expression && !/[+\-−×÷*/]$/.test(this.expression)) {
            this.expression += op;
            this.calculate();
        }
    }

    /**
     * Replace the last operator with a new one
     */
    replaceLastOperator(op) {
        if (this.expression) {
            this.expression = this.expression.replace(/[+\-−×÷*/]$/, op);
            this.calculate();
        }
    }

    /**
     * Check if expression ends with an operator
     */
    endsWithOperator() {
        return /[+\-−×÷*/]$/.test(this.expression);
    }

    /**
     * Remove the last character from the expression (backspace)
     */
    backspace() {
        if (!this.expression || this.expression.length === 0) {
            return;
        }

        // Simply remove the last character
        this.expression = this.expression.slice(0, -1);
        this.calculate();
    }

    /**
     * Clear the equation
     */
    clear() {
        const blocks = [...this.blocks];
        blocks.forEach(b => b.setSelected(false));
        this.expression = '';
        this.blocks = [];
        this.result = null;
        this.isValid = false;
        return blocks;
    }

    /**
     * Get the blocks used in the equation
     */
    getBlocks() {
        return [...this.blocks];
    }

    /**
     * Check if equation is empty
     */
    isEmpty() {
        return this.expression === '';
    }

    /**
     * Get the display expression (with nicer symbols)
     */
    getDisplayExpression() {
        return this.expression
            .replace(/\*/g, '×')
            .replace(/\//g, '÷');
    }

    /**
     * Calculate the result of the expression
     */
    calculate() {
        try {
            if (!this.expression || this.expression.trim() === '') {
                this.result = null;
                this.isValid = false;
                return;
            }

            // Check for valid expression structure
            if (!this.isValidStructure()) {
                this.result = null;
                this.isValid = false;
                return;
            }

            // Evaluate the expression safely
            const result = this.safeEval(this.expression);
            
            if (result !== null && !isNaN(result) && isFinite(result)) {
                // Round to avoid floating point issues
                this.result = Math.round(result * 10000) / 10000;
                this.isValid = true;
            } else {
                this.result = null;
                this.isValid = false;
            }
        } catch (e) {
            this.result = null;
            this.isValid = false;
        }
    }

    /**
     * Check if the expression has valid structure
     */
    isValidStructure() {
        if (!this.expression) return false;
        
        // Check balanced parentheses
        let depth = 0;
        for (const char of this.expression) {
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (depth < 0) return false;
        }
        if (depth !== 0) return false;

        // Check it doesn't start/end with operators (except minus at start)
        if (/^[+*/]/.test(this.expression)) return false;
        if (/[+\-−×÷*/]$/.test(this.expression)) return false;

        // Check for consecutive operators
        if (/[+\-−×÷*/]{2,}/.test(this.expression)) return false;

        // Must contain at least one number
        if (!/\d/.test(this.expression)) return false;

        return true;
    }

    /**
     * Safely evaluate a mathematical expression
     */
    safeEval(expr) {
        try {
            // Normalize display symbols to JavaScript operators
            const normalized = expr
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');
            
            // Use Function constructor for safer eval
            const func = new Function('return ' + normalized);
            return func();
        } catch (e) {
            return null;
        }
    }

    /**
     * Check if result matches a target
     */
    matchesTarget(target) {
        if (!this.isValid || this.result === null) return false;
        return Math.abs(this.result - target) < 0.0001;
    }

    /**
     * Get the result display string
     */
    getResultString() {
        if (this.result === null) return '';
        
        // Format fractions nicely
        if (this.result % 1 !== 0) {
            const commonFractions = {
                0.5: '½', 0.333: '⅓', 0.667: '⅔',
                0.25: '¼', 0.75: '¾', 0.2: '⅕',
                0.4: '⅖', 0.6: '⅗', 0.8: '⅘'
            };
            
            for (const [decimal, fraction] of Object.entries(commonFractions)) {
                if (Math.abs(this.result - parseFloat(decimal)) < 0.01) {
                    return fraction;
                }
            }
            return this.result.toFixed(2);
        }
        
        return this.result.toString();
    }

    /**
     * Static method to generate a solvable target based on available blocks
     */
    static generateTarget(blocks, level = 1) {
        const minTarget = level <= 2 ? 1 : -10;
        const maxTarget = Math.min(10 + level * 5, 50);
        
        const possibleResults = new Set();
        const numbers = blocks
            .filter(b => b.type === Block.TYPES.NUMBER)
            .map(b => b.value);

        // Simple two-number combinations
        for (let i = 0; i < numbers.length; i++) {
            for (let j = 0; j < numbers.length; j++) {
                if (i !== j) {
                    possibleResults.add(numbers[i] + numbers[j]);
                    possibleResults.add(numbers[i] - numbers[j]);
                    possibleResults.add(numbers[i] * numbers[j]);
                    if (numbers[j] !== 0 && numbers[i] % numbers[j] === 0) {
                        possibleResults.add(numbers[i] / numbers[j]);
                    }
                }
            }
        }
        
        const validTargets = Array.from(possibleResults).filter(t => 
            t >= minTarget && t <= maxTarget && Number.isInteger(t) && t !== 0
        );
        
        if (validTargets.length > 0) {
            return validTargets[Math.floor(Math.random() * validTargets.length)];
        }
        
        return Math.floor(Math.random() * (maxTarget - Math.max(1, minTarget))) + Math.max(1, minTarget);
    }
}
