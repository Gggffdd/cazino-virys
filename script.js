class ModernSlotMachine {
    constructor() {
        this.balance = 10000;
        this.bet = 100;
        this.totalBet = 500;
        this.isSpinning = false;
        this.autoSpin = false;
        this.freeSpins = 0;
        this.lastWin = 0;
        
        this.symbols = [
            '💎', '💰', '₿', '👑', '7️⃣', 
            '🎯', '✨', '🎁', '🍒', '🍋'
        ];
        
        this.symbolTypes = {
            '💎': 'high',
            '💰': 'high',
            '₿': 'medium',
            '👑': 'medium',
            '7️⃣': 'medium',
            '🎯': 'wild',
            '✨': 'scatter',
            '🎁': 'bonus',
            '🍒': 'low',
            '🍋': 'low'
        };
        
        this.payouts = {
            '💎': [0, 0, 20, 50, 100],
            '💰': [0, 0, 15, 40, 80],
            '₿': [0, 0, 12, 30, 60],
            '👑': [0, 0, 10, 25, 50],
            '7️⃣': [0, 0, 8, 20, 40],
            '🍒': [0, 0, 5, 15, 30],
            '🍋': [0, 0, 5, 15, 30]
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
            '💎': 5, '💰': 6, '₿': 7, '👑': 8, '7️⃣': 9,
            '🎯': 4, '✨': 3, '🎁': 2, '🍒': 10, '🍋': 10
        };
        
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (const [symbol, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return symbol;
        }
        
        return '🍒';
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
            
            // V patterns
            [[0,0], [1,0], [2,0], [1,1], [0,2]],
            [[3,0], [2,0], [1,0], [2,1], [3,2]]
        ];
    }

    async startSpin() {
        if (this.isSpinning || this.balance < this.totalBet) return;
        
        this.isSpinning = true;
        this.balance -= this.totalBet;
        this.updateDisplay();
        
        document.getElementById('spinSound').play();
        
        // Animate spin
        await this.animateSpin();
        
        // Generate new grid
        this.generateNewGrid();
        
        // Check for wins
        const winResult = this.checkWins();
        
        if (winResult.totalWin > 0) {
            this.showWin(winResult);
        }
        
        this.isSpinning = false;
        
        if (this.autoSpin && this.balance >= this.totalBet) {
            setTimeout(() => this.startSpin(), 1000);
        }
    }

    async animateSpin() {
        const cells = document.querySelectorAll('.grid-cell');
        const spinDuration = 2000;
        const startTime = Date.now();
        
        // Fast spin phase
        while (Date.now() - startTime < spinDuration) {
            for (const cell of cells) {
                if (Math.random() < 0.3) {
                    cell.textContent = this.getRandomSymbol();
                    cell.style.animation = 'symbolFall 0.2s ease';
                }
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Slow down phase
        for (let i = 0; i < 5; i++) {
            for (const cell of cells) {
                if (Math.random() < 0.1) {
                    cell.textContent = this.getRandomSymbol();
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
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
            totalWin += this.bet * scatterCount * 5;
            this.awardFreeSpins(scatterCount);
        }
        
        // Check paylines
        for (const line of this.paylines) {
            const lineSymbols = line.map(([row, col]) => this.currentGrid[row][col]);
            const winResult = this.checkLine(lineSymbols);
            
            if (winResult.win > 0) {
                totalWin += winResult.win;
                winLines.push({ line, win: winResult.win });
                
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
        
        // Wild symbol can be any symbol
        if (firstSymbol === '🎯') {
            for (let i = 1; i < symbols.length; i++) {
                if (symbols[i] !== '🎯' && symbols[i] !== firstSymbol) {
                    firstSymbol = symbols[i];
                    break;
                }
            }
        }
        
        for (let i = 1; i < symbols.length; i++) {
            if (symbols[i] === firstSymbol || symbols[i] === '🎯') {
                count++;
            } else {
                break;
            }
        }
        
        if (count >= 3 && this.payouts[firstSymbol]) {
            const win = this.bet * this.payouts[firstSymbol][count - 1];
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

    awardFreeSpins(scatterCount) {
        const spins = scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : 20;
        this.freeSpins += spins;
        this.showFreeSpinsIndicator();
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
            document.getElementById('bigWinSound').play();
            this.showBigWin(winResult.totalWin);
        } else {
            document.getElementById('winSound').play();
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
        
        setTimeout(() => {
            winPopup.classList.remove('show');
        }, 3000);
    }

    showFreeSpinsIndicator() {
        const indicator = document.getElementById('freeSpinsIndicator');
        const countElement = document.getElementById('freeSpinsCount');
        
        countElement.textContent = this.freeSpins;
        indicator.classList.add('show');
        
        document.getElementById('bonusSound').play();
    }

    changeBet(amount) {
        if (this.isSpinning) return;
        
        const newBet = this.bet + amount;
        if (newBet >= 50 && newBet <= 1000) {
            this.bet = newBet;
            this.totalBet = this.bet * 5; // 5 paylines
            this.updateDisplay();
        }
    }

    setMaxBet() {
        if (this.isSpinning) return;
        
        this.bet = 1000;
        this.totalBet = this.bet * 5;
        this.updateDisplay();
    }

    toggleAutoSpin() {
        this.autoSpin = !this.autoSpin;
        const autoText = document.getElementById('autoText');
        autoText.textContent = this.autoSpin ? 'STOP' : 'AUTO';
        
        if (this.autoSpin && !this.isSpinning && this.balance >= this.totalBet) {
            this.startSpin();
        }
    }

    updateDisplay() {
        document.getElementById('balance').textContent = this.balance.toLocaleString();
        document.getElementById('lastWin').textContent = this.lastWin.toLocaleString();
        document.getElementById('betAmount').textContent = this.bet.toLocaleString();
        document.getElementById('spinPrice').textContent = this.totalBet.toLocaleString();
        
        const spinBtn = document.getElementById('spinBtn');
        spinBtn.disabled = this.isSpinning || this.balance < this.totalBet;
    }

    setupEventListeners() {
        document.getElementById('spinBtn').addEventListener('click', () => {
            this.startSpin();
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                e.target.classList.add('active');
                document.getElementById(tab).classList.add('active');
            });
        });
    }

    initializeParticles() {
        // Particle background animation
        const canvas = document.getElementById('particles');
        if (canvas && canvas.getContext) {
            const ctx = canvas.getContext('2d');
            const particles = [];
            
            function resizeCanvas() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            
            function createParticles() {
                for (let i = 0; i < 50; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        size: Math.random() * 3 + 1,
                        speed: Math.random() * 2 + 0.5,
                        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                        angle: Math.random() * Math.PI * 2
                    });
                }
            }
            
            function animateParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                for (const particle of particles) {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fillStyle = particle.color;
                    ctx.fill();
                    
                    particle.x += Math.cos(particle.angle) * particle.speed;
                    particle.y += Math.sin(particle.angle) * particle.speed;
                    
                    if (particle.x < 0 || particle.x > canvas.width || 
                        particle.y < 0 || particle.y > canvas.height) {
                        particle.x = Math.random() * canvas.width;
                        particle.y = Math.random() * canvas.height;
                        particle.angle = Math.random() * Math.PI * 2;
                    }
                }
                
                requestAnimationFrame(animateParticles);
            }
            
            resizeCanvas();
            createParticles();
            animateParticles();
            
            window.addEventListener('resize', resizeCanvas);
        }
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
