const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 600;

const width = canvas.width;
const height = canvas.height;

let imageData = ctx.createImageData(width, height);
let data = imageData.data;

const centerX = width / 2;
const centerY = height / 2;

window.time = 0;
window.wavelength = 20;
window.speed = 0.05;
window.thresholdLevel = 0.98;
window.colorSaturation = 100;
window.colorLightness = 50;
window.showColorField = true;
window.showThresholdHighlight = true;
window.isPaused = false;
window.zoomFactor = 1;

const emitters = [];
const phaseSpeeds = [];

function updateEmitters(n) {
  emitters.length = 0;
  phaseSpeeds.length = 0;
  for (let i = 0; i < n; i++) {
    const angle = i * (2 * Math.PI / n) - Math.PI / 2;
    const radius = 200;
    emitters.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      phase: i === 0 ? 0 : Math.PI,
    });
    phaseSpeeds.push(0.002);
  }
}

function renderPhaseControls() {
  const container = document.getElementById('emitterPhaseControls');
  container.innerHTML = '';
  emitters.forEach((_, i) => {
    const group = document.createElement('div');
    group.className = 'control-group';
    group.innerHTML = `
      <div class="range-group">
        <input type="range" min="0" max="6.2832" step="0.01" value="${emitters[i].phase}" data-index="${i}" />
        <input type="number" min="0" max="6.2832" step="0.01" value="${emitters[i].phase}" data-index="${i}" />
      </div>
      <label>Phase ${String.fromCharCode(65 + i)} (0 → 2π)</label>
    `;
    container.appendChild(group);
  });

  container.querySelectorAll('input[type="range"]').forEach(input => {
    input.addEventListener('input', e => {
      const idx = Number(e.target.dataset.index);
      const val = parseFloat(e.target.value);
      emitters[idx].phase = val;
      container.querySelector(`input[type="number"][data-index="${idx}"]`).value = val;
    });
  });

  container.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', e => {
      const idx = Number(e.target.dataset.index);
      const val = parseFloat(e.target.value);
      emitters[idx].phase = val;
      container.querySelector(`input[type="range"][data-index="${idx}"]`).value = val;
    });
  });
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function renderFrame() {
  const zoom = window.zoomFactor;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const vx = centerX + (x - centerX) / zoom;
      const vy = centerY + (y - centerY) / zoom;

      let value = 0;
      for (let i = 0; i < emitters.length; i++) {
        const dx = vx - emitters[i].x;
        const dy = vy - emitters[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const phaseOffset = emitters[i].phase + window.time * phaseSpeeds[i];
        value += Math.sin((dist / window.wavelength) - window.time + phaseOffset);
      }

      const norm = (value + emitters.length) / (2 * emitters.length);
      const hue = norm * 360;
      const { r, g, b } = hslToRgb(hue, window.colorSaturation, window.colorLightness);

      const index = (y * width + x) * 4;
      if (window.showColorField) {
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      } else {
        data[index] = data[index + 1] = data[index + 2] = 0;
        data[index + 3] = 255;
      }

      if (window.showThresholdHighlight && norm > window.thresholdLevel) {
        data[index] = 255;
        data[index + 1] = 255;
        data[index + 2] = 255;
        data[index + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function animate() {
  if (!window.isPaused) {
    window.time += window.speed;
    document.getElementById('masterTime').value = window.time.toFixed(2);
    document.getElementById('masterTimeInput').value = window.time.toFixed(2);
  }
  renderFrame();
  requestAnimationFrame(animate);
}

document.addEventListener("DOMContentLoaded", () => {
  updateEmitters(3);
  renderPhaseControls();
  renderFrame();
  animate();

  const bind = (id, prop, parse = parseFloat) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") {
      el.addEventListener("change", () => window[prop] = el.checked);
    } else {
      el.addEventListener("input", () => window[prop] = parse(el.value));
    }
  };

  bind("toggleColor", "showColorField");
  bind("toggleThreshold", "showThresholdHighlight");
  bind("pauseTime", "isPaused");
  bind("threshold", "thresholdLevel");
  bind("saturation", "colorSaturation");
  bind("lightness", "colorLightness");

  document.getElementById("wavelengthSlider").addEventListener("input", e => {
    const val = parseFloat(e.target.value);
    window.wavelength = val;
    document.getElementById("wavelengthInput").value = val;
  });
  document.getElementById("wavelengthInput").addEventListener("input", e => {
    const val = parseFloat(e.target.value);
    window.wavelength = val;
    document.getElementById("wavelengthSlider").value = val;
  });

  document.getElementById("zoomInput").addEventListener("input", e => {
    window.zoomFactor = Math.max(1, parseFloat(e.target.value));
  });

  document.getElementById("masterTime").addEventListener("input", e => {
    window.time = parseFloat(e.target.value);
    document.getElementById("masterTimeInput").value = window.time.toFixed(2);
  });
  document.getElementById("masterTimeInput").addEventListener("input", e => {
    window.time = parseFloat(e.target.value);
    document.getElementById("masterTime").value = window.time.toFixed(2);
  });

  document.getElementById("addEmitterBtn").addEventListener("click", () => {
    updateEmitters(emitters.length + 1);
    renderPhaseControls();
  });

  document.getElementById("removeEmitterBtn").addEventListener("click", () => {
    if (emitters.length > 1) {
      updateEmitters(emitters.length - 1);
      renderPhaseControls();
    }
  });

  // --- Export Feature ---
  document.getElementById("exportBtn").addEventListener("click", async () => {
    const frameStep = parseFloat(document.getElementById("frameStepInput").value) || 0.05;
    const totalFrames = Math.ceil((2 * Math.PI) / frameStep);

    window.isPaused = true;
    const oldTime = window.time;

    const { ZipWriter, BlobWriter, BlobReader } = zip;
    const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

    for (let i = 0; i < totalFrames; i++) {
      window.time = i * frameStep;
      renderFrame();
      await new Promise(r => requestAnimationFrame(r));
      const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
      await zipWriter.add(`frame_${String(i).padStart(5, '0')}.png`, new BlobReader(blob));
      console.log(`Frame ${i + 1}/${totalFrames}`);
    }

    const zipBlob = await zipWriter.close();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = "frames.zip";
    a.click();

    window.time = oldTime;
    window.isPaused = false;
    console.log("Export complete!");
  });
});

