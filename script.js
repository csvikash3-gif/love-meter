/* =========================================================
   1. SIDE-FLOATING HEARTS CANVAS
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
    const margin = canvas.width * 0.16;
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
   3. POLAROID SCRAPBOOK WITH IN-BROWSER FACE SCANNER
========================================================= */
const scrapbook = document.getElementById('polaroidScrapbook');
const addMemoryBtn = document.getElementById('addMemoryBtn');
const validationNotice = document.getElementById('validationNotice');

// Initialize MediaPipe Face Detector
let faceDetector = null;
if (window.FaceDetection) {
  faceDetector = new FaceDetection({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
  });
  faceDetector.setOptions({
    model: 'short',
    minDetectionConfidence: 0.45
  });
}

// Function to scan an Image element and count human faces
function countFacesInImage(imgElement) {
  return new Promise((resolve) => {
    if (!faceDetector) {
      // Fallback if CDN blocked: accept upload
      resolve(2);
      return;
    }
    faceDetector.onResults((results) => {
      const faceCount = results.detections ? results.detections.length : 0;
      resolve(faceCount);
    });
    faceDetector.send({ image: imgElement });
  });
}

function createPolaroidCard(index = 1) {
  const card = document.createElement('div');
  card.className = 'polaroid-frame';
  card.dataset.faces = '0';
  card.dataset.hasPhoto = 'false';

  card.innerHTML = `
    <div class="washi-tape-strip"></div>
    ${index > 1 ? '<button type="button" class="btn-remove-polaroid" title="Remove">&times;</button>' : ''}
    
    <div class="photo-slot">
      <img class="polaroid-img-preview" alt="Polaroid Memory" crossOrigin="anonymous" />
      <div class="photo-placeholder">
        <span>📷</span>
        <p>Upload a photo of you both</p>
      </div>
      <input type="file" accept="image/*" style="display:none;" />
    </div>

    <input type="text" class="polaroid-caption-input" placeholder="Describe this precious moment together..." required />
  `;

  const slot = card.querySelector('.photo-slot');
  const fileInput = card.querySelector('input[type="file"]');
  const imgPreview = card.querySelector('.polaroid-img-preview');
  const placeholder = card.querySelector('.photo-placeholder');

  slot.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      imgPreview.src = event.target.result;
      imgPreview.style.display = 'block';
      placeholder.style.display = 'none';

      // Scan image for faces as soon as image loads
      imgPreview.onload = async () => {
        validationNotice.style.display = 'block';
        validationNotice.className = 'validation-box scanning';
        validationNotice.textContent = "🔍 Scanning polaroid to verify two hearts...";
        
        const count = await countFacesInImage(imgPreview);
        card.dataset.faces = count.toString();
        card.dataset.hasPhoto = 'true';

        validationNotice.style.display = 'none';
      };
    };
    reader.readAsDataURL(file);
  });

  const removeBtn = card.querySelector('.btn-remove-polaroid');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => card.remove());
  }

  return card;
}

scrapbook.appendChild(createPolaroidCard(1));

addMemoryBtn.addEventListener('click', () => {
  const count = scrapbook.querySelectorAll('.polaroid-frame').length + 1;
  scrapbook.appendChild(createPolaroidCard(count));
});

