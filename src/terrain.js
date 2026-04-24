import * as THREE from "three";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";

export function createTerrain({ scene, renderer, loader, size = 10000, segments = 300, repeat = 1000, height = 300, scale = 0.00025 }) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const noise = new ImprovedNoise();

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

  const colorMap = loader.load("textures/sol/Grass001_Color.jpg");
  const normalMap = loader.load("textures/sol/Grass001_Normal.jpg");
  const roughnessMap = loader.load("textures/sol/Grass001_Roughness.jpg");

  const colorMap2 = loader.load("textures/sol/rocks_ground_01_diff_2k.jpg");
  const normalMap2 = loader.load("textures/sol/rocks_ground_01_nor_gl_2k.exr");
  const roughnessMap2 = loader.load("textures/sol/rocks_ground_01_rough_2k.jpg");

[colorMap2, normalMap2, roughnessMap2].forEach((tex) => {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
});

  [colorMap2, normalMap2, roughnessMap2].forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
  });

    [colorMap, normalMap, roughnessMap].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    });

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,

    uniforms: {
      map1: { value: colorMap },
      normalMap1: { value: normalMap },
      roughnessMap1: { value: roughnessMap },

      map2: { value: colorMap2 },
      normalMap2: { value: normalMap2 },
      roughnessMap2: { value: roughnessMap2 },

      waterLevel: { value: 5.0 },      // niveau de l’eau
      blendStrength: { value: 20.0 },  // largeur du dégradé
      repeat: { value: repeat }

    },

    vertexShader: `
      varying vec2 vUv;
      varying float vHeight;

      void main() {
        vUv = uv;
        vHeight = position.y;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      uniform sampler2D map1;
      uniform sampler2D normalMap1;
      uniform sampler2D roughnessMap1;

      uniform sampler2D map2;
      uniform sampler2D normalMap2;
      uniform sampler2D roughnessMap2;

      uniform float waterLevel;
      uniform float blendStrength;
      uniform float repeat;

      varying vec2 vUv;
      varying float vHeight;

      void main() {
        vec2 uv = vUv * repeat;

        // textures
        vec4 col1 = texture2D(map1, uv);
        vec4 col2 = texture2D(map2, uv);

        // 💡 facteur de blend smooth
        float blend = smoothstep(
          waterLevel - blendStrength,
          waterLevel + blendStrength,
          vHeight
        );

        // mix final
        vec4 finalColor = mix(col2, col1, blend);

        gl_FragColor = finalColor;
      }
    `,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  scene.add(terrain);

  return { terrain, getHeight, noise, scale, height, size };
}
