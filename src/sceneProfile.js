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
    background: "#839da8",
    hdr: "/hdr/city.exr",
    hdrIntensity: 0.25,
    // EV is logarithmic; the final AgX pass consumes a linear multiplier.
    exposure: 2 ** 0.45,
    hemisphere: ["#dfe6ef", "#b9b8b1", 0.65],
    keyLight: {
      color: "#fffaf2",
      intensity: 2.0,
      // Blender SUN local +Z, converted Z-up -> Y-up, then scene rotation -0.34.
      position: [-62.8, 102.2, 4.7],
      shadow: {
        mapSize: 2048,
        bounds: 110,
        near: 0.5,
        far: 240,
        bias: -0.00008,
        normalBias: 0.025,
        radius: 4,
      },
    },
  },
  postprocessing: {
    ao: {
      radius: 1.2,
      distanceFalloff: 0.9,
      intensity: 0.42,
      color: "#757a80",
      quality: "high",
      aoSamples: 16,
      denoiseSamples: 8,
      denoiseRadius: 12,
    },
    saturation: 0,
  },
  materials: {
    contextBuildings: { opacity: 1 },
    grass: { color: "#c4cf97", offset: -0.5 },
    wall: "#a47758",
    ground: "#aaa9a1",
    water: { opacity: 0.46, offset: -1 },
  },
};
