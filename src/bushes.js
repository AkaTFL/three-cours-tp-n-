import * as THREE from "three";

export function createBushes({ scene, loader, getHeight, size, bushCount = 5000, faces = 6, bushHeight = 3, isUnderWater }) {
  const bushGeometry = new THREE.PlaneGeometry(2, 3);
  const bushMaterial = new THREE.MeshStandardMaterial({
    map: loader.load("textures/others/buisson/buisson.png"),
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    depthWrite: true,
  });

  const bushMesh = new THREE.InstancedMesh(bushGeometry, bushMaterial, bushCount * faces);
  scene.add(bushMesh);

  let index = 0;
  const obj = new THREE.Object3D();

  for (let i = 0; i < bushCount; i++) {
    const x = (Math.random() - 0.5) * size;
    const z = (Math.random() - 0.5) * size;
    const y = getHeight(x, z);
    const rot = Math.random() * Math.PI;

    if (isUnderWater(x, z)) continue;

    for (let f = 0; f < faces; f++) {
      obj.position.set(x, y + bushHeight / 2, z);
      obj.rotation.set(0, rot + (Math.PI / faces) * f, 0);
      obj.scale.setScalar(20);
      obj.updateMatrix();
      bushMesh.setMatrixAt(index++, obj.matrix);
    }
  }

  bushMesh.instanceMatrix.needsUpdate = true;
  return bushMesh;
}
