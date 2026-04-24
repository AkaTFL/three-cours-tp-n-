import * as THREE from "three";

export function createGrass({ scene, loader, getHeight, size, fogStart = 1500, grassDensity = 500000, radius = 1500, isUnderWater }) {
  const grassGeometry = new THREE.PlaneGeometry(8, 15);
  const grassHeight = 3;
  const grassMaterial = new THREE.MeshStandardMaterial({
    map: loader.load("textures/others/herbes/herbes.png"),
    alphaTest: 0.5,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: true,
    opacity: 1.0,
  });

  const grassNear = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassDensity);
  const grassMid = new THREE.InstancedMesh(grassGeometry, grassMaterial, Math.floor(grassDensity / 4));
  const maxNearCount = grassNear.count;
  const maxMidCount = grassMid.count;

  scene.add(grassNear);
  scene.add(grassMid);

  grassNear.castShadow = false;
  grassMid.castShadow = false;
  grassNear.receiveShadow = true;
  grassMid.receiveShadow = false;
  grassNear.frustumCulled = false;
  grassMid.frustumCulled = false;

  const dummy = new THREE.Object3D();

  function hash(x, z) {
  return fract(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453);
}

function fract(x) {
  return x - Math.floor(x);
}

function updateGrass(camera) {
  let nearIndex = 0;
  let midIndex = 0;

  const step = 6; // ⚠️ légèrement irrégulier

  const maxDistNear = fogStart;
  const maxDistMid = fogStart * 1.5;

  for (let x = -radius; x < radius; x += step) {
    for (let z = -radius; z < radius; z += step) {

      // 🌍 base position (NON snapped)
      const baseX = camera.position.x + x;
      const baseZ = camera.position.z + z;

      // 🎲 jitter NON corrélé
      const jx = (hash(baseX, baseZ) - 0.5) * step * 1.2;
      const jz = (hash(baseZ, baseX) - 0.5) * step * 1.2;

      const finalX = baseX + jx;
      const finalZ = baseZ + jz;

      const dx = finalX - camera.position.x;
      const dz = finalZ - camera.position.z;
      
      const dist = dx * dx + dz * dz;

      if (dist > maxDistMid * maxDistMid) continue;
      if (isUnderWater(finalX, finalZ)) continue;

      const y = getHeight(finalX, finalZ);

      const rand = hash(finalX * 0.1, finalZ * 0.1);

      dummy.position.set(finalX, y + grassHeight / 2, finalZ);

      // 🌪️ rotation FULL random
      dummy.rotation.y = rand * Math.PI * 2;

      // 🌿 scale moins uniforme
      dummy.scale.set(
        0.8 + rand * 0.8,
        0.8 + rand * 1.2,
        0.8 + rand * 0.8
      );

      dummy.updateMatrix();

      if (dist < (maxDistNear * maxDistNear) && nearIndex < maxNearCount) {
        grassNear.setMatrixAt(nearIndex++, dummy.matrix);
      } else if (dist < (maxDistMid * maxDistMid) && midIndex < maxMidCount) {

        const fade = (dist - maxDistNear) / (maxDistMid - maxDistNear);

        if (rand > fade) {
          grassMid.setMatrixAt(midIndex++, dummy.matrix);
        }
      }
    }
  }

  grassNear.count = nearIndex;
  grassMid.count = midIndex;

  grassNear.instanceMatrix.needsUpdate = true;
  grassMid.instanceMatrix.needsUpdate = true;
}

  return { grassNear, grassMid, grassMaterial, updateGrass, grassHeight, fogStart };
}
