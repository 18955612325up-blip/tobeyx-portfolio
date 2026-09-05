import { Suspense, use, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, HueSaturation, N8AO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { sceneProfile } from './sceneProfile.js';
import { prepareSceneResources, retrySceneResources } from './sceneResources.js';
export { prepareSceneResources, retrySceneResources };
const preparedModels = new WeakMap();
const isVectorTriplet = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
function SceneEnvironment() {
  const { environment } = use(prepareSceneResources());
  return <Environment map={environment} environmentIntensity={sceneProfile.environment.hdrIntensity} />;
}
function ContextLoss({ onFailure }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  return null;
}
// Every imported GLB passes through this profile. It keeps browser-side shadow-map
// artifacts and transparent-water depth flicker from reappearing after a model swap.
function isWaterMaterial(material) {
  // Match only explicit water-surface labels. Substring matching misclassified
  // solid materials such as "0057D0.16" and "waterproof01.003" as water.
  const label = material.name.trim().toLowerCase();
  return /^(?:water|lake|river|h02|水面|水体|水景)$/.test(label);
}

function isContextBuildingMaterial(material) {
  return material.name.trim() === "8";
}

const geometryCleanupNames = new Set([
  "商业1001",
  "平面012",
  "平面021",
  "平面022",
  "平面095",
  "平面096",
  "平面171",
  "平面180",
  "平面209",
  "平面210",
  "平面211",
  "圆环011",
  "立方体020",
  "立方体023",
  "立方体055",
  "立方体062",
  "立方体078",
]);

function normalizedObjectName(name) {
  return name.replace(/[^\p{L}\p{N}_]/gu, "");
}

function sampledAttributeHash(attribute) {
  if (!attribute?.array?.length) return "0";
  const values = attribute.array;
  const step = Math.max(1, Math.floor(values.length / 64));
  let hash = 2166136261;
  for (let index = 0; index < values.length; index += step) {
    hash ^= Math.round(values[index] * 100000);
    hash = Math.imul(hash, 16777619);
  }
  return `${values.length}:${hash >>> 0}`;
}

function exactMeshSignature(mesh) {
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const fixed = (value) => Number(value).toFixed(6);
  return JSON.stringify({
    matrix: mesh.matrixWorld.elements.map(fixed),
    box: box ? [...box.min.toArray(), ...box.max.toArray()].map(fixed) : null,
    position: sampledAttributeHash(geometry.attributes.position),
    index: sampledAttributeHash(geometry.index),
    groups: geometry.groups.map((group) => [group.start, group.count, group.materialIndex]),
    materials: materials.map((material) => material?.name ?? ""),
  });
}

function hideExactDuplicateMeshes(model) {
  model.updateMatrixWorld(true);
  const seen = new Set();
  model.traverse((child) => {
    if (!child.isMesh || !child.visible) return;
    const signature = exactMeshSignature(child);
    if (seen.has(signature)) {
      child.visible = false;
      return;
    }
    seen.add(signature);
  });
}

function cleanedTriangleGeometry(source) {
  const position = source.attributes.position;
  if (!position) return source;
  const sourceIndex = source.index;
  const indexCount = sourceIndex ? sourceIndex.count : position.count;
  const groups = source.groups.length
    ? source.groups
    : [{ start: 0, count: indexCount, materialIndex: 0 }];
  const output = [];
  const outputGroups = [];
  let removed = 0;

  const vertexIndexAt = (offset) => sourceIndex ? sourceIndex.getX(offset) : offset;
  const vertexKey = (index) => [position.getX(index), position.getY(index), position.getZ(index)]
    .map((value) => Math.round(value * 100000))
    .join(",");

  groups.forEach((group) => {
    const groupStart = output.length;
    const faces = new Set();
    const end = Math.min(group.start + group.count, indexCount);
    for (let offset = group.start; offset + 2 < end; offset += 3) {
      const a = vertexIndexAt(offset);
      const b = vertexIndexAt(offset + 1);
      const c = vertexIndexAt(offset + 2);
      const abx = position.getX(b) - position.getX(a);
      const aby = position.getY(b) - position.getY(a);
      const abz = position.getZ(b) - position.getZ(a);
      const acx = position.getX(c) - position.getX(a);
      const acy = position.getY(c) - position.getY(a);
      const acz = position.getZ(c) - position.getZ(a);
      const crossX = aby * acz - abz * acy;
      const crossY = abz * acx - abx * acz;
      const crossZ = abx * acy - aby * acx;
      const areaSquared = crossX * crossX + crossY * crossY + crossZ * crossZ;
      const faceKey = [vertexKey(a), vertexKey(b), vertexKey(c)].sort().join("|");
      if (areaSquared < 1e-18 || faces.has(faceKey)) {
        removed += 1;
        continue;
      }
      faces.add(faceKey);
      output.push(a, b, c);
    }
    outputGroups.push({
      start: groupStart,
      count: output.length - groupStart,
      materialIndex: group.materialIndex ?? 0,
    });
  });

  if (!removed) return source;
  const geometry = source.clone();
  geometry.setIndex(output);
  geometry.clearGroups();
  outputGroups.forEach((group) => geometry.addGroup(group.start, group.count, group.materialIndex));
  geometry.setDrawRange(0, output.length);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function surfaceLayerOffset(materialName) {
  if (/^柏油路/.test(materialName)) return -3;
  if (/^三级路/.test(materialName)) return -2.5;
  if (/^二级路/.test(materialName)) return -2;
  if (/^铺装/.test(materialName)) return -1.5;
  return null;
}

function stabilizeImportedIsland(model) {
  hideExactDuplicateMeshes(model);
  model.traverse((child) => {
    if (!child.isMesh || !child.visible) return;

    if (geometryCleanupNames.has(normalizedObjectName(child.name))) {
      child.geometry = cleanedTriangleGeometry(child.geometry);
    }

    // These two export-only construction columns extend far above the site
    // model and would otherwise make the automatic framing unusably distant.
    const objectName = `${child.name} ${child.parent?.name ?? ""}`;
    child.geometry.computeBoundingBox();
    const geometryHeight = child.geometry.boundingBox?.getSize(new THREE.Vector3()).y ?? 0;
    if (
      objectName.includes("柱体.060") ||
      objectName.includes("柱体.062") ||
      geometryHeight * child.scale.y > 100
    ) {
      child.visible = false;
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    // Opaque imported materials must retain depth writes. This gives all solid
    // meshes a stable depth order instead of allowing coplanar faces to trade
    // places while the camera moves.
    if (materials.every((material) => !material.transparent)) {
      child.renderOrder = 0;
      materials.forEach((material) => {
        material.depthTest = true;
        material.depthWrite = true;
      });
    }

    materials.forEach((material) => {
      // The imported city massing uses a dedicated context material.
      // Fade only those context buildings so the museum and landscape remain
      // fully opaque. Depth writes and a single front-face pass keep hundreds
      // of overlapping background blocks stable while the camera rotates.
      if (isContextBuildingMaterial(material)) {
        material.transparent = true;
        material.opacity = sceneProfile.materials.contextBuildings.opacity;
        material.side = THREE.FrontSide;
        material.depthTest = true;
        material.depthWrite = true;
        material.forceSinglePass = true;
        material.roughness = 0.9;
        material.metalness = 0;
        child.renderOrder = 0;
        return;
      }

      // Blender exported every alpha-blended material as double-sided. In the
      // browser that makes the front and back faces compete while transparent
      // objects are sorted, especially around the museum's circular skylight.
      // Render transparent solids in one stable front-face pass and let the
      // nearest layer write depth. Explicit water surfaces are handled below.
      if (material.transparent && !isWaterMaterial(material)) {
        material.side = THREE.FrontSide;
        material.depthTest = true;
        material.depthWrite = true;
        material.forceSinglePass = true;
        child.renderOrder = 2;
      }

      // The two curtain-wall materials sit immediately above the museum roof.
      // A small deterministic depth bias prevents them from trading pixels
      // with the roof as the presentation camera rotates.
      if (/^玻璃(?:幕墙\d*)?$/.test(material.name)) {
        material.side = THREE.FrontSide;
        material.depthTest = true;
        material.depthWrite = true;
        material.polygonOffset = true;
        material.polygonOffsetFactor = -1;
        material.polygonOffsetUnits = -1;
      }

      // Blender's procedural grass and wall materials export without a PBR
      // base color, which leaves them white in a glTF viewer. Preserve their
      // intended material separation with browser-safe PBR colors.
      if (/^草绿(?:\.\d+)?$/.test(material.name)) {
        material.color.set(sceneProfile.materials.grass.color);
        material.roughness = 0.9;
        material.metalness = 0;
        // Keep a minimal depth bias against the site base without letting the
        // lawn render on top of low buildings, paths, or planting.
        material.polygonOffset = true;
        material.polygonOffsetFactor = sceneProfile.materials.grass.offset;
        material.polygonOffsetUnits = sceneProfile.materials.grass.offset;
        return;
      }
      if (material.name === "材质.005") {
        material.color.set(sceneProfile.materials.wall);
        material.roughness = 0.82;
        material.metalness = 0;
        return;
      }
      if (material.name === "地基") {
        material.color.set(sceneProfile.materials.ground);
        material.roughness = 0.88;
        material.metalness = 0;
        return;
      }
      const layerOffset = surfaceLayerOffset(material.name);
      if (layerOffset !== null) {
        material.polygonOffset = true;
        material.polygonOffsetFactor = layerOffset;
        material.polygonOffsetUnits = layerOffset;
      }
      if (!isWaterMaterial(material)) return;

      material.opacity = sceneProfile.materials.water.opacity;
      material.transparent = true;
      material.side = THREE.DoubleSide;
      material.depthWrite = false;
      material.polygonOffset = true;
      material.polygonOffsetFactor = sceneProfile.materials.water.offset;
      material.polygonOffsetUnits = sceneProfile.materials.water.offset;
      material.metalness = 0;
      material.roughness = 0.72;
      child.renderOrder = 1;
    });

    // Opaque site geometry participates in one baked shadow-map pass. The map
    // is frozen after the GLB mounts, so orbiting the camera does not trigger
    // realtime shadow work or reintroduce the previous moving-edge artifacts.
    const shadowEligible = materials.every((material) => (
      !isContextBuildingMaterial(material) &&
      !isWaterMaterial(material) &&
      !/^玻璃(?:幕墙\d*)?$/.test(material.name)
    ));
    child.castShadow = shadowEligible;
    child.receiveShadow = shadowEligible;
  });
}

function IslandModel({ onExitFocus, onPlaceNode, isFocused }) {
  const { scene } = use(prepareSceneResources());
  const model = useMemo(() => {
    if (!preparedModels.has(scene)) {
      const cloned = scene.clone(true);
      stabilizeImportedIsland(cloned);
      preparedModels.set(scene, cloned);
    }
    return preparedModels.get(scene);
  }, [scene]);

  return (
    <primitive
      object={model}
      dispose={null}
      onClick={(event) => {
        event.stopPropagation();
        if (onPlaceNode) {
          onPlaceNode(event.point);
          return;
        }
        if (isFocused) return;
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onExitFocus();
      }}
    />
  );
}

function DoubleClickExit({ active, onExit }) {
  const { gl } = useThree();

  useEffect(() => {
    if (!active) return undefined;
    const exitOnDoubleClick = (event) => {
      event.stopImmediatePropagation();
      onExit();
    };
    gl.domElement.addEventListener("dblclick", exitOnDoubleClick, true);
    return () => gl.domElement.removeEventListener("dblclick", exitOnDoubleClick, true);
  }, [active, gl, onExit]);

  return null;
}

function StaticShadowBake({ onReady }) {
  const { gl } = useThree();

  useEffect(() => {
    // Keep shadow updates alive for two rendered frames after the async GLB
    // mounts, then freeze the completed texture for the rest of the orbit.
    gl.shadowMap.autoUpdate = true;
    gl.shadowMap.needsUpdate = true;
    let freezeFrame;
    const bakeFrame = window.requestAnimationFrame(() => {
      gl.shadowMap.needsUpdate = true;
      freezeFrame = window.requestAnimationFrame(() => {
        gl.shadowMap.autoUpdate = false;
        onReady();
      });
    });

    return () => {
      window.cancelAnimationFrame(bakeFrame);
      if (freezeFrame) window.cancelAnimationFrame(freezeFrame);
      gl.shadowMap.autoUpdate = true;
      gl.shadowMap.needsUpdate = true;
    };
  }, [gl, onReady]);

  return null;
}

function ScenePin({ node, onFocus }) {
  const [hovered, setHovered] = useState(false);
  const pinMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.82, depthWrite: false }), [node.color]);

  useEffect(() => () => pinMaterial.dispose(), [pinMaterial]);

  return (
    <group position={node.position}>
      <mesh position={[0, 3.05, 0]} material={pinMaterial} renderOrder={3}>
        <sphereGeometry args={[0.44, 20, 16]} />
      </mesh>
      <mesh position={[0, 2.15, 0]} rotation={[Math.PI, 0, 0]} material={pinMaterial} renderOrder={3}>
        <coneGeometry args={[0.32, 1.25, 20]} />
      </mesh>
      <mesh
        position={[0, 2.4, 0]}
        onClick={(event) => { event.stopPropagation(); onFocus(node); }}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[hovered ? 1.12 : 0.96, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SceneCamera({ focusedNode, controlsRef, planMode, onTransitionChange }) {
  const { camera } = useThree();
  const overviewView = useRef(null);
  const returnView = useRef(null);
  const isReturningFromFocus = useRef(false);
  const transition = useRef(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (focusedNode) {
      // Preserve the exact framing the visitor had before opening a feature.
      // This is deliberately captured each time, rather than using a fixed overview.
      returnView.current = { position: camera.position.clone(), target: controls.target.clone() };
      isReturningFromFocus.current = false;
      const target = new THREE.Vector3(...focusedNode.position).add(new THREE.Vector3(0, 0.2, 0));
      const direction = camera.position.clone().sub(controls.target);
      direction.y *= 0.25;
      direction.normalize();
      const focusSpherical = new THREE.Spherical().setFromVector3(direction);
      focusSpherical.phi = THREE.MathUtils.clamp(focusSpherical.phi, 0.72, 1.46);
      direction.setFromSpherical(focusSpherical).normalize();
      transition.current = { position: target.clone().add(direction.multiplyScalar(5.5)), target };
      onTransitionChange(true);
      return;
    }

    if (returnView.current) {
      transition.current = {
        position: returnView.current.position.clone(),
        target: returnView.current.target.clone(),
      };
      isReturningFromFocus.current = true;
      onTransitionChange(true);
      return;
    }

    if (planMode) {
      overviewView.current ??= { position: camera.position.clone(), target: controls.target.clone() };
      transition.current = {
        position: new THREE.Vector3(0, 72, -28.99),
        target: new THREE.Vector3(...sceneProfile.camera.target),
      };
      onTransitionChange(true);
      return;
    }

    if (overviewView.current && !focusedNode) {
      transition.current = { position: overviewView.current.position.clone(), target: overviewView.current.target.clone() };
      overviewView.current = null;
      onTransitionChange(true);
      return;
    }

  }, [camera, controlsRef, focusedNode, onTransitionChange, planMode]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const destination = transition.current;
    if (!controls || !destination) return;

    const step = 1 - Math.exp(-delta * 3.5);
    camera.position.lerp(destination.position, step);
    controls.target.lerp(destination.target, step);
    camera.lookAt(controls.target);

    if (camera.position.distanceToSquared(destination.position) < 0.002 && controls.target.distanceToSquared(destination.target) < 0.002) {
      transition.current = null;
      if (isReturningFromFocus.current) {
        returnView.current = null;
        isReturningFromFocus.current = false;
      }
      onTransitionChange(false);
    }
  });

  return null;
}

function SceneControlsInitializer({ controlsRef, cameraView }) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.target.set(...cameraView.target);
    camera.lookAt(controls.target);
    controls.update();
  }, [camera, cameraView, controlsRef]);

  return null;
}

