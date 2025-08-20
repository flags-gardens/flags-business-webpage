const canvas = document.getElementById('flag-canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const flag = {
    width: 400,
    height: 250,
    color1: '#FF0000',
    color2: '#FF4D4D',
    poleColor: '#8B4513',
    poleWidth: 10,
};

let angle = 0;

function drawFlag() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pole
    ctx.fillStyle = flag.poleColor;
    ctx.fillRect(50, 50, flag.poleWidth, canvas.height - 100);

    // Draw flag
    const poleX = 50 + flag.poleWidth;
    const poleY = 50;

    ctx.beginPath();
    ctx.moveTo(poleX, poleY);

    for (let i = 0; i <= flag.width; i++) {
        const x = poleX + i;
        const y = poleY + Math.sin((i / (flag.width / 2)) * Math.PI + angle) * 20;
        ctx.lineTo(x, y);
    }

    ctx.lineTo(poleX + flag.width, poleY + flag.height);

    for (let i = flag.width; i >= 0; i--) {
        const x = poleX + i;
        const y = poleY + flag.height + Math.sin((i / (flag.width / 2)) * Math.PI + angle) * 20;
        ctx.lineTo(x, y);
    }

    ctx.closePath();

    const gradient = ctx.createLinearGradient(poleX, poleY, poleX, poleY + flag.height);
    gradient.addColorStop(0, flag.color1);
    gradient.addColorStop(0.5, flag.color2);
    gradient.addColorStop(1, flag.color1);

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    angle += 0.1;
    requestAnimationFrame(drawFlag);
}

drawFlag();