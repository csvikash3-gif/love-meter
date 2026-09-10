/* =========================================================
   1. SIDE-FLOATING HEARTS (Confined to Page Margins)
========================================================= */
const canvas = document.getElementById('heartsCanvas');
const ctx = canvas.getContext('2d');
let hearts = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class SideHeart {
  constructor() {
    this.init(true);
  }

  init(scatter = false) {
    const margin = canvas.width * 0.16; // 16% width on left and right
    this.isLeft = Math.random() > 0.5;
    this.baseX = this.isLeft ? Math.random() * margin : canvas.width - Math.random() * margin;
    
    this.x = this.baseX;
    this.y = scatter ? Math.random() * canvas.height : canvas.height + 30;
    this.size = Math.random() * 12 + 10;
    this.speedY = Math.random() * 0.7 + 0.4;
    this.swayAngle = Math.random() * Math.PI * 2;
    this.swaySpeed = Math.random() * 0.025 + 0.01;
    this.swayDistance = Math.random() * 16 + 6;
    this.alpha = Math.random() * 0.45 + 0.3;

    // Palette: Gold, Crimson, Champagne
    const hues = ['rgba(245, 212, 135,', 'rgba(201, 61, 88,', 'rgba(255, 230, 235,'];
    this.colorPrefix = hues[Math.floor(Math.random() * hues.length)];
  }

  update() {
    this.y -= this.speedY;
    this.swayAngle += this.swaySpeed;
    this.x = this.baseX + Math.sin(this.swayAngle) * this.swayDistance;

    if (this.y < -30) this.init(false);
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = `${this.colorPrefix} ${this.alpha})`;
    ctx.shadowColor = `${this.colorPrefix} 0.6)`;
    ctx.shadowBlur = 8;

    // Heart Bezier Curve
    ctx.beginPath();
    const s = this.size;
    ctx.moveTo(0, -s * 0.33);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.8, -s, -s * 0.3, 0, s * 0.6);
    ctx.bezierCurveTo(s, -s * 0.3, s * 0.5, -s * 0.8, 0, -s * 0.33);
    ctx.fill();
    ctx.restore();
  }
}

for (let i = 0; i < 34; i++) hearts.push(new SideHeart());

function animateHearts() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hearts.forEach(h => {
    h.update();
    h.draw();
  });
  requestAnimationFrame(animateHearts);
}
animateHearts();

/* =========================================================
   2. AMBIENT RAIN SOUND (Web Audio API)
========================================================= */
let audioCtx = null;
let soundOn = false;
let noiseNode = null;
const rainBtn = document.getElementById('rainToggle');

rainBtn.addEventListener('click', () => {
  if (!soundOn) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, audioCtx.currentTime);

    noiseNode.connect(filter);
    filter.connect(audioCtx.destination);
    noiseNode.start();

    soundOn = true;
    rainBtn.innerHTML = '<span>🌧️ Ambient Rain: On</span>';
  } else {
    if (noiseNode) {
      noiseNode.stop();
      noiseNode.disconnect();
    }
    soundOn = false;
    rainBtn.innerHTML = '<span>🌧️ Ambient Rain: Off</span>';
  }
});

/* =========================================================
   3. POLAROID SCRAPBOOK COMPONENT
========================================================= */
const scrapbook = document.getElementById('polaroidScrapbook');
const addMemoryBtn = document.getElementById('addMemoryBtn');

function createPolaroidCard(index = 1) {
  const card = document.createElement('div');
  card.className = 'polaroid-frame';
  card.innerHTML = `
    <div class="washi-tape-strip"></div>
    ${index > 1 ? '<button type="button" class="btn-remove-polaroid" title="Remove">&times;</button>' : ''}
    
    <div class="photo-slot">
      <img class="polaroid-img-preview" alt="Polaroid Memory" />
      <div class="photo-placeholder">
        <span>📷</span>
        <p>Click to choose snapshot</p>
      </div>
      <input type="file" accept="image/*" style="display:none;" />
    </div>

    <input type="text" class="polaroid-caption-input" placeholder="Handwrite a caption for this moment..." required />
  `;

  // Image upload handling
  const slot = card.querySelector('.photo-slot');
  const fileInput = card.querySelector('input[type="file"]');
  const imgPreview = card.querySelector('.polaroid-img-preview');
  const placeholder = card.querySelector('.photo-placeholder');

  slot.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imgPreview.src = event.target.result;
        imgPreview.style.display = 'block';
        placeholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  // Remove button
  const removeBtn = card.querySelector('.btn-remove-polaroid');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => card.remove());
  }

  return card;
}

// Start with one polaroid
scrapbook.appendChild(createPolaroidCard(1));

addMemoryBtn.addEventListener('click', () => {
  const count = scrapbook.querySelectorAll('.polaroid-frame').length + 1;
  scrapbook.appendChild(createPolaroidCard(count));
});

/* =========================================================
   4. LOVE METER CALCULATION
========================================================= */
const form = document.getElementById('loveForm');
const resultsSection = document.getElementById('resultsSection');
const scoreVal = document.getElementById('scoreVal');
const verdictTitle = document.getElementById('verdictTitle');
const verdictDesc = document.getElementById('verdictDesc');

const mWarmth = document.getElementById('mWarmth');
const mLaughter = document.getElementById('mLaughter');
const mDestiny = document.getElementById('mDestiny');