/* =========================================================
   4. TEXT-ONLY MEMORY EVALUATION ENGINE (Photos don't alter score)
========================================================= */
function analyzeMemoriesText(memoriesText, p1, p2) {
  const lower = memoriesText.toLowerCase();

  // Romantic & emotional anchors
  const warmKeywords = ['warm', 'coffee', 'rain', 'cooking', 'home', 'peace', 'hold', 'hug', 'safe', 'cozy', 'blanket', 'cuddle', 'sunset'];
  const laughKeywords = ['laugh', 'funny', 'joke', 'smile', 'tripped', 'giggle', 'tears', 'crazy', 'silly', 'dancing', 'screamed', 'fun'];
  const destinyKeywords = ['forever', 'always', 'destiny', 'first time', 'eyes', 'soul', 'dream', 'stars', 'love', 'marry', 'journey', 'life'];

  let warmPoints = 0;
  let laughPoints = 0;
  let destinyPoints = 0;

  warmKeywords.forEach(k => { if (lower.includes(k)) warmPoints += 2.5; });
  laughKeywords.forEach(k => { if (lower.includes(k)) laughPoints += 2.5; });
  destinyKeywords.forEach(k => { if (lower.includes(k)) destinyPoints += 2.5; });

  // Word count & depth multiplier
  const wordCount = memoriesText.trim().split(/\s+/).filter(w => w.length > 0).length;
  const depthBonus = Math.min(8, Math.floor(wordCount / 6));

  // Seeded hash based ONLY on the names and memories text
  let seed = 0;
  const combinedStr = (p1 + p2 + memoriesText).toLowerCase();
  for (let i = 0; i < combinedStr.length; i++) {
    seed = (seed * 31 + combinedStr.charCodeAt(i)) % 10000;
  }

  // Calculate dynamic sub-scores (ranges from 88% to 99%)
  let warmthScore = Math.min(99, Math.max(88, Math.round(89 + (warmPoints + depthBonus + (seed % 5)))));
  let laughterScore = Math.min(99, Math.max(88, Math.round(88 + (laughPoints + depthBonus + ((seed * 3) % 6)))));
  let destinyScore = Math.min(99, Math.max(89, Math.round(90 + (destinyPoints + depthBonus + ((seed * 7) % 5)))));

  // Total affinity score is the balanced average
  const totalScore = Math.round((warmthScore + laughterScore + destinyScore) / 3);

  return {
    total: totalScore,
    warmth: warmthScore,
    laughter: laughterScore,
    destiny: destinyScore,
    wordCount: wordCount
  };
}

