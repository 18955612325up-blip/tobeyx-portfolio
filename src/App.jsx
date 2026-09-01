import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { EffectComposer, HueSaturation, N8AO } from "@react-three/postprocessing";
import * as THREE from "three";
import { ACTIVE_MODEL_URL, sceneProfile } from "./sceneProfile.js";

const layers = {
  overview: { label: "总体鸟瞰", image: "/images/shangdu/overview.webp", alt: "郑州商城国家考古遗址公园整体鸟瞰", note: "以考古式阅读重构遗址公园，将保护、生态与公共活动编织为可步行、可停留、可感知的城市地景。" },
  sequence: { label: "空间序列", image: "/images/shangdu/birdseye.webp", alt: "郑州商城国家考古遗址公园空间序列与城市边界", note: "从城市秩序渐入遗址绿意，以净身、正序、回望组织时间感与空间层次。" },
  activation: { label: "节点体验", image: "/images/shangdu/playground.webp", alt: "郑州商城遗址公园儿童友好节点", note: "以栈道、农事体验、遗址迷宫与儿童友好活动，让历史转化为日常公共体验。" },
};

const thumbnails = [
  ["/images/shangdu/entry.webp", "入境·净身｜遗址公园入口"],
  ["/images/shangdu/farmland.webp", "田景观体验｜耕作记忆"],
  ["/images/shangdu/skywalk.webp", "登高·回望｜空中栈道"],
];

const planLegendSets = {
  redesign: {
    label: "设计改造",
    note: "公共服务标识与 01—10 号设计节点",
    textGroups: [
      { label: "公共服务", items: ["游客中心", "出入口", "卫生间", "餐饮", "停车场", "导游服务", "无障碍坡道"] },
      { label: "设计节点", items: ["01 洗礼水幕墙", "02 空中栈道", "03 田景观体验", "04 商图腾迷宫", "05 口袋公园", "06 露天舞台", "07 商代古城垣遗址", "08 儿童友好区", "09 中转广场", "10 生态连廊"] },
    ],
  },
  existing: {
    label: "原场地",
    note: "原导览系统中的服务设施与 01—18 号场所索引",
    textGroups: [
      { label: "公共服务", items: ["01 游客中心", "02 出入口", "03 卫生间", "04 家庭卫生间", "05 餐饮", "06 问讯", "07 医务点", "08 电话", "09 手机充电", "10 公共汽车", "11 地铁", "12 允许吸烟", "13 行李寄存", "14 失物招领", "15 投诉接待", "16 母婴室", "17 导游服务", "18 停车场", "19 自动售货机", "20 安全保卫", "21 无障碍坡道", "22 票务服务", "23 邮政", "24 超市"] },
    ],
  },
};

const planViews = {
  redesign: {
    title: "浮层叠影",
    label: "设计改造",
    sheet: "02 / 03",
    src: "/images/shangdu/plan-redesign.webp",
    width: 2600,
    height: 1959,
    alt: "浮层叠影设计改造总平面，展示空中栈道、田景体验、迷宫、口袋公园、露天舞台与生态连廊",
    caption: "“浮层叠影”总平面与节点系统",
    note: "以遗址保护为底，将游线、节点与公共服务编织为连续的公共体验。",
    switchLabel: "原场地",
  },
  existing: {
    title: "原场地",
    label: "改造前",
    sheet: "01 / 03",
    src: "/images/shangdu/plan-existing.webp",
    width: 1410,
    height: 960,
    alt: "郑州商城国家考古遗址公园原场地总平面，展示场地边界、道路、主要设施和编号节点",
    caption: "现状游览体系与主要设施分布",
    note: "以原有游览体系、服务设施与遗址节点为基底，呈现改造前的空间组织。",
    switchLabel: "设计改造",
  },
  satellite: {
    title: "卫星图",
    label: "卫星图",
    sheet: "03 / 03",
    src: "/images/shangdu/satellite.png",
    width: 1524,
    height: 1164,
    alt: "郑州商城国家考古遗址公园卫星影像，展示遗址公园、周边道路与城市肌理",
    caption: "郑州商城国家考古遗址公园卫星影像",
    hideSidePanel: true,
  },
};

const renderOverview = {
  id: "overview",
  kicker: "SYSTEM / 10 VIEWS",
  title: "从入口阈值到空中漫游的连续空间叙事",
  description: "效果图共同呈现由入口、水景、田景、儿童活动与口袋空间组成的地面体验，并通过空中栈道串联观察、停留与回望，让遗址公园形成上下交织、昼夜连续的公共游览系统。",
  tags: ["入口礼序", "立体游线", "多龄活动"],
};

