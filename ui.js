export function createUi() {
    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.top = "12px";
    panel.style.left = "12px";
    panel.style.zIndex = "10";
    panel.style.padding = "8px 12px";
    panel.style.borderRadius = "8px";
    panel.style.background = "rgba(0, 0, 0, 0.65)";
    panel.style.color = "#ffffff";
    panel.style.font = "14px monospace";
    panel.style.pointerEvents = "none";

    const polygonCounter = document.createElement("div");
    polygonCounter.textContent = "Polygones: 0";

    const fpsCounter = document.createElement("div");
    fpsCounter.textContent = "FPS: 0";

    panel.appendChild(polygonCounter);
    panel.appendChild(fpsCounter);
    document.body.appendChild(panel);

    let fpsAccumulator = 0;
    let fpsFrames = 0;

    return {
        update(triangles, deltaSeconds) {
            polygonCounter.textContent = `Polygones: ${triangles}`;

            fpsAccumulator += deltaSeconds;
            fpsFrames += 1;

            if (fpsAccumulator >= 0.25) {
                const fps = Math.round(fpsFrames / fpsAccumulator);
                fpsCounter.textContent = `FPS: ${fps}`;
                fpsAccumulator = 0;
                fpsFrames = 0;
            }
        },
    };
}