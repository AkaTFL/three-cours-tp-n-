import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

function loadTreeTexture(loader, path) {
  const tex = loader.load(path);
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  return tex;
}

export async function initTrees({ scene, loader, getHeight, size, noise, scale, height, camera, isUnderWater }) {
  const gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  gltfLoader.setDRACOLoader(dracoLoader);

  const treeTextures = {
    color: loadTreeTexture(loader, "textures/others/arbres/vrai/color.jpg"),
    normal: loadTreeTexture(loader, "textures/others/arbres/vrai/normal.jpg"),
    roughness: loadTreeTexture(loader, "textures/others/arbres/vrai/dd.png"),
    ao: loadTreeTexture(loader, "textures/others/arbres/vrai/ciuxjb.jpg"),
  };

  Object.values(treeTextures).forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  });

  const treeHigh = await new Promise((resolve, reject) => {
    gltfLoader.load(
      "textures/others/tree.glb",
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => reject(err)
    );
  });

  treeHigh.traverse((child) => {
    if (!child.isMesh) return;

    const geo = child.geometry;
    if (geo.attributes.uv && !geo.attributes.uv2) {
      geo.setAttribute("uv2", new THREE.BufferAttribute(geo.attributes.uv.array, 2));
    }

    const isLeaves =
      child.name.toLowerCase().includes("lea") ||
      child.name.toLowerCase().includes("feuil") ||
      child.name.toLowerCase().includes("foliage");

    child.material = new THREE.MeshStandardMaterial({
      map: treeTextures.color,
      normalMap: treeTextures.normal,
      roughnessMap: treeTextures.roughness,
      aoMap: treeTextures.ao,
      transparent: isLeaves,
      alphaTest: isLeaves ? 0.5 : 0,
      side: THREE.DoubleSide,
      depthWrite: !isLeaves,
      roughness: 1,
      metalness: 0,
    });

    child.castShadow = true;
    child.receiveShadow = true;
  });

  const treeLow = new THREE.Mesh(
    new THREE.ConeGeometry(20, 60, 6),
    new THREE.MeshBasicMaterial({ color: 0x2e8b57 })
  );

  const box = new THREE.Box3().setFromObject(treeHigh);
  treeHigh.position.y -= box.min.y;

  function forestNoise(x, z) {
    return noise.noise(x * 0.0008, z * 0.0008, 10);
  }

  function getSlope(x, z) {
    const e = 2;
    const hL = getHeight(x - e, z);
    const hR = getHeight(x + e, z);
    const hD = getHeight(x, z - e);
    const hU = getHeight(x, z + e);
    const dx = hR - hL;
    const dz = hU - hD;
    return Math.sqrt(dx * dx + dz * dz);
  }

  const treeBillboardTexture = loader.load("textures/others/arbres/impostor/impostor.png");
  const treeBillboardMaterial = new THREE.SpriteMaterial({
    map: treeBillboardTexture,
    transparent: true,
    alphaTest: 0.5,
  });

  function createTreeBillboard(scaleFactor = 1) {
    const sprite = new THREE.Sprite(treeBillboardMaterial);
    sprite.scale.set(120 * scaleFactor, 180 * scaleFactor, 1);
    return sprite;
  }

  const TREE_COUNT = 1500;
  for (let i = 0; i < TREE_COUNT; i++) {
    const x = (Math.random() - 0.5) * size;
    const z = (Math.random() - 0.5) * size;
    const density = (forestNoise(x, z) + 1) / 2;
    if (isUnderWater(x, z)) continue;

    if (density < 0.5) continue;
    if (getSlope(x, z) > 15) continue;

    const y = getHeight(x, z);
    const treeScale = 50 + Math.random() * 60;

    const lod = new THREE.LOD();

    const high = treeHigh.clone();
    high.scale.setScalar(treeScale);
    high.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    const mid = treeHigh.clone();
    mid.scale.setScalar(treeScale * 0.6);
    mid.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    const billboard = createTreeBillboard(treeScale / 50);

    high.position.set(0, -treeScale / 2, 0);
    mid.position.set(0, 0, 0);
    billboard.position.set(0, 0, 0);

    lod.addLevel(high, 0);
    lod.addLevel(mid, 4000);
    lod.addLevel(billboard, 8000);
    lod.position.set(x, y, z);
    scene.add(lod);

    if (Math.random() > 0.7) {
      const clusterSize = 2 + Math.floor(Math.random() * 4);
      for (let j = 0; j < clusterSize; j++) {
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetZ = (Math.random() - 0.5) * 50;
        const nx = x + offsetX;
        const nz = z + offsetZ;
        const ny = getHeight(nx, nz);

        if (isUnderWater(nx, nz)) continue;

        const t = treeHigh.clone();
        const s = treeScale * (0.7 + Math.random() * 0.6);
        t.scale.setScalar(s);
        t.rotation.y = Math.random() * Math.PI * 2;
        t.position.set(nx, ny, nz);
        t.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
      }
    }
  }
}
