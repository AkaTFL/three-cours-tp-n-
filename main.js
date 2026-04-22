import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { Sky } from "three/addons/objects/Sky.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  1,
  20000
);
camera.position.set(0, 800, 1200);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(500, 1000, 500);
scene.add(light);

// -------- TERRAIN --------
const SIZE = 10000;
const SEGMENTS = 1000; // augmente pour plus de détails

const geometry = new THREE.PlaneGeometry(
  SIZE,
  SIZE,
  SEGMENTS,
  SEGMENTS
);

geometry.rotateX(-Math.PI / 2);

// Perlin noise
const noise = new ImprovedNoise();
const vertices = geometry.attributes.position;
const scale = 0.002;   // fréquence du bruit
const height = 120;    // amplitude

for (let i = 0; i < vertices.count; i++) {
  const x = vertices.getX(i);
  const z = vertices.getZ(i);

  const y =
    noise.noise(x * scale, z * scale, 0) * height;

  vertices.setY(i, y);
}

geometry.computeVertexNormals();

const loader = new THREE.TextureLoader();

const roughnessMap = loader.load("textures/Grass001_Roughness.jpg");
const normalMap = loader.load("textures/Grass001_Normal.jpg");
const color = loader.load("textures/Grass001_Color.jpg");

// Repeat wrapping
[roughnessMap, normalMap, color].forEach((tex) => {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  tex.repeat.set(10, 10);
});

// Material
const material = new THREE.MeshStandardMaterial({
  roughnessMap : roughnessMap,
  normalMap: normalMap,
  map: color,
});

const terrain = new THREE.Mesh(geometry, material);
scene.add(terrain);

import { InstancedMesh, PlaneGeometry, MeshBasicMaterial, Object3D, TextureLoader, DoubleSide, MeshStandardMaterial } from "three";

// -------- HERBE --------
const grassTexture = new THREE.TextureLoader().load("textures/others/color.png");
grassTexture.transparent = true;

const GRASS_COUNT = 500000; // 🔥 réduit (beaucoup plus stable visuellement)

const grassGeometry = new THREE.PlaneGeometry(10, 10);

const grassMaterial = new THREE.MeshBasicMaterial({
  map: grassTexture,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const grassMesh = new THREE.InstancedMesh(
  grassGeometry,
  grassMaterial,
  GRASS_COUNT
);

scene.add(grassMesh);

const dummy = new THREE.Object3D();

for (let i = 0; i < GRASS_COUNT; i++) {
  const x = (Math.random() - 0.5) * SIZE;
  const z = (Math.random() - 0.5) * SIZE;

  const y = noise.noise(x * scale, z * scale, 0) * height;

  dummy.position.set(x, y, z);

  dummy.rotation.x = Math.random() * 0.3 - 0.15;
  dummy.rotation.y = Math.random() * Math.PI * 2;
  dummy.rotation.z = Math.random() * 0.3 - 0.15;

  const s = 0.6 + Math.random() * 1.2; // 🔥 plus propre
  dummy.scale.set(s, s, s);

  dummy.updateMatrix();
  grassMesh.setMatrixAt(i, dummy.matrix);
}

grassMesh.instanceMatrix.needsUpdate = true;

const bushTexture = new THREE.TextureLoader().load("textures/others/BaseColor.png");
bushTexture.transparent = true;

const BUSH_COUNT = 500;
const FACES = 8;

const bushGeometry = new THREE.PlaneGeometry(3, 3);

const bushMaterial = new THREE.MeshLambertMaterial({
  map: bushTexture,
  transparent: true,
  alphaTest: 0.5,
  side: THREE.DoubleSide,
});

const bushMesh = new THREE.InstancedMesh(
  bushGeometry,
  bushMaterial,
  BUSH_COUNT * FACES
);

scene.add(bushMesh);

const buisson = new THREE.Object3D();

let index = 0;

for (let i = 0; i < BUSH_COUNT; i++) {
  const x = (Math.random() - 0.5) * SIZE;
  const z = (Math.random() - 0.5) * SIZE;

  const y = noise.noise(x * scale, z * scale, 0) * height;

  const rotYBase = Math.random() * Math.PI * 2;

  const s = 40 + Math.random() * 18; // 🔥 plus lisible + stable

  for (let f = 0; f < FACES; f++) {
    const angle = (Math.PI / 4) * f;

    buisson.position.set(x, y + 2.0, z); // 🔥 légèrement au-dessus de l’herbe

    buisson.rotation.set(0, rotYBase + angle, 0);

    buisson.scale.set(s, s, s);

    buisson.updateMatrix();

    bushMesh.setMatrixAt(index++, buisson.matrix);
  }
}

bushMesh.instanceMatrix.needsUpdate = true;


for (let i = 0; i < BUSH_COUNT; i++) {
  const x = (Math.random() - 0.5) * SIZE;
  const z = (Math.random() - 0.5) * SIZE;

  const y = noise.noise(x * scale, z * scale, 0) * height;

  const rotYBase = Math.random() * Math.PI * 2;
  const s = 30 + Math.random() * 45;

  for (let f = 0; f < FACES; f++) {
    const angle = (Math.PI / 8) * f;

    buisson.position.set(x, y, z);

    buisson.rotation.set(0, rotYBase + angle, 0);

    buisson.scale.set(s, s, s);

    buisson.updateMatrix();

    bushMesh.setMatrixAt(index++, buisson.matrix);
  }
}

bushMesh.instanceMatrix.needsUpdate = true;

const dummy2 = new Object3D();


for (let i = 0; i < GRASS_COUNT; i++) {
  const x = (Math.random() - 0.5) * SIZE;
  const z = (Math.random() - 0.5) * SIZE;
  // récupérer hauteur du terrain (approx via noise)
  const y = noise.noise(x * scale, z * scale, 0) * height;
  dummy2.position.set(x, y, z);
  // rotation 3D aléatoire pour chaque brin d'herbe
  dummy2.rotation.x = Math.random() * 0.3 - 0.15;
  dummy2.rotation.y = Math.random() * Math.PI * 2;
  dummy2.rotation.z = Math.random() * 0.3 - 0.15;
  // variation de taille
  const s = 0.8 + Math.random() * 10;
  dummy2.scale.set(s, s, s);
  dummy2.updateMatrix();
  grassMesh.setMatrixAt(i, dummy2.matrix);
}

// -------- SKY --------
const sky = new Sky();
sky.scale.setScalar(1000000);
scene.add(sky);

const sun = new THREE.Vector3();

// paramètres du ciel
const skyUniforms = sky.material.uniforms;

skyUniforms["turbidity"].value = 10;
skyUniforms["rayleigh"].value = 2;
skyUniforms["mieCoefficient"].value = 0.005;
skyUniforms["mieDirectionalG"].value = 0.8;

// position du soleil
const elevation = 25; // hauteur dans le ciel
const azimuth = 180;

const phi = THREE.MathUtils.degToRad(90 - elevation);
const theta = THREE.MathUtils.degToRad(azimuth);

sun.setFromSphericalCoords(1, phi, theta);

sky.material.uniforms["sunPosition"].value.copy(sun);

const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.copy(sun.clone().multiplyScalar(1000));
scene.add(sunLight);

grassMesh.instanceMatrix.needsUpdate = true;

const gltfLoader = new GLTFLoader();

gltfLoader.load("textures/skybox/sky.glb", (gltf) => {
  const skyBox = gltf.scene;

  skyBox.scale.setScalar(5000);

  skyBox.traverse((child) => {
    if (child.isMesh) {
      child.material.side = THREE.BackSide;
    }
  });

  scene.add(skyBox);
});

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();