// Mouse, buttons, sliders and keyboard
function evPos(e) {
  const r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function nearest(px, py, maxPx) {
  let b = -1,
    bd = maxPx * maxPx;
  for (let i = 0; i < pts.length; i++) {
    const p = toPx(pts[i]),
      d = (p.x - px) ** 2 + (p.y - py) ** 2;
    if (d < bd) {
      bd = d;
      b = i;
    }
  }
  return b;
}
function brushTick() {
  if (!mouse) return;
  const r = +$("nozzle").value;
  if (tool === "spray") {
    const n = +$("density").value;
    for (let i = 0; i < n && pts.length < MAXP; i++) {
      const a = Math.random() * Math.PI * 2,
        d = r * Math.sqrt(Math.random());
      const w = toW(mouse.x + Math.cos(a) * d, mouse.y + Math.sin(a) * d);
      if (w.x > 0 && w.x < WX && w.y > 0 && w.y < WY) pts.push(w);
    }
    if (pts.length >= MAXP)
      setStatus(
        `<b>Photo limit reached</b> (${MAXP}). Erase some to add more.`,
      );
  } else if (tool === "erase") {
    const before = pts.length;
    pts = pts.filter((p) => {
      const q = toPx(p);
      return (q.x - mouse.x) ** 2 + (q.y - mouse.y) ** 2 > r * r;
    });
    if (pts.length === before) return;
  }
  dataChanged();
}
cv.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  cv.setPointerCapture(e.pointerId);
  mouse = evPos(e);
  down = true;
  if (tool === "point") {
    if (pts.length < MAXP) {
      pts.push(toW(mouse.x, mouse.y));
      dataChanged();
    }
  } else {
    brushTick();
    brushTimer = setInterval(brushTick, 40);
  }
});
cv.addEventListener("pointermove", (e) => {
  mouse = evPos(e);
  if (!down) {
    const h = nearest(mouse.x, mouse.y, 10);
    if (h !== hover) {
      hover = h;
      if (S.d) ui();
    }
  }
});
const endBrush = () => {
  down = false;
  clearInterval(brushTimer);
};
cv.addEventListener("pointerup", endBrush);
cv.addEventListener("pointercancel", endBrush);
cv.addEventListener("pointerleave", () => {
  mouse = null;
  if (hover >= 0) {
    hover = -1;
    if (S.d) ui();
  }
});
cv.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const p = evPos(e),
    i = nearest(p.x, p.y, 12);
  if (i >= 0) {
    pts.splice(i, 1);
    dataChanged();
  }
});

document.querySelectorAll(".seg button").forEach((b) =>
  b.addEventListener("click", () => {
    tool = b.dataset.tool;
    document
      .querySelectorAll(".seg button")
      .forEach((x) => x.classList.toggle("on", x === b));
    cv.style.cursor = tool === "point" ? "crosshair" : "none";
  }),
);
cv.style.cursor = "none";

[
  ["nozzle", "oNozzle"],
  ["density", "oDensity"],
  ["k", "oK"],
  ["R", "oR"],
  ["speed", "oSpeed"],
].forEach(([i, o]) =>
  $(i).addEventListener("input", () => {
    $(o).textContent = $(i).value;
    if (i === "k" || i === "R") resetRun();
    if (i === "speed" && timer) {
      stop();
      play();
    }
  }),
);
// hand focus back so Space / Enter shortcuts work after a change
document
  .querySelectorAll("input[type=range], select")
  .forEach((el) => el.addEventListener("change", () => el.blur()));
$("init").addEventListener("change", resetRun);
$("seed").addEventListener("change", resetRun);
$("dice").addEventListener("click", () => {
  $("seed").value = Math.floor(Math.random() * 1000);
  resetRun();
});
$("showMap").addEventListener("change", drawBg);

$("pTrips").addEventListener("click", () => {
  pts = threeTrips();
  dataChanged();
});
$("pBlobs").addEventListener("click", () => {
  pts = blobs();
  dataChanged();
});
$("pClear").addEventListener("click", () => {
  pts = [];
  dataChanged();
});

$("bLine").addEventListener("click", () => {
  stop();
  stepLine();
  ui();
});
$("bRound").addEventListener("click", stepRound);
$("bPlay").addEventListener("click", play);
$("bAll").addEventListener("click", runAll);
$("bReset").addEventListener("click", resetRun);

document.addEventListener("keydown", (e) => {
  if (/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)) return;
  if (e.code === "Space") {
    e.preventDefault();
    stop();
    stepLine();
    ui();
  }
  if (e.code === "Enter") {
    e.preventDefault();
    play();
  }
});
