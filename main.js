import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const app = document.getElementById('app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(9, 8, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(4, 0.5, 4);

const ambientLight = new THREE.AmbientLight(0xeeeeee, 1.5);
scene.add(ambientLight);


const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
directionalLight.position.set(8, 12, 6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.camera.left = -12;
directionalLight.shadow.camera.right = 12;
directionalLight.shadow.camera.top = 12;
directionalLight.shadow.camera.bottom = -12;
directionalLight.shadow.bias = -0.0005;

scene.add(directionalLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 1 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.75;
floor.castShadow = true;
floor.receiveShadow = true;
scene.add(floor);

const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 32);
const colors = [0x60a5fa, 0x38bdf8, 0x22c55e, 0xf59e0b, 0xef4444];
const spacing = 2.2;
const offset = ((5 - 1) * spacing) / 2;

for (let row = 0; row < 5; row += 1) {
  for (let column = 0; column < 5; column += 1) {
    const material = new THREE.MeshStandardMaterial({ color: colors[column], roughness: 0.35, metalness: 0.1 });
    const cylinder = new THREE.Mesh(cylinderGeometry, material);
    const scale = 0.75 + column * 0.35;
    cylinder.scale.setScalar(scale);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.position.set(column * spacing - offset, floor.position.y + (1.4 * scale) / 2, row * spacing - offset);
    scene.add(cylinder);
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onResize);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
