import * as THREE from "three";

export function createGrass({ scene, loader, getHeight, size, fogStart = 1500, grassDensity = 500000, radius = 1500, isUnderWater }) {
  const grassGeometry = new THREE.PlaneGeometry(8, 15);
  const grassHeight = 3;
  const grassMaterial = new THREE.MeshStandardMaterial({
    map: loader.load("textures/others/herbes/herbes.png"),
    alphaTest: 0.5,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
    fog: true,
    opacity: 1.0,
  });

  const grassNear = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassDensity);
  const grassMid = new THREE.InstancedMesh(grassGeometry, grassMaterial, Math.floor(grassDensity / 4));
  const maxNearCount = grassNear.count;
  const maxMidCount = grassMid.count;

  scene.add(grassNear);
  scene.add(grassMid);

  grassNear.castShadow = true;
  grassMid.castShadow = false;
  grassNear.frustumCulled = false;
  grassMid.frustumCulled = false;

  const dummy = new THREE.Object3D();

  function hash(x, z) {
    return (Math.sin(x * 127.1 + z * 311.7) * 43758.5453123) % 1;
  }

  function updateGrass(camera) {
    let nearIndex = 0;
    let midIndex = 0;
    const step = 10;

    for (let x = -radius; x < radius; x += step) {
      for (let z = -radius; z < radius; z += step) {
        const worldX = Math.floor((camera.position.x + x) / step) * step;
        const worldZ = Math.floor((camera.position.z + z) / step) * step;
        const y = getHeight(worldX, worldZ);
        const dist = Math.sqrt(x * x + z * z);
        const rand = hash(worldX, worldZ);

        if (isUnderWater(worldX, worldZ)) continue;

        dummy.position.set(worldX, y + grassHeight / 2, worldZ);
        dummy.rotation.y = rand * Math.PI;
        dummy.scale.setScalar(1 + rand);
        dummy.updateMatrix();

        if (dist < 800 && nearIndex < maxNearCount) {
          grassNear.setMatrixAt(nearIndex++, dummy.matrix);
        } else if (dist < 1500 && midIndex < maxMidCount) {
          grassMid.setMatrixAt(midIndex++, dummy.matrix);
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
