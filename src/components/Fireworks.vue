<template>
  <canvas ref="canvas" class="fireworks-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref(null);
let ctx = null;
let particles = [];
let animationFrame = null;

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocity = {
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 6 - 3
    };
    this.alpha = 1;
    this.decay = 0.03;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
    ctx.fill();
  }

  update() {
    this.velocity.y += 0.15;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= this.decay;
  }
}

const createFirework = (x, y) => {
  const colors = [
    '255, 182, 193', // 粉红
    '255, 218, 185', // 桃色
    '255, 192, 203', // 浅粉红
    '255, 228, 225', // 薄雾玫瑰
    '255, 240, 245', // 淡紫红
    '255, 105, 180', // 热粉红
    '255, 20, 147'   // 深粉红
  ];
  
  const particleCount = 35;
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(x, y, color));
  }
};

const animate = () => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
  
  particles = particles.filter(particle => {
    if (particle.alpha <= 0) return false;
    particle.update();
    particle.draw();
    return true;
  });
  
  if (particles.length === 0) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  }
  
  animationFrame = requestAnimationFrame(animate);
};

const handleClick = (event) => {
  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  createFirework(x, y);
};

const resizeCanvas = () => {
  if (canvas.value) {
    canvas.value.width = window.innerWidth;
    canvas.value.height = window.innerHeight;
  }
};

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  canvas.value.addEventListener('click', handleClick);
  animate();
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
  if (canvas.value) {
    canvas.value.removeEventListener('click', handleClick);
  }
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});
</script>

<style scoped>
.fireworks-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  opacity: 0.8;
}
</style> 