const renderGallery = [
  { id: "entrance", index: "01", kicker: "VIEW 01 / ENTRANCE", title: "入口界面与城市到达", description: "以开敞前场、框景构架和清晰的步行入口建立到达秩序，将城市街道自然引入遗址公园内部。", tags: ["入口界面", "框景", "到达秩序"], src: "/images/shangdu/render-gallery/entrance-perspective.jpg", alt: "郑州商城遗址公园入口透视效果图" },
  { id: "water-wall", index: "02", kicker: "VIEW 02 / WATER WALL", title: "水幕墙形成进入遗址的感知阈值", description: "不同尺度的水幕构件沿入口展开，以声音、反射与连续界面强化进入仪式，同时为开放场地提供清凉的停留体验。", tags: ["洗礼水幕", "感知入口", "停留"], src: "/images/shangdu/render-gallery/entrance-water-wall.jpg", alt: "郑州商城遗址公园入口水幕墙效果图" },
  { id: "night", index: "03", kicker: "VIEW 03 / NIGHT WALK", title: "低照度环境中的空中慢行", description: "夜间照明集中于步道边界、节点与下层停留空间，在维持安全识别的同时保留遗址公园安静克制的夜景氛围。", tags: ["夜间慢行", "安全照明", "静谧氛围"], src: "/images/shangdu/render-gallery/skywalk-night.jpg", alt: "空中栈道夜间步行与下层休憩空间效果图" },
  { id: "children", index: "04", kicker: "VIEW 04 / PLAY", title: "嵌入游线的儿童友好活动场", description: "环形攀爬、钻爬与弹跳设施顺应地形布置，并与空中栈道保持视线联系，让儿童活动成为全龄游览的一部分。", tags: ["儿童友好", "地形游戏", "全龄共享"], src: "/images/shangdu/render-gallery/children-play.jpg", alt: "郑州商城遗址公园儿童友好活动场效果图" },
  { id: "field", index: "05", kicker: "VIEW 05 / FIELD GARDEN", title: "田景体验回应场地的耕作记忆", description: "规则与自由形态的种植地块交织在慢行路径之间，通过季相变化、参与式耕作与高处观看重现城市中的田园记忆。", tags: ["田景体验", "季相", "耕作记忆"], src: "/images/shangdu/render-gallery/field-garden.jpg", alt: "郑州商城遗址公园田景花园效果图" },
  { id: "pocket-plaza", index: "06", kicker: "VIEW 06 / POCKET PLAZA", title: "栈道下方的口袋停留空间", description: "框景墙、林下座椅与小尺度铺装共同界定安静的停留节点，承接主游线之外的短暂停留与日常交流。", tags: ["林下空间", "框景墙", "短暂停留"], src: "/images/shangdu/render-gallery/pocket-plaza.jpg", alt: "空中栈道下口袋广场效果图" },
  { id: "pocket-park", index: "07", kicker: "VIEW 07 / URBAN EDGE", title: "连续口袋公园柔化城市边界", description: "沿街绿带、连续树阵与分散的停留设施形成可渗透的公园界面，使遗址空间与周边社区保持日常联系。", tags: ["城市界面", "连续绿带", "社区联系"], src: "/images/shangdu/render-gallery/pocket-park-panorama.jpg", alt: "郑州商城遗址公园沿街口袋公园全景效果图" },
  { id: "overlook", index: "08", kicker: "VIEW 08 / OVERLOOK", title: "登高回望建立多层次场地阅读", description: "抬升的栈道越过林冠与活动空间，将遗址、公园与城市背景纳入连续视野，提供理解整体空间关系的观看高度。", tags: ["登高回望", "场地阅读", "城市背景"], src: "/images/shangdu/render-gallery/skywalk-overlook.jpg", alt: "从空中栈道回望遗址公园与城市界面的效果图" },
  { id: "node-one", index: "09", kicker: "VIEW 09 / SKY NODE", title: "林冠之间的环形空中节点", description: "环形平台绕树展开，与主栈道形成停留支路；通透栏板维持上下层的视线关系，让植被成为空间中心。", tags: ["环形平台", "绕树空间", "上下联系"], src: "/images/shangdu/render-gallery/skywalk-node-one.jpg", alt: "林冠之间的环形空中栈道节点效果图" },
  { id: "node-two", index: "10", kicker: "VIEW 10 / SKY TERRACE", title: "面向遗址核心的空中观景平台", description: "观景平台借助转折与加宽形成停留界面，从高处观察遗址核心、林下路径与周边公共建筑。", tags: ["空中平台", "遗址眺望", "路径转折"], src: "/images/shangdu/render-gallery/skywalk-node-two.jpg", alt: "面向遗址核心的空中观景平台效果图" },
];

