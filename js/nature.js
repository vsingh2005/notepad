/**
 * Ringo's Notepad: Nature Ambience Engine
 * High-performance, calming animated nature visual with drifting botanical leaves,
 * organic pollen/fireflies, and atmospheric ambient lighting.
 * Adapts organically to Light, Dark, Sepia, and Cyber themes.
 */

class NatureAmbience {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animationFrameId = null;
    this.isActive = true;

    this.particles = [];
    this.leaves = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.theme = document.documentElement.getAttribute('data-theme') || 'light';

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Observe theme changes to adapt leaf & particle colors
    const observer = new MutationObserver(() => {
      this.theme = document.documentElement.getAttribute('data-theme') || 'light';
      this.resetPalette();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Populate natural elements
    this.populateElements();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  getThemeConfig() {
    switch (this.theme) {
      case 'dark':
        return {
          bgGradient: ['#060a12', '#0b1424', '#0d1f18'],
          leafColors: ['rgba(52, 211, 153, 0.45)', 'rgba(16, 185, 129, 0.35)', 'rgba(99, 102, 241, 0.35)'],
          fireflyColor: 'rgba(52, 211, 153, 0.75)',
          glowColor: 'rgba(16, 185, 129, 0.15)',
          sunbeam: 'rgba(52, 211, 153, 0.04)'
        };
      case 'sepia':
        return {
          bgGradient: ['#e4d4c0', '#eedfcb', '#f5e9d7'],
          leafColors: ['rgba(180, 83, 9, 0.35)', 'rgba(217, 119, 6, 0.3)', 'rgba(146, 64, 14, 0.25)'],
          fireflyColor: 'rgba(245, 158, 11, 0.7)',
          glowColor: 'rgba(245, 158, 11, 0.12)',
          sunbeam: 'rgba(251, 191, 36, 0.06)'
        };
      case 'terminal':
        return {
          bgGradient: ['#020805', '#05180f', '#031008'],
          leafColors: ['rgba(74, 222, 128, 0.5)', 'rgba(34, 197, 94, 0.4)', 'rgba(21, 128, 61, 0.4)'],
          fireflyColor: 'rgba(74, 222, 128, 0.9)',
          glowColor: 'rgba(34, 197, 94, 0.2)',
          sunbeam: 'rgba(74, 222, 128, 0.05)'
        };
      case 'light':
      default:
        return {
          bgGradient: ['#e8f4ec', '#f0f7f3', '#eaf2f8'],
          leafColors: ['rgba(34, 197, 94, 0.45)', 'rgba(16, 185, 129, 0.4)', 'rgba(56, 189, 248, 0.35)'],
          fireflyColor: 'rgba(16, 185, 129, 0.65)',
          glowColor: 'rgba(52, 211, 153, 0.18)',
          sunbeam: 'rgba(255, 255, 255, 0.35)'
        };
    }
  }

  populateElements() {
    this.leaves = [];
    this.particles = [];

    // Ambient floating leaves (28 leaves for lush organic motion)
    const leafCount = Math.min(28, Math.floor(this.width / 45));
    for (let i = 0; i < leafCount; i++) {
      this.leaves.push(this.createLeaf(true));
    }

    // Glowing organic pollen / fireflies (35 particles)
    const particleCount = 35;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  resetPalette() {
    // Refresh colors when theme changes
    this.leaves.forEach(leaf => {
      const config = this.getThemeConfig();
      leaf.color = config.leafColors[Math.floor(Math.random() * config.leafColors.length)];
    });
  }

  createLeaf(randomY = false) {
    const config = this.getThemeConfig();
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -30,
      size: 14 + Math.random() * 18,
      speedY: 0.6 + Math.random() * 1.1,
      speedX: -0.4 + Math.random() * 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.015 + Math.random() * 0.02,
      color: config.leafColors[Math.floor(Math.random() * config.leafColors.length)]
    };
  }

  createParticle(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + 20,
      radius: 1.5 + Math.random() * 2.5,
      speedY: -(0.3 + Math.random() * 0.6),
      speedX: (Math.random() - 0.5) * 0.5,
      pulse: Math.random() * Math.PI,
      pulseSpeed: 0.03 + Math.random() * 0.03,
      alpha: 0.2 + Math.random() * 0.6
    };
  }

  drawSunbeams(config) {
    // Subtle ethereal sun ray / ambient atmosphere in upper corner
    const gradient = this.ctx.createRadialGradient(
      this.width * 0.15, 0, 10,
      this.width * 0.2, this.height * 0.4, this.width * 0.7
    );
    gradient.addColorStop(0, config.sunbeam);
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  animate() {
    if (!this.isActive) return;

    const config = this.getThemeConfig();
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Nature ambient atmosphere gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    bgGrad.addColorStop(0, config.bgGradient[0]);
    bgGrad.addColorStop(0.5, config.bgGradient[1]);
    bgGrad.addColorStop(1, config.bgGradient[2]);
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Soft sunlight rays
    this.drawSunbeams(config);

    // 3. Render and update glowing pollen / fireflies
    this.particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.pulse) * 0.4;
      p.pulse += p.pulseSpeed;

      // Glow effect
      const currentAlpha = Math.max(0.1, Math.min(1, Math.sin(p.pulse) * p.alpha + 0.2));
      
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = config.glowColor;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = config.fireflyColor.replace(/[\d\.]+\)$/, `${currentAlpha})`);
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = config.fireflyColor;
      this.ctx.fill();
      this.ctx.restore();

      // Wrap around
      if (p.y < -20) {
        p.y = this.height + 20;
        p.x = Math.random() * this.width;
      }
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;
    });

    // 4. Render and update drifting organic leaves
    this.leaves.forEach(leaf => {
      leaf.y += leaf.speedY;
      leaf.x += leaf.speedX + Math.sin(leaf.swayOffset) * 0.8;
      leaf.swayOffset += leaf.swaySpeed;
      leaf.rotation += leaf.rotationSpeed;

      // Draw stylized organic leaf
      this.ctx.save();
      this.ctx.translate(leaf.x, leaf.y);
      this.ctx.rotate(leaf.rotation);

      this.ctx.beginPath();
      // Organic teardrop leaf curvature
      this.ctx.moveTo(0, -leaf.size);
      this.ctx.bezierCurveTo(leaf.size * 0.7, -leaf.size * 0.4, leaf.size * 0.7, leaf.size * 0.4, 0, leaf.size);
      this.ctx.bezierCurveTo(-leaf.size * 0.7, leaf.size * 0.4, -leaf.size * 0.7, -leaf.size * 0.4, 0, -leaf.size);
      this.ctx.fillStyle = leaf.color;
      this.ctx.fill();

      // Central delicate leaf stem
      this.ctx.beginPath();
      this.ctx.moveTo(0, -leaf.size * 0.85);
      this.ctx.lineTo(0, leaf.size * 0.85);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.restore();

      // Recycle leaf when it exits screen bottom
      if (leaf.y > this.height + 40) {
        Object.assign(leaf, this.createLeaf(false));
      }
      if (leaf.x < -40) leaf.x = this.width + 40;
      if (leaf.x > this.width + 40) leaf.x = -40;
    });

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  toggle() {
    this.isActive = !this.isActive;
    if (this.isActive) {
      this.animate();
    } else {
      cancelAnimationFrame(this.animationFrameId);
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
    return this.isActive;
  }
}

// Global instance
window.natureAmbience = null;

function initNatureAmbience() {
  if (!window.natureAmbience) {
    window.natureAmbience = new NatureAmbience('nature-canvas');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNatureAmbience);
} else {
  initNatureAmbience();
}