/* =========================================================
   5. FORM SUBMISSION & TWO-HUMAN VERIFICATION
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const p1 = document.getElementById('partner1').value.trim();
  const p2 = document.getElementById('partner2').value.trim();
  const cards = scrapbook.querySelectorAll('.polaroid-frame');

  // Verify Photos & Detect Humans
  let totalFaces = 0;
  let hasMissingPhoto = false;

  cards.forEach(card => {
    if (card.dataset.hasPhoto !== 'true') {
      hasMissingPhoto = true;
    }
    totalFaces += parseInt(card.dataset.faces || '0', 10);
  });

  if (hasMissingPhoto) {
    validationNotice.style.display = 'block';
    validationNotice.className = 'validation-box error';
    validationNotice.textContent = "📷 Please upload a photo for every polaroid frame before consulting the meter.";
    validationNotice.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Requirement: Detect at least 2 human faces across the polaroids
  if (totalFaces < 2) {
    validationNotice.style.display = 'block';
    validationNotice.className = 'validation-box error';
    validationNotice.innerHTML = `⚠️ <strong>Two human hearts required:</strong> We only detected <strong>${totalFaces}</strong> face in your photo(s). Please upload a picture showing both of you together (or individual photos of each partner).`;
    validationNotice.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Validation passed: Clear alerts
  validationNotice.style.display = 'none';

  // Extract all memories text
  const captionInputs = scrapbook.querySelectorAll('.polaroid-caption-input');
  let allMemories = "";
  captionInputs.forEach(input => {
    allMemories += input.value.trim() + " ";
  });

  // Calculate scores exclusively from the memories content
  const result = analyzeMemoriesText(allMemories, p1, p2);

  // Reveal results
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth' });

  // Percentage Counting Animation
  let counter = 0;
  const timer = setInterval(() => {
    if (counter >= result.total) {
      clearInterval(timer);
    } else {
      counter++;
      scoreVal.textContent = `${counter}%`;
    }
  }, 22);

  mWarmth.textContent = `${result.warmth}%`;
  mLaughter.textContent = `${result.laughter}%`;
  mDestiny.textContent = `${result.destiny}%`;

  // Tailored Reading based on the dynamic memory score
  if (result.total >= 97) {
    verdictTitle.textContent = "Twin Velvet Flames ⚜";
    verdictDesc.textContent = `The stories ${p1} and ${p2} documented radiate rare permanence. Your memories reflect deep mutual grounding, unspoken devotion, and unmatched comfort.`;
  } else if (result.total >= 94) {
    verdictTitle.textContent = "Golden Hearth Harmony ✦";
    verdictDesc.textContent = `Between ${p1} and ${p2}, every moment shared feels like coming home. The details in your memories show spontaneous laughter, tenderness, and an unbreakable bond.`;
  } else {
    verdictTitle.textContent = "Gentle Starlight Resonance 🌙";
    verdictDesc.textContent = `The narrative woven by ${p1} and ${p2} is sweet, serene, and steadily blossoming. Each shared memory builds a warm shelter of lasting kindness.`;
  }

  // Unlocked secret letter
  const secret = document.getElementById('secretNote').value.trim();
  if (secret) {
    unlockedLetterCard.style.display = 'block';
    unlockedLetterText.textContent = `"${secret}"`;
  } else {
    unlockedLetterCard.style.display = 'none';
  }
});

/* =========================================================
   6. DOWNLOAD KEEPSAKE CERTIFICATE (PNG)
========================================================= */
document.getElementById('saveKeepsakeBtn').addEventListener('click', () => {
  const p1 = document.getElementById('partner1').value.trim() || 'First Heart';
  const p2 = document.getElementById('partner2').value.trim() || 'Second Heart';
  const score = scoreVal.textContent;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 500;
  exportCanvas.height = 700;
  const eCtx = exportCanvas.getContext('2d');

  const grad = eCtx.createRadialGradient(250, 250, 60, 250, 350, 420);
  grad.addColorStop(0, '#480918');
  grad.addColorStop(0.6, '#2f060f');
  grad.addColorStop(1, '#190308');
  eCtx.fillStyle = grad;
  eCtx.fillRect(0, 0, 500, 700);

  eCtx.strokeStyle = '#f5d487';
  eCtx.lineWidth = 2;
  eCtx.strokeRect(20, 20, 460, 660);

  eCtx.fillStyle = '#f5d487';
  eCtx.font = '22px "Cinzel Decorative", serif';
  eCtx.fillText('❧', 35, 50);
  eCtx.fillText('☙', 445, 50);
  eCtx.fillText('❧', 35, 660);
  eCtx.fillText('☙', 445, 660);

  eCtx.font = '16px "Cinzel Decorative", cursive';
  eCtx.textAlign = 'center';
  eCtx.fillText('⚜ THE VELVET CHRONICLE ⚜', 250, 80);

  eCtx.fillStyle = '#ffffff';
  eCtx.font = '26px "Italiana", serif';
  eCtx.fillText(`${p1}   ♥   ${p2}`, 250, 130);

  eCtx.strokeStyle = 'rgba(245, 212, 135, 0.4)';
  eCtx.beginPath();
  eCtx.arc(250, 270, 85, 0, Math.PI * 2);
  eCtx.stroke();

  eCtx.fillStyle = '#f5d487';
  eCtx.font = 'bold 54px "Italiana", serif';
  eCtx.fillText(score, 250, 285);

  eCtx.font = '14px "Marcellus", serif';
  eCtx.fillStyle = '#d9b8bf';
  eCtx.fillText(`Warmth & Hearth: ${mWarmth.textContent}`, 250, 400);
  eCtx.fillText(`Shared Laughter: ${mLaughter.textContent}`, 250, 430);
  eCtx.fillText(`Destiny Resonance: ${mDestiny.textContent}`, 250, 460);

  eCtx.font = 'italic 16px "Marcellus", serif';
  eCtx.fillStyle = '#fdf5ec';
  eCtx.fillText('“Enshrined in velvet dusk and eternal flame.”', 250, 530);

  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  eCtx.font = '10px "Space Mono", monospace';
  eCtx.fillStyle = '#f5d487';
  eCtx.fillText(`SEALED ON ${dateStr.toUpperCase()}`, 250, 620);

  const link = document.createElement('a');
  link.download = `${p1}_and_${p2}_love_keepsake.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
});