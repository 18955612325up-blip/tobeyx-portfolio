import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { EquirectangularReflectionMapping } from 'three';
import { ACTIVE_MODEL_URL, sceneProfile } from './sceneProfile.js';
import { updateSceneLoading } from './sceneLoading.js';

let resource;
let failed = false;
async function download(url, signal, onProgress) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`资源加载失败 (${response.status})`);
  // Fetch streams decoded bytes. An encoded Content-Length is not comparable.
  const encoding = response.headers.get('content-encoding');
  const total = !encoding || encoding === 'identity' ? Number(response.headers.get('content-length')) || 0 : 0;
  if (!onProgress || !response.body) return response.arrayBuffer();
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress({ loaded, total });
  }
  const result = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result.buffer;
}

export function prepareSceneResources() {
  if (resource) return resource;
  failed = false;
  updateSceneLoading({ phase: 'download', loaded: 0, total: 0 });
  const controller = new AbortController();
  let timeout;
  const resetTimeout = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => controller.abort(), 120000);
  };
  resetTimeout();
  resource = (async () => {
    const urls = [];
    const draco = new DRACOLoader().setWorkerLimit(4);
    const asUrl = (data, type) => {
      const url = URL.createObjectURL(new Blob([data], { type }));
      urls.push(url);
      return url;
    };
    try {
      // Download decoder files ourselves so network failures reject this promise,
      // instead of becoming unhandled worker errors inside the glTF parser.
      const [model, hdr, decoderJs, decoderWasm] = await Promise.all([
        download(ACTIVE_MODEL_URL, controller.signal, (progress) => {
          resetTimeout();
          updateSceneLoading(progress);
        }),
        download(sceneProfile.environment.hdr, controller.signal),
        download('/draco/draco_wasm_wrapper.js', controller.signal),
        download('/draco/draco_decoder.wasm', controller.signal),
      ]);
      clearTimeout(timeout);
      updateSceneLoading({ phase: 'prepare' });
      draco.setDecoderPath({ js: asUrl(decoderJs, 'text/javascript'), wasm: asUrl(decoderWasm, 'application/wasm') });
      const loader = new GLTFLoader().setDRACOLoader(draco);
      const [gltf, environment] = await Promise.all([
        loader.parseAsync(model, '/models/'),
        new EXRLoader().loadAsync(asUrl(hdr, 'application/octet-stream')),
      ]);
      environment.mapping = EquirectangularReflectionMapping;
      return { scene: gltf.scene, environment };
    } catch (error) {
      failed = true;
      controller.abort();
      updateSceneLoading({ phase: 'error' });
      throw error;
    } finally {
      clearTimeout(timeout);
      draco.dispose();
      urls.forEach((url) => URL.revokeObjectURL(url));
    }
  })();
  // Warmup can run without a mounted Suspense consumer.
  resource.catch(() => {});
  return resource;
}

export function retrySceneResources() {
  if (failed) resource = undefined;
}
