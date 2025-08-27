class SlotMachine {
    constructor() {
        this.balance = 1000;
        this.bet = 50;
        this.isSpinning = false;
        this.symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '7️⃣'];
        this.payouts = {
            '7️⃣7️⃣7️⃣': 10,
            '🍒🍒🍒': 5,
            '🍇🍇🍇': 4,
            '🍉🍉🍉': 3,
            '🍊🍊🍊': 2,
            '🍋🍋🍋': 2
        };
        
        this.initialize();
    }

    initialize() {
        this.updateDisplay();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('spinBtn').addEventListener('click', () => {
            if (!this.isSpinning) {
                this.startSpin();
            }
        });
    }

    startSpin() {
        if (this.balance < this.bet) {
            this.showMessage('Недостаточно средств!');
            return;
        }

        this.isSpinning = true;
        this.balance -= this.bet;
        this.updateDisplay();
        this.hideMessage();
        this.disableSpinButton();

        // Play spin sound
        document.getElementById('spinSound').play();

        // Spin each reel with different delays
        this.spinReel('reel1', 1000);
        this.spinReel('reel2', 1500);
        this.spinReel('reel3', 2000).then(() => {
            this.checkWin();
            this.isSpinning = false;
            this.enableSpinButton();
        });
    }

    async spinReel(reelId, duration) {
        const reel = document.getElementById(reelId);
        const symbols = reel.querySelectorAll('.symbol');
        
        // Add spinning animation
        reel.style.transition = `transform ${duration}ms cubic-bezier(0.3, 0.1, 0.3, 1)`;
        reel.style.transform = 'translateY(-480px)';

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, duration));

        // Play reel stop sound
        document.getElementById('reelSound').play();

        // Reset position and update symbols
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(0)';
        
        // Randomize symbols for next spin
        this.randomizeReelSymbols(reelId);
    }

    randomizeReelSymbols(reelId) {
        const reel = document.getElementById(reelId);
        const symbols = reel.querySelectorAll('.symbol');
        
        symbols.forEach((symbol, index) => {
            const randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
            symbol.textContent = randomSymbol;
        });
    }

    checkWin() {
        const reels = ['reel1', 'reel2', 'reel3'];
        const result = reels.map(reelId => {
            const reel = document.getElementById(reelId);
            const symbols = reel.querySelectorAll('.symbol');
            return symbols[2].textContent; // Get the middle symbol (visible after spin)
        });

        const resultString = result.join('');
        let winAmount = 0;

        // Check for winning combinations
        for (const [combination, multiplier] of Object.entries(this.payouts)) {
            if (resultString === combination) {
                winAmount = this.bet * multiplier;
                break;
            }
        }

        if (winAmount > 0) {
            this.balance += winAmount;
            this.showWin(winAmount, result);
        } else {
            this.showMessage('Повезёт в следующий раз!');
        }

        this.updateDisplay();
    }

    showWin(amount, symbols) {
        const winMessage = `🎉 ВЫ ВЫИГРАЛИ ${amount} ₽!`;
        this.showMessage(winMessage);
        
        // Play win sound
        document.getElementById('winSound').play();

        // Highlight winning symbols
        const reels = ['reel1', 'reel2', 'reel3'];
        reels.forEach((reelId, index) => {
            const reel = document.getElementById(reelId);
            const symbol = reel.querySelectorAll('.symbol')[2];
            symbol.classList.add('winning-symbol');
            
            setTimeout(() => {
                symbol.classList.remove('winning-symbol');
            }, 1500);
        });
    }

    changeBet(amount) {
        if (this.isSpinning) return;

        const newBet = this.bet + amount;
        if (newBet >= 10 && newBet <= 100) {
            this.bet = newBet;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        document.getElementById('balance').textContent = this.balance;
        document.getElementById('bet').textContent = this.bet;
    }

    showMessage(message) {
        const messageElement = document.getElementById('winMessage');
        messageElement.textContent = message;
    }

    hideMessage() {
        document.getElementById('winMessage').textContent = '';
    }

    disableSpinButton() {
        document.getElementById('spinBtn').disabled = true;
    }

    enableSpinButton() {
        document.getElementById('spinBtn').disabled = false;
    }
}

// Initialize the slot machine when page loads
let slotMachine;

document.addEventListener('DOMContentLoaded', () => {
    slotMachine = new SlotMachine();
});

// Global functions for HTML buttons
function startSpin() {
    if (slotMachine) {
        slotMachine.startSpin();
    }
}

function changeBet(amount) {
    if (slotMachine) {
        slotMachine.changeBet(amount);
    }
}
