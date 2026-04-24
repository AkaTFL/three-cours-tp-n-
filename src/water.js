import * as THREE from "three";

export function createWaterSystem({ scene, camera, sunLight, size, getHeight, renderTarget }) {  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCameraPos: { value: camera.position },
      uDeepColor: { value: new THREE.Color(0x0a1e2e) },
      uShallowColor: { value: new THREE.Color(0x3fa7ff) },
      uSunDir: { value: sunLight.position.clone().normalize() },
      uSunColor: { value: new THREE.Color(1.0, 0.9, 0.7) },
      uEnvMap: { value: scene.environment },

      uSceneColor: { value: renderTarget.texture },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    vertexShader: `
        uniform float uTime;

        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
        vUv = uv;

        vec3 pos = position;

        // 🌊 Vagues multi-fréquences (beaucoup plus réaliste)
        float waveA = sin(pos.x * 0.05 + uTime * 1.0) * 1.2;
        float waveB = cos(pos.z * 0.08 + uTime * 0.7) * 0.8;
        float waveC = sin((pos.x + pos.z) * 0.02 + uTime * 0.5) * 0.5;

        pos.y += waveA + waveB + waveC;

        // Position monde
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;

        // 🌊 Normales dynamiques (meilleur rendu lumière)
        float eps = 1.0;

        vec3 posX = position + vec3(eps, 0.0, 0.0);
        float waveAX = sin(posX.x * 0.05 + uTime * 1.0) * 1.2;
        float waveBX = cos(posX.z * 0.08 + uTime * 0.7) * 0.8;
        float waveCX = sin((posX.x + posX.z) * 0.02 + uTime * 0.5) * 0.5;
        posX.y += waveAX + waveBX + waveCX;

        vec3 posZ = position + vec3(0.0, 0.0, eps);
        float waveAZ = sin(posZ.x * 0.05 + uTime * 1.0) * 1.2;
        float waveBZ = cos(posZ.z * 0.08 + uTime * 0.7) * 0.8;
        float waveCZ = sin((posZ.x + posZ.z) * 0.02 + uTime * 0.5) * 0.5;
        posZ.y += waveAZ + waveBZ + waveCZ;

        vec3 dx = posX - pos;
        vec3 dz = posZ - pos;

        vNormal = normalize(cross(dz, dx));

        gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
    `,
    fragmentShader: `
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        uniform vec3 uCameraPos;
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;

        uniform samplerCube uEnvMap;
        uniform sampler2D uSceneColor;
        uniform vec2 uResolution;

        uniform float uTime;
        uniform float uWaterLevel;

        void main() {

            vec3 normal = normalize(vNormal);

            // 🌊 micro vagues
            float micro = sin(vWorldPos.x * 0.05 + uTime * 0.05) *
                        cos(vWorldPos.z * 0.05 + uTime * 0.05);

            normal += vec3(micro * 0.05, 0.0, micro * 0.05);
            normal = normalize(normal);

            vec3 viewDir = normalize(uCameraPos - vWorldPos);

            // =========================
            // 🌅 FRESNEL (renforcé)
            // =========================

            float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 4.0);

            // =========================
            // 🌊 REFLECTION (principale)
            // =========================

            vec3 reflectDir = reflect(-viewDir, normal);

            // distortion pour casser l'effet miroir parfait
            reflectDir.xy += normal.xz * 0.1;

            vec3 reflection = textureCube(uEnvMap, reflectDir).rgb;

            // =========================
            // 🌊 COULEUR EAU (profondeur)
            // =========================

            float depthFactor = clamp((uWaterLevel - vWorldPos.y) * 0.05, 0.0, 1.0);

            vec3 waterColor = mix(uShallowColor, uDeepColor, depthFactor);

            // =========================
            // ☀️ SPECULAIRE (plus visible)
            // =========================

            vec3 lightDir = normalize(uSunDir);
            vec3 halfDir = normalize(viewDir + lightDir);

            float spec = pow(max(dot(normal, halfDir), 0.0), 10.0);
            spec *= 0.8;

            vec3 specular = uSunColor * spec;

            // =========================
            // 🎨 MIX FINAL
            // =========================

            // sans réfraction → base = eau + reflection
            vec3 base = mix(waterColor, reflection, fresnel);

            // léger boost de contraste
            base *= 1.1;

            // ajout specular
            vec3 color = base + specular;

            // transparence simulée (plus opaque sans réfraction)
            float alpha = mix(0.6, 0.95, depthFactor);

            // clipping surface
            if (vWorldPos.y > uWaterLevel + 0.2) discard;

            gl_FragColor = vec4(color, alpha);
        }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
  });

    function createLake() {
        const lakeSize = size; // taille du lac
        const resolution = 68;

        const geometry = new THREE.PlaneGeometry(
            lakeSize,
            lakeSize,
            resolution,
            resolution
        );

        geometry.rotateX(-Math.PI / 2);

        const water = new THREE.Mesh(geometry, waterMaterial);

        // 📍 Position du lac (centre map ici)
        water.position.y = -10;
        water.position.x = 0;
        water.position.z = -10;

        scene.add(water);

        return water;
    }

    const lake = createLake();

  return { waterMaterial };
}
