import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';



interface Model3DViewerProps {
  src: string;
  poster?: string;
  title: string;
  isFullscreen?: boolean;
}

export default function Model3DViewer({ src, poster, title, isFullscreen = false }: Model3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !src) return;

    setLoadProgress(0);
    setLoadError(false);



    const scene = new THREE.Scene();
    // null background = transparent canvas. The webpage's CSS white background shows through.
    // This lets the diamond refract the ENVIRONMENT MAP (dark studio) not the webpage background.
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
    camera.position.set(0, 1.2, 4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Use the optimized RoomEnvironment which provides excellent studio lighting for jewelry
    const roomEnvironment = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnvironment).texture;
    scene.environment = envTexture;
    
    // Set a subtle ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(2, 4, 3);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-3, 1, -2);
    scene.add(fillLight);

    const sparkleLight = new THREE.PointLight(0xffffff, 1.5, 10);
    sparkleLight.position.set(0, 1, 2);
    scene.add(sparkleLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    
    let modelRoot: THREE.Object3D | null = null;
    let animationFrame = 0;
    let disposed = false;

    const frameModel = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.4 / maxDimension;

      object.position.sub(center);
      object.scale.setScalar(scale);

      const framedBox = new THREE.Box3().setFromObject(object);
      const framedSize = framedBox.getSize(new THREE.Vector3());
      const framedCenter = framedBox.getCenter(new THREE.Vector3());
      const distance = Math.max(framedSize.x, framedSize.y, framedSize.z) * 1.8;

      controls.target.copy(framedCenter);
      camera.position.set(framedCenter.x, framedCenter.y + distance * 0.25, framedCenter.z + distance);
      camera.near = Math.max(distance / 100, 0.01);
      camera.far = distance * 20;
      camera.updateProjectionMatrix();
      controls.update();
    };

    const loader = new GLTFLoader();
    loader.load(
      src,
      gltf => {
        if (disposed) return;
        modelRoot = gltf.scene;
        
        modelRoot.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material, index) => {
                material.side = THREE.DoubleSide;
                if (material instanceof THREE.MeshStandardMaterial) {
                  const name = (material.name || '').toLowerCase();
                  const isDiamond = 
                    name.includes('diamond') || 
                    name.includes('gem') || 
                    name.includes('stone') || 
                    name.includes('crystal') || 
                    name.includes('glass') || 
                    (material as any).transmission > 0 || 
                    (material.transparent && material.opacity < 1);

                  if (isDiamond) {
                    // Upgrade to MeshPhysicalMaterial if it isn't already
                    let physMat = material as any;
                    if (!(material instanceof THREE.MeshPhysicalMaterial)) {
                      physMat = new THREE.MeshPhysicalMaterial().copy(material);
                      // Replace the material on the mesh
                      if (Array.isArray(child.material)) {
                        child.material[index] = physMat;
                      } else {
                        child.material = physMat;
                      }
                    }

                    // Tag this mesh so the HDR callback can reliably find it later
                    child.userData.isDiamond = true;

                    // TRUE PHYSICAL DIAMOND: light enters, refracts internally, exits
                    // This creates the "fire" and internal glow diamonds are known for.
                    physMat.transmission = 1.0;    // Full physical light transmission
                    physMat.ior = 2.4;             // Diamond IOR (real value: 2.417)
                    physMat.thickness = 1.0;       // Gem volume — light travels this far inside
                    physMat.roughness = 0;         // Perfect polish
                    physMat.metalness = 0;         // NOT metallic — it's a crystal
                    physMat.clearcoat = 1.0;       // Top polish layer (like table facet shine)
                    physMat.clearcoatRoughness = 0;
                    physMat.attenuationColor = new THREE.Color(0xCCE4FF); // Real diamonds have a very faint blue tint
                    physMat.attenuationDistance = 0.4; // Makes deep facets darker = visible depth!
                    physMat.dispersion = 2.0;      // Rainbow fire effect (light splits into spectrum)
                    physMat.envMapIntensity = 4.0;
                    physMat.color = new THREE.Color(0xffffff);
                    physMat.flatShading = true;    // Keeps sharp geometric facets
                    
                    
                    // The RoomEnvironment is perfectly calibrated for jewelry reflections
                    physMat.envMap = envTexture;
                    
                    physMat.needsUpdate = true;
                  }
                }
                material.needsUpdate = true;
              });
            }
          }
        });

        scene.add(modelRoot);
        frameModel(modelRoot);
        setLoadProgress(100);
      },
      event => {
        if (!event.total) return;
        setLoadProgress(Math.round((event.loaded / event.total) * 100));
      },
      () => {
        if (!disposed) setLoadError(true);
      }
    );

    const resize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      renderer.dispose();
      if (envTexture) envTexture.dispose();
      if (scene.environment) scene.environment.dispose();
      pmremGenerator.dispose();
      renderer.domElement.remove();
    };
  }, [src]);

  return (
    <div 
      className={`relative w-full overflow-hidden ${isFullscreen ? 'h-[100dvh] flex-1 bg-transparent' : 'h-[400px] border border-[#381932]/10 bg-[#FFFFFF] rounded-md'}`}
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {poster && loadProgress < 100 && !loadError && (
        <img
          src={poster}
          alt={title}
          className="absolute inset-0 h-full w-full object-contain mix-blend-multiply opacity-35"
          referrerPolicy="no-referrer"
        />
      )}
      <div ref={mountRef} className="absolute inset-0" aria-label={`${title} 3D model`} />
      {loadProgress < 100 && !loadError && (
        <div className="absolute inset-x-6 bottom-6 space-y-2">
          <div className="h-px w-full bg-[#381932]/15 overflow-hidden">
            <div
              className="h-full bg-[#381932] transition-all duration-300"
              style={{ width: `${Math.max(loadProgress, 8)}%` }}
            />
          </div>
          <p className="text-center text-[9px] font-mono uppercase tracking-[0.18em] text-[#381932]/60">
            Loading 3D model {loadProgress}%
          </p>
        </div>
      )}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[10px] font-sans font-bold uppercase tracking-widest text-[#381932]">
          3D model could not be loaded
        </div>
      )}
    </div>
  );
}
