import * as THREE from "three";

export function createSkybox(scene) {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const skyboxTexture = cubeTextureLoader.load([
    "textures/skybox/posx.jpg",
    "textures/skybox/negx.jpg",
    "textures/skybox/posy.jpg",
    "textures/skybox/negy.jpg",
    "textures/skybox/posz.jpg",
    "textures/skybox/negz.jpg",
  ]);

  scene.background = skyboxTexture;
  scene.environment = skyboxTexture;

  return skyboxTexture;
}
