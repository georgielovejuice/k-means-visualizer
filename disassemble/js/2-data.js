// Ready-made photo sets
//data preset: three trips, blobs, or blank
const coastY = (x) => 60 + 2.5 * Math.sin(x / 9);

function threeTrips() {
  // fixed seed: the same 600 photos every time, so a demo seed is reproducible
  const r = mulberry32(2026),
    g = () => gauss(r),
    a = [];
  for (let i = 0; i < 250; i++)
    a.push({ x: 24 + g() * 5.5, y: 24 + g() * 5 }); // city
  for (let i = 0; i < 200; i++) {
    const x = 38 + r() * 50;
    a.push({ x, y: coastY(x) - 2.8 + g() * 1.3 });
  } // coast
  for (let i = 0; i < 150; i++) {
    // mountain trail
    const t = r();
    a.push({
      x: 58 + t * 32 + g() * 1.5,
      y: 34 - t * 26 - 4 * Math.sin(Math.PI * t) + g() * 1.5,
    });
  }
  return a.map((p) => ({
    x: clamp(p.x, 1, WX - 1),
    y: clamp(p.y, 1, WY - 1),
  }));
}

function blobs() {
  const k = P().k,
    a = [];
  const cs = Array.from({ length: k }, () => ({
    x: 12 + Math.random() * 76,
    y: 10 + Math.random() * 50,
    s: 3 + Math.random() * 4,
  }));
  for (let i = 0; i < 360; i++) {
    const c = cs[i % k];
    a.push({
      x: clamp(c.x + gauss() * c.s, 1, WX - 1),
      y: clamp(c.y + gauss() * c.s, 1, WY - 1),
    });
  }
  return a;
}
