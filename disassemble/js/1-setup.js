// Constants, shared state and small helpers
//setup
const WX = 100,
  WY = 70; // world size: the map is 100 x 70 "km"
const MAXP = 2500; // photo cap so the page stays smooth
const CAP = 200; // safety cap on rounds per try
const PAL = [
  [255, 69, 58],
  [255, 159, 10],
  [10, 132, 255],
  [48, 209, 88],
  [191, 90, 242],
  [255, 214, 10],
  [255, 55, 95],
  [100, 210, 255],
];
const GRAY = [142, 142, 147];
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const $ = (id) => document.getElementById(id);

let pts = []; // photos: {x, y}
let tool = "spray";
let rng = Math.random;
let S,
  disp = []; // algorithm state + animated pin positions
let timer = null;

const P = () => ({
  k: +$("k").value,
  R: +$("R").value,
  init: $("init").value,
  seed: Math.abs(parseInt($("seed").value, 10) || 0),
  speed: +$("speed").value,
});

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r = Math.random) {
  let u = 0;
  while (!u) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fmt(v) {
  if (v === Infinity) return "inf";
  if (v == null) return "-";
  return Math.abs(v) >= 1000
    ? Math.round(v).toLocaleString("en-US")
    : v.toFixed(1);
}
