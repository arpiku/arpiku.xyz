
export default class Vortex {
  constructor(canvas, gravitationalConstant) {
    this.gravitationalConstant = gravitationalConstant;
    this.numberOfParticles = 300;
    this.particles = [];
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.init();
    this.animate();
  }

  init() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    for (let i = 0; i < this.numberOfParticles; i++) {
      let x,y,color;
      if (i%2) {
       x = Math.random() * this.canvas.width/2;
       y = Math.random() * this.canvas.height/2;
      color = '#1c2943'
      }
      else {
        x = Math.random() * this.canvas.width + this.canvas.width/2;
       y = Math.random() * this.canvas.height + this.canvas.height/2;
        color = '#f0583c'
      }
      const dx = this.canvas.width / 2 - x;
      const dy = this.canvas.height / 2 - y;


      const vx = -dy * 0.005;  
      const vy = dx * 0.005;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const size = Math.random() * 0.5 + distance*0.01;
      this.particles.push({ x, y, vx, vy, size,color });
    }
  }





  drawParticle(x, y, size, color='#01497C') {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawOrbit(x, y, size, color) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.stroke();
  }

// this.drawOrbit(this.canvas.width / 2, this.canvas.height / 2, Math.sqrt((particle.x - this.canvas.width / 2) ** 2 + (particle.y - this.canvas.height / 2) ** 2), 'rgba(169, 214, 229,0.0)');

  animate() {
    requestAnimationFrame(() => this.animate());

    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);



    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.particles.forEach((particle, index) => {
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Gravitational force towards the center
        const gravForceX = (dx / distance) * (12*particle.size*this.gravitationalConstant / (distance * distance));
        const gravForceY = (dy / distance) * (12*particle.size*this.gravitationalConstant / (distance * distance));

        // Tangential force for rotation (perpendicular to gravitational force)
        const tangentForceX = -gravForceY;
        const tangentForceY = gravForceX;

        // Combine the gravitational and tangential forces (with a control multiplier for tangential force)
        const combinedForceX = gravForceX + 0.5*tangentForceX/distance;
        const combinedForceY = gravForceY + 0.5*tangentForceY/distance;

        // Update velocity
        particle.vx += combinedForceX;
        particle.vy += combinedForceY;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

      this.drawParticle(particle.x, particle.y, particle.size*distance*0.001, particle.color)
      // Remove particles that spiral into the center
      if (distance < 20) {
        this.particles.splice(index, 1);
      }
    });
  }
}

