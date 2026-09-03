(() => {
const galaxyCanvas = document.querySelector(".galaxy-canvas");

if (galaxyCanvas) {
  const galaxyContext = galaxyCanvas.getContext("2d");
  let galaxyResizeFrame;

  const createSeededRandom = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const drawGalaxy = () => {
    const bounds = galaxyCanvas.getBoundingClientRect();
    const width = Math.round(bounds.width);
    const height = Math.round(bounds.height);
    if (!width || !height) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    galaxyCanvas.width = Math.round(width * pixelRatio);
    galaxyCanvas.height = Math.round(height * pixelRatio);
    galaxyContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    galaxyContext.clearRect(0, 0, width, height);

    const compact = width < 700;
    const centerX = width * (compact ? 0.72 : 0.77);
    const centerY = height * (compact ? 1.04 : 1.08);
    const radiusX = width * (compact ? 0.96 : 0.82);
    const radiusY = height * (compact ? 0.37 : 0.47);
    const random = createSeededRandom(width * 97 + height * 193);
    const gaussian = () => random() + random() + random() + random() - 2;

    const strokeGalaxyArc = (color, lineWidth, blur) => {
      galaxyContext.save();
      galaxyContext.beginPath();
      galaxyContext.ellipse(centerX, centerY, radiusX, radiusY, 0, Math.PI, Math.PI * 2);
      galaxyContext.strokeStyle = color;
      galaxyContext.lineWidth = lineWidth;
      galaxyContext.filter = `blur(${blur}px)`;
      galaxyContext.stroke();
      galaxyContext.restore();
    };

    strokeGalaxyArc("rgba(36, 119, 255, 0.12)", Math.max(92, height * 0.22), Math.max(20, height * 0.06));
    strokeGalaxyArc("rgba(98, 201, 255, 0.16)", Math.max(36, height * 0.07), Math.max(10, height * 0.026));

    const particleCount = Math.min(14500, Math.max(5200, Math.round((width * height) / 58)));
    galaxyContext.save();
    galaxyContext.globalCompositeOperation = "lighter";

    for (let index = 0; index < particleCount; index += 1) {
      const layerChoice = random();
      const coreParticle = layerChoice < 0.48;
      const haloParticle = layerChoice > 0.86;
      const progress = random();
      const angle = Math.PI + progress * Math.PI + gaussian() * (coreParticle ? 0.004 : haloParticle ? 0.024 : 0.013);
      const coreExpansion = 0.72 + Math.exp(-Math.pow((progress - 0.46) / 0.23, 2)) * 1.25;
      const spread = height * (coreParticle ? 0.03 : haloParticle ? 0.19 : 0.095) * coreExpansion;
      const offset = gaussian() * spread;
      const x = centerX + (radiusX + offset * 1.65) * Math.cos(angle);
      const y = centerY + (radiusY + offset) * Math.sin(angle);

      if (x < -3 || x > width + 3 || y < -3 || y > height + 3) continue;

      const laneStrength = Math.max(0, 1 - Math.abs(offset) / (spread * 2.4));
      const coreStrength = Math.exp(-Math.pow((progress - 0.48) / 0.24, 2));
      const alpha = Math.min(
        0.96,
        (coreParticle ? 0.31 : haloParticle ? 0.055 : 0.12) +
          random() * (coreParticle ? 0.4 : haloParticle ? 0.13 : 0.23) +
          laneStrength * (coreParticle ? 0.2 : 0.1) +
          coreStrength * 0.1
      );
      const brightParticle = coreParticle && random() > 0.989;
      const size = brightParticle ? 1.9 + random() * 1.35 : 0.34 + Math.pow(random(), 3) * 1.2;
      const colorChoice = random();

      if (colorChoice > 0.965) {
        galaxyContext.fillStyle = `rgba(242, 215, 110, ${alpha * 0.82})`;
      } else if (colorChoice > 0.77) {
        galaxyContext.fillStyle = `rgba(41, 182, 255, ${alpha * 0.94})`;
      } else if (colorChoice > 0.52) {
        galaxyContext.fillStyle = `rgba(98, 201, 255, ${alpha})`;
      } else {
        galaxyContext.fillStyle = `rgba(242, 248, 255, ${alpha})`;
      }

      galaxyContext.fillRect(x, y, size, size);
    }

    const drawGlint = (progress, offset, size, color) => {
      const angle = Math.PI + progress * Math.PI;
      const x = centerX + (radiusX + offset * 1.65) * Math.cos(angle);
      const y = centerY + (radiusY + offset) * Math.sin(angle);
      if (x < 0 || x > width || y < 0 || y > height) return;

      galaxyContext.save();
      galaxyContext.beginPath();
      galaxyContext.moveTo(x, y - size);
      galaxyContext.lineTo(x, y + size);
      galaxyContext.moveTo(x - size * 0.62, y);
      galaxyContext.lineTo(x + size * 0.62, y);
      galaxyContext.strokeStyle = color;
      galaxyContext.lineWidth = 1.2;
      galaxyContext.shadowColor = color;
      galaxyContext.shadowBlur = 8;
      galaxyContext.stroke();
      galaxyContext.restore();
    };

    drawGlint(0.19, height * 0.025, 5, "#62c9ff");
    drawGlint(0.34, -height * 0.035, 7, "#f2f8ff");
    drawGlint(0.48, height * 0.018, 6, "#f2d76e");
    drawGlint(0.63, -height * 0.02, 8, "#f2f8ff");
    drawGlint(0.76, height * 0.045, 5, "#29b6ff");
    galaxyContext.restore();
  };

  const scheduleGalaxyDraw = () => {
    window.cancelAnimationFrame(galaxyResizeFrame);
    galaxyResizeFrame = window.requestAnimationFrame(drawGalaxy);
  };

  new ResizeObserver(scheduleGalaxyDraw).observe(galaxyCanvas);
  scheduleGalaxyDraw();
}
})();
