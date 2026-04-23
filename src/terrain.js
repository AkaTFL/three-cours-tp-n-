import * as THREE from "three";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";

export function createTerrain({ scene, renderer, loader, size = 10000, segments = 300, repeat = 1000, height = 300, scale = 0.00025 }) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const noise = new ImprovedNoise();

  function getHeight(x, z) {
    return noise.noise(x * scale, z * scale, 0) * height;
  }

  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    vertices.setY(i, getHeight(x, z));
  }

  geometry.computeVertexNormals();

  const colorMap = loader.load("textures/Grass001_Color.jpg");
  const normalMap = loader.load("textures/Grass001_Normal.jpg");
  const roughnessMap = loader.load("textures/Grass001_Roughness.jpg");

  [colorMap, normalMap, roughnessMap].forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  });

  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap,
    roughnessMap,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  scene.add(terrain);

  return { terrain, getHeight, noise, scale, height, size };
}