const sceneNodes = [
  { id: "north-terrace", label: "北侧景观界面", position: [-58.0, 0.1, -64.9], color: "#a9797a" },
  { id: "north-east-path", label: "东北游径", position: [-40.4, 0.1, -71.3], color: "#77979c" },
  { id: "east-grove", label: "东侧林下空间", position: [-41.6, 0.1, -59.5], color: "#90936e" },
  { id: "field-garden", label: "田景花园", position: [-48.6, -0.5, -52.1], color: "#8d7c9c" },
  { id: "heritage-maze", label: "遗址迷宫", position: [-53.7, -0.5, -47.9], color: "#a78670" },
  { id: "water-court", label: "水景庭院", position: [-54.7, 0.1, -43.8], color: "#739589" },
  { id: "children-garden", label: "儿童活动花园", position: [-60.1, 0.1, -38.6], color: "#b28972" },
  { id: "round-plaza", label: "圆形活动场", position: [-45.4, 0.1, -48.3], color: "#8c8c7a" },
];

const NODE_POSITION_STORAGE_KEY = "tobey-xiao-scene-node-positions";
const NODE_LABEL_STORAGE_KEY = "tobey-xiao-scene-node-labels";
const SCENE_VIEW_STORAGE_KEY = "tobey-xiao-default-scene-view";
const presetSceneView = {
  position: [...sceneProfile.camera.position],
  target: [...sceneProfile.camera.target],
};

const isVectorTriplet = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);

function loadSceneView() {
  if (typeof window === "undefined") return presetSceneView;
  try {
    const savedView = JSON.parse(window.localStorage.getItem(SCENE_VIEW_STORAGE_KEY));
    return isVectorTriplet(savedView?.position) && isVectorTriplet(savedView?.target) ? savedView : presetSceneView;
  } catch {
    return presetSceneView;
  }
}

function persistSceneView(view) {
  window.localStorage.setItem(SCENE_VIEW_STORAGE_KEY, JSON.stringify(view));
}

function loadSceneNodes() {
  if (typeof window === "undefined") return sceneNodes;

  try {
    const savedPositions = JSON.parse(window.localStorage.getItem(NODE_POSITION_STORAGE_KEY) ?? "{}");
    const savedLabels = JSON.parse(window.localStorage.getItem(NODE_LABEL_STORAGE_KEY) ?? "{}");
    return sceneNodes.map((node) => {
      const position = savedPositions[node.id];
      const savedLabel = typeof savedLabels[node.id] === "string" ? savedLabels[node.id].trim() : "";
      return {
        ...node,
        ...(Array.isArray(position) && position.length === 3 && position.every(Number.isFinite) ? { position } : {}),
        ...(savedLabel ? { label: savedLabel } : {}),
      };
    });
  } catch {
    return sceneNodes;
  }
}

function persistSceneNodes(nodes) {
  const positions = Object.fromEntries(nodes.map((node) => [node.id, node.position]));
  window.localStorage.setItem(NODE_POSITION_STORAGE_KEY, JSON.stringify(positions));
}

function persistNodeLabels(nodes) {
  const labels = Object.fromEntries(nodes.map((node) => [node.id, node.label]));
  window.localStorage.setItem(NODE_LABEL_STORAGE_KEY, JSON.stringify(labels));
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
  const { scene } = useGLTF(ACTIVE_MODEL_URL);
  const model = useMemo(() => {
    const cloned = scene.clone(true);
    stabilizeImportedIsland(cloned);
    return cloned;
  }, [scene]);

  return (
    <primitive
      object={model}
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

function SceneLoadingIndicator() {
  const { progress, loaded, total } = useProgress();
  const percent = total ? Math.round(progress) : 0;

  return (
    <Html center>
      <div className="scene-loader" role="status" aria-live="polite">
        <span className="scene-loader__spinner" aria-hidden="true" />
        <strong>正在加载 3D 模型</strong>
        <span>{percent}% · {loaded}/{total || "?"} 个资源</span>
        <small>首次打开需要下载约 24 MB，请稍候</small>
      </div>
    </Html>
  );
}

class SceneLoadErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="scene-loader scene-loader--error" role="alert">
            <strong>3D 模型加载失败</strong>
            <span>请刷新页面后重试</span>
          </div>
        </Html>
      );
    }

    return this.props.children;
  }
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

function StaticShadowBake() {
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
      });
    });

    return () => {
      window.cancelAnimationFrame(bakeFrame);
      if (freezeFrame) window.cancelAnimationFrame(freezeFrame);
      gl.shadowMap.autoUpdate = true;
      gl.shadowMap.needsUpdate = true;
    };
  }, [gl]);

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

