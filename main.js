import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { createStatsPanels } from "./src/stats.js";
import { createTerrain } from "./src/terrain.js";
import { createGrass } from "./src/grass.js";
import { createBushes } from "./src/bushes.js";
import { createSkybox } from "./src/skybox.js";
import { createWaterSystem } from "./src/water.js";
import { initTrees } from "./src/trees.js";
import { createGodRayPipeline } from "./src/postprocessing.js";

const { fpsStats, trisPanel } = createStatsPanels();

const WATER_LEVEL = -10;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 200000);
camera.position.set(0, 120, 180);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const FOG_START = 800;
const FOG_END = 1600;
scene.fog = new THREE.Fog(0xffc58f, FOG_START, FOG_END);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 500, 0);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffee, 1.0);
sunLight.position.set(500, 150, 500);
sunLight.color.set(0xffb56b);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 0;
sunLight.shadow.camera.far = 5000;
const shadowDistance = 15000;
sunLight.shadow.camera.left = -shadowDistance;
sunLight.shadow.camera.right = shadowDistance;
sunLight.shadow.camera.top = shadowDistance;
sunLight.shadow.camera.bottom = -shadowDistance;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const loader = new THREE.TextureLoader();
const SIZE = 10000;

const terrainData = createTerrain({
  scene,
  renderer,
  loader,
  size: SIZE,
  segments: 300,
  repeat: 1000,
  height: 300,
  scale: 0.00025,
});

const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
  {
    type: THREE.HalfFloatType,
    colorSpace: THREE.SRGBColorSpace,
  }
);

const { getHeight, noise, scale, height } = terrainData;

createSkybox(scene);

const { grassNear, grassMid, grassMaterial, updateGrass } = createGrass({
  scene,
  loader,
  getHeight,
  size: SIZE,
  fogStart: FOG_START,
  grassDensity: 500000,
  radius: 400,
  isUnderWater, // 👈 AJOUT
});

createBushes({
  scene,
  loader,
  getHeight,
  size: SIZE,
  bushCount: 5000,
  faces: 6,
  bushHeight: 3,
  isUnderWater, // 👈 AJOUT
});

const { waterMaterial } = createWaterSystem({
  scene,
  camera,
  sunLight,
  size: SIZE,
  getHeight,
  renderTarget,
});

const godRays = createGodRayPipeline({ scene, camera, renderer, sunLight });

const cameraLastGrassUpdate = camera.position.clone();
let grassHidden = false;
const UPDATE_THRESHOLD = 200;

updateGrass(camera);

initTrees({
  scene,
  loader,
  getHeight,
  size: SIZE,
  noise,
  scale,
  height,
  camera,
  isUnderWater,
}).catch((err) => console.error("Erreur chargement arbres :", err));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  godRays.setSize(window.innerWidth, window.innerHeight);
});

function isOutsideMap(position) {
  const halfSize = SIZE / 2;
  return (
    position.x < -halfSize ||
    position.x > halfSize ||
    position.z < -halfSize ||
    position.z > halfSize
  );
}

function isUnderWater(x, z) {
  return getHeight(x, z) < WATER_LEVEL;
}

function animate() {
    requestAnimationFrame(animate);

    renderTarget.setSize(window.innerWidth, window.innerHeight);
    waterMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);

    controls.update();


    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    waterMaterial.uniforms.uTime.value += 0.03;
    waterMaterial.uniforms.uCameraPos.value.copy(camera.position);
    waterMaterial.uniforms.uSunDir.value.copy(sunLight.position).normalize();

    const camPos = camera.position;
    if (isOutsideMap(camPos)) {
        grassNear.visible = false;
        grassMid.visible = false;
        grassNear.count = 0;
        grassMid.count = 0;
        grassHidden = true;
    } else {
        grassNear.visible = true;
        grassMid.visible = true;

        if (grassHidden || camPos.distanceTo(cameraLastGrassUpdate) > UPDATE_THRESHOLD) {
        updateGrass(camera);
        cameraLastGrassUpdate.copy(camPos);
        grassHidden = false;
        }
    }

    godRays.render();

    fpsStats.update();
    trisPanel.update(renderer.info.render.triangles, 5000000);
    }

animate();