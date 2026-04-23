import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

import Stats from "https://unpkg.com/three@0.157.0/examples/jsm/libs/stats.module.js";

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 20000);
camera.position.set(0, 8, 12);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// -------- LIGHTS (LUMIÈRE NATURELLE) --------

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 500, 0);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffee, 1.5);
sunLight.position.set(500, 1000, 500);
sunLight.castShadow = true;

sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 5000;

const shadowDistance = 1500;
sunLight.shadow.camera.left = -shadowDistance;
sunLight.shadow.camera.right = shadowDistance;
sunLight.shadow.camera.top = shadowDistance;
sunLight.shadow.camera.bottom = -shadowDistance;
sunLight.shadow.bias = -0.0005;

scene.add(sunLight);

// -------- TERRAIN --------
const SIZE = 10000;
const SEGMENTS = 1000;

const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
geometry.rotateX(-Math.PI / 2);

const noise = new ImprovedNoise();
const scale = 0.002;
const height = 120;

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

const loader = new THREE.TextureLoader();

const terrain = new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({
    map: loader.load("textures/Grass001_Color.jpg"),
    normalMap: loader.load("textures/Grass001_Normal.jpg"),
    roughnessMap: loader.load("textures/Grass001_Roughness.jpg"),
  })
);

terrain.receiveShadow = true;
scene.add(terrain);

// -------- EAU --------
const waterGeometry = new THREE.CircleGeometry(500, 64);

const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x3366aa,
  transparent: true,
  opacity: 0.7,
  roughness: 0.2,
  metalness: 0.3,
});

const water = new THREE.Mesh(waterGeometry, waterMaterial);

const wx = 0;
const wz = 0;
const wy = getHeight(wx, wz) - 2;

water.rotation.x = -Math.PI / 2;
water.position.set(wx, wy, wz);

scene.add(water);

waterMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.time = { value: 0 };

  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `
    vec3 transformed = vec3(position);
    transformed.z += sin(position.x * 0.05 + time) * 0.5;
    transformed.x += cos(position.y * 0.05 + time) * 0.5;
    `
  );

  waterMaterial.userData.shader = shader;
};

// -------- HERBE --------
const GRASS_COUNT = 200000;
const grassGeometry = new THREE.PlaneGeometry(10, 15);
const GRASS_HEIGHT = 3;