function IslandScene({ onSelect, nodes, editingNodeId, onChooseNode, onUpdateNode, planMode, onPlanModeChange, cameraView, cameraApiRef, viewCalibration }) {
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
      <Suspense fallback={<SceneLoadingIndicator />}>
        <SceneLoadErrorBoundary>
          <Environment files={sceneProfile.environment.hdr} environmentIntensity={sceneProfile.environment.hdrIntensity} />
          <group rotation={[0, -0.34, 0]}>
            <Center>
              <IslandModel onExitFocus={exitFocus} onPlaceNode={editingNode ? placeNode : null} isFocused={Boolean(focusedNode)} />
            </Center>
          </group>
          <StaticShadowBake />
          {!focusedNode && nodes.map((node) => <ScenePin key={node.id} node={node} onFocus={editingNode ? onChooseNode : focusNode} />)}
        </SceneLoadErrorBoundary>
      </Suspense>
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

useGLTF.preload(ACTIVE_MODEL_URL);

function CinematicSceneHint({ message }) {
  const [displayedMessage, setDisplayedMessage] = useState(message);
  const [phase, setPhase] = useState("entering");
  const displayedMessageRef = useRef(message);

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setPhase("shown"), 40);
    return () => window.clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (message === displayedMessageRef.current) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayedMessageRef.current = message;
      setDisplayedMessage(message);
      setPhase("shown");
      return undefined;
    }

    let enterTimer;
    setPhase("exiting");
    const swapTimer = window.setTimeout(() => {
      displayedMessageRef.current = message;
      setDisplayedMessage(message);
      setPhase("entering");
      enterTimer = window.setTimeout(() => setPhase("shown"), 40);
    }, 480);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(enterTimer);
    };
  }, [message]);

  return <p className={`field-instruction cinematic-hint is-${phase}`} aria-live="polite" aria-atomic="true">{displayedMessage}</p>;
}

