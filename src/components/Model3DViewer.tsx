import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// @ts-ignore - Vite will resolve these as static URLs
import diamondHdrUrl from '../assets/textures/dimond.hdr';

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
    scene.background = new THREE.Color('#FFFFFF');

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
    camera.position.set(0, 1.2, 4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    
    let diamondEnvMap: THREE.Texture | null = null;
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(diamondHdrUrl, (tex) => {
      if (disposed) return;
      diamondEnvMap = pmremGenerator.fromEquirectangular(tex).texture;
      
      // If the model loaded before the HDR, we need to update the diamond material now
      if (modelRoot) {
        modelRoot.traverse(child => {
          if (child instanceof THREE.Mesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(material => {
              const physMat = material as any;
              const name = (material.name || '').toLowerCase();
              const isDiamond = 
                name.includes('diamond') || 
                name.includes('gem') || 
                name.includes('stone') || 
                name.includes('crystal') || 
                name.includes('glass') || 
                (physMat.ior === 2.4 && physMat.metalness > 0.5); // Fallback check based on our custom assignment

              if (isDiamond) {
                physMat.envMap = diamondEnvMap;
              }
              physMat.needsUpdate = true;
            });
          }
        });
      }
    });

    // Add default lighting similar to standard GLTF viewers
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(2, 2, 2);
    scene.add(directionalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

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

                    // To get the hyper-realistic "shining" diamond look on a pure white background,
                    // physical transmission fails because refracting white = pure white (no dark contrast).
                    // We fake it using a highly intense transparent mirror. The opacity lets the background through,
                    // and the metalness=1 reflects the dark/bright spots of the HDR intensely.
                    physMat.transmission = 0; 
                    physMat.opacity = 0.65;
                    physMat.transparent = true; 
                    physMat.roughness = 0;
                    physMat.metalness = 1.0; // Pure mirror
                    physMat.clearcoat = 1.0;
                    physMat.clearcoatRoughness = 0;
                    physMat.envMapIntensity = 6.0; // Massive boost to make the HDR lights "pop" and shine
                    physMat.color = new THREE.Color(0xffffff); // Must be white so reflections aren't tinted
                    physMat.flatShading = true; // Keeps the sharp diamond facets
                    
                    if (diamondEnvMap) physMat.envMap = diamondEnvMap;
                    
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
      if (diamondEnvMap) diamondEnvMap.dispose();
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
