// Draws the map: photos, territories, centers
// Map canvas
const cv = $("map"),
  ctx = cv.getContext("2d");
const bg = document.createElement("canvas"),
  bgx = bg.getContext("2d");
const terr = document.createElement("canvas"),
  tx = terr.getContext("2d");
let W = 0,
  H = 0,
  dpr = 1;
let mouse = null,
  down = false,
  hover = -1,
  brushTimer = null;

const toPx = (p) => ({ x: (p.x / WX) * W, y: (p.y / WY) * H });
const toW = (x, y) => ({ x: (x / W) * WX, y: (y / H) * WY });

function resize() {
  dpr = window.devicePixelRatio || 1;
  const r = cv.getBoundingClientRect();
  W = r.width;
  H = r.height;
  cv.width = W * dpr;
  cv.height = H * dpr;
  bg.width = W * dpr;
  bg.height = H * dpr;
  drawBg();
  drawLoss();
}

function drawBg() {
  const c = bgx;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = "#141619";
  c.fillRect(0, 0, W, H);
  if (!$("showMap").checked) return;
  const sx = W / WX,
    sy = H / WY;

  c.strokeStyle = "rgba(255,255,255,0.025)";
  c.lineWidth = 1; // 10 km grid
  for (let x = 10; x < WX; x += 10) {
    c.beginPath();
    c.moveTo(x * sx, 0);
    c.lineTo(x * sx, H);
    c.stroke();
  }
  for (let y = 10; y < WY; y += 10) {
    c.beginPath();
    c.moveTo(0, y * sy);
    c.lineTo(W, y * sy);
    c.stroke();
  }

  c.beginPath(); // sea
  for (let x = 0; x <= WX; x += 1) {
    const y = coastY(x);
    x ? c.lineTo(x * sx, y * sy) : c.moveTo(0, y * sy);
  }
  c.lineTo(W, H);
  c.lineTo(0, H);
  c.closePath();
  c.fillStyle = "rgba(10,132,255,0.07)";
  c.fill();
  c.beginPath();
  for (let x = 0; x <= WX; x += 1) {
    const y = coastY(x);
    x ? c.lineTo(x * sx, y * sy) : c.moveTo(0, y * sy);
  }
  c.strokeStyle = "rgba(100,210,255,0.22)";
  c.lineWidth = 1.2;
  c.stroke();
  c.beginPath();
  for (let x = 0; x <= WX; x += 1) {
    const y = coastY(x + 6) + 4;
    x ? c.lineTo(x * sx, y * sy) : c.moveTo(0, y * sy);
  }
  c.strokeStyle = "rgba(100,210,255,0.07)";
  c.stroke();

  c.save(); // city streets
  c.beginPath();
  c.arc(24 * sx, 24 * sy, 13 * sx, 0, 7);
  c.clip();
  c.strokeStyle = "rgba(255,255,255,0.045)";
  for (let v = 8; v < 42; v += 2.6) {
    c.beginPath();
    c.moveTo(v * sx, 0);
    c.lineTo(v * sx, H);
    c.stroke();
    c.beginPath();
    c.moveTo(0, v * sy);
    c.lineTo(W, v * sy);
    c.stroke();
  }
  c.restore();

  [
    [68, 22, 5],
    [77, 15, 6],
    [88, 21, 5],
    [64, 9, 4],
    [84, 6, 5],
    [94, 12, 4],
  ].forEach(([x, y, s]) => {
    // mountains
    c.beginPath();
    c.moveTo((x - s) * sx, (y + s * 0.8) * sy);
    c.lineTo(x * sx, (y - s * 0.8) * sy);
    c.lineTo((x + s) * sx, (y + s * 0.8) * sy);
    c.closePath();
    c.fillStyle = "rgba(255,255,255,0.025)";
    c.fill();
    c.strokeStyle = "rgba(255,255,255,0.09)";
    c.stroke();
  });
  c.setLineDash([3, 4]);
  c.strokeStyle = "rgba(255,255,255,0.10)"; // trail
  c.beginPath();
  for (let t = 0; t <= 1.001; t += 0.05) {
    const x = 58 + t * 32,
      y = 34 - t * 26 - 4 * Math.sin(Math.PI * t);
    t ? c.lineTo(x * sx, y * sy) : c.moveTo(x * sx, y * sy);
  }
  c.stroke();
  c.setLineDash([]);

  c.font = "11px ui-monospace, Menlo, Consolas, monospace";
  c.fillStyle = "rgba(255,255,255,0.18)";
  c.fillText("city", 34 * sx, 40 * sy);
  c.fillText("coast", 80 * sx, 66 * sy);
  c.fillText("trail", 92 * sx, 33 * sy);
  c.strokeStyle = "rgba(255,255,255,0.35)";
  c.lineWidth = 1.5; // scale bar
  c.beginPath();
  c.moveTo(14, H - 14);
  c.lineTo(14 + 10 * sx, H - 14);
  c.moveTo(14, H - 18);
  c.lineTo(14, H - 10);
  c.moveTo(14 + 10 * sx, H - 18);
  c.lineTo(14 + 10 * sx, H - 10);
  c.stroke();
  c.fillStyle = "rgba(255,255,255,0.45)";
  c.fillText("10 km", 18, H - 22);
}

