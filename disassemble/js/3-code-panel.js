// The Python code shown in the kmeans.py panel
//python code lines for display
function pad(code, comment) {
  return (
    (code.length >= 40 ? code + "  " : code.padEnd(40)) + "# " + comment
  );
}
function codeLines() {
  const { k, R, init, seed } = P();
  return [
    "import numpy as np",
    pad("photos = load_photos()", `${pts.length} photos as (x, y)`),
    pad(`k = ${k}`, "number of groups"),
    `best, random = np.inf, np.random.default_rng(${seed})`,
    pad(`for attempt in range(${R}):`, `${R} random starts`),
    init === "pp"
      ? pad("    centers = kmeans_pp(photos, k, random)", "spread-out start")
      : "    centers = random.choice(photos, k, replace=False)",
    "    while True:",
    pad("        old_centers = centers.copy()", "remember centers"),
    "        distances = ((photos[:, None] - centers) ** 2).sum(2)",
    pad("        groups = distances.argmin(1)", "nearest center"),
    pad("        for c in np.unique(groups):", "groups with photos"),
    "            centers[c] = photos[groups == c].mean(0)",
    pad("        if (centers == old_centers).all(): break", "no change"),
    pad("    spread = distances.min(1).sum()", "total spread"),
    "    if spread < best: best, best_groups = spread, groups",
    pad("print(np.bincount(best_groups))", "photos per group"),
  ];
}
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function highlight(src) {
  const ci = src.indexOf("#");
  const code = ci >= 0 ? src.slice(0, ci) : src,
    com = ci >= 0 ? src.slice(ci) : "";
  const body = esc(code).replace(
    /\b(import|as|for|in|while|True|False|None|if|break)\b|\b(\d+)\b|\b(range|len|copy|sum|argmin|mean|min|choice|bincount|inf|all|print|kmeans_pp|default_rng|load_photos|unique)\b|\b(np|random)\b/g,
    (m, kw, nu, fn, md) =>
      kw
        ? `<span class="kw">${kw}</span>`
        : nu
          ? `<span class="nu">${nu}</span>`
          : fn
            ? `<span class="fn">${fn}</span>`
            : `<span class="md">${md}</span>`,
  );
  return (
    `<span class="pl">${body}</span>` +
    (com ? `<span class="cm">${esc(com)}</span>` : "")
  );
}

let lineEls = [],
  noteEl = null;
function renderCode() {
  const box = $("code");
  box.innerHTML = "";
  lineEls = codeLines().map((src, i) => {
    const d = document.createElement("div");
    d.className = "ln";
    d.innerHTML = `<span class="no">${i + 1}</span>${highlight(src)}`;
    box.appendChild(d);
    return d;
  });
  noteEl = document.createElement("div");
  noteEl.className = "note";
}