const unlockedLetterCard = document.getElementById('unlockedLetterCard');
const unlockedLetterText = document.getElementById('unlockedLetterText');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const p1 = document.getElementById('partner1').value.trim();
  const p2 = document.getElementById('partner2').value.trim();

  // Gather captions
  const captions = scrapbook.querySelectorAll('.polaroid-caption-input');
  let combinedWords = "";
  captions.forEach(c => combinedWords += c.value.trim() + " ");

  // Deterministic Hash (Score between 94% and 99%)
  let seed = 0;
  const raw = (p1 + p2 + combinedWords).toLowerCase();
  for (let i = 0; i < raw.length; i++) {
    seed = (seed * 37 + raw.charCodeAt(i)) % 10000;
  }

  const finalScore = 94 + (Math.abs(seed) % 6);
  const warmth = 93 + (Math.abs(seed * 3) % 7);
  const laughter = 92 + (Math.abs(seed * 5) % 8);
  const destiny = 96 + (Math.abs(seed * 7) % 4);

  // Reveal results
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth' });

  // Number counting animation
  let counter = 0;
  const timer = setInterval(() => {
    if (counter >= finalScore) {
      clearInterval(timer);
    } else {
      counter++;
      scoreVal.textContent = `${counter}%`;
    }
  }, 22);

  mWarmth.textContent = `${warmth}%`;
  mLaughter.textContent = `${laughter}%`;
  mDestiny.textContent = `${destiny}%`;

  if (finalScore >= 97) {
    verdictTitle.textContent = "Twin Velvet Flames ⚜";
    verdictDesc.textContent = `The stories ${p1} and ${p2} share bear the deep permanence of aged wine and velvet twilight. Every memory you frame is a foundation of quiet safety, deep tenderness, and timeless devotion.`;
  } else {
    verdictTitle.textContent = "Golden Hearth Harmony ✦";
    verdictDesc.textContent = `Between ${p1} and ${p2}, every small moment feels like entering a warm home on a rainy evening. Your bond brings boundless laughter, deep understanding, and gentle comfort.`;
  }

  // Handle secret letter
  const secret = document.getElementById('secretNote').value.trim();
  if (secret) {
    unlockedLetterCard.style.display = 'block';
    unlockedLetterText.textContent = `"${secret}"`;
  } else {
    unlockedLetterCard.style.display = 'none';
  }
});

/* =========================================================
   5. KEEPSAKE PARCHMENT EXPORT (PNG)
========================================================= */
document.getElementById('saveKeepsakeBtn').addEventListener('click', () => {
  const p1 = document.getElementById('partner1').value.trim() || 'First Heart';
  const p2 = document.getElementById('partner2').value.trim() || 'Second Heart';
  const score = scoreVal.textContent;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 500;
  exportCanvas.height = 700;
  const eCtx = exportCanvas.getContext('2d');

  // Maroon background
  const grad = eCtx.createRadialGradient(250, 250, 60, 250, 350, 420);
  grad.addColorStop(0, '#480918');
  grad.addColorStop(0.6, '#2f060f');
  grad.addColorStop(1, '#190308');
  eCtx.fillStyle = grad;
  eCtx.fillRect(0, 0, 500, 700);

  // Gold border
  eCtx.strokeStyle = '#f5d487';
  eCtx.lineWidth = 2;
  eCtx.strokeRect(20, 20, 460, 660);

  // Corner ornaments
  eCtx.fillStyle = '#f5d487';
  eCtx.font = '22px "Cinzel Decorative", serif';
  eCtx.fillText('❧', 35, 50);
  eCtx.fillText('☙', 445, 50);
  eCtx.fillText('❧', 35, 660);
  eCtx.fillText('☙', 445, 660);

  // Title
  eCtx.font = '16px "Cinzel Decorative", cursive';
  eCtx.textAlign = 'center';
  eCtx.fillText('⚜ THE VELVET CHRONICLE ⚜', 250, 80);

  // Names
  eCtx.fillStyle = '#ffffff';
  eCtx.font = '26px "Italiana", serif';
  eCtx.fillText(`${p1}   ♥   ${p2}`, 250, 130);

  // Dial Circle
  eCtx.strokeStyle = 'rgba(245, 212, 135, 0.4)';
  eCtx.beginPath();
  eCtx.arc(250, 270, 85, 0, Math.PI * 2);
  eCtx.stroke();

  // Score
  eCtx.fillStyle = '#f5d487';
  eCtx.font = 'bold 54px "Italiana", serif';
  eCtx.fillText(score, 250, 285);

  // Breakdown
  eCtx.font = '14px "Marcellus", serif';
  eCtx.fillStyle = '#d9b8bf';
  eCtx.fillText(`Warmth & Hearth: ${mWarmth.textContent}`, 250, 400);
  eCtx.fillText(`Shared Laughter: ${mLaughter.textContent}`, 250, 430);
  eCtx.fillText(`Destiny Index: ${mDestiny.textContent}`, 250, 460);

  // Inscription
  eCtx.font = 'italic 16px "Marcellus", serif';
  eCtx.fillStyle = '#fdf5ec';
  eCtx.fillText('“Enshrined in velvet dusk and eternal flame.”', 250, 530);

  // Date
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  eCtx.font = '10px "Space Mono", monospace';
  eCtx.fillStyle = '#f5d487';
  eCtx.fillText(`SEALED ON ${dateStr.toUpperCase()}`, 250, 620);

  // Download
  const link = document.createElement('a');
  link.download = `${p1}_and_${p2}_love_keepsake.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
});