function drawTerritory() {
  const cell = 5,
    cols = Math.ceil(W / cell),
    rows = Math.ceil(H / cell);
  if (terr.width !== cols || terr.height !== rows) {
    terr.width = cols;
    terr.height = rows;
  }
  const img = tx.createImageData(cols, rows),
    a = img.data,
    k = disp.length;
  for (let r = 0; r < rows; r++) {
    const wy = (((r + 0.5) * cell) / H) * WY;
    for (let c = 0; c < cols; c++) {
      const wx = (((c + 0.5) * cell) / W) * WX;
      let b = 0,
        bd = Infinity;
      for (let j = 0; j < k; j++) {
        const d = (wx - disp[j].x) ** 2 + (wy - disp[j].y) ** 2;
        if (d < bd) {
          bd = d;
          b = j;
        }
      }
      const o = (r * cols + c) * 4,
        col = PAL[b];
      a[o] = col[0];
      a[o + 1] = col[1];
      a[o + 2] = col[2];
      a[o + 3] = 34;
    }
  }
  tx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(terr, 0, 0, cols * cell, rows * cell);
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function frame(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(bg, 0, 0, W, H);

  if (disp.length !== S.C.length) disp = S.C.map((c) => ({ ...c }));
  disp.forEach((p, j) => {
    p.x += (S.C[j].x - p.x) * 0.18;
    p.y += (S.C[j].y - p.y) * 0.18;
  });

  if (disp.length && $("showTerr").checked) drawTerritory();

  if ($("showTrail").checked)
    S.trails.forEach((tr, j) => {
      if (tr.length < 2) return;
      const pts2 = tr.map(toPx);
      pts2[pts2.length - 1] = toPx(disp[j] || tr[tr.length - 1]);
      for (const [w, a] of [
        [6, 0.18],
        [2, 0.9],
      ]) {
        ctx.strokeStyle = rgb(PAL[j], a);
        ctx.lineWidth = w;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        pts2.forEach((p, i) =>
          i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
        );
        ctx.stroke();
      }
    });

  const rad = Math.max(2.2, W / 280);
  const paths = PAL.map(() => new Path2D()),
    gray = new Path2D();
  for (let i = 0; i < pts.length; i++) {
    const p = toPx(pts[i]),
      g = S.g ? S.g[i] : -1,
      path = g >= 0 ? paths[g] : gray;
    path.moveTo(p.x + rad, p.y);
    path.arc(p.x, p.y, rad, 0, 7);
  }
  ctx.fillStyle = rgb(GRAY, 0.75);
  ctx.fill(gray);
  paths.forEach((p, j) => {
    ctx.fillStyle = rgb(PAL[j], 0.9);
    ctx.fill(p);
  });

  // distance fan from the focus photo (line 9/10 or hover)
  if (
    disp.length &&
    pts.length &&
    (hover >= 0 || S.line === 9 || S.line === 10)
  ) {
    const f = focusIdx(),
      fp = toPx(pts[f]);
    let b = 0,
      ds = disp.map((c) => (pts[f].x - c.x) ** 2 + (pts[f].y - c.y) ** 2);
    ds.forEach((d, j) => {
      if (d < ds[b]) b = j;
    });
    ctx.font = "11px ui-monospace, Menlo, Consolas, monospace";
    disp.forEach((c, j) => {
      const q = toPx(c);
      ctx.strokeStyle = rgb(PAL[j], j === b ? 0.95 : 0.4);
      ctx.lineWidth = j === b ? 2 : 1;
      ctx.setLineDash(j === b ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(fp.x, fp.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const mx = fp.x + (q.x - fp.x) * 0.55,
        my = fp.y + (q.y - fp.y) * 0.55,
        txt = ds[j].toFixed(0);
      const tw = ctx.measureText(txt).width + 8;
      ctx.fillStyle = "rgba(20,22,25,0.85)";
      roundRect(ctx, mx - tw / 2, my - 9, tw, 17, 4);
      ctx.fill();
      ctx.fillStyle = rgb(PAL[j], j === b ? 1 : 0.7);
      ctx.textAlign = "center";
      ctx.fillText(txt, mx, my + 4);
    });
    ctx.textAlign = "left";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fp.x, fp.y, rad + 3, 0, 7);
    ctx.stroke();
  }

  if (S.old && S.line >= 8 && S.line <= 13)
    S.old.forEach((o, j) => {
      const q = toPx(o);
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = rgb(PAL[j], 0.7);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 8, 0, 7);
      ctx.stroke();
      ctx.setLineDash([]);
    });

  const pulse = now - S.pulse < 900 ? (now - S.pulse) / 900 : -1;
  disp.forEach((c, j) => {
    const q = toPx(c);
    if (S.j === j && (S.line === 11 || S.line === 12)) {
      ctx.fillStyle = rgb(PAL[j], 0.22);
      ctx.beginPath();
      ctx.arc(q.x, q.y, 18, 0, 7);
      ctx.fill();
    }
    if (pulse >= 0) {
      ctx.strokeStyle = `rgba(48,209,88,${1 - pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 10 + pulse * 22, 0, 7);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.arc(q.x, q.y, 10.5, 0, 7);
    ctx.fill();
    ctx.strokeStyle = rgb(PAL[j]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(q.x, q.y, 7.5, 0, 7);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(q.x, q.y, 3, 0, 7);
    ctx.fill();
  });

  if (mouse && tool !== "point") {
    const r = +$("nozzle").value;
    ctx.setLineDash(tool === "erase" ? [4, 3] : []);
    ctx.strokeStyle =
      tool === "erase"
        ? "rgba(255,69,58,0.85)"
        : "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, r, 0, 7);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  let label;
  if (S.line === 0)
    label = pts.length
      ? `${pts.length} photos, no groups yet`
      : "Spray photos onto the map";
  else if (S.done)
    label = `Best of ${S.R} tries: [${S.counts.join(" ")}] photos per group`;
  else
    label = `Try ${S.cur + 1}/${S.R}, round ${Math.max(S.round, 1)}: ${phase(S.line)}`;
  ctx.font =
    '600 12px -apple-system, "SF Pro Text", "Segoe UI", sans-serif';
  const tw = ctx.measureText(label).width + 28;
  ctx.fillStyle = "rgba(20,20,22,0.82)";
  roundRect(ctx, (W - tw) / 2, 12, tw, 26, 13);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#ebebf0";
  ctx.textAlign = "center";
  ctx.fillText(label, W / 2, 29);
  ctx.textAlign = "left";

  requestAnimationFrame(frame);
}
