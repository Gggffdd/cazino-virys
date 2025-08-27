// Enhanced Particle background system
class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 100 };
        this.colors = ['#ff2d95', '#00f3ff', '#c96dff', '#00ff9d', '#ffd700'];
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('mousemove', (e) => this.trackMouse(e));
        this.canvas.addEventListener('mouseleave', () => this.clearMouse());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    trackMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }
    
    clearMouse() {
        this.mouse.x = null;
        this.mouse.y = null;
    }
    
    createParticles() {
        this.particles = [];
        const particleCount = Math.min(150, Math.floor((this.canvas.width * this.canvas.height) / 8000));
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 4 + 1,
                speedX: (Math.random() - 0.5) * 1,
                speedY: (Math.random() - 0.5) * 1,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                opacity: Math.random() * 0.5 + 0.3,
                angle: Math.random() * Math.PI * 2,
                wave: Math.random() * Math.PI * 2
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw gradient overlay
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2,
            this.canvas.height / 2,
            0,
            this.canvas.width / 2,
            this.canvas.height / 2,
            Math.max(this.canvas.width, this.canvas.height) / 1.5
        );
        
        gradient.addColorStop(0, 'rgba(10, 10, 26, 0.1)');
        gradient.addColorStop(1, 'rgba(10, 10, 26, 0.9)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        for (const particle of this.particles) {
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            
            // Create gradient for particle
            const particleGradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            
            particleGradient.addColorStop(0, particle.color + 'ff');
            particleGradient.addColorStop(1, particle.color + '00');
            
            this.ctx.fillStyle = particleGradient;
            this.ctx.fill();
            
            // Update position with wave motion
            particle.wave += 0.01;
            particle.x += particle.speedX + Math.cos(particle.wave) * 0.3;
            particle.y += particle.speedY + Math.sin(particle.wave) * 0.3;
            
            // Mouse interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    
                    particle.x += Math.cos(angle) * force * 2;
                    particle.y += Math.sin(angle) * force * 2;
                }
            }
            
            // Wrap around edges
            if (particle.x <= -particle.size) particle.x = this.canvas.width + particle.size;
            if (particle.x >= this.canvas.width + particle.size) particle.x = -particle.size;
            if (particle.y <= -particle.size) particle.y = this.canvas.height + particle.size;
            if (particle.y >= this.canvas.height + particle.size) particle.y = -particle.size;
            
            // Draw connections
            for (const otherParticle of this.particles) {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    this.ctx.beginPath();
                    
                    // Line gradient
                    const lineGradient = this.ctx.createLinearGradient(
                        particle.x, particle.y,
                        otherParticle.x, otherParticle.y
                    );
                    
                    const alpha = (1 - distance/100) * 0.2;
                    lineGradient.addColorStop(0, particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
                    lineGradient.addColorStop(1, otherParticle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
                    
                    this.ctx.strokeStyle = lineGradient;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize particle background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ParticleBackground('particles');
});