function SceneViewApi({ controlsRef, cameraApiRef }) {
  const { camera } = useThree();

  useEffect(() => {
    cameraApiRef.current = {
      capture() {
        const controls = controlsRef.current;
        if (!controls) return null;
        const roundVector = (vector) => vector.toArray().map((value) => Number(value.toFixed(4)));
        return { position: roundVector(camera.position), target: roundVector(controls.target) };
      },
      apply(view) {
        const controls = controlsRef.current;
        if (!controls || !isVectorTriplet(view?.position) || !isVectorTriplet(view?.target)) return;
        camera.position.set(...view.position);
        controls.target.set(...view.target);
        camera.lookAt(controls.target);
        controls.update();
      },
    };

    return () => { cameraApiRef.current = null; };
  }, [camera, cameraApiRef, controlsRef]);

  return null;
}

export default function IslandScene({ onSelect, nodes, editingNodeId, onChooseNode, onUpdateNode, planMode, onPlanModeChange, cameraView, cameraApiRef, viewCalibration, onReady, onFailure }) {
  const controlsRef = useRef(null);
  const [focusedNode, setFocusedNode] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const editingNode = nodes.find((node) => node.id === editingNodeId);
  const focusNode = (node) => {
    onPlanModeChange(false);
    setFocusedNode(node);
    onSelect(`${node.label} · 节点特写中，双击模型退出特写`);
  };
  const exitFocus = () => {
    if (!focusedNode) return;
    setFocusedNode(null);
    onSelect("拖拽旋转模型；点击悬浮图钉进入节点特写");
  };
  const placeNode = (point) => {
    if (!editingNode) return;
    const position = [point.x, point.y, point.z].map((value) => Number(value.toFixed(2)));
    onUpdateNode(editingNode.id, position);
    onSelect(`${editingNode.label} 已更新位置 · 可继续点击模型微调`);
  };

  return (
    <Canvas
      className="island-canvas"
      camera={{
        position: cameraView.position,
        fov: sceneProfile.camera.fov,
        near: sceneProfile.camera.near,
        far: sceneProfile.camera.far,
      }}
      gl={{ antialias: true, logarithmicDepthBuffer: true, powerPreference: "high-performance" }}
      shadows={{ type: THREE.PCFShadowMap }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = sceneProfile.environment.exposure;
      }}
      dpr={[1, 1.6]}
      onDoubleClick={editingNode ? undefined : exitFocus}
      onPointerMissed={() => onSelect(focusedNode ? "节点特写中，双击模型退出特写" : "拖拽旋转模型；点击悬浮图钉进入节点特写")}
    >
      <color attach="background" args={[sceneProfile.environment.background]} />
      <hemisphereLight args={sceneProfile.environment.hemisphere} />
      <directionalLight
        castShadow
        color={sceneProfile.environment.keyLight.color}
        intensity={sceneProfile.environment.keyLight.intensity}
        position={sceneProfile.environment.keyLight.position}
        shadow-mapSize-width={sceneProfile.environment.keyLight.shadow.mapSize}
        shadow-mapSize-height={sceneProfile.environment.keyLight.shadow.mapSize}
        shadow-camera-left={-sceneProfile.environment.keyLight.shadow.bounds}
        shadow-camera-right={sceneProfile.environment.keyLight.shadow.bounds}
        shadow-camera-top={sceneProfile.environment.keyLight.shadow.bounds}
        shadow-camera-bottom={-sceneProfile.environment.keyLight.shadow.bounds}
        shadow-camera-near={sceneProfile.environment.keyLight.shadow.near}
        shadow-camera-far={sceneProfile.environment.keyLight.shadow.far}
        shadow-bias={sceneProfile.environment.keyLight.shadow.bias}
        shadow-normalBias={sceneProfile.environment.keyLight.shadow.normalBias}
        shadow-radius={sceneProfile.environment.keyLight.shadow.radius}
      />
      <Suspense fallback={null}>
          <SceneEnvironment />
          <group rotation={[0, -0.34, 0]}>
            <Center>
              <IslandModel onExitFocus={exitFocus} onPlaceNode={editingNode ? placeNode : null} isFocused={Boolean(focusedNode)} />
            </Center>
          </group>
          <StaticShadowBake onReady={onReady} />
          {!focusedNode && nodes.map((node) => <ScenePin key={node.id} node={node} onFocus={editingNode ? onChooseNode : focusNode} />)}

      </Suspense>
      <ContextLoss onFailure={onFailure} />
      <DoubleClickExit active={Boolean(focusedNode)} onExit={exitFocus} />
      <SceneCamera focusedNode={focusedNode} controlsRef={controlsRef} planMode={planMode} onTransitionChange={setTransitioning} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableRotate={!planMode && !transitioning}
        enableZoom={!transitioning}
        enableDamping={!planMode && !transitioning}
        dampingFactor={0.07}
        minPolarAngle={0.72}
        maxPolarAngle={1.46}
        autoRotate={!planMode && !viewCalibration && !transitioning}
        autoRotateSpeed={focusedNode ? sceneProfile.camera.rotationSpeed.focus : sceneProfile.camera.rotationSpeed.overview}
      />
      <SceneControlsInitializer controlsRef={controlsRef} cameraView={cameraView} />
      <SceneViewApi controlsRef={controlsRef} cameraApiRef={cameraApiRef} />
      <EffectComposer multisampling={0}>
        <N8AO
          halfRes
          depthAwareUpsampling
          quality={sceneProfile.postprocessing.ao.quality}
          aoRadius={sceneProfile.postprocessing.ao.radius}
          aoSamples={sceneProfile.postprocessing.ao.aoSamples}
          denoiseSamples={sceneProfile.postprocessing.ao.denoiseSamples}
          denoiseRadius={sceneProfile.postprocessing.ao.denoiseRadius}
          distanceFalloff={sceneProfile.postprocessing.ao.distanceFalloff}
          intensity={sceneProfile.postprocessing.ao.intensity}
          color={sceneProfile.postprocessing.ao.color}
        />
        <HueSaturation saturation={sceneProfile.postprocessing.saturation} />
      </EffectComposer>
    </Canvas>
  );
}
