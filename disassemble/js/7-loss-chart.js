// Draws the loss (WCSS) chart
const lc = $("loss"),
  lx = lc.getContext("2d");
function drawLoss() {
  const dpr = window.devicePixelRatio || 1,
    r = lc.getBoundingClientRect();
  if (!r.width) return;
  lc.width = r.width * dpr;
  lc.height = r.height * dpr;
  lx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = r.width,
    H = r.height,
    L = 58,
    Rp = 12,
    T = 10,
    B = 28,
    gw = W - L - Rp,
    gh = H - T - B;
  lx.clearRect(0, 0, W, H);
  lx.font = "11px ui-monospace, Menlo, Consolas, monospace";
  const tries = S.tries.filter((t) => t.loss.length);
  if (!tries.length) {
    lx.fillStyle = "#5c5c62";
    lx.fillText(
      "No loss yet. The first value appears at line 10.",
      L,
      T + gh / 2,
    );
    return;
  }
  const maxR = Math.max(2, ...tries.map((t) => t.loss.length));
  // round tick step (1, 2, 5 x 10^n), domain at least [0, 1]
  const top = Math.max(1, ...tries.flatMap((t) => t.loss));
  const mag = 10 ** Math.floor(Math.log10(top / 4)),
    step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s * 4 >= top);
  const nT = Math.ceil(top / step),
    maxV = nT * step;
  const X = (i) => L + (i / (maxR - 1)) * gw,
    Y = (v) => T + gh - (v / maxV) * gh;

  lx.strokeStyle = "rgba(255,255,255,0.07)";
  lx.fillStyle = "#98989f";
  lx.lineWidth = 1;
  for (let g = 0; g <= nT; g++) {
    const v = step * g,
      y = Y(v);
    lx.beginPath();
    lx.moveTo(L, y);
    lx.lineTo(L + gw, y);
    lx.stroke();
    lx.textAlign = "right";
    lx.fillText(
      v >= 1000 ? +(v / 1000).toFixed(1) + "k" : String(+v.toFixed(2)),
      L - 8,
      y + 4,
    );
  }
  lx.textAlign = "center";
  const stepL = Math.ceil(maxR / 10);
  for (let i = 0; i < maxR; i += stepL)
    lx.fillText(i + 1, X(i), T + gh + 16);
  lx.textAlign = "right";
  lx.fillText("round", L + gw, H - 1);

  const order = S.tries
    .map((t, i) => i)
    .filter((i) => S.tries[i].loss.length)
    .sort(
      (a, b) =>
        (a === S.cur) - (b === S.cur) ||
        (a === S.bestTry) - (b === S.bestTry),
    );
  for (const i of order) {
    const d = S.tries[i].loss;
    const isCur = i === S.cur && !S.done,
      isBest = i === S.bestTry,
      s = S.tries[i].s,
      isStuck =
        !isBest &&
        s != null &&
        (S.best > 0 ? s / S.best > 1.1 : s > 0);
    lx.strokeStyle = isCur
      ? "#0a84ff"
      : isBest
        ? "#30d158"
        : isStuck
          ? "rgba(255,69,58,0.6)"
          : "rgba(142,142,147,0.35)";
    lx.lineWidth = isCur ? 2.5 : isBest ? 2 : 1.2;
    lx.beginPath();
    d.forEach((v, j) =>
      j ? lx.lineTo(X(j), Y(v)) : lx.moveTo(X(j), Y(v)),
    );
    lx.stroke();
    if (isCur || (S.done && isBest)) {
      lx.fillStyle = lx.strokeStyle;
      d.forEach((v, j) => {
        lx.beginPath();
        lx.arc(X(j), Y(v), 3, 0, 7);
        lx.fill();
      });
    }
  }
}
