// Starts the page
new ResizeObserver(resize).observe(cv);
window.addEventListener("resize", resize);

pts = threeTrips();
freshState();
renderCode();
resize();
ui();
requestAnimationFrame(frame);
