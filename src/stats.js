import Stats from "https://unpkg.com/three@0.157.0/examples/jsm/libs/stats.module.js";

export function createStatsPanels() {
  const fpsStats = new Stats();
  fpsStats.showPanel(0);
  fpsStats.dom.style.cssText = "position:fixed;top:0;left:0;z-index:10000;";
  document.body.appendChild(fpsStats.dom);

  const trisStats = new Stats();
  const trisPanel = trisStats.addPanel(new Stats.Panel("TRIS", "#8f8", "#020"));
  trisStats.showPanel(3);
  trisStats.dom.style.cssText = "position:fixed;top:48px;left:0;z-index:10000;opacity:0.9;";
  document.body.appendChild(trisStats.dom);

  return { fpsStats, trisPanel };
}
