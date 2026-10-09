// Updates the tables, variable chips and status text
let prevVars = {};
function ui() {
  const k = S.k;

  // code highlight + note
  lineEls.forEach((el, i) => {
    el.classList.toggle("active", S.line === i + 1);
    el.classList.toggle("ran", S.line !== i + 1 && S.ran.has(i + 1));
  });
  if (S.line > 0) {
    noteEl.textContent = "→ " + S.note;
    lineEls[S.line - 1].after(noteEl);
  } else noteEl.remove();

  // variables
  const vars = [
    ["k", S.k],
    ["attempt", S.start ?? "-"],
    ["round", S.round],
    ["c", S.j ?? "-"],
    ["changed", S.changed ?? "-"],
    ["spread", fmt(S.s)],
    ["best", fmt(S.best)],
  ];
  $("vars").innerHTML = vars
    .map(
      ([n, v]) =>
        `<span class="var${prevVars[n] !== undefined && prevVars[n] !== String(v) ? " flash" : ""}"><span>${n} =</span> ${v}</span>`,
    )
    .join("");
  vars.forEach(([n, v]) => (prevVars[n] = String(v)));
  requestAnimationFrame(() =>
    document
      .querySelectorAll(".var.flash")
      .forEach((e) => e.classList.remove("flash")),
  );

  // C table
  if (S.C.length) {
    const counts = new Array(k).fill(0);
    if (S.g) for (const v of S.g) if (v >= 0) counts[v]++;
    const N = Math.max(pts.length, 1);
    $("cTable").innerHTML =
      `<table><tr><th>Center</th><th>x</th><th>y</th><th>Photos</th><th>Moved</th></tr>` +
      S.C.map((c, j) => {
        const mv = S.old
          ? Math.hypot(c.x - S.old[j].x, c.y - S.old[j].y)
          : 0;
        return `<tr class="${S.j === j ? "act" : ""}"><td><span class="sw" style="background:${rgb(PAL[j])}"></span>C${j + 1}</td>
    <td>${c.x.toFixed(2)}</td><td>${c.y.toFixed(2)}</td>
    <td><div class="cnt"><i style="width:${Math.round((counts[j] / N) * 90)}px;background:${rgb(PAL[j])}"></i>${counts[j]}</div></td>
    <td>${mv.toFixed(2)}</td></tr>`;
      }).join("") +
      `</table>`;
  } else
    $("cTable").innerHTML =
      `<div class="empty">Centers appear at line 6.</div>`;

  // d table
  if (S.d && pts.length) {
    const N = pts.length,
      rows = [];
    if (hover >= 0) rows.push(hover);
    for (let q = 0; rows.length < 5 && q < 5; q++) {
      const i = Math.floor((q * N) / 5);
      if (!rows.includes(i)) rows.push(i);
    }
    $("dTable").innerHTML =
      `<table><tr><th>Photo</th>${S.C.map((c, j) => `<th>C${j + 1}</th>`).join("")}<th>argmin</th></tr>` +
      rows
        .map((i) => {
          let b = 0;
          for (let j = 1; j < k; j++)
            if (S.d[i * k + j] < S.d[i * k + b]) b = j;
          return (
            `<tr class="${i === hover ? "act" : ""}"><td>#${i}</td>` +
            S.C.map(
              (c, j) =>
                `<td class="${j === b ? "min" : ""}" style="${j === b ? "color:" + rgb(PAL[j]) : ""}">${S.d[i * k + j].toFixed(1)}</td>`,
            ).join("") +
            `<td style="color:${rgb(PAL[b])}">C${b + 1}</td></tr>`
          );
        })
        .join("") +
      `</table><div class="cap" style="margin:6px 0 0">Showing ${rows.length} of ${N} rows. Hover a photo on the map to see its row.</div>`;
  } else
    $("dTable").innerHTML =
      `<div class="empty">distances is computed at line 9.</div>`;

  // try board
  const R = S.R,
    done = S.tries.filter((t) => t.s != null).map((t) => t.s);
  const maxS = done.length ? Math.max(...done) : 1;
  let html = "";
  for (let t = 0; t < R; t++) {
    const tr = S.tries[t];
    if (!tr || tr.s == null) {
      html += `<div class="try pending${S.cur === t && !S.done ? " cur" : ""}"><div class="b"></div><small>T${t + 1}</small></div>`;
      continue;
    }
    const ratio = S.best > 0 ? tr.s / S.best : tr.s === 0 ? 1 : Infinity;
    const cls = t === S.bestTry ? "best" : ratio > 1.1 ? "stuck" : "";
    html += `<div class="try ${cls}${S.cur === t ? " cur" : ""}" title="Try ${t + 1}: spread = ${fmt(tr.s)}, ${tr.rounds} rounds">
<div class="b" style="height:${Math.max(4, (tr.s / maxS) * 62)}px"></div><small>${isFinite(ratio) ? ratio.toFixed(1) + "x" : "—"}</small></div>`;
  }
  $("tries").innerHTML = html;

  drawLoss();

  const short = S.line === 0 && pts.length < P().k;
  if (short)
    setStatus(
      `<b>Need at least k = ${P().k} photos</b> (have ${pts.length}). Add more on the map or lower k.`,
    );
  else if (S.line === 0)
    setStatus(
      `<b>Ready.</b> ${pts.length} photos. Press Step line to run line 1.`,
    );
  else if (S.done)
    setStatus(
      `<b>Done.</b> Best of ${R} tries is try ${S.bestTry + 1}, spread = ${fmt(S.best)}. Photos per group: [${S.counts.join(" ")}]`,
    );
  else if (S.cur < 0)
    setStatus(`<b>Setup</b>, line ${S.line}: ${phase(S.line)}`);
  else
    setStatus(
      `<b>Try ${S.cur + 1} of ${R}</b>, round ${Math.max(S.round, 1)}, line ${S.line}: ${phase(S.line)}`,
    );
  $("bPlay").textContent = timer ? "Pause" : "Play until convergence";
  ["bLine", "bRound", "bPlay", "bAll"].forEach(
    (id) => ($(id).disabled = short || (S.done && !timer)),
  );
  $("count").textContent = `${pts.length} photos`;
}
function setStatus(h) {
  $("status").innerHTML = h;
}
function phase(l) {
  return (
    {
      1: "load numpy",
      2: "load photos",
      3: "choose k",
      4: "set best and random",
      5: "new try",
      6: "drop the starting centers",
      7: "next round",
      8: "remember centers",
      9: "measure distances",
      10: "join the nearest center",
      11: "move to the mean",
      12: "move to the mean",
      13: "did anything move?",
      14: "score this try",
      15: "keep the best try",
      16: "best of all tries",
    }[l] || ""
  );
}