const grassMaterial = new THREE.MeshStandardMaterial({
  map: loader.load("textures/others/herbes/herbes.png"),
  alphaTest: 0.5,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const grassMesh = new THREE.InstancedMesh(grassGeometry, grassMaterial, GRASS_COUNT);
scene.add(grassMesh);

const dummy = new THREE.Object3D();

for (let i = 0; i < GRASS_COUNT; i++) {
  const x = (Math.random() - 0.5) * SIZE;
  const z = (Math.random() - 0.5) * SIZE;
  const y = getHeight(x, z);

  dummy.position.set(x, y + GRASS_HEIGHT / 2, z);
  dummy.rotation.y = Math.random() * Math.PI;
  const s = 1.5 + Math.random() * 2;
  dummy.scale.set(s, s, s);

  dummy.updateMatrix();
  grassMesh.setMatrixAt(i, dummy.matrix);
}

grassMesh.instanceMatrix.needsUpdate = true;

// -------- BUISSON --------
const BUSH_COUNT = 500;
const FACES = 6;
const BUSH_HEIGHT = 3;

const bushGeometry = new THREE.PlaneGeometry(2, 3);

const bushMaterial = new THREE.MeshStandardMaterial({
  map: loader.load("textures/others/buisson/buisson.png"),
  alphaTest: 0.5,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const bushMesh = new THREE.InstancedMesh(bushGeometry, bushMaterial, BUSH_COUNT * FACES);
scene.add(bushMesh);

let index = 0;
const obj = new THREE.Object3D();

for (let i = 0; i < BUSH_COUNT; i++) {
  const x = (Math.random() - 0.5) * SIZE;
  const z = (Math.random() - 0.5) * SIZE;
  const y = getHeight(x, z);

  const rot = Math.random() * Math.PI;

  for (let f = 0; f < FACES; f++) {
    obj.position.set(x, y + BUSH_HEIGHT / 2, z);
    obj.rotation.set(0, rot + (Math.PI / FACES) * f, 0);
    obj.scale.setScalar(20);

    obj.updateMatrix();
    bushMesh.setMatrixAt(index++, obj.matrix);
  }
}

bushMesh.instanceMatrix.needsUpdate = true;

// -------- SKYBOX --------
const cubeTextureLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeTextureLoader.load([
  "textures/skybox/px.jpg",
  "textures/skybox/nx.jpg",
  "textures/skybox/py.jpg",
  "textures/skybox/ny.jpg",
  "textures/skybox/pz.jpg",
  "textures/skybox/nz.jpg",
]);

scene.background = skyboxTexture;
scene.environment = skyboxTexture;

// -------- TEXTURES UTILITAIRES --------

// FIX 1 : loadTreeTexture déclarée AVANT son utilisation (bonne pratique)
function loadTreeTexture(path) {
  const tex = loader.load(path);
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  return tex;
}

function placeOnGround(object, x, z, scale = 1) {
  const y = getHeight(x, z);
  const box = new THREE.Box3().setFromObject(object);
  const minY = box.min.y;
  object.position.set(x, y - minY * scale, z);
}

// -------- BRUIT / PENTE --------

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

// -------- ARBRES (FIX 2 : tout dans une async function) --------

async function initTrees() {
  const gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  gltfLoader.setDRACOLoader(dracoLoader);

  const treeTextures = {
    color: loadTreeTexture("textures/others/arbres/vrai/color.png"),
    normal: loadTreeTexture("textures/others/arbres/vrai/normal.png"),
    roughness: loadTreeTexture("textures/others/arbres/vrai/roughness.png"),
    ao: loadTreeTexture("textures/others/arbres/vrai/ao.png"),
  };

  Object.values(treeTextures).forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  });

  // FIX 3 : await correctement dans une async function
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

    // FIX 4 : depthWrite séparé selon si le mesh est transparent (feuilles) ou opaque (tronc)
    // On utilise le nom du mesh pour distinguer — adapte "Leaves" au nom réel dans ton GLB
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
      side: isLeaves ? THREE.DoubleSide : THREE.FrontSide,
      depthWrite: !isLeaves, // ✅ FIX : tronc écrit dans le depth buffer, feuilles non
      roughness: 1,
      metalness: 0,
    });

    child.castShadow = true;
    child.receiveShadow = true;
  });

  // Recalage pivot
  const box = new THREE.Box3().setFromObject(treeHigh);
  treeHigh.position.y -= box.min.y;

  // -------- FORÊT --------
  const TREE_COUNT = 2000;

  for (let i = 0; i < TREE_COUNT; i++) {
    let x = (Math.random() - 0.5) * SIZE;
    let z = (Math.random() - 0.5) * SIZE;

    const density = forestNoise(x, z);

    if (density < 0.2) continue;
    if (getSlope(x, z) > 15) continue;

    const y = getHeight(x, z);

    const tree = treeHigh.clone();

    const treeScale = 50 + Math.random() * 60;
    tree.scale.setScalar(treeScale);

    tree.rotation.y = Math.random() * Math.PI * 2;
    tree.rotation.z = (Math.random() - 0.5) * 0.05;

    tree.position.set(x, y, z);

    tree.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    scene.add(tree);

    // Clusters
    if (Math.random() > 0.7) {
      const clusterSize = 2 + Math.floor(Math.random() * 4);

      for (let j = 0; j < clusterSize; j++) {
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetZ = (Math.random() - 0.5) * 50;

        const nx = x + offsetX;
        const nz = z + offsetZ;
        const ny = getHeight(nx, nz);

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

        scene.add(t);
      }
    }
  }
}

// Lancement — les erreurs de chargement seront affichées dans la console
initTrees().catch((err) => console.error("Erreur chargement arbres :", err));

// -------- RESIZE --------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// -------- ANIMATE --------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  renderer.render(scene, camera);

  if (grassMaterial.userData.shader) {
    grassMaterial.userData.shader.uniforms.time.value += 0.03;
  }

  if (waterMaterial.userData.shader) {
    waterMaterial.userData.shader.uniforms.time.value += 0.02;
  }
}

animate();