export function App() {
  const [planOrder, setPlanOrder] = useState(["redesign", "existing", "satellite"]);
  const [isPlanCycling, setIsPlanCycling] = useState(false);
  const [activeRenderId, setActiveRenderId] = useState(null);
  const [exploring, setExploring] = useState(false);
  const [isClosingExplorer, setIsClosingExplorer] = useState(false);
  const [sceneStatus, setSceneStatus] = useState("拖拽旋转模型；点击悬浮图钉进入节点特写");
  const [nodes, setNodes] = useState(loadSceneNodes);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingNodeNames, setEditingNodeNames] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [sceneView, setSceneView] = useState(loadSceneView);
  const [viewCalibration, setViewCalibration] = useState(false);
  const dialogRef = useRef(null);
  const cameraApiRef = useRef(null);
  const explorerCloseTimer = useRef(null);
  const planCycleTimer = useRef(null);
  const active = layers.overview;
  const activePlan = planViews[planOrder[0]];
  const nextPlan = planViews[planOrder[1]];
  const activeLegend = planLegendSets[planOrder[0]];
  const activeRender = renderGallery.find((render) => render.id === activeRenderId) ?? renderOverview;

  const cyclePlan = () => {
    if (isPlanCycling || planOrder.length < 2) return;
    setIsPlanCycling(true);
    window.clearTimeout(planCycleTimer.current);
    planCycleTimer.current = window.setTimeout(() => {
      setPlanOrder((order) => [...order.slice(1), order[0]]);
      setIsPlanCycling(false);
    }, 360);
  };

  useEffect(() => {
    if (exploring) dialogRef.current?.focus();
    return () => window.clearTimeout(explorerCloseTimer.current);
  }, [exploring]);
  useEffect(() => () => window.clearTimeout(planCycleTimer.current), []);
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === "Escape") closeExplorer(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [exploring, isClosingExplorer]);
  useEffect(() => {
    const modules = [...document.querySelectorAll("[data-focus-module]")];
    let frameId = 0;

    const updateFocus = () => {
      const viewportCenter = window.innerHeight * 0.52;
      const range = Math.max(window.innerHeight * 0.68, 1);

      modules.forEach((module) => {
        const bounds = module.getBoundingClientRect();
        const moduleCenter = bounds.top + Math.min(bounds.height, window.innerHeight) * 0.5;
        const level = Math.max(0, Math.min(1, 1 - Math.abs(moduleCenter - viewportCenter) / range));
        module.style.setProperty("--focus-level", level.toFixed(3));
        module.classList.toggle("is-in-focus", level > 0.66);
      });

      frameId = 0;
    };
    const requestFocusUpdate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateFocus);
    };

    updateFocus();
    window.addEventListener("scroll", requestFocusUpdate, { passive: true });
    window.addEventListener("resize", requestFocusUpdate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestFocusUpdate);
      window.removeEventListener("resize", requestFocusUpdate);
    };
  }, []);
  const openExplorer = () => {
    window.clearTimeout(explorerCloseTimer.current);
    setIsClosingExplorer(false);
    setExploring(true);
  };
  const closeExplorer = () => {
    if (!exploring || isClosingExplorer) return;
    setIsClosingExplorer(true);
    explorerCloseTimer.current = window.setTimeout(() => {
      setExploring(false);
      setViewCalibration(false);
      setEditingNodeId(null);
      setEditingNodeNames(false);
      setPlanMode(false);
      setIsClosingExplorer(false);
    }, 460);
  };
  const updateNodePosition = (nodeId, position) => {
    setNodes((currentNodes) => {
      const nextNodes = currentNodes.map((node) => node.id === nodeId ? { ...node, position } : node);
      persistSceneNodes(nextNodes);
      return nextNodes;
    });
  };
  const resetNodePositions = () => {
    setNodes((currentNodes) => currentNodes.map((node) => {
      const defaultNode = sceneNodes.find((candidate) => candidate.id === node.id);
      return defaultNode ? { ...node, position: [...defaultNode.position] } : node;
    }));
    window.localStorage.removeItem(NODE_POSITION_STORAGE_KEY);
    setSceneStatus("已恢复初始节点位置");
  };
  const updateNodeLabel = (nodeId, label) => {
    setNodes((currentNodes) => {
      const nextNodes = currentNodes.map((node) => node.id === nodeId ? { ...node, label } : node);
      persistNodeLabels(nextNodes);
      return nextNodes;
    });
  };
  const normalizeNodeLabel = (nodeId) => {
    setNodes((currentNodes) => {
      const defaultLabel = sceneNodes.find((node) => node.id === nodeId)?.label ?? "未命名锚点";
      const nextNodes = currentNodes.map((node) => node.id === nodeId ? { ...node, label: node.label.trim() || defaultLabel } : node);
      persistNodeLabels(nextNodes);
      return nextNodes;
    });
  };
  const resetNodeLabels = () => {
    setNodes((currentNodes) => {
      const nextNodes = currentNodes.map((node) => {
        const defaultNode = sceneNodes.find((candidate) => candidate.id === node.id);
        return defaultNode ? { ...node, label: defaultNode.label } : node;
      });
      return nextNodes;
    });
    window.localStorage.removeItem(NODE_LABEL_STORAGE_KEY);
    setSceneStatus("已恢复默认锚点名称");
  };
  const startCalibration = () => {
    setEditingNodeId(nodes[0].id);
    setEditingNodeNames(false);
    setPlanMode(true);
    setSceneStatus("锚点校准：选择锚点后，点击模型确定位置");
  };
  const startViewCalibration = () => {
    setPlanMode(false);
    setViewCalibration(true);
    setSceneStatus("调整默认视角：拖拽旋转、滚轮缩放，满意后点击保存");
  };
  const saveDefaultView = () => {
    const currentView = cameraApiRef.current?.capture();
    if (!currentView) {
      setSceneStatus("场景仍在加载，请稍后再保存视角");
      return;
    }
    setSceneView(currentView);
    persistSceneView(currentView);
    setViewCalibration(false);
    setSceneStatus("当前角度已保存为默认视角，下次打开仍会使用此视角");
  };
  const restorePresetView = () => {
    const restoredView = { position: [...presetSceneView.position], target: [...presetSceneView.target] };
    window.localStorage.removeItem(SCENE_VIEW_STORAGE_KEY);
    setSceneView(restoredView);
    cameraApiRef.current?.apply(restoredView);
    setViewCalibration(false);
    setSceneStatus("已恢复网站预设视角");
  };
  const cancelViewCalibration = () => {
    cameraApiRef.current?.apply(sceneView);
    setViewCalibration(false);
    setSceneStatus("已取消视角调整");
  };
  const finishCalibration = () => {
    setEditingNodeId(null);
    setEditingNodeNames(false);
    setPlanMode(false);
    setSceneStatus("锚点位置已保存；拖拽旋转模型，点击悬浮图钉进入节点特写");
  };
  const chooseNode = (node) => {
    setEditingNodeId(node.id);
    setSceneStatus(`正在校准 ${node.label} · 点击模型确定位置`);
  };
  const togglePlanMode = () => {
    setPlanMode((currentMode) => {
      const nextMode = !currentMode;
      setSceneStatus(nextMode ? "平面视图：可滚动缩放并校准节点" : "拖拽旋转模型；点击悬浮图钉进入节点特写");
      return nextMode;
    });
  };

  return (
    <main className="site-shell">
      <section className="content" id="top">
        <header className="topbar">
          <a className="wordmark" href="#top">TOBEY XIAO</a>
          <div className="topbar-meta">
            <p><span className="topbar-person">肖林</span><span className="topbar-role">LANDSCAPE ARCHITECTURE STUDENT</span></p>
            <p className="topbar-project-type">课程作业</p>
          </div>
        </header>
        <div className="project-header" id="projects">
          <div><h1>浮层叠影</h1><p className="place">郑州商城国家考古遗址公园 · 河南，郑州 · 2025</p></div>
        </div>

        <section className="atlas focus-module" id="atlas" data-focus-module aria-label="郑州商城遗址公园总体鸟瞰">
          <header className="module-title"><h2>总体鸟瞰</h2><p>BIRD'S-EYE OVERVIEW</p></header>
          <div className="main-artwork"><img src={active.image} alt={active.alt} /></div>
          <aside className="atlas-sidebar" aria-label="鸟瞰图设计说明">
            <div className="artwork-caption"><span>浮层叠影 · 郑州商城</span><span>总体鸟瞰 / 2025</span></div>
            <h2 className="atlas-title">以考古式阅读重构遗址公园</h2>
            <p className="atlas-copy">{active.note}</p>
            <div className="atlas-keywords" aria-label="设计关键词"><span>遗址保护</span><span>生态连通</span><span>公共体验</span></div>
          </aside>
        </section>

        <section className="plan-study focus-module" id="process" data-focus-module aria-labelledby="plan-study-title">
          <header className="plan-study-header">
            <h2 id="plan-study-title">总体平面</h2><p>PLAN STUDY / SITE TRANSFORMATION</p>
          </header>

          <div className="plan-display">
            <figure className="plan-card plan-card--stacked">
              <div className={`plan-stack${isPlanCycling ? " is-cycling" : ""}`}>
                <div className="plan-layer plan-layer--active" key={`active-${planOrder[0]}`}>
                  <img src={activePlan.src} width={activePlan.width} height={activePlan.height} alt={activePlan.alt} />
                </div>
                {nextPlan && <button className="plan-layer plan-layer--next" key={`next-${planOrder[1]}`} type="button" onClick={cyclePlan} disabled={isPlanCycling} aria-label={`露出的${nextPlan.label}。点击切换为主图`}>
                  <img src={nextPlan.src} width={nextPlan.width} height={nextPlan.height} alt={nextPlan.alt} />
                  <span><small>下一张图纸</small><strong>点击切换为主图 →</strong></span>
                </button>}
              </div>
              <figcaption><span className="plan-number">{activePlan.sheet}</span><div><strong>{activePlan.label}</strong><p>{activePlan.caption}</p></div><a className="open-image-label" href={activePlan.src} target="_blank" rel="noreferrer">查看大图 ↗</a></figcaption>
            </figure>

            {!activePlan.hideSidePanel && <aside className="plan-side-panel" aria-label="图纸信息与图例">
              <div className="plan-meta">
                <p className="plan-meta-title">{activePlan.title}</p>
                <p className="plan-meta-place">郑州，河南</p>
                <dl><div><dt>图纸</dt><dd>{activePlan.sheet}</dd></div><div><dt>状态</dt><dd>{activePlan.label}</dd></div><div><dt>年份</dt><dd>2025</dd></div></dl>
              </div>

              <details className="plan-legends">
                <summary>
                  <span className="legend-summary-title"><small>附属信息 / Legend</small><strong>图例与节点</strong></span>
                  <span className="legend-summary-toggle"><span className="legend-summary-closed">展开 ↘</span><span className="legend-summary-open">收起 ↗</span></span>
                </summary>
                <div className="plan-legend-panel">
                  <div className="legend-header">
                    <p className="section-kicker">按需查看服务系统与编号节点</p>
                    <div className="legend-copy"><p>{activeLegend.note}</p></div>
                  </div>

                  <div className="legend-text-groups" aria-label={`${activeLegend.label}文字索引`}>
                    {activeLegend.textGroups.map((group) => <div className="legend-text-group" key={group.label}>
                      <p>{group.label}</p>
                      <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>)}
                  </div>
                </div>
              </details>
            </aside>}
          </div>
        </section>

        <section className="site-observations" aria-labelledby="site-observations-title">
          <header className="site-observations-header">
            <h2 id="site-observations-title">现状问题</h2><p>SITE OBSERVATIONS</p>
          </header>
          <div className="site-observations-display">
            <div className="observation-grid">
              <div className="observation-column observation-column--square">
                <figure className="observation-card observation-card--square">
                  <img src="/images/shangdu/site-entry.jpg" alt="郑州商都遗址公园入口广场与台阶现状" />
                  <figcaption><span>01</span><p>入口广场尺度大，导向弱</p></figcaption>
                </figure>
                <figure className="observation-card observation-card--square">
                  <img src="/images/shangdu/site-symbols.jpg" alt="郑州商都遗址公园文化符号展示现状" />
                  <figcaption><span>02</span><p>文化展示偏符号堆砌</p></figcaption>
                </figure>
              </div>
              <div className="observation-column observation-column--wide">
                <figure className="observation-card observation-card--wide">
                  <img src="/images/shangdu/site-wall.jpg" alt="郑州商都古城墙遗址高差与步道现状" />
                  <figcaption><span>03</span><p>古城墙已利用，体验仍不深入</p></figcaption>
                </figure>
                <figure className="observation-card observation-card--wide">
                  <img src="/images/shangdu/site-activities.jpg" alt="郑州商都遗址公园广场舞等集体活动现状" />
                  <figcaption><span>04</span><p>广场舞集中，占用过强</p></figcaption>
                </figure>
              </div>
            </div>
            <aside className="observation-sidebar" aria-label="现状问题说明">
              <p className="observation-kicker">现场观察 / 04 FRAMES</p>
              <h3>遗址、游线与日常活动尚未形成连续体验</h3>
              <p>入口、文化展示、古城墙与日常活动各自存在，缺少将遗址感知、游览路径与公共停留组织为连续体验的空间关系。</p>
              <div className="observation-keywords"><span>遗址可读性</span><span>游线组织</span><span>活动边界</span></div>
            </aside>
          </div>
        </section>

        <section className="cultural-translation" aria-labelledby="cultural-translation-title">
          <header className="cultural-translation-header">
            <h2 id="cultural-translation-title">文化转译</h2><p>CULTURAL TRANSLATION</p>
          </header>
          <div className="culture-layout">
            <div className="culture-grid" aria-label="文化原型与景观构件转译">
              <figure className="culture-tile culture-tile--human-source"><img src="/images/shangdu/source-human-ding.jpg" alt="人面鼎实物参考" /><figcaption>原型 / 人面鼎</figcaption></figure>
              <figure className="culture-tile culture-tile--human-model culture-tile--model"><img src="/images/shangdu/culture-human-ding.png" alt="提取人面鼎形态形成的构件模型" /><figcaption>提取 / 体量与支撑</figcaption></figure>
              <figure className="culture-tile culture-tile--sheep-source"><img src="/images/shangdu/source-sheep-zun.jpg" alt="四羊方尊实物参考" /><figcaption>原型 / 四羊方尊</figcaption></figure>
              <figure className="culture-tile culture-tile--sheep-model culture-tile--model"><img src="/images/shangdu/culture-sheep-zun.png" alt="提取四羊方尊形态形成的构件模型" /><figcaption>提取 / 转角与围合</figcaption></figure>
              <figure className="culture-tile culture-tile--attire-source"><img src="/images/shangdu/source-shang-attire.webp" alt="商代服饰人物参考" /><figcaption>参考 / 商代服饰</figcaption></figure>
              <figure className="culture-tile culture-tile--ox culture-tile--model"><img src="/images/shangdu/culture-ox.png" alt="小牛与农耕场景模型" /><figcaption>转译 / 田景互动</figcaption></figure>
              <figure className="culture-tile culture-tile--carry culture-tile--model"><img src="/images/shangdu/culture-carry.png" alt="挑扁担人物场景模型" /><figcaption>转译 / 劳动记忆</figcaption></figure>
              <figure className="culture-tile culture-tile--sculpture"><img src="/images/shangdu/culture-sculpture-ox.png" alt="小牛农耕主题景观雕塑效果图" /><figcaption>落地 / 田景窗口</figcaption></figure>
              <figure className="culture-tile culture-tile--sculpture"><img src="/images/shangdu/culture-sculpture-carry.png" alt="挑扁担主题景观雕塑效果图" /><figcaption>落地 / 劳动记忆</figcaption></figure>
              <figure className="culture-tile culture-tile--marker culture-tile--model"><img src="/images/shangdu/culture-marker.png" alt="竖向文化构件模型" /><figcaption>转译 / 节点导向构架</figcaption></figure>
            </div>
            <aside className="culture-sidebar" aria-label="文化转译说明">
              <p className="culture-kicker">SOURCE → ABSTRACT → SPACE</p>
              <h3>从器物和生活场景中提取可感知的空间语言</h3>
              <p>器物的体量、支撑与转角被转化为入口和停留构件；农耕人物组织田景体验；竖向构架则提示游线与节点。</p>
              <ol className="culture-actions">
                <li><span>01</span><p><strong>识别</strong>：以形态建立遗址的可读性。</p></li>
                <li><span>02</span><p><strong>参与</strong>：以人物和农耕场景激活停留。</p></li>
                <li><span>03</span><p><strong>导向</strong>：以构架串联游线节点。</p></li>
              </ol>
            </aside>
          </div>
        </section>

        <section className="render-studies" aria-labelledby="render-studies-title">
          <header className="render-studies-header">
            <h2 id="render-studies-title">空间体验</h2><p>SPATIAL EXPERIENCE / RENDER STUDIES</p>
          </header>
          <div className="render-studies-layout">
            <div className="render-grid" aria-label="郑州商城遗址公园空间效果图拼接">
              {renderGallery.map((render) => <button
                className={`render-tile render-tile--${render.id}${activeRenderId === render.id ? " is-active" : ""}`}
                type="button"
                key={render.id}
                aria-label={`查看${render.title}介绍`}
                aria-pressed={activeRenderId === render.id}
                onMouseEnter={() => setActiveRenderId(render.id)}
                onMouseLeave={() => setActiveRenderId(null)}
                onFocus={() => setActiveRenderId(render.id)}
                onBlur={() => setActiveRenderId(null)}
                onClick={() => setActiveRenderId((currentId) => currentId === render.id ? null : render.id)}
              >
                <img src={render.src} alt={render.alt} />
                <span className="render-tile__caption"><small>{render.index}</small><strong>{render.title}</strong></span>
              </button>)}
            </div>
            <aside className="render-sidebar" aria-label="空间效果图说明" aria-live="polite">
              <div className="render-sidebar__content" key={activeRender.id}>
                <p className="render-kicker">{activeRender.kicker}</p>
                <h3>{activeRender.title}</h3>
                <p>{activeRender.description}</p>
                <div className="render-keywords" aria-label="当前效果图关键词">{activeRender.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
              <p className="render-hint">移动到画面查看节点说明 / HOVER TO READ</p>
            </aside>
          </div>
        </section>

        <section className="project-notes"><p className="notes-number">01</p><p>遗址保护 · 生态连通 · 公共生活</p><p className="notes-count">06</p></section>
        <footer id="about">
          <p>以考古式阅读场地，让历史遗存、生态廊道与日常公共生活在当代城市中重新相遇。</p>
          <div className="footer-meta"><span>Landscape Architecture Student</span><span>Seeking internship opportunities</span><a href="mailto:18955612325up@gmail.com">18955612325up@gmail.com</a><span>© 2026 Tobey Xiao</span></div>
        </footer>
      </section>

      <button className="spatial-roam-entry" type="button" onClick={openExplorer} aria-label="进入空间漫游">
        <span className="spatial-roam-entry__label">进入空间漫游</span>
        <span className="spatial-roam-entry__subline">SPATIAL EXPLORATION</span>
      </button>

      {exploring && <div className={`field-view island-view${isClosingExplorer ? " is-leaving" : ""}`} role="dialog" aria-modal="true" aria-label="郑州商城遗址公园 3D 场景漫游" ref={dialogRef} tabIndex="-1">
        <IslandScene onSelect={setSceneStatus} nodes={nodes} editingNodeId={editingNodeId} onChooseNode={chooseNode} onUpdateNode={updateNodePosition} planMode={planMode} onPlanModeChange={setPlanMode} cameraView={sceneView} cameraApiRef={cameraApiRef} viewCalibration={viewCalibration} />
        <div className="field-ui island-ui">
          <div><p>3D 场景漫游 / 郑州商城遗址公园</p><span className="model-badge">GLB · LIVE</span></div>
          <CinematicSceneHint message={sceneStatus} />
          <div className="scene-control-panel">
            {editingNodeId && <section className="node-calibrator" aria-label="锚点校准">
              <p>{editingNodeNames ? "锚点名称 / 点击输入框直接修改，离开输入框后保存" : "锚点校准 / 选择锚点后点击模型落点"}</p>
              <div className={editingNodeNames ? "node-name-editor" : undefined}>{nodes.map((node, index) => editingNodeNames ? <label className={`node-name-field${node.id === editingNodeId ? " selected" : ""}`} key={node.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <input
                  type="text"
                  value={node.label}
                  maxLength="18"
                  aria-label={`编辑第 ${index + 1} 个锚点名称`}
                  onFocus={() => {
                    setEditingNodeId(node.id);
                    setSceneStatus(`正在编辑 ${node.label || "未命名锚点"} 的名称`);
                  }}
                  onChange={(event) => updateNodeLabel(node.id, event.target.value)}
                  onBlur={() => normalizeNodeLabel(node.id)}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                />
              </label> : <button className={node.id === editingNodeId ? "selected" : ""} type="button" key={node.id} onClick={() => chooseNode(node)}>{node.label}</button>)}</div>
              <div>
                <button className={editingNodeNames ? "selected" : ""} type="button" onClick={() => setEditingNodeNames((current) => !current)}>{editingNodeNames ? "完成命名" : "编辑名称"}</button>
                {editingNodeNames && <button type="button" onClick={resetNodeLabels}>恢复默认名称</button>}
                <button type="button" onClick={togglePlanMode}>{planMode ? "退出平面视图" : "平面视图"}</button>
                <button type="button" onClick={resetNodePositions}>恢复初始位置</button>
                <button type="button" onClick={finishCalibration}>完成校准</button>
              </div>
            </section>}
            {viewCalibration && <section className="node-calibrator view-calibrator" aria-label="默认视角调整">
              <p>默认视角 / 拖拽旋转，滚轮缩放到满意构图</p>
              <div>
                <button type="button" className="selected" onClick={saveDefaultView}>保存为默认视角</button>
                <button type="button" onClick={restorePresetView}>恢复预设视角</button>
                <button type="button" onClick={cancelViewCalibration}>取消</button>
              </div>
            </section>}
            <div className="scene-actions">
              {!editingNodeId && !viewCalibration && <button type="button" onClick={startViewCalibration}>调整默认视角</button>}
              {!editingNodeId && !viewCalibration && <button type="button" onClick={startCalibration}>调整锚点</button>}
              <button type="button" onClick={() => setSceneStatus("拖拽旋转模型；点击悬浮图钉进入节点特写")}>重置提示</button>
              <button type="button" onClick={closeExplorer}>关闭场景</button>
            </div>
          </div>
        </div>
      </div>}
    </main>
  );
}
