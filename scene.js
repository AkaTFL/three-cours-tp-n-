import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createTerrainGeometry } from "./algo/terrain.js";

//Scene et caméra
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById("container").appendChild(renderer.domElement);


const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(0, 80, 120);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.update();



// Lumière
const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
directionalLight.position.set(50, 100, 50);
scene.add(directionalLight);


// Géométrie
let geometry = createTerrainGeometry({
    width: 10000,
    depth: 10000,
    widthSegments: 50,
    depthSegments: 50,
    heightScale: 20,
    smoothTerrain: true,
    smoothIterations: 4,
    smoothBorders: true,
    borderFalloff: 0.2,
});


const loader = new THREE.TextureLoader();

const terrainTextureRepeat = 40;

function configureTexture(texture, isColor = false) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(terrainTextureRepeat, terrainTextureRepeat);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    if (isColor) {
        texture.colorSpace = THREE.SRGBColorSpace;
    }

    return texture;
}

const grass1C = configureTexture(loader.load("textures/ground/Grass001/Grass001_Color.jpg"), true)
const grass1N = configureTexture(loader.load("textures/ground/Grass001/Grass001_Normal.jpg"))
const grass1R = configureTexture(loader.load("textures/ground/Grass001/Grass001_Roughness.jpg"))

const grass2C = configureTexture(loader.load("textures/ground/Ground047/Ground047_Color.jpg"), true)
const grass2N = configureTexture(loader.load("textures/ground/Ground047/Ground047_Normal.jpg"))
const grass2R = configureTexture(loader.load("textures/ground/Ground047/Ground047_Roughness.jpg"))

const grass3C = configureTexture(loader.load("textures/ground/Ground048/Ground048_Color.jpg"), true)
const grass3N = configureTexture(loader.load("textures/ground/Ground048/Ground048_Normal.jpg"))
const grass3R = configureTexture(loader.load("textures/ground/Ground048/Ground048_Roughness.jpg"))


const materials1 = new THREE.MeshStandardMaterial({

    map: grass1C,
    normalMap: grass1N,
    roughnessMap: grass1R,
    side: THREE.DoubleSide,
});

const materials2 = new THREE.MeshStandardMaterial({
    map: grass2C,
    normalMap: grass2N,
    roughnessMap: grass2R,
    side: THREE.DoubleSide,
});

const materials3 = new THREE.MeshStandardMaterial({
    map: grass3C,
    normalMap: grass3N,
    roughnessMap: grass3R,
    side: THREE.DoubleSide,
});



let mesh = new THREE.Mesh(geometry, materials3);

mesh.position.x = 0;

scene.add(mesh);


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});