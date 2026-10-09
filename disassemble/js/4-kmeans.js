// The K-Means algorithm, paused after every code line
function freshState() {
  S = {
    gen: null,
    line: 0,
    note: "",
    done: false,
    k: P().k,
    R: P().R,
    C: [],
    old: null,
    g: null,
    d: null,
    start: null,
    j: null,
    round: 0,
    best: Infinity,
    s: null,
    keep: null,
    bestC: null,
    bestTrails: null,
    bestTry: -1,
    tries: [],
    cur: -1,
    trails: [],
    changed: null,
    moved: null,
    wcss: null,
    pulse: 0,
    ran: new Set(),
    counts: null,
  };
  disp = [];
}
function at(line, note) {
  S.line = line;
  S.note = note;
  S.ran.add(line);
  return line;
}

function pickRandom(N, k) {
  // random.choice(photos, k, replace=False)
  const ids = [];
  while (ids.length < k) {
    const r = Math.floor(rng() * N);
    if (!ids.includes(r)) ids.push(r);
  }
  return ids;
}
function kmeansPP(X, k) {
  // first center random, then far photos are more likely
  const N = X.length,
    ids = [Math.floor(rng() * N)];
  const D = new Float64Array(N).fill(Infinity);
  while (ids.length < k) {
    const c = X[ids[ids.length - 1]];
    let tot = 0;
    for (let i = 0; i < N; i++) {
      D[i] = Math.min(D[i], (X[i].x - c.x) ** 2 + (X[i].y - c.y) ** 2);
      tot += D[i];
    }
    let r = rng() * tot,
      i = 0;
    while (i < N - 1 && r > D[i]) {
      r -= D[i];
      i++;
    }
    if (ids.includes(i)) i = (i + 1) % N;
    ids.push(i);
  }
  return ids;
}
function focusIdx() {
  if (hover >= 0 && hover < pts.length) return hover;
  return 0;
}

