import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useProjectStore } from '../../stores/useProjectStore';

export type ViewMode = 'acabado' | 'estructura' | 'wireframe';
export type CameraPreset = 'perspectiva' | 'planta' | 'frontal';

export default function DrywallScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const wallsGroupRef = useRef<THREE.Group | null>(null);

  const currentProject = useProjectStore((s) => s.currentProject);

  const [viewMode, setViewMode] = useState<ViewMode>('acabado');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [screenshotSuccess, setScreenshotSuccess] = useState<boolean>(false);

  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // slate-100
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4, 3.2, 5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go below floor
    controls.minDistance = 1;
    controls.maxDistance = 25;
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight.position.set(6, 9, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.4);
    fillLight.position.set(-5, 4, -4);
    scene.add(fillLight);

    // 6. Floor Grid & Ground Plane
    const gridHelper = new THREE.GridHelper(16, 32, 0x3b82f6, 0xcfd8dc);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.005;
    ground.receiveShadow = true;
    scene.add(ground);

    // 7. Group for Walls & Elements
    const wallsGroup = new THREE.Group();
    scene.add(wallsGroup);
    wallsGroupRef.current = wallsGroup;

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Texture generator for Drywall boards
  const drywallTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#f5f3ef'; // Bone white / drywall paper color
    ctx.fillRect(0, 0, 512, 512);

    // Subtle paper grain
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const alpha = Math.random() * 0.05;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Drywall sheet joint line
    ctx.strokeStyle = '#e2dfd7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  // Dimension billboard sprite
  const createTextSprite = (text: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Sprite();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(4, 4, 248, 72, 12);
    ctx.fill();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.roundRect(4, 4, 248, 72, 12);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.7, 0.22, 1);
    return sprite;
  };

  // Rebuild 3D geometry when project or view mode changes
  useEffect(() => {
    const wallsGroup = wallsGroupRef.current;
    if (!wallsGroup) return;

    // Clear previous objects
    while (wallsGroup.children.length > 0) {
      const obj = wallsGroup.children[0];
      wallsGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }

    if (!currentProject || (currentProject.walls.length === 0 && currentProject.ceilings.length === 0)) {
      buildDemoWall(wallsGroup, viewMode, showDimensions);
      return;
    }

    const tex = drywallTexture();

    const drywallMat = new THREE.MeshStandardMaterial({
      color: 0xf3efe6,
      roughness: 0.85,
      metalness: 0.05,
      map: tex,
    });

    const studMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.25,
    });

    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.2,
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
    });

    const wallThickness = 0.09;
    const studSpacing = 0.406;

    let currentX = 0;
    let currentZ = 0;

    currentProject.walls.forEach((wall, idx) => {
      const wallGroup = new THREE.Group();
      wallGroup.name = wall.id;

      const wWidth = wall.width || 3;
      const wHeight = wall.height || 2.4;

      const isCorner = idx % 2 === 1;
      const angle = isCorner ? Math.PI / 2 : 0;

      wallGroup.position.set(currentX, 0, currentZ);
      wallGroup.rotation.y = angle;

      // 1. Structure: Tracks
      const trackThickness = 0.03;
      const trackGeo = new THREE.BoxGeometry(wWidth, trackThickness, wallThickness);

      const bottomTrack = new THREE.Mesh(trackGeo, viewMode === 'wireframe' ? wireMat : trackMat);
      bottomTrack.position.set(wWidth / 2, trackThickness / 2, 0);
      bottomTrack.castShadow = true;
      bottomTrack.receiveShadow = true;
      wallGroup.add(bottomTrack);

      const topTrack = new THREE.Mesh(trackGeo, viewMode === 'wireframe' ? wireMat : trackMat);
      topTrack.position.set(wWidth / 2, wHeight - trackThickness / 2, 0);
      topTrack.castShadow = true;
      wallGroup.add(topTrack);

      // 2. Studs
      const studCount = Math.floor(wWidth / studSpacing) + 1;
      const studWidth = 0.038;
      const studDepth = wallThickness - 0.005;
      const studHeight = wHeight - trackThickness * 2;
      const studGeo = new THREE.BoxGeometry(studWidth, studHeight, studDepth);

      for (let i = 0; i < studCount; i++) {
        let xPos = i * studSpacing;
        if (i === studCount - 1 && xPos < wWidth - 0.02) {
          xPos = wWidth - studWidth / 2;
        } else if (i === 0) {
          xPos = studWidth / 2;
        }

        const studMesh = new THREE.Mesh(studGeo, viewMode === 'wireframe' ? wireMat : studMat);
        studMesh.position.set(xPos, wHeight / 2, 0);
        studMesh.castShadow = true;
        wallGroup.add(studMesh);
      }

      // 3. Openings
      if (wall.openings && wall.openings.length > 0) {
        wall.openings.forEach((op) => {
          const kingStud1 = new THREE.Mesh(studGeo, studMat);
          kingStud1.position.set(wWidth / 2 - op.width / 2 - 0.02, wHeight / 2, 0);
          wallGroup.add(kingStud1);

          const kingStud2 = new THREE.Mesh(studGeo, studMat);
          kingStud2.position.set(wWidth / 2 + op.width / 2 + 0.02, wHeight / 2, 0);
          wallGroup.add(kingStud2);

          const headerGeo = new THREE.BoxGeometry(op.width + 0.08, trackThickness, wallThickness);
          const header = new THREE.Mesh(headerGeo, trackMat);
          header.position.set(wWidth / 2, op.height + trackThickness / 2, 0);
          wallGroup.add(header);
        });
      }

      // 4. Drywall Boards
      if (viewMode === 'acabado') {
        const boardThickness = 0.0127;
        const zOffsetFront = wallThickness / 2 + boardThickness / 2;
        const zOffsetBack = -wallThickness / 2 - boardThickness / 2;

        const boardGeo = new THREE.BoxGeometry(wWidth, wHeight, boardThickness);

        const frontBoard = new THREE.Mesh(boardGeo, drywallMat);
        frontBoard.position.set(wWidth / 2, wHeight / 2, zOffsetFront);
        frontBoard.castShadow = true;
        frontBoard.receiveShadow = true;
        wallGroup.add(frontBoard);

        if (wall.hasDoubleSide) {
          const backBoard = new THREE.Mesh(boardGeo, drywallMat);
          backBoard.position.set(wWidth / 2, wHeight / 2, zOffsetBack);
          backBoard.castShadow = true;
          backBoard.receiveShadow = true;
          wallGroup.add(backBoard);
        }
      }

      // 5. Dimension Annotation
      if (showDimensions) {
        const dimSprite = createTextSprite(`${wWidth.toFixed(2)}m × ${wHeight.toFixed(2)}m`);
        dimSprite.position.set(wWidth / 2, wHeight + 0.28, 0);
        wallGroup.add(dimSprite);

        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, wHeight + 0.12, 0),
          new THREE.Vector3(wWidth, wHeight + 0.12, 0),
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6 });
        const line = new THREE.Line(lineGeo, lineMat);
        wallGroup.add(line);
      }

      wallsGroup.add(wallGroup);

      if (!isCorner) {
        currentX += wWidth;
      } else {
        currentZ += wWidth;
      }
    });

    // 6. Ceilings
    if (currentProject.ceilings && currentProject.ceilings.length > 0) {
      currentProject.ceilings.forEach((ceiling) => {
        const cGroup = new THREE.Group();
        const cWidth = ceiling.width || 3;
        const cLength = ceiling.length || 3;
        const cHeight = 2.4 - (ceiling.dropHeight || 0.1);

        cGroup.position.set(cWidth / 2, cHeight, cLength / 2);

        if (viewMode === 'acabado') {
          const cGeo = new THREE.BoxGeometry(cWidth, 0.0127, cLength);
          const cMesh = new THREE.Mesh(cGeo, drywallMat);
          cMesh.castShadow = true;
          cMesh.receiveShadow = true;
          cGroup.add(cMesh);
        }

        if (viewMode !== 'acabado') {
          const furringCount = Math.floor(cWidth / 0.61) + 1;
          for (let f = 0; f < furringCount; f++) {
            const fGeo = new THREE.BoxGeometry(0.04, 0.03, cLength);
            const fMesh = new THREE.Mesh(fGeo, studMat);
            fMesh.position.set(-cWidth / 2 + f * 0.61, 0.02, 0);
            cGroup.add(fMesh);
          }

          const rodGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.4);
          const rodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 });
          for (let rx = -cWidth / 2 + 0.5; rx < cWidth / 2; rx += 1.2) {
            for (let rz = -cLength / 2 + 0.5; rz < cLength / 2; rz += 1.2) {
              const rod = new THREE.Mesh(rodGeo, rodMat);
              rod.position.set(rx, 0.2, rz);
              cGroup.add(rod);
            }
          }
        }

        if (showDimensions) {
          const cLabel = createTextSprite(`Techo: ${cWidth.toFixed(2)}m × ${cLength.toFixed(2)}m`);
          cLabel.position.set(0, 0.25, 0);
          cGroup.add(cLabel);
        }

        wallsGroup.add(cGroup);
      });
    }

    if (controlsRef.current && wallsGroup.children.length > 0) {
      const box = new THREE.Box3().setFromObject(wallsGroup);
      const center = box.getCenter(new THREE.Vector3());
      controlsRef.current.target.copy(center);
    }
  }, [currentProject, viewMode, showDimensions, drywallTexture]);

  const buildDemoWall = (
    group: THREE.Group,
    mode: ViewMode,
    withDims: boolean
  ) => {
    const wWidth = 3.6;
    const wHeight = 2.4;
    const thickness = 0.09;

    const studMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });
    const drywallMat = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.85 });

    const trackGeo = new THREE.BoxGeometry(wWidth, 0.03, thickness);
    const bottomTrack = new THREE.Mesh(trackGeo, trackMat);
    bottomTrack.position.set(0, 0.015, 0);
    group.add(bottomTrack);

    const topTrack = new THREE.Mesh(trackGeo, trackMat);
    topTrack.position.set(0, wHeight - 0.015, 0);
    group.add(topTrack);

    const studSpacing = 0.406;
    const studCount = Math.floor(wWidth / studSpacing) + 1;
    const studGeo = new THREE.BoxGeometry(0.038, wHeight - 0.06, thickness - 0.005);

    for (let i = 0; i < studCount; i++) {
      const x = -wWidth / 2 + i * studSpacing;
      const stud = new THREE.Mesh(studGeo, studMat);
      stud.position.set(x, wHeight / 2, 0);
      stud.castShadow = true;
      group.add(stud);
    }

    if (mode === 'acabado') {
      const boardGeo = new THREE.BoxGeometry(wWidth, wHeight, 0.0127);
      const board = new THREE.Mesh(boardGeo, drywallMat);
      board.position.set(0, wHeight / 2, thickness / 2 + 0.006);
      board.castShadow = true;
      board.receiveShadow = true;
      group.add(board);
    }

    if (withDims) {
      const sprite = createTextSprite(`Ejemplo: 3.60m × 2.40m`);
      sprite.position.set(0, wHeight + 0.25, 0);
      group.add(sprite);
    }
  };

  const setCameraPreset = (preset: CameraPreset) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'perspectiva') {
      camera.position.set(4, 3.2, 5);
      controls.target.set(0, 1.2, 0);
    } else if (preset === 'planta') {
      camera.position.set(0, 7.5, 0.01);
      controls.target.set(0, 0, 0);
    } else if (preset === 'frontal') {
      camera.position.set(0, 1.4, 5.5);
      controls.target.set(0, 1.2, 0);
    }
    controls.update();
  };

  const takeScreenshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const dataUrl = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Drywall3D_${currentProject?.name || 'Diseno'}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    setScreenshotSuccess(true);
    setTimeout(() => setScreenshotSuccess(false), 2500);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex bg-slate-900/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-700 pointer-events-auto">
          <button
            onClick={() => setViewMode('acabado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'acabado'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🧱 Acabado
          </button>
          <button
            onClick={() => setViewMode('estructura')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'estructura'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔩 Estructura
          </button>
          <button
            onClick={() => setViewMode('wireframe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'wireframe'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📐 Alambre
          </button>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            title="Mostrar/Ocultar Medidas"
            className={`p-2 rounded-xl text-xs font-medium backdrop-blur-md transition-all border ${
              showDimensions
                ? 'bg-blue-600/90 text-white border-blue-500'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            📏
          </button>

          <button
            onClick={takeScreenshot}
            title="Guardar Foto 3D"
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-transform active:scale-95"
          >
            📸
          </button>
        </div>
      </div>

      {screenshotSuccess && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-bounce pointer-events-none">
          ✓ Imagen 3D guardada exitosamente
        </div>
      )}

      {/* Bottom Camera Presets */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 pointer-events-auto shadow-lg">
          <button
            onClick={() => setCameraPreset('perspectiva')}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            3D
          </button>
          <button
            onClick={() => setCameraPreset('planta')}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Plano 2D
          </button>
          <button
            onClick={() => setCameraPreset('frontal')}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Frontal
          </button>
        </div>

        <div className="hidden sm:block bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-400">
          Arrastra para rotar · Pellizca para zoom
        </div>
      </div>
    </div>
  );
}
