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
    for (let i = 0; i < flag.width; i++) {
        const y = Math.sin((i / (flag.width / 2)) * Math.PI + angle) * 20;
        const shade = Math.sin((i / (flag.width / 2)) * Math.PI + angle) * 0.2 + 0.8;
        const color = i % 20 < 10 ? flag.color1 : flag.color2; // Simple stripe pattern for shading

        ctx.fillStyle = color;
        ctx.fillRect(50 + flag.poleWidth + i, 50 + y, 1, flag.height);
    }

    angle += 0.1;
    requestAnimationFrame(drawFlag);
}

drawFlag();