function* algo() {
  const { k, R, init, seed } = P();
  const X = pts,
    N = X.length;
  rng = mulberry32(seed);
  S.k = k;
  S.R = R;

  yield at(1, "numpy loaded, it does the array math below");
  yield at(
    2,
    `photos holds ${N} photos, shape (${N}, 2): one (x, y) location each`,
  );
  yield at(
    3,
    `k = ${k}: we want ${k} groups, the algorithm never sees the real trips`,
  );
  S.best = Infinity;
  yield at(
    4,
    `best = inf, so the first finished try always wins. random is seeded with ${seed}, so every run repeats`,
  );

  for (let t = 0; t < R; t++) {
    S.start = t;
    S.cur = t;
    S.round = 0;
    S.j = null;
    S.s = null;
    S.changed = null;
    S.moved = null;
    S.tries.push({ loss: [], s: null, rounds: 0 });
    S.g = new Int16Array(N).fill(-1);
    S.C = [];
    S.old = null;
    S.d = null;
    S.trails = [];
    S.ran = new Set();
    yield at(5, `attempt = ${t}: try ${t + 1} of ${R} begins`);

    const ids = init === "pp" ? kmeansPP(X, k) : pickRandom(N, k);
    S.C = ids.map((i) => ({ x: X[i].x, y: X[i].y }));
    S.trails = S.C.map((c) => [{ ...c }]);
    disp = S.C.map((c) => ({ ...c }));
    yield at(
      6,
      (init === "pp"
        ? "K-Means++ picked photos "
        : "picked random photos ") +
        ids.map((i) => "#" + i).join(", ") +
        " as the starting centers",
    );

    while (true) {
      S.ran = new Set([5, 6]);
      yield at(7, `round ${S.round + 1} starts`);

      S.old = S.C.map((c) => ({ ...c }));
      yield at(8, "saved a copy of centers, line 13 compares against it");

      S.d = new Float64Array(N * k);
      for (let i = 0; i < N; i++)
        for (let j = 0; j < k; j++)
          S.d[i * k + j] =
            (X[i].x - S.C[j].x) ** 2 + (X[i].y - S.C[j].y) ** 2;
      const f = focusIdx();
      const row = [];
      let fb = 0;
      for (let j = 0; j < k; j++) {
        row.push(S.d[f * k + j].toFixed(1));
        if (S.d[f * k + j] < S.d[f * k + fb]) fb = j;
      }
      yield at(
        9,
        `distances is a ${N} x ${k} matrix. Photo #${f}: distances = [${row.join(", ")}], smallest is C${fb + 1}`,
      );

      let changed = 0,
        w = 0;
      for (let i = 0; i < N; i++) {
        let b = 0;
        for (let j = 1; j < k; j++)
          if (S.d[i * k + j] < S.d[i * k + b]) b = j;
        if (S.g[i] !== b) changed++;
        S.g[i] = b;
        w += S.d[i * k + b];
      }
      S.changed = changed;
      S.wcss = w;
      S.tries[t].loss.push(w);
      yield at(
        10,
        S.round === 0
          ? `every photo joined its nearest center. WCSS = ${fmt(w)}`
          : `${changed} ${changed === 1 ? "photo" : "photos"} switched group. WCSS = ${fmt(w)}`,
      );

      for (let j = 0; j < k; j++) {
        S.j = j;
        let sx = 0,
          sy = 0,
          n = 0;
        for (let i = 0; i < N; i++)
          if (S.g[i] === j) {
            sx += X[i].x;
            sy += X[i].y;
            n++;
          }
        yield at(
          11,
          n > 0
            ? `c = ${j}: now moving center C${j + 1}`
            : `no photo has group ${j}, so np.unique skips it and C${j + 1} stays at its old position`,
        );
        if (n > 0) {
          S.C[j] = { x: sx / n, y: sy / n };
          const mv = Math.hypot(
            S.C[j].x - S.old[j].x,
            S.C[j].y - S.old[j].y,
          );
          if (mv > 0) S.trails[j].push({ ...S.C[j] });
          yield at(
            12,
            `C${j + 1} = (${sx.toFixed(2)} / ${n}, ${sy.toFixed(2)} / ${n}) = (${S.C[j].x.toFixed(2)}, ${S.C[j].y.toFixed(2)}), moved ${mv.toFixed(2)}`,
          );
        }
      }
      S.j = null;
      S.round++;
      S.tries[t].rounds = S.round;
      const moved = S.C.filter(
        (c, j) => c.x !== S.old[j].x || c.y !== S.old[j].y,
      ).length;
      S.moved = moved;
      if (moved === 0) S.pulse = performance.now();
      const stop = moved === 0 || S.round >= CAP;
      yield at(
        13,
        moved === 0
          ? "centers == old_centers for every center: nothing moved, break"
          : S.round >= CAP
            ? "safety cap reached, break"
            : `${moved} ${moved === 1 ? "center" : "centers"} moved: loop for another round`,
      );
      if (stop) break;
    }

    let s = 0;
    for (let i = 0; i < N; i++) {
      let m = Infinity;
      for (let j = 0; j < k; j++) m = Math.min(m, S.d[i * k + j]);
      s += m;
    }
    S.s = s;
    S.tries[t].s = s;
    yield at(
      14,
      `spread = ${fmt(s)} after ${S.round} ${S.round === 1 ? "round" : "rounds"}`,
    );

    if (s < S.best) {
      const prev = S.best;
      S.best = s;
      S.keep = S.g.slice();
      S.bestC = S.C.map((c) => ({ ...c }));
      S.bestTrails = S.trails.map((a) => a.map((p) => ({ ...p })));
      S.bestTry = t;
      yield at(
        15,
        prev === Infinity
          ? `first finished try: best = ${fmt(s)}, best_groups = this grouping`
          : `${fmt(s)} < ${fmt(prev)}: new best, best_groups = this grouping`,
      );
    } else {
      yield at(
        15,
        S.best > 0
          ? `${fmt(s)} is not below best ${fmt(S.best)} (${(s / S.best).toFixed(2)}x worse): discard this try`
          : `${fmt(s)} is not below best ${fmt(S.best)}: discard this try`,
      );
    }
  }

  S.g = S.keep;
  S.C = S.bestC;
  S.trails = S.bestTrails;
  S.cur = S.bestTry;
  S.start = S.bestTry;
  S.round = S.tries[S.bestTry].rounds;
  S.s = S.best;
  S.j = null;
  S.old = null;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < k; j++)
      S.d[i * k + j] =
        (X[i].x - S.C[j].x) ** 2 + (X[i].y - S.C[j].y) ** 2;
  const counts = new Array(k).fill(0);
  for (const v of S.keep) counts[v]++;
  S.counts = counts;
  yield at(
    16,
    `[${counts.join(" ")}]  from try ${S.bestTry + 1}, the tightest of ${R}`,
  );
  S.done = true;
}
