import { useEffect, useRef, useState } from 'react';
import { sceneProfile } from './sceneProfile.js';
import { RoamingViewer, warmSceneCode } from './RoamingViewer.jsx';

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
  const [sceneReady, setSceneReady] = useState(false);
  const showCalibration = import.meta.env.DEV && new URLSearchParams(window.location.search).has('calibrate');
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
    if (!exploring) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(explorerCloseTimer.current);
      previousFocus?.focus?.();
    };
  }, [exploring]);
  useEffect(() => () => window.clearTimeout(planCycleTimer.current), []);
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (!exploring) return;
      if (event.key === "Escape") closeExplorer();
      if (event.key !== "Tab") return;
      const buttons = [...dialogRef.current.querySelectorAll('button, a[href], input, [tabindex="0"]')].filter((element) => !element.disabled && !element.closest('[inert]') && element.getClientRects().length);
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first?.focus(); }
    };
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
    setSceneReady(false);
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
      <section className="content" id="top" inert={exploring}>
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
          <div className="main-artwork"><img fetchPriority="high" decoding="async" src={active.image} alt={active.alt} /></div>
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
                  <img loading="lazy" decoding="async" src={activePlan.src} width={activePlan.width} height={activePlan.height} alt={activePlan.alt} />
                </div>
                {nextPlan && <button className="plan-layer plan-layer--next" key={`next-${planOrder[1]}`} type="button" onClick={cyclePlan} disabled={isPlanCycling} aria-label={`露出的${nextPlan.label}。点击切换为主图`}>
                  <img loading="lazy" decoding="async" src={nextPlan.src} width={nextPlan.width} height={nextPlan.height} alt={nextPlan.alt} />
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
                  <img loading="lazy" decoding="async" src="/images/shangdu/site-entry.jpg" alt="郑州商都遗址公园入口广场与台阶现状" />
                  <figcaption><span>01</span><p>入口广场尺度大，导向弱</p></figcaption>
                </figure>
                <figure className="observation-card observation-card--square">
                  <img loading="lazy" decoding="async" src="/images/shangdu/site-symbols.jpg" alt="郑州商都遗址公园文化符号展示现状" />
                  <figcaption><span>02</span><p>文化展示偏符号堆砌</p></figcaption>
                </figure>
              </div>
              <div className="observation-column observation-column--wide">
                <figure className="observation-card observation-card--wide">
                  <img loading="lazy" decoding="async" src="/images/shangdu/site-wall.jpg" alt="郑州商都古城墙遗址高差与步道现状" />
                  <figcaption><span>03</span><p>古城墙已利用，体验仍不深入</p></figcaption>
                </figure>
                <figure className="observation-card observation-card--wide">
                  <img loading="lazy" decoding="async" src="/images/shangdu/site-activities.jpg" alt="郑州商都遗址公园广场舞等集体活动现状" />
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
              <figure className="culture-tile culture-tile--human-source"><img loading="lazy" decoding="async" src="/images/shangdu/source-human-ding.jpg" alt="人面鼎实物参考" /><figcaption>原型 / 人面鼎</figcaption></figure>
              <figure className="culture-tile culture-tile--human-model culture-tile--model"><img loading="lazy" decoding="async" src="/images/shangdu/culture-human-ding.png" alt="提取人面鼎形态形成的构件模型" /><figcaption>提取 / 体量与支撑</figcaption></figure>
              <figure className="culture-tile culture-tile--sheep-source"><img loading="lazy" decoding="async" src="/images/shangdu/source-sheep-zun.jpg" alt="四羊方尊实物参考" /><figcaption>原型 / 四羊方尊</figcaption></figure>
              <figure className="culture-tile culture-tile--sheep-model culture-tile--model"><img loading="lazy" decoding="async" src="/images/shangdu/culture-sheep-zun.png" alt="提取四羊方尊形态形成的构件模型" /><figcaption>提取 / 转角与围合</figcaption></figure>
              <figure className="culture-tile culture-tile--attire-source"><img loading="lazy" decoding="async" src="/images/shangdu/source-shang-attire.webp" alt="商代服饰人物参考" /><figcaption>参考 / 商代服饰</figcaption></figure>
              <figure className="culture-tile culture-tile--ox culture-tile--model"><img loading="lazy" decoding="async" src="/images/shangdu/culture-ox.png" alt="小牛与农耕场景模型" /><figcaption>转译 / 田景互动</figcaption></figure>
              <figure className="culture-tile culture-tile--carry culture-tile--model"><img loading="lazy" decoding="async" src="/images/shangdu/culture-carry.png" alt="挑扁担人物场景模型" /><figcaption>转译 / 劳动记忆</figcaption></figure>
              <figure className="culture-tile culture-tile--sculpture"><img loading="lazy" decoding="async" src="/images/shangdu/culture-sculpture-ox.png" alt="小牛农耕主题景观雕塑效果图" /><figcaption>落地 / 田景窗口</figcaption></figure>
              <figure className="culture-tile culture-tile--sculpture"><img loading="lazy" decoding="async" src="/images/shangdu/culture-sculpture-carry.png" alt="挑扁担主题景观雕塑效果图" /><figcaption>落地 / 劳动记忆</figcaption></figure>
              <figure className="culture-tile culture-tile--marker culture-tile--model"><img loading="lazy" decoding="async" src="/images/shangdu/culture-marker.png" alt="竖向文化构件模型" /><figcaption>转译 / 节点导向构架</figcaption></figure>
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
                onClick={() => setActiveRenderId(render.id)}
              >
                <img loading="lazy" decoding="async" src={render.src} alt={render.alt} />
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

      <button className="spatial-roam-entry" inert={exploring} type="button" onPointerEnter={warmSceneCode} onFocus={warmSceneCode} onClick={openExplorer} aria-label="进入空间漫游">
        <span className="spatial-roam-entry__label">进入空间漫游</span>
        <span className="spatial-roam-entry__subline">SPATIAL EXPLORATION</span>
      </button>

      {exploring && <div className={`field-view island-view${isClosingExplorer ? " is-leaving" : ""}`} role="dialog" aria-modal="true" aria-label="郑州商城遗址公园 3D 场景漫游" ref={dialogRef} tabIndex="-1">
        <RoamingViewer onSelect={setSceneStatus} nodes={nodes} editingNodeId={editingNodeId} onChooseNode={chooseNode} onUpdateNode={updateNodePosition} planMode={planMode} onPlanModeChange={setPlanMode} cameraView={sceneView} cameraApiRef={cameraApiRef} viewCalibration={viewCalibration} onClose={closeExplorer} onAvailability={setSceneReady} />
        <div className="field-ui island-ui" inert={!sceneReady} aria-hidden={!sceneReady}>
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
              {showCalibration && !editingNodeId && !viewCalibration && <button type="button" onClick={startViewCalibration}>调整默认视角</button>}
              {showCalibration && !editingNodeId && !viewCalibration && <button type="button" onClick={startCalibration}>调整锚点</button>}
              <button type="button" onClick={() => setSceneStatus("拖拽旋转模型；点击悬浮图钉进入节点特写")}>重置提示</button>
              <button type="button" onClick={closeExplorer}>关闭场景</button>
            </div>
          </div>
        </div>
      </div>}
    </main>
  );
}
