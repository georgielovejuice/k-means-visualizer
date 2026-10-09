// Step line, Step round, Play, Run all, Reset
//run control
function ensureGen() {
  if (S.gen) return true;
  const k = P().k;
  if (pts.length < k) {
    setStatus(
      `Need at least ${k} photos for k = ${k}. Spray some on the map.`,
    );
    return false;
  }
  S.gen = algo();
  return true;
}
function stepLine() {
  if (S.done || !ensureGen()) return false;
  const r = S.gen.next();
  if (r.done) S.done = true;
  return !S.done;
}
function stepRound() {
  stop();
  if (!ensureGen()) return ui();
  do {
    stepLine();
  } while (!S.done && S.line !== 13 && S.line < 14);
  ui();
}
function play() {
  if (timer) {
    stop();
    ui();
    return;
  }
  if (S.done || !ensureGen()) {
    ui();
    return;
  }
  timer = setInterval(() => {
    stepLine();
    ui();
    if (S.done || S.line === 14) {
      stop();
      ui();
    }
  }, P().speed);
  ui();
}
function stop() {
  clearInterval(timer);
  timer = null;
}
function runAll() {
  stop();
  if (!ensureGen()) return ui();
  let guard = 0;
  while (!S.done && guard++ < 3e6) stepLine();
  ui();
}
function resetRun() {
  stop();
  freshState();
  renderCode();
  ui();
}
function dataChanged() {
  hover = -1;
  resetRun();
}
