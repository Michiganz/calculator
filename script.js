class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.history = []; 
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
        this.errorState = false;
    }

    delete() {
        if (this.shouldResetScreen || this.errorState) {
            this.clear();
            return;
        }
        if (this.currentOperand.length === 1 || this.currentOperand === '0' || this.currentOperand.length === 0) {
            this.currentOperand = '0';
            return;
        }
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
    }

    appendNumber(number) {
        if (this.errorState) this.clear();
        if (number === '.' && this.currentOperand.includes('.')) return;
        
        if (this.shouldResetScreen) {
            this.currentOperand = number === '.' ? '0.' : number.toString();
            this.shouldResetScreen = false;
            return;
        }

        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            if(this.currentOperand.length >= 15) return; 
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    chooseOperation(operation) {
        if (this.errorState) this.clear();
        if (this.currentOperand === '' && this.previousOperand === '') return;
        
        if (this.currentOperand === '') {
            this.operation = operation;
            return;
        }
        
        if (this.previousOperand !== '') {
            this.compute(false); 
        }
        
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    // --- CORRECTION DU POURCENTAGE ---
    computePercent() {
        if (this.errorState) this.clear();
        if (this.currentOperand === '') return;
        
        const current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;

        // Transforme immédiatement la valeur (ex: 45 devient 0.45)
        const computedPercent = current / 100;
        this.currentOperand = computedPercent.toString();
        this.shouldResetScreen = true;
    }

    compute(recordHistory = true) {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+': computation = prev + current; break;
            case '-': computation = prev - current; break;
            case '×': 
            case '*': computation = prev * current; break;
            case '÷': 
            case '/': 
                if (current === 0) {
                    this.handleError();
                    return;
                }
                computation = prev / current; 
                break;
            default: return;
        }

        // Corrige les bugs de flottants en JS (ex: 0.1 + 0.2)
        computation = Math.round(computation * 10000000000) / 10000000000;
        
        if (recordHistory) {
            this.addToHistory(`${this.getDisplayNumber(prev)} ${this.operation} ${this.getDisplayNumber(current)}`, computation);
        }

        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.shouldResetScreen = true;
        this.triggerResultAnimation();
    }

    handleError() {
        this.currentOperand = "Erreur";
        this.previousOperand = "";
        this.operation = undefined;
        this.errorState = true;
        this.shouldResetScreen = true;
    }

    getDisplayNumber(number) {
        if (number === "Erreur") return number;
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(integerDigits);
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay},${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            this.previousOperandTextElement.innerText = `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandTextElement.innerText = '';
        }

        // Ajustement dynamique de la taille
        const length = this.currentOperandTextElement.innerText.length;
        if(length > 13) this.currentOperandTextElement.style.fontSize = 'clamp(2rem, 5vw, 4rem)';
        else if(length > 9) this.currentOperandTextElement.style.fontSize = 'clamp(3rem, 7vw, 6rem)';
        else this.currentOperandTextElement.style.fontSize = '';
    }

    triggerResultAnimation() {
        this.currentOperandTextElement.classList.remove('animate-result');
        void this.currentOperandTextElement.offsetWidth; // Déclenche un reflow pour relancer l'animation
        this.currentOperandTextElement.classList.add('animate-result');
    }

    addToHistory(expression, result) {
        this.history.unshift({ expression, result });
        if (this.history.length > 30) this.history.pop();
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        this.history.forEach((item) => {
            const div = document.createElement('div');
            div.classList.add('history-item');
            div.innerHTML = `
                <div class="expr">${item.expression} =</div>
                <div class="res">${this.getDisplayNumber(item.result)}</div>
            `;
            div.addEventListener('click', () => {
                this.clear();
                this.currentOperand = item.result.toString();
                this.updateDisplay();
                document.getElementById('history-panel').classList.remove('active');
            });
            historyList.appendChild(div);
        });
    }
}

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new Calculator(
        document.getElementById('previous-operand'),
        document.getElementById('current-operand')
    );

    // Événements d'interface
    document.querySelectorAll('[data-number]').forEach(button => {
        button.addEventListener('click', () => {
            calculator.appendNumber(button.dataset.number);
            calculator.updateDisplay();
        });
    });

    document.querySelectorAll('[data-operator]').forEach(button => {
        button.addEventListener('click', () => {
            calculator.chooseOperation(button.dataset.operator);
            calculator.updateDisplay();
        });
    });

    document.querySelector('[data-action="compute"]').addEventListener('click', () => {
        calculator.compute(true);
        calculator.updateDisplay();
    });

    document.querySelector('[data-action="clear"]').addEventListener('click', () => {
        calculator.clear();
        calculator.updateDisplay();
    });

    document.querySelector('[data-action="delete"]').addEventListener('click', () => {
        calculator.delete();
        calculator.updateDisplay();
    });

    // Bouton de pourcentage modifié
    document.querySelector('[data-action="percent"]').addEventListener('click', () => {
        calculator.computePercent();
        calculator.updateDisplay();
    });

    // Contrôle Clavier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'BUTTON') { e.preventDefault(); e.target.click(); return; }
        if (/[0-9]/.test(e.key)) { calculator.appendNumber(e.key); calculator.updateDisplay(); }
        if (e.key === '.' || e.key === ',') { calculator.appendNumber('.'); calculator.updateDisplay(); }
        if (e.key === '+' || e.key === '-') { calculator.chooseOperation(e.key); calculator.updateDisplay(); }
        if (e.key === '*' || e.key === 'x') { calculator.chooseOperation('×'); calculator.updateDisplay(); }
        if (e.key === '/') { e.preventDefault(); calculator.chooseOperation('÷'); calculator.updateDisplay(); }
        if (e.key === '%') { calculator.computePercent(); calculator.updateDisplay(); }
        if (e.key === 'Enter' || e.key === '=') { calculator.compute(); calculator.updateDisplay(); }
        if (e.key === 'Backspace' || e.key === 'Delete') { calculator.delete(); calculator.updateDisplay(); }
        if (e.key === 'Escape') { calculator.clear(); calculator.updateDisplay(); }
    });

    // LOGIQUE DE THEME
    const themeBtn = document.getElementById('theme-btn');
    const themeIcon = document.getElementById('theme-icon');
    const htmlEl = document.documentElement;
    
    const moonIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const sunIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

    const setTheme = (theme) => {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('calc-theme', theme);
        themeIcon.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    };

    const savedTheme = localStorage.getItem('calc-theme');
    if (savedTheme) setTheme(savedTheme);
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

    themeBtn.addEventListener('click', () => {
        setTheme(htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });

    // LOGIQUE HISTORIQUE
    document.getElementById('history-btn').addEventListener('click', () => {
        document.getElementById('history-panel').classList.add('active');
    });

    document.getElementById('close-history-btn').addEventListener('click', () => {
        document.getElementById('history-panel').classList.remove('active');
    });
});