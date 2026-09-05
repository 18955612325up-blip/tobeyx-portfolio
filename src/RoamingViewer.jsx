import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { sceneLoading } from './sceneLoading.js';

let sceneModule;
function loadSceneCode() {
  if (!sceneModule) sceneModule = import('./IslandScene.jsx').catch((error) => { sceneModule = undefined; throw error; });
  return sceneModule;
}
export function warmSceneCode() { loadSceneCode().catch(() => {}); }

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function RoamingViewer({ onClose, onAvailability, ...sceneProps }) {
  const loading = useSyncExternalStore(sceneLoading.subscribe, sceneLoading.getSnapshot);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const Scene = useMemo(() => lazy(() => loadSceneCode().then((module) => {
    module.prepareSceneResources();
    return module;
  })), [attempt]);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);
  useEffect(() => {
    onAvailability(ready);
    if (ready && document.activeElement.closest('.scene-welcome')) document.activeElement.closest('[role="dialog"]')?.focus();
  }, [ready, onAvailability]);

  useEffect(() => {
    // Give the DOM preview a paint before mounting WebGL and preparing shaders.
    let secondFrame;
    const frame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(() => {
      try {
        const probe = document.createElement('canvas');
        const context = probe.getContext('webgl2');
        if (!context) { onFailure(); return; }
        context.getExtension('WEBGL_lose_context')?.loseContext();
        setMounted(true);
      } catch { onFailure(); }
    }); });
    const timer = setTimeout(() => setSlow(true), 15000);
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(secondFrame); clearTimeout(timer); };
  }, [attempt, onFailure]);

  const retry = async () => {
    setMounted(false);
    setReady(false);
    setFailed(false);
    setSlow(false);
    try {
      const module = await loadSceneCode();
      module.retrySceneResources();
      setAttempt((value) => value + 1);
    } catch { setFailed(true); }
  };
  const percent = loading.total > 0 ? Math.min(100, Math.floor(loading.loaded / loading.total * 100)) : null;
  const isDownloading = loading.phase === 'download';
  const title = failed ? '暂时无法进入空间漫游' : isDownloading ? '正在下载场景' : '正在准备空间漫游';

  return <>
    {mounted && !failed && <SceneBoundary key={attempt} onFailure={onFailure}>
      <Suspense fallback={null}><Scene {...sceneProps} onReady={onReady} onFailure={onFailure} /></Suspense>
    </SceneBoundary>}
    <div className={`scene-welcome${ready ? ' is-ready' : ''}`} aria-hidden={ready} inert={ready}>
      <img className="scene-welcome__preview" src="/images/shangdu/overview.webp" alt="" />
      <div className="scene-welcome__content">
        <p className="scene-welcome__eyebrow">浮层叠影 · 空间漫游</p>
        <h2 role={failed ? 'alert' : 'status'} aria-live="polite">{title}</h2>
        {!failed && <>
          <progress aria-label="模型下载进度" max="100" value={isDownloading && percent !== null ? percent : undefined} />
          <p className="scene-welcome__progress">{isDownloading
            ? `${percent === null ? '' : `${percent}% · `}${(loading.loaded / 1048576).toFixed(1)}${loading.total ? ` / ${(loading.total / 1048576).toFixed(1)}` : ''} MB`
            : '正在整理模型、光照与首帧画面'}</p>
        </>}
        <p className="scene-welcome__note">{failed ? '网络或图形环境暂时不可用。可以重试，也可以返回浏览项目图文。'
          : slow ? '这次等待较久，场景仍在准备。你可以先返回浏览图文，准备过程会在后台继续。'
          : '先预览项目全貌，准备完成后自动进入。首次打开需要一些时间。'}</p>
        <div className="scene-welcome__actions">
          {failed && <button type="button" onClick={retry}>重新加载</button>}
          <button type="button" onClick={onClose}>返回浏览图文</button>
        </div>
      </div>
    </div>
  </>;
}
