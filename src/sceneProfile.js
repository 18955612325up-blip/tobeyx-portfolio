// Shared browser-rendering profile for every replacement GLB.
// Normally only ACTIVE_MODEL_URL changes when a new model is supplied.
export const ACTIVE_MODEL_URL = "/models/sdyz20.glb";

export const sceneProfile = {
  camera: {
    // Ground-level presentation view: keep the museum as the visual anchor
    // while placing the camera at the lowest useful orbit height.
    // Main museum building: positioned from the imported "博物院主体" meshes
    // after <Center> and the scene's Y-axis rotation are applied.
    position: [-20, 7, -39],
    target: [0, 2, -29],
    fov: 32,
    near: 0.5,
    far: 350,
    rotationSpeed: {
      overview: 0.86,
      focus: 0.5,
    },
  },
  environment: {
    background: "#3f3f3f",
    hdr: "/hdr/city.exr",
    hdrIntensity: 0.48,
    exposure: 0.74,
    hemisphere: ["#f4f6f8", "#aeb5bd", 0.22],
    keyLight: {
      color: "#fff7e8",
      intensity: 0.34,
      position: [-45, 80, -30],
      shadow: {
        mapSize: 2048,
        bounds: 105,
        near: 0.5,
        far: 240,
        bias: -0.00018,
        normalBias: 0.035,
        radius: 3,
      },
    },
  },
  postprocessing: {
    ao: {
      radius: 4.2,
      distanceFalloff: 0.9,
      intensity: 0.52,
      color: "#66707a",
      quality: "high",
      aoSamples: 16,
      denoiseSamples: 8,
      denoiseRadius: 12,
    },
    saturation: -0.22,
  },
  materials: {
    contextBuildings: { opacity: 0.3 },
    grass: { color: "#c4cf97", offset: -0.5 },
    wall: "#a47758",
    ground: "#aaa9a1",
    water: { opacity: 0.46, offset: -1 },
  },
};
