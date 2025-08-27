class ModernSlotMachine {
    constructor() {
        this.balance = 10000;
        this.bet = 50;
        this.lines = 20;
        this.totalBet = this.bet * this.lines;
        this.isSpinning = false;
        this.autoSpin = false;
        this.autoSpinsCount = 0;
        this.freeSpins = 0;
        this.lastWin = 0;
        this.soundEnabled = true;
        this.animationSpeed = 3;
        this.quickSpin = false;
        this.turboMode = false;
        this.gameHistory = [];
        
        this.symbols = [
            '💎', '💰', '₿', '👑', '7️⃣', '❤️', '⭐', '🔔',
            '🎯', '✨', '🎁'
        ];
        
        this.symbolTypes = {
            '💎': 'premium',
            '💰': 'premium', 
            '₿': 'high',
            '👑': 'high',
            '7️⃣': 'medium',
            '❤️': 'medium',
            '⭐': 'low',
            '🔔': 'low',
            '🎯': 'wild',
            '✨': 'scatter',
            '🎁': 'bonus'
        };
        
        this.payouts = {
            '💎': [0, 0, 20, 50, 100],
            '💰': [0, 0, 15, 40, 80],
            '₿': [0, 0, 12, 30, 60],
            '👑': [0, 0, 10, 25, 50],
            '7️⃣': [0, 0, 8, 20, 40],
            '❤️': [0, 0, 6, 15, 30],
            '⭐': [0, 0, 5, 12, 25],
            '🔔': [0, 0, 4, 10, 20]
        };
        
        this.paylines = this.generatePaylines();
        this.currentGrid = [];
        
        this.initialize();
    }

    initialize() {
        this.createGrid();
        this.updateDisplay();
        this.setupEventListeners();
        this.initializeParticles();
        this.hidePreloader();
        
        // Initialize settings
        this.setVolume(80);
    }

    createGrid() {
        const grid = document.getElementById('slotGrid');
        grid.innerHTML = '';
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const randomSymbol = this.getRandomSymbol();
                cell.textContent = randomSymbol;
                cell.dataset.symbol = randomSymbol;
                
                if (this.symbolTypes[randomSymbol] === 'wild') {
                    cell.classList.add('wild');
                } else if (this.symbolTypes[randomSymbol] === 'scatter') {
                    cell.classList.add('scatter');
                } else if (this.symbolTypes[randomSymbol] === 'bonus') {
                    cell.classList.add('bonus');
                }
                
                grid.appendChild(cell);
            }
        }
    }

    getRandomSymbol() {
        const weights = {
            '💎': 3, '💰': 4, '₿': 5, '👑': 6, '7️⃣': 7,
            '❤️': 8, '⭐': 10, '🔔': 12, '🎯': 4, '✨': 3, '🎁': 2
        };
        
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (const [symbol, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return symbol;
        }
        
        return '🔔';
    }

    generatePaylines() {
        return [
            // Horizontal lines
            [[0,0], [0,1], [0,2], [0,3], [0,4]],
            [[1,0], [1,1], [1,2], [1,3], [1,4]],
            [[2,0], [2,1], [2,2], [2,3], [2,4]],
            [[3,0], [3,1], [3,2], [3,3], [3,4]],
            
            // Diagonals
            [[0,0], [1,1], [2,2], [3,3], [3,4]],
            [[3,0], [2,1], [1,2], [0,3], [0,4]],
            [[0,0], [1,1], [2,2], [2,3], [3,4]],
            [[3,0], [2,1], [1,2], [1,3], [0,4]],
            
            // V patterns
            [[0,0], [1,0], [2,0], [1,1], [0,2]],
            [[3,0], [2,0], [1,0], [2,1], [3,2]],
            [[0,2], [1,1], [2,0], [1,0], [0,0]],
            [[3,2], [2,1], [1,0], [2,0], [3,0]],
            
            // Z patterns
            [[0,0], [0,1], [1,2], [2,3], [3,4]],
            [[3,0], [3,1], [2,2], [1,3], [0,4]],
            [[0,4], [0,3], [1,2], [2,1], [3,0]],
            [[3,4], [3,3], [2,2], [1,1], [0,0]],
            
            // M patterns
            [[0,0], [1,1], [0,2], [1,3], [0,4]],
            [[3,0], [2,1], [3,2], [2,3], [3,4]],
            [[0,0], [0,1], [1,2], [0,3], [0,4]],
            [[3,0], [3,1], [2,2], [3,3], [3,4]]
        ];
    }

    async startSpin() {
        if (this.isSpinning) return;
        
        // Check if we have free spins
        if (this.freeSpins > 0) {
            this.freeSpins--;
            this.updateFreeSpinsDisplay();
        } else {
            // Check balance for regular spin
            if (this.balance < this.totalBet) {
                this.showMessage("Not enough balance!");
                return;
            }
            
            this.balance -= this.totalBet;
        }
        
        this.isSpinning = true;
        this.updateDisplay();
        
        // Play spin sound
        this.playSound('spinSound');
        
        // Animate spin
        await this.animateSpin();
        
        // Generate new grid
        this.generateNewGrid();
        
        // Check for wins
        const winResult = this.checkWins();
        
        if (winResult.totalWin > 0) {
            this.showWin(winResult);
        } else if (this.freeSpins <= 0 && !this.autoSpin) {
            this.playSound('reelSound');
        }
        
        // Add to history
        this.addToHistory(winResult.totalWin);
        
        this.isSpinning = false;
        
        // Continue auto spin if enabled
        if (this.autoSpin && (this.autoSpinsCount > 0 || this.autoSpinsCount === -1)) {
            if (this.autoSpinsCount > 0) this.autoSpinsCount--;
            
            if (this.balance >= this.totalBet || this.freeSpins > 0) {
                const delay = this.turboMode ? 100 : 500;
                setTimeout(() => this.startSpin(), delay);
            } else {
                this.toggleAutoSpin(false);
            }
        }
    }

    async animateSpin() {
        const cells = document.querySelectorAll('.grid-cell');
        const spinDuration = this.quickSpin ? 1000 : 2000;
        const startTime = Date.now();
        
        // Add spinning class to cells
        cells.forEach(cell => {
            cell.classList.add('spinning');
        });
        
        // Fast spin phase
        while (Date.now() - startTime < spinDuration) {
            for (const cell of cells) {
                if (Math.random() < 0.3) {
                    cell.textContent = this.getRandomSymbol();
                }
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Slow down phase
        for (let i = 0; i < 5; i++) {
            for (const cell of cells) {
                if (Math.random() < 0.2) {
                    cell.textContent = this.getRandomSymbol();
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Remove spinning class
        cells.forEach(cell => {
            cell.classList.remove('spinning');
        });
    }

    generateNewGrid() {
        const cells = document.querySelectorAll('.grid-cell');
        this.currentGrid = [];
        
        for (let row = 0; row < 4; row++) {
            this.currentGrid[row] = [];
            for (let col = 0; col < 5; col++) {
                const cell = cells[row * 5 + col];
                const symbol = this.getRandomSymbol();
                
                cell.textContent = symbol;
                cell.dataset.symbol = symbol;
                
                cell.classList.remove('wild', 'scatter', 'bonus', 'win');
                if (this.symbolTypes[symbol] === 'wild') {
                    cell.classList.add('wild');
                } else if (this.symbolTypes[symbol] === 'scatter') {
                    cell.classList.add('scatter');
                } else if (this.symbolTypes[symbol] === 'bonus') {
                    cell.classList.add('bonus');
                }
                
                this.currentGrid[row][col] = symbol;
            }
        }
    }

    checkWins() {
        let totalWin = 0;
        const winningCells = new Set();
        const winLines = [];
        
        // Check scatter wins
        const scatterCount = this.countScatters();
        if (scatterCount >= 3) {
            const scatterWin = this.bet * scatterCount * 5;
            totalWin += scatterWin;
            this.awardFreeSpins(scatterCount);
            
            // Add all scatter positions to winning cells
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 5; col++) {
                    if (this.currentGrid[row][col] === '✨') {
                        winningCells.add(`${row}-${col}`);
                    }
                }
            }
        }
        
        // Check bonus symbols
        const bonusCount = this.countBonus();
        if (bonusCount >= 3) {
            this.startBonusGame();
        }
        
        // Check paylines
        for (let i = 0; i < this.paylines.length; i++) {
            const line = this.paylines[i];
            const lineSymbols = line.map(([row, col]) => this.currentGrid[row][col]);
            const winResult = this.checkLine(lineSymbols);
            
            if (winResult.win > 0) {
                totalWin += winResult.win;
                winLines.push({ line: i, win: winResult.win });
                
                for (const [row, col] of line.slice(0, winResult.length)) {
                    winningCells.add(`${row}-${col}`);
                }
            }
        }
        
        // Highlight winning cells
        this.highlightWinningCells(winningCells);
        
        return { totalWin, winLines, winningCells: Array.from(winningCells) };
    }

    checkLine(symbols) {
        let firstSymbol = symbols[0];
        let count = 1;
        let wildCount = 0;
        
        // If first symbol is wild, find the next non-wild symbol
        if (firstSymbol === '🎯') {
            wildCount++;
            for (let i = 1; i < symbols.length; i++) {
                if (symbols[i] !== '🎯') {
                    firstSymbol = symbols[i];
                    break;
                } else {
                    wildCount++;
                }
            }
        }
        
        for (let i = 1; i < symbols.length; i++) {
            if (symbols[i] === firstSymbol || symbols[i] === '🎯') {
                count++;
                if (symbols[i] === '🎯') wildCount++;
            } else {
                break;
            }
        }
        
        if (count >= 3 && this.payouts[firstSymbol]) {
            // Apply wild multiplier (2x for each wild in the line)
            const wildMultiplier = Math.pow(2, wildCount);
            const win = this.bet * this.payouts[firstSymbol][count - 1] * wildMultiplier;
            return { win, length: count };
        }
        
        return { win: 0, length: 0 };
    }

    countScatters() {
        let count = 0;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 5; col++) {
                if (this.currentGrid[row][col] === '✨') {
                    count++;
                }
            }
        }
        return count;
    }

    countBonus() {
        let count = 0;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 5; col++) {
                if (this.currentGrid[row][col] === '🎁') {
                    count++;
                }
            }
        }
        return count;
    }

    awardFreeSpins(scatterCount) {
        const spins = scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : 25;
        this.freeSpins += spins;
        this.showFreeSpinsIndicator();
        this.playSound('bonusSound');
    }

    highlightWinningCells(cellIds) {
        const cells = document.querySelectorAll('.grid-cell');
        
        cells.forEach(cell => {
            cell.classList.remove('win');
        });
        
        for (const cellId of cellIds) {
            const [row, col] = cellId.split('-').map(Number);
            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('win');
            }
        }
    }

    showWin(winResult) {
        this.balance += winResult.totalWin;
        this.lastWin = winResult.totalWin;
        
        if (winResult.totalWin > this.bet * 10) {
            this.playSound('bigWinSound');
            this.showBigWin(winResult.totalWin);
        } else {
            this.playSound('winSound');
        }
        
        this.updateDisplay();
    }

    showBigWin(amount) {
        const winPopup = document.getElementById('winPresentation');
        const winTotal = document.getElementById('winTotal');
        const winMultiplier = document.getElementById('winMultiplier');
        
        winTotal.textContent = amount.toLocaleString();
        winMultiplier.textContent = Math.round(amount / this.totalBet);
        
        winPopup.classList.add('show');
        
        // Create confetti particles
        this.createConfetti();
        
        setTimeout(() => {
            winPopup.classList.remove('show');
        }, 3000);
    }

    createConfetti() {
        const container = document.getElementById('winParticles');
        container.innerHTML = '';
        
        const colors = ['#ff2d95', '#00f3ff', '#c96dff', '#00ff9d', '#ffd700'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = Math.random() * 2 + 2 + 's';
            
            container.appendChild(confetti);
        }
    }

    showFreeSpinsIndicator() {
        const indicator = document.getElementById('freeSpinsIndicator');
        const countElement = document.getElementById('freeSpinsCount');
        
        countElement.textContent = this.freeSpins;
        indicator.classList.add('show');
    }

    updateFreeSpinsDisplay() {
        const countElement = document.getElementById('freeSpinsCount');
        if (countElement) {
            countElement.textContent = this.freeSpins;
        }
    }

    startBonusGame() {
        const bonusGame = document.getElementById('bonusGame');
        const bonusGrid = document.getElementById('bonusGrid');
        const bonusTotal = document.getElementById('bonusTotal');
        
        // Generate bonus boxes
        bonusGrid.innerHTML = '';
        const prizes = [10, 20, 50, 100, 200, 500];
        let boxes = [];
        
        for (let i = 0; i < 9; i++) {
            const box = document.createElement('div');
            box.className = 'bonus-box';
            box.dataset.value = prizes[Math.floor(Math.random() * prizes.length)] * this.bet;
            box.innerHTML = '?';
            
            box.addEventListener('click', () => {
                if (box.classList.contains('revealed')) return;
                
                box.classList.add('revealed');
                box.innerHTML = '₽' + box.dataset.value;
                
                const value = parseInt(box.dataset.value);
                this.balance += value;
                this.lastWin += value;
                
                bonusTotal.textContent = this.lastWin.toLocaleString();
                this.updateDisplay();
                this.playSound('winSound');
            });
            
            bonusGrid.appendChild(box);
            boxes.push(box);
        }
        
        bonusTotal.textContent = '0';
        bonusGame.classList.add('show');
    }

    collectBonus() {
        const bonusGame = document.getElementById('bonusGame');
        bonusGame.classList.remove('show');
        
        this.addToHistory(this.lastWin);
    }

    changeBet(amount) {
        if (this.isSpinning) return;
        
        const newBet = this.bet + amount;
        if (newBet >= 10 && newBet <= 1000) {
            this.bet = newBet;
            this.totalBet = this.bet * this.lines;
            this.updateDisplay();
            this.playSound('clickSound');
        }
    }

    setMaxBet() {
        if (this.isSpinning) return;
        
        this.bet = 1000;
        this.totalBet = this.bet * this.lines;
        this.updateDisplay();
        this.playSound('clickSound');
    }

    toggleAutoSpin(showPanel = true) {
        const autoBtn = document.getElementById('autoSpinBtn');
        const autoPanel = document.getElementById('autoPanel');
        const autoText = document.getElementById('autoText');
        
        if (showPanel) {
            autoPanel.classList.toggle('show');
            return;
        }
        
        this.autoSpin = !this.autoSpin;
        
        if (this.autoSpin) {
            autoBtn.classList.add('active');
            autoText.textContent = 'STOP';
            this.autoSpinsCount = -1; // Infinite
        } else {
            autoBtn.classList.remove('active');
            autoText.textContent = 'AUTO';
            this.autoSpinsCount = 0;
            autoPanel.classList.remove('show');
        }
        
        this.playSound('clickSound');
        
        if (this.autoSpin && !this.isSpinning && (this.balance >= this.totalBet || this.freeSpins > 0)) {
            this.startSpin();
        }
    }

    setAutoSpins(count) {
        this.autoSpinsCount = count;
        this.autoSpin = true;
        
        const autoBtn = document.getElementById('autoSpinBtn');
        const autoText = document.getElementById('autoText');
        const autoPanel = document.getElementById('autoPanel');
        
        autoBtn.classList.add('active');
        autoText.textContent = 'STOP';
        autoPanel.classList.remove('show');
        
        this.playSound('clickSound');
        
        if (!this.isSpinning && (this.balance >= this.totalBet || this.freeSpins > 0)) {
            this.startSpin();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('soundBtn');
        
        if (this.soundEnabled) {
            soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
        
        this.playSound('clickSound');
    }

    setVolume(volume) {
        const sounds = document.querySelectorAll('audio');
        sounds.forEach(sound => {
            sound.volume = volume / 100;
        });
        
        const volumeValue = document.getElementById('volumeValue');
        volumeValue.textContent = volume + '%';
    }

    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
        const speedValue = document.getElementById('speedValue');
        
        const speeds = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
        speedValue.textContent = speeds[speed - 1];
    }

    toggleQuickSpin() {
        this.quickSpin = !this.quickSpin;
    }

    toggleTurboMode() {
        this.turboMode = !this.turboMode;
    }

    playSound(soundId) {
        if (!this.soundEnabled) return;
        
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Audio play error:", e));
        }
    }

    updateDisplay() {
        document.getElementById('balance').textContent = this.balance.toLocaleString();
        document.getElementById('lastWin').textContent = this.lastWin.toLocaleString();
        document.getElementById('betAmount').textContent = this.bet.toLocaleString();
        document.getElementById('spinPrice').textContent = this.totalBet.toLocaleString();
        
        const spinBtn = document.getElementById('spinBtn');
        spinBtn.disabled = this.isSpinning || (this.balance < this.totalBet && this.freeSpins <= 0);
    }

    addToHistory(winAmount) {
        const now = new Date();
        const time = now.toLocaleTimeString();
        
        this.gameHistory.unshift({
            time: time,
            win: winAmount
        });
        
        // Keep only last 10 history items
        if (this.gameHistory.length > 10) {
            this.gameHistory.pop();
        }
        
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        
        if (this.gameHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No games played yet</div>';
            return;
        }
        
        historyList.innerHTML = '';
        
        this.gameHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            historyItem.innerHTML = `
                <div class="history-time">${item.time}</div>
                <div class="history-win">${item.win > 0 ? '₽' + item.win.toLocaleString() : 'No win'}</div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    clearHistory() {
        this.gameHistory = [];
        this.updateHistoryDisplay();
        this.playSound('clickSound');
    }

    showMessage(message) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            z-index: 1000;
            font-family: 'Orbitron', sans-serif;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 2000);
    }

    hidePreloader() {
        const preloader = document.getElementById('preloader');
        const container = document.querySelector('.container');
        
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                container.classList.add('loaded');
            }, 500);
        }, 2000);
    }

    setupEventListeners() {
        // Spin button
        document.getElementById('spinBtn').addEventListener('click', () => {
            this.startSpin();
        });
        
        // Bet buttons
        document.getElementById('betUp').addEventListener('click', () => {
            this.changeBet(10);
        });
        
        document.getElementById('betDown').addEventListener('click', () => {
            this.changeBet(-10);
        });
        
        // Max bet button
        document.getElementById('maxBetBtn').addEventListener('click', () => {
            this.setMaxBet();
        });
        
        // Auto spin button
        document.getElementById('autoSpinBtn').addEventListener('click', () => {
            this.toggleAutoSpin();
        });
        
        // Auto spin options
        document.querySelectorAll('.auto-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const spins = parseInt(e.target.dataset.spins);
                this.setAutoSpins(spins);
            });
        });
        
        // Auto close button
        document.getElementById('autoClose').addEventListener('click', () => {
            document.getElementById('autoPanel').classList.remove('show');
        });
        
        // Sound button
        document.getElementById('soundBtn').addEventListener('click', () => {
            this.toggleSound();
        });
        
        // Volume slider
        document.getElementById('soundVolume').addEventListener('input', (e) => {
            this.setVolume(parseInt(e.target.value));
        });
        
        // Animation speed slider
        document.getElementById('animationSpeed').addEventListener('input', (e) => {
            this.setAnimationSpeed(parseInt(e.target.value));
        });
        
        // Quick spin toggle
        document.getElementById('quickSpin').addEventListener('change', (e) => {
            this.toggleQuickSpin();
        });
        
        // Turbo mode toggle
        document.getElementById('turboMode').addEventListener('change', (e) => {
            this.toggleTurboMode();
        });
        
        // Clear history button
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });
        
        // Collect bonus button
        document.getElementById('collectBonus').addEventListener('click', () => {
            this.collectBonus();
        });
        
        // Close free spins button
        document.getElementById('closeFreeSpins').addEventListener('click', () => {
            document.getElementById('freeSpinsIndicator').classList.remove('show');
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                e.target.classList.add('active');
                document.getElementById(tab).classList.add('active');
                
                this.playSound('clickSound');
            });
        });
    }

    initializeParticles() {
        // Particle background is handled by bg-particles.js
    }
}

// Initialize the slot machine
let modernSlot;

document.addEventListener('DOMContentLoaded', () => {
    modernSlot = new ModernSlotMachine();
});

// Global functions for HTML buttons
function changeBet(amount) {
    if (modernSlot) modernSlot.changeBet(amount);
}

function setMaxBet() {
    if (modernSlot) modernSlot.setMaxBet();
}

function toggleAutoSpin() {
    if (modernSlot) modernSlot.toggleAutoSpin();
}
