import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Model3DViewerProps {
  src: string;
  poster?: string;
  title: string;
}

export default function Model3DViewer({ src, poster, title }: Model3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !src) return;

    setLoadProgress(0);
    setLoadError(false);

    // Prevent page scrolling when zooming the 3D model
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    mount.addEventListener('wheel', handleWheel, { passive: false });

    const scene = new THREE.Scene();
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
    renderer.toneMappingExposure = 1.75;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environmentMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environmentMap;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xeadfc8, 3.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 5.5);
    keyLight.position.set(3, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfff1d2, 2.8);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 4.2);
    rimLight.position.set(-3, 4, 4);
    scene.add(rimLight);

    const frontSparkle = new THREE.PointLight(0xffffff, 3.5, 8);
    frontSparkle.position.set(0, 1.2, 2.2);
    scene.add(frontSparkle);

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
              materials.forEach(material => {
                material.side = THREE.DoubleSide;
                if (material instanceof THREE.MeshStandardMaterial) {
                  material.envMapIntensity = Math.max(material.envMapIntensity || 1, 2.4);
                  material.roughness = Math.min(material.roughness, 0.42);
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
      mount.removeEventListener('wheel', handleWheel);
      controls.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      renderer.dispose();
      environmentMap.dispose();
      pmremGenerator.dispose();
      renderer.domElement.remove();
    };
  }, [src]);

  return (
    <div className="relative h-[400px] w-full overflow-hidden border border-[#381932]/10 bg-[#FAF7F2] rounded-md">
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
