const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");

function drawStarfield() {
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#07111f");
  gradient.addColorStop(1, "#111827");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#f8fafc";
  const stars = [
    [72, 48, 2],
    [148, 96, 1],
    [236, 42, 2],
    [344, 112, 1],
    [504, 74, 2],
    [584, 132, 1],
    [118, 246, 1],
    [408, 278, 2],
    [556, 228, 1]
  ];

  for (const [x, y, radius] of stars) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawShip() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  context.save();
  context.translate(centerX, centerY);

  context.fillStyle = "#38bdf8";
  context.beginPath();
  context.moveTo(0, -30);
  context.lineTo(22, 24);
  context.lineTo(0, 12);
  context.lineTo(-22, 24);
  context.closePath();
  context.fill();

  context.fillStyle = "#e0f2fe";
  context.beginPath();
  context.arc(0, -6, 8, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f97316";
  context.beginPath();
  context.moveTo(-8, 22);
  context.lineTo(0, 42);
  context.lineTo(8, 22);
  context.closePath();
  context.fill();

  context.restore();
}

function render() {
  drawStarfield();
  drawShip();
}

render();
