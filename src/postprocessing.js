import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

export function createGodRayPipeline({ scene, camera, renderer, sunLight }) {

  // ⚡ RT en basse résolution (énorme gain)
  const RT_SCALE = 0.5;

  const occlusionRenderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth * RT_SCALE,
    window.innerHeight * RT_SCALE
  );

  // ⚡ matériaux persistants
  const occlusionMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // ⚡ créer UNE FOIS
  const sunSphere = new THREE.Mesh(
    new THREE.SphereGeometry(200, 8, 8), // moins de vertices
    lightMaterial
  );

  scene.add(sunSphere);

  const godRayShader = {
    uniforms: {
      tDiffuse: { value: null },
      lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
      exposure: { value: 0.2 },
      decay: { value: 0.95 },
      density: { value: 0.5 },
      weight: { value: 0.08 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform vec2 lightPosition;
      uniform float exposure;
      uniform float decay;
      uniform float density;
      uniform float weight;

      const int NUM_SAMPLES = 20; // ⚡ réduit

      void main() {
        vec2 delta = (vUv - lightPosition) * density / float(NUM_SAMPLES);
        vec2 coord = vUv;
        float illuminationDecay = 1.0;
        vec4 color = vec4(0.0);

        for (int i = 0; i < NUM_SAMPLES; i++) {
          coord -= delta;
          float sampleValue = texture2D(tDiffuse, coord).r;
          color += vec4(sampleValue) * illuminationDecay * weight;
          illuminationDecay *= decay;
        }

        vec4 sceneColor = texture2D(tDiffuse, vUv);
        gl_FragColor = sceneColor + color * exposure;
      }
    `,
  };

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const godPass = new ShaderPass(godRayShader);
  godPass.material.blending = THREE.AdditiveBlending;
  godPass.material.transparent = true;
  composer.addPass(godPass);

  // ⚡ occlusion optimisée
  function renderOcclusion() {
    const prevOverride = scene.overrideMaterial;

    scene.overrideMaterial = occlusionMaterial;

    // activer soleil
    sunSphere.visible = true;
    sunSphere.position.copy(sunLight.position);

    renderer.setRenderTarget(occlusionRenderTarget);
    renderer.clear();
    renderer.render(scene, camera);

    // cacher soleil après
    sunSphere.visible = false;

    scene.overrideMaterial = prevOverride;
    renderer.setRenderTarget(null);
  }

  function render() {

    const sunScreenPos = sunLight.position.clone().project(camera);

    godPass.uniforms.lightPosition.value.set(
      (sunScreenPos.x + 1) * 0.5,
      (sunScreenPos.y + 1) * 0.5
    );

    const dist = camera.position.distanceTo(sunLight.position);
    godPass.uniforms.density.value = THREE.MathUtils.clamp(1.0 / dist * 200, 0.2, 0.8);

    renderOcclusion();

    godPass.uniforms.tDiffuse.value = occlusionRenderTarget.texture;

    composer.render();
  }

  function setSize(width, height) {
    composer.setSize(width, height);
    occlusionRenderTarget.setSize(width * RT_SCALE, height * RT_SCALE);
  }

  return { render, setSize };
}
