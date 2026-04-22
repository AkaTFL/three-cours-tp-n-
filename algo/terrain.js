import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createTerrainGeometry({
    width = 100,
    depth = 100,
    widthSegments = 50,
    depthSegments = 50,
    heightScale = 20,
    smoothTerrain = true,
    smoothIterations = 4,
    smoothBorders = true,
} = {}) {
    const geometry = new THREE.PlaneGeometry(width, depth, widthSegments, depthSegments);
    geometry.rotateX(-Math.PI / 2);

    const vertexWidth = widthSegments + 1;
    const vertexDepth = depthSegments + 1;
    const heights = new Float32Array(geometry.attributes.position.count);

    for (let index = 0; index < heights.length; index++) {
        heights[index] = Math.random() * heightScale;
    }

    if (smoothTerrain) {
        for (let iteration = 0; iteration < smoothIterations; iteration++) {
            const smoothedHeights = heights.slice();

            for (let z = 1; z < vertexDepth - 1; z++) {
                for (let x = 1; x < vertexWidth - 1; x++) {
                    const index = z * vertexWidth + x;
                    smoothedHeights[index] = (
                        heights[index] +
                        heights[index - 1] +
                        heights[index + 1] +
                        heights[index - vertexWidth] +
                        heights[index + vertexWidth]
                    ) / 5;
                }
            }

            heights.set(smoothedHeights);
        }
    }

    if (smoothBorders) {
        for (let z = 0; z < vertexDepth; z++) {
            for (let x = 0; x < vertexWidth; x++) {
                const index = z * vertexWidth + x;
                const isBorder = x === 0 || z === 0 || x === vertexWidth - 1 || z === vertexDepth - 1;

                if (isBorder) {
                    heights[index] = 0;
                }
            }
        }
    }

    for (let index = 0; index < geometry.attributes.position.count; index++) {
        geometry.attributes.position.setY(index, heights[index]);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;
}