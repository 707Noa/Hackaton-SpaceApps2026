// MARS OUTPOST: Babylon.js 3D Pixel-Art Jezero Simulation Engine
// Features:
// - 16-bit procedural pixel textures & hardware pixel scaling
// - Keyboard movement (WASD / Arrow keys) for the Junior Astronaut with walk animation
// - Proximity detection to interactive Mars modules + [E] key interaction
// - Dynamic day/night lighting, growing crops, animated rover, and dust particles

import {
  createMarsGroundTexture,
  createSolarPanelTexture,
  createHabitatWallTexture,
  createEarthTexture,
  createRockTexture
} from './pixelTextureFactory';
import { getTelemetrySnapshot } from './telemetryStatus';

export class BabylonSceneManager {
  constructor(canvas, onModuleClick, onProximityChange) {
    this.canvas = canvas;
    this.onModuleClick = onModuleClick;
    this.onProximityChange = onProximityChange;

    const BAB = window.BABYLON;
    if (!BAB) {
      console.error('Babylon.js runtime not loaded');
      return;
    }

    this.BAB = BAB;
    this.engine = new BAB.Engine(canvas, false, { preserveDrawingBuffer: true, stencil: true });
    this.engine.setHardwareScalingLevel(2.5);

    this.scene = new BAB.Scene(this.engine);
    this.scene.clearColor = new BAB.Color4(0.11, 0.04, 0.05, 1.0);

    this.solarPanels = [];
    this.cropMeshes = [];
    this.domeLights = [];
    this.statusBeacons = {};
    this.bunkerShieldMesh = null;
    this.roverGroup = null;
    this.astronautGroup = null;
    this.astroLegs = { left: null, right: null };
    this.helperBots = [];
    this.dustSystem = null;
    this.roverAnim = { active: false, phase: 0 };

    // Keyboard & movement state
    this.keys = {};
    this.controlsEnabled = true;
    this.walkTime = 0;
    this.currentNearby = null;
    this.interactiveZones = [
      { module: 'agrodome', title: 'Invernadero Agrodome', x: -7.5, z: 6.5, radius: 5.0 },
      { module: 'agrodome', title: 'Invernadero Agrodome', x: -7.5, z: -6.5, radius: 5.0 },
      { module: 'power_core', title: 'Paneles Solares (Power Core)', x: -11.5, z: 0.5, radius: 4.5 },
      { module: 'power_core', title: 'Rover & Energía', x: 3.8, z: -6.5, radius: 3.2 },
      { module: 'life_support', title: 'Hábitat (Life Support)', x: 7.3, z: 4.8, radius: 4.8 },
      { module: 'life_support', title: 'Laboratorio MOXIE (Life Support)', x: 8.0, z: -2.5, radius: 4.8 },
      { module: 'shield_system', title: 'Búnker de Regolito (Shield)', x: 6.5, z: -10.5, radius: 4.2 },
      { module: 'mission_control', title: 'Control de Misión y Antena', x: 0.0, z: 3.5, radius: 3.0 }
    ];

    this.initCamera();
    this.initLighting();
    this.initSkyAndEarth();
    this.initTerrainAndCraters();
    this.initBiodomes();
    this.initSolarArrays();
    this.initHabitatAndLab();
    this.initBunker();
    this.initStatusBeacons();
    this.initRover();
    this.initAstronautAndBots();
    this.initMissionBeacon();
    this.initDustParticles();
    this.initPicking();
    this.initKeyboard();

    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });

    this.resizeHandler = () => this.engine.resize();
    window.addEventListener('resize', this.resizeHandler);
  }

  initCamera() {
    const BAB = this.BAB;
    this.camera = new BAB.ArcRotateCamera(
      'outpostCam',
      -Math.PI / 2,
      Math.PI / 3.05,
      28,
      new BAB.Vector3(0, 0.5, 0),
      this.scene
    );
    this.camera.attachControl(this.canvas, true);
    this.camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
    this.camera.lowerRadiusLimit = 14;
    this.camera.upperRadiusLimit = 42;
    this.camera.lowerBetaLimit = 0.35;
    this.camera.upperBetaLimit = Math.PI / 2.25;
    // Disable default camera arrow keys so player uses arrow keys to walk
    this.camera.keysUp = [];
    this.camera.keysDown = [];
    this.camera.keysLeft = [];
    this.camera.keysRight = [];
  }

  initLighting() {
    const BAB = this.BAB;
    this.hemiLight = new BAB.HemisphericLight('hemiLight', new BAB.Vector3(0, 1, 0), this.scene);
    this.hemiLight.intensity = 0.85;
    this.hemiLight.diffuse = new BAB.Color3(1.0, 0.92, 0.85);
    this.hemiLight.groundColor = new BAB.Color3(0.45, 0.16, 0.08);

    this.sunLight = new BAB.DirectionalLight('sunLight', new BAB.Vector3(-0.6, -1, -0.5), this.scene);
    this.sunLight.position = new BAB.Vector3(18, 30, 15);
    this.sunLight.intensity = 1.1;
    this.sunLight.diffuse = new BAB.Color3(1.0, 0.86, 0.72);
  }

  initSkyAndEarth() {
    const BAB = this.BAB;

    // Warm Martian atmospheric horizon haze (butterscotch/rust dust fog)
    this.scene.fogMode = BAB.Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.012;
    this.scene.fogColor = new BAB.Color3(0.38, 0.14, 0.09);

    const earthSize = 3.2;
    const earthInitialPosition = new BAB.Vector3(-12, 11, 16);
    this.earthReferenceDistance = BAB.Vector3.Distance(this.camera.position, earthInitialPosition);
    const earthDirection = earthInitialPosition.subtract(this.camera.position).normalize();
    const earthDistance = 120;
    const earth = BAB.MeshBuilder.CreatePlane('pixelEarth', { size: earthSize }, this.scene);
    earth.position = this.camera.position.add(earthDirection.scale(earthDistance));
    earth.scaling.setAll(earthDistance / this.earthReferenceDistance);
    earth.billboardMode = BAB.Mesh.BILLBOARDMODE_ALL;
    this.earth = earth;

    const earthMat = new BAB.StandardMaterial('earthMat', this.scene);
    const earthTex = createEarthTexture(BAB, this.scene);
    earthTex.hasAlpha = true;
    earthMat.diffuseTexture = earthTex;
    earthMat.emissiveTexture = earthTex;
    earthMat.useAlphaFromDiffuseTexture = true;
    earthMat.fogEnabled = false;
    earthMat.specularColor = new BAB.Color3(0, 0, 0);
    earth.material = earthMat;
    earth.metadata = {
      module: 'mission_control',
      label: 'Planeta Tierra & Red DSN: Comunicaciones con 14 min de retardo.'
    };

    const starMat = new BAB.StandardMaterial('starMat', this.scene);
    starMat.emissiveColor = new BAB.Color3(1.0, 0.95, 0.8);
    starMat.disableLighting = true;

    for (let s = 0; s < 40; s++) {
      const star = BAB.MeshBuilder.CreateBox(`star_${s}`, { size: 0.16 }, this.scene);
      const angle = (s * 2.4) % (Math.PI * 2);
      const r = 28 + (s % 6) * 2;
      star.position = new BAB.Vector3(Math.cos(angle) * r, 9 + (s % 8) * 1.5, Math.sin(angle) * r);
      star.material = starMat;
    }
  }

  initTerrainAndCraters() {
    const BAB = this.BAB;

    // Outer continuous Martian desert & Jezero Crater rim (rolling organic terrain, zero pyramids)
    const outerGround = BAB.MeshBuilder.CreateGround('outerMarsTerrain', {
      width: 110,
      height: 110,
      subdivisions: 42,
      updatable: true
    }, this.scene);
    outerGround.position.y = -0.05;

    const positions = outerGround.getVerticesData(BAB.VertexBuffer.PositionKind);
    for (let i = 0; i < positions.length; i += 3) {
      const vx = positions[i];
      const vz = positions[i + 2];
      const dist = Math.hypot(vx, vz);
      if (dist > 17.5) {
        const edgeFactor = Math.min(1, (dist - 17.5) / 28);
        const angle = Math.atan2(vz, vx);
        // Smooth undulating crater rim + rolling sand dunes + flat-topped mesa ridges
        const dunes = Math.sin(vx * 0.14) * Math.cos(vz * 0.14) * 1.4;
        const rimWave = Math.sin(angle * 3.0) * 1.2 + Math.cos(angle * 5.0) * 0.7;
        const mesaClamp = Math.min(4.8, (edgeFactor * 5.2) + rimWave + dunes);
        positions[i + 1] = Math.max(0, mesaClamp * edgeFactor);
      }
    }
    outerGround.updateVerticesData(BAB.VertexBuffer.PositionKind, positions);
    outerGround.createNormals(true);

    const outerMat = new BAB.StandardMaterial('outerMarsMat', this.scene);
    outerMat.diffuseColor = new BAB.Color3(0.62, 0.22, 0.11);
    outerMat.specularColor = new BAB.Color3(0, 0, 0);
    outerGround.material = outerMat;

    // Inner walkable base terrain with crisp pixel-art paths
    const ground = BAB.MeshBuilder.CreateGround('marsTerrain', { width: 36, height: 36, subdivisions: 8 }, this.scene);
    const groundMat = new BAB.StandardMaterial('groundMat', this.scene);
    groundMat.diffuseTexture = createMarsGroundTexture(BAB, this.scene);
    groundMat.specularColor = new BAB.Color3(0, 0, 0);
    ground.material = groundMat;

    const createCrater = (id, x, z, radius) => {
      const craterRim = BAB.MeshBuilder.CreateTorus(`${id}_rim`, {
        diameter: radius * 2,
        thickness: radius * 0.45,
        tessellation: 16
      }, this.scene);
      craterRim.position = new BAB.Vector3(x, 0.1, z);
      craterRim.scaling.y = 0.45;

      const rimMat = new BAB.StandardMaterial(`${id}_rimMat`, this.scene);
      rimMat.diffuseColor = new BAB.Color3(0.58, 0.18, 0.09);
      rimMat.specularColor = new BAB.Color3(0, 0, 0);
      craterRim.material = rimMat;

      const craterHole = BAB.MeshBuilder.CreateDisc(`${id}_hole`, { radius: radius * 0.95, tessellation: 16 }, this.scene);
      craterHole.rotation.x = Math.PI / 2;
      craterHole.position = new BAB.Vector3(x, 0.03, z);

      const holeMat = new BAB.StandardMaterial(`${id}_holeMat`, this.scene);
      holeMat.diffuseColor = new BAB.Color3(0.28, 0.07, 0.04);
      holeMat.specularColor = new BAB.Color3(0, 0, 0);
      craterHole.material = holeMat;

      const meta = {
        module: 'shield_system',
        label: 'Cráter de Jezero: Zona de exploración geológica y regolito protector.'
      };
      craterRim.metadata = meta;
      craterHole.metadata = meta;
    };

    createCrater('crater_ne', 5.5, 11.5, 2.3);
    createCrater('crater_se', 11.5, -10.5, 2.8);

    const rockMat = new BAB.StandardMaterial('rockMat', this.scene);
    rockMat.diffuseTexture = createRockTexture(BAB, this.scene);
    rockMat.specularColor = new BAB.Color3(0, 0, 0);

    // Rounded / weathered flat-topped Jezero sedimentary boulders (no pointy pyramids)
    const rockCoords = [
      [-4.2, -1.2, 1.2], [-14.5, 9.5, 1.1], [2.5, 10.5, 0.9],
      [14.2, -4.5, 1.2], [-14.0, -11.5, 1.3], [1.8, -11.2, 1.0],
      [-2.8, -9.2, 0.8], [13.5, 8.2, 1.1]
    ];
    rockCoords.forEach(([rx, rz, scale], idx) => {
      const rock = BAB.MeshBuilder.CreateSphere(`marsRock_${idx}`, {
        diameter: 1.15 * scale,
        segments: 4
      }, this.scene);
      rock.position = new BAB.Vector3(rx, 0.25 * scale, rz);
      rock.scaling.set(1.25, 0.52, 0.95);
      rock.rotation.y = idx * 0.9;
      rock.material = rockMat;
    });
  }

  initBiodomes() {
    const BAB = this.BAB;
    const domeCoords = [
      { id: 'north', x: -7.5, z: 6.5 },
      { id: 'south', x: -7.5, z: -6.5 }
    ];

    domeCoords.forEach((cfg) => {
      const base = BAB.MeshBuilder.CreateCylinder(`domeBase_${cfg.id}`, {
        diameter: 7.4,
        height: 0.6,
        tessellation: 16
      }, this.scene);
      base.position = new BAB.Vector3(cfg.x, 0.3, cfg.z);
      const baseMat = new BAB.StandardMaterial(`domeBaseMat_${cfg.id}`, this.scene);
      baseMat.diffuseColor = new BAB.Color3(0.55, 0.56, 0.62);
      baseMat.specularColor = new BAB.Color3(0, 0, 0);
      base.material = baseMat;

      const soil = BAB.MeshBuilder.CreateDisc(`domeSoil_${cfg.id}`, { radius: 3.3, tessellation: 16 }, this.scene);
      soil.rotation.x = Math.PI / 2;
      soil.position = new BAB.Vector3(cfg.x, 0.61, cfg.z);
      const soilMat = new BAB.StandardMaterial(`domeSoilMat_${cfg.id}`, this.scene);
      soilMat.diffuseColor = new BAB.Color3(0.45, 0.25, 0.14);
      soilMat.specularColor = new BAB.Color3(0, 0, 0);
      soil.material = soilMat;

      const lamp = BAB.MeshBuilder.CreateSphere(`domeLamp_${cfg.id}`, { diameter: 0.75, segments: 6 }, this.scene);
      lamp.position = new BAB.Vector3(cfg.x, 1.0, cfg.z);
      const lampMat = new BAB.StandardMaterial(`domeLampMat_${cfg.id}`, this.scene);
      lampMat.emissiveColor = new BAB.Color3(1.0, 0.72, 0.2);
      lampMat.disableLighting = true;
      lamp.material = lampMat;

      const ptLight = new BAB.PointLight(`domePt_${cfg.id}`, new BAB.Vector3(cfg.x, 2.2, cfg.z), this.scene);
      ptLight.diffuse = new BAB.Color3(1.0, 0.75, 0.35);
      ptLight.intensity = 1.2;
      ptLight.range = 8;
      this.domeLights.push(ptLight);

      const plantMat = new BAB.StandardMaterial(`plantMat_${cfg.id}`, this.scene);
      plantMat.diffuseColor = new BAB.Color3(0.24, 0.65, 0.30);
      plantMat.emissiveColor = new BAB.Color3(0.06, 0.2, 0.08);

      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const px = cfg.x + Math.cos(angle) * 2.0;
        const pz = cfg.z + Math.sin(angle) * 2.0;

        const tray = BAB.MeshBuilder.CreateBox(`tray_${cfg.id}_${p}`, { width: 1.0, height: 0.35, depth: 0.7 }, this.scene);
        tray.position = new BAB.Vector3(px, 0.75, pz);
        tray.rotation.y = -angle;
        tray.material = baseMat;

        const plant = BAB.MeshBuilder.CreateBox(`crop_${cfg.id}_${p}`, { width: 0.75, height: 0.85, depth: 0.5 }, this.scene);
        plant.position = new BAB.Vector3(px, 1.15, pz);
        plant.rotation.y = -angle;
        plant.material = plantMat;
        this.cropMeshes.push(plant);
      }

      const glass = BAB.MeshBuilder.CreateSphere(`domeGlass_${cfg.id}`, {
        diameter: 7.1,
        segments: 8,
        slice: 0.5
      }, this.scene);
      glass.position = new BAB.Vector3(cfg.x, 0.6, cfg.z);
      const glassMat = new BAB.StandardMaterial(`domeGlassMat_${cfg.id}`, this.scene);
      glassMat.diffuseColor = new BAB.Color3(0.65, 0.85, 0.98);
      glassMat.emissiveColor = new BAB.Color3(0.1, 0.18, 0.25);
      glassMat.alpha = 0.28;
      glass.material = glassMat;

      const ribs = BAB.MeshBuilder.CreateSphere(`domeRibs_${cfg.id}`, {
        diameter: 7.18,
        segments: 6,
        slice: 0.5
      }, this.scene);
      ribs.position = new BAB.Vector3(cfg.x, 0.6, cfg.z);
      const ribMat = new BAB.StandardMaterial(`domeRibMat_${cfg.id}`, this.scene);
      ribMat.diffuseColor = new BAB.Color3(0.75, 0.8, 0.85);
      ribMat.wireframe = true;
      ribMat.alpha = 0.45;
      ribs.material = ribMat;

      const meta = {
        module: 'agrodome',
        label: 'Invernadero Agrodome (NASA Veggie): Cultivos hidropónicos.'
      };
      base.metadata = meta;
      glass.metadata = meta;
      ribs.metadata = meta;
    });
  }

  initSolarArrays() {
    const BAB = this.BAB;
    const solarMat = new BAB.StandardMaterial('solarFaceMat', this.scene);
    solarMat.diffuseTexture = createSolarPanelTexture(BAB, this.scene);
    solarMat.specularColor = new BAB.Color3(0.2, 0.3, 0.5);

    const poleMat = new BAB.StandardMaterial('solarPoleMat', this.scene);
    poleMat.diffuseColor = new BAB.Color3(0.32, 0.38, 0.46);

    const createPanel = (id, x, z) => {
      const pole = BAB.MeshBuilder.CreateCylinder(`${id}_pole`, { diameter: 0.22, height: 1.4, tessellation: 6 }, this.scene);
      pole.position = new BAB.Vector3(x, 0.7, z);
      pole.material = poleMat;

      const panel = BAB.MeshBuilder.CreateBox(`${id}_plate`, { width: 1.7, height: 0.12, depth: 2.1 }, this.scene);
      panel.position = new BAB.Vector3(x, 1.45, z);
      panel.rotation.x = Math.PI / 5.5;
      panel.material = solarMat;

      const meta = {
        module: 'power_core',
        label: 'Paneles Solares (Power Core): Generación eléctrica.'
      };
      pole.metadata = meta;
      panel.metadata = meta;
      this.solarPanels.push({ panel, mat: solarMat });
    };

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        createPanel(`solarW_${r}_${c}`, -13.5 + c * 2.1, 1.8 - r * 2.6);
      }
    }

    createPanel('solarN_0', -1.8, 9.2);
    createPanel('solarN_1', 0.6, 8.2);
  }

  initHabitatAndLab() {
    const BAB = this.BAB;
    const habMat = new BAB.StandardMaterial('habMat', this.scene);
    habMat.diffuseTexture = createHabitatWallTexture(BAB, this.scene, false);
    habMat.specularColor = new BAB.Color3(0, 0, 0);

    const labMat = new BAB.StandardMaterial('labMat', this.scene);
    labMat.diffuseTexture = createHabitatWallTexture(BAB, this.scene, true);
    labMat.specularColor = new BAB.Color3(0, 0, 0);

    const roofMat = new BAB.StandardMaterial('roofMat', this.scene);
    roofMat.diffuseColor = new BAB.Color3(0.68, 0.7, 0.75);
    roofMat.specularColor = new BAB.Color3(0, 0, 0);

    [4.8, 9.8].forEach((hx, i) => {
      const pod = BAB.MeshBuilder.CreateBox(`habitatPod_${i}`, { width: 4.5, height: 2.5, depth: 3.2 }, this.scene);
      pod.position = new BAB.Vector3(hx, 1.25, 4.8);
      pod.material = habMat;

      const roof = BAB.MeshBuilder.CreateCylinder(`habitatRoof_${i}`, {
        diameter: 3.1,
        height: 4.5,
        tessellation: 8
      }, this.scene);
      roof.rotation.z = Math.PI / 2;
      roof.scaling.x = 0.45;
      roof.position = new BAB.Vector3(hx, 2.5, 4.8);
      roof.material = roofMat;

      const meta = {
        module: 'life_support',
        label: 'Hábitat (Life Support): Reciclador de agua ECLSS y aire.'
      };
      pod.metadata = meta;
      roof.metadata = meta;
    });

    const tunnel = BAB.MeshBuilder.CreateBox('habTunnel', { width: 1.2, height: 1.8, depth: 2.0 }, this.scene);
    tunnel.position = new BAB.Vector3(7.3, 0.9, 4.8);
    tunnel.material = roofMat;

    const lab = BAB.MeshBuilder.CreateBox('scienceLab', { width: 6.4, height: 2.8, depth: 3.8 }, this.scene);
    lab.position = new BAB.Vector3(8.0, 1.4, -2.5);
    lab.material = labMat;

    const labRoof = BAB.MeshBuilder.CreateBox('labRoof', { width: 6.0, height: 0.4, depth: 3.4 }, this.scene);
    labRoof.position = new BAB.Vector3(8.0, 2.95, -2.5);
    labRoof.material = roofMat;

    const moxieUnit = BAB.MeshBuilder.CreateBox('moxieUnit', { width: 1.6, height: 0.9, depth: 1.4 }, this.scene);
    moxieUnit.position = new BAB.Vector3(6.5, 3.4, -2.5);
    const moxieMat = new BAB.StandardMaterial('moxieMat', this.scene);
    moxieMat.diffuseColor = new BAB.Color3(0.95, 0.65, 0.15);
    moxieUnit.material = moxieMat;

    const dish = BAB.MeshBuilder.CreateCylinder('commsDish', { diameterTop: 1.4, diameterBottom: 0.2, height: 0.7, tessellation: 8 }, this.scene);
    dish.position = new BAB.Vector3(9.8, 3.6, -2.5);
    dish.rotation.x = Math.PI / 5;
    dish.material = roofMat;

    const labMeta = {
      module: 'life_support',
      label: 'Laboratorio MOXIE: Fábrica de oxígeno desde CO2.'
    };
    lab.metadata = labMeta;
    labRoof.metadata = labMeta;
    moxieUnit.metadata = labMeta;
    dish.metadata = {
      module: 'mission_control',
      label: 'Antena DSN: Enlace directo con Control de Misión en Houston.'
    };
  }

  initBunker() {
    const BAB = this.BAB;
    // Rounded regolith-shielded Mars habitat dome (igloo shelter)
    const bunker = BAB.MeshBuilder.CreateSphere('regolithBunker', {
      diameter: 4.4,
      segments: 8,
      slice: 0.5
    }, this.scene);
    bunker.position = new BAB.Vector3(6.5, 0, -10.5);
    bunker.scaling.y = 0.72;

    const bunkerMat = new BAB.StandardMaterial('bunkerMat', this.scene);
    bunkerMat.diffuseTexture = createRockTexture(BAB, this.scene);
    bunkerMat.specularColor = new BAB.Color3(0, 0, 0);
    bunker.material = bunkerMat;

    // Metal airlock entrance on bunker
    const hatch = BAB.MeshBuilder.CreateBox('bunkerHatch', { width: 1.2, height: 1.1, depth: 0.9 }, this.scene);
    hatch.position = new BAB.Vector3(4.9, 0.55, -9.2);
    hatch.rotation.y = Math.PI / 4;
    const hatchMat = new BAB.StandardMaterial('hatchMat', this.scene);
    hatchMat.diffuseColor = new BAB.Color3(0.45, 0.48, 0.54);
    hatch.material = hatchMat;

    this.bunkerShieldMesh = BAB.MeshBuilder.CreateSphere('bunkerShield', {
      diameter: 5.2,
      segments: 8,
      slice: 0.5
    }, this.scene);
    this.bunkerShieldMesh.position = new BAB.Vector3(6.5, 0, -10.5);
    const shieldMat = new BAB.StandardMaterial('shieldMat', this.scene);
    shieldMat.diffuseColor = new BAB.Color3(0.2, 0.8, 1.0);
    shieldMat.emissiveColor = new BAB.Color3(0.1, 0.5, 0.9);
    shieldMat.alpha = 0.0;
    this.bunkerShieldMesh.material = shieldMat;

    const meta = {
      module: 'shield_system',
      label: 'Búnker de Regolito (Shield): Refugio antirradiación.'
    };
    bunker.metadata = meta;
    hatch.metadata = meta;
    this.bunkerShieldMesh.metadata = meta;
  }

  initStatusBeacons() {
    const BAB = this.BAB;
    const beaconConfigs = {
      power: new BAB.Vector3(-11.5, 2.8, 0),
      agrodome: new BAB.Vector3(-7.5, 4.5, 6.5),
      life_support: new BAB.Vector3(7.3, 4.8, 4.8),
      shield: new BAB.Vector3(6.5, 3.0, -10.5)
    };

    this.statusBeaconColors = {
      nominal: new BAB.Color3(0.15, 0.9, 0.48),
      warning: new BAB.Color3(1.0, 0.62, 0.12),
      critical: new BAB.Color3(1.0, 0.16, 0.12)
    };

    Object.entries(beaconConfigs).forEach(([system, position]) => {
      const mesh = BAB.MeshBuilder.CreateSphere(`statusBeacon_${system}`, {
        diameter: 0.42,
        segments: 4
      }, this.scene);
      mesh.position = position;
      mesh.isPickable = false;

      const material = new BAB.StandardMaterial(`statusBeaconMat_${system}`, this.scene);
      material.diffuseColor = this.statusBeaconColors.nominal;
      material.emissiveColor = this.statusBeaconColors.nominal;
      material.disableLighting = true;
      mesh.material = material;

      this.statusBeacons[system] = { mesh, material, severity: 'nominal' };
    });
  }

  initMissionBeacon() {
    const BAB = this.BAB;
    // Central holographic mission terminal kiosk on the north plaza
    const terminal = BAB.MeshBuilder.CreateBox('missionTerminal', { width: 1.1, height: 1.6, depth: 0.8 }, this.scene);
    terminal.position = new BAB.Vector3(0, 0.8, 3.5);
    const termMat = new BAB.StandardMaterial('termMat', this.scene);
    termMat.diffuseColor = new BAB.Color3(0.25, 0.35, 0.55);
    terminal.material = termMat;

    const screen = BAB.MeshBuilder.CreateBox('termScreen', { width: 0.8, height: 0.6, depth: 0.1 }, this.scene);
    screen.position = new BAB.Vector3(0, 1.25, 3.08);
    const scrMat = new BAB.StandardMaterial('scrMat', this.scene);
    scrMat.emissiveColor = new BAB.Color3(0.2, 0.85, 1.0);
    scrMat.disableLighting = true;
    screen.material = scrMat;

    const meta = {
      module: 'mission_control',
      label: 'Terminal Control de Misión: Revisa las misiones y comunícate con Houston.'
    };
    terminal.metadata = meta;
    screen.metadata = meta;
  }

  initRover() {
    const BAB = this.BAB;
    this.roverGroup = new BAB.TransformNode('roverGroup', this.scene);
    this.roverGroup.position = new BAB.Vector3(3.8, 0, -6.5);

    const chassisMat = new BAB.StandardMaterial('roverChassisMat', this.scene);
    chassisMat.diffuseColor = new BAB.Color3(0.88, 0.89, 0.92);
    chassisMat.specularColor = new BAB.Color3(0, 0, 0);

    const wheelMat = new BAB.StandardMaterial('roverWheelMat', this.scene);
    wheelMat.diffuseColor = new BAB.Color3(0.12, 0.14, 0.18);

    const body = BAB.MeshBuilder.CreateBox('roverBody', { width: 1.8, height: 0.7, depth: 1.2 }, this.scene);
    body.position.y = 0.65;
    body.material = chassisMat;
    body.parent = this.roverGroup;

    const mast = BAB.MeshBuilder.CreateBox('roverMast', { width: 0.18, height: 1.0, depth: 0.18 }, this.scene);
    mast.position = new BAB.Vector3(-0.5, 1.3, 0);
    mast.material = chassisMat;
    mast.parent = this.roverGroup;

    const head = BAB.MeshBuilder.CreateBox('roverHead', { width: 0.5, height: 0.32, depth: 0.45 }, this.scene);
    head.position = new BAB.Vector3(-0.5, 1.85, 0);
    head.material = chassisMat;
    head.parent = this.roverGroup;

    const lens = BAB.MeshBuilder.CreateBox('roverLens', { width: 0.12, height: 0.15, depth: 0.2 }, this.scene);
    lens.position = new BAB.Vector3(-0.74, 1.85, 0);
    const lensMat = new BAB.StandardMaterial('lensMat', this.scene);
    lensMat.emissiveColor = new BAB.Color3(0.2, 0.85, 1.0);
    lens.material = lensMat;
    lens.parent = this.roverGroup;

    [-0.65, 0, 0.65].forEach((wx) => {
      [-0.7, 0.7].forEach((wz) => {
        const wheel = BAB.MeshBuilder.CreateCylinder('wheel', { diameter: 0.52, height: 0.25, tessellation: 8 }, this.scene);
        wheel.rotation.x = Math.PI / 2;
        wheel.position = new BAB.Vector3(wx, 0.26, wz);
        wheel.material = wheelMat;
        wheel.parent = this.roverGroup;
      });
    });

    const meta = {
      module: 'power_core',
      label: 'Rover de Mantenimiento: Úsalo para limpiar el polvo de los paneles solares.'
    };
    body.metadata = meta;
    head.metadata = meta;
  }

  initAstronautAndBots() {
    const BAB = this.BAB;
    this.astronautGroup = new BAB.TransformNode('astronautGroup', this.scene);
    this.astronautGroup.position = new BAB.Vector3(0, 0, 0);

    const suitMat = new BAB.StandardMaterial('suitMat', this.scene);
    suitMat.diffuseColor = new BAB.Color3(0.95, 0.96, 0.98);
    suitMat.specularColor = new BAB.Color3(0, 0, 0);

    const accentMat = new BAB.StandardMaterial('suitAccentMat', this.scene);
    accentMat.diffuseColor = new BAB.Color3(0.92, 0.42, 0.18);

    const visorMat = new BAB.StandardMaterial('visorMat', this.scene);
    visorMat.diffuseColor = new BAB.Color3(0.85, 0.45, 0.12);
    visorMat.emissiveColor = new BAB.Color3(0.35, 0.15, 0.05);

    const torso = BAB.MeshBuilder.CreateBox('astroTorso', { width: 0.75, height: 0.95, depth: 0.5 }, this.scene);
    torso.position.y = 1.05;
    torso.material = accentMat;
    torso.parent = this.astronautGroup;

    const backpack = BAB.MeshBuilder.CreateBox('astroPack', { width: 0.6, height: 0.8, depth: 0.35 }, this.scene);
    backpack.position = new BAB.Vector3(0, 1.15, 0.35);
    backpack.material = suitMat;
    backpack.parent = this.astronautGroup;

    const helmet = BAB.MeshBuilder.CreateBox('astroHelmet', { width: 0.75, height: 0.7, depth: 0.7 }, this.scene);
    helmet.position.y = 1.85;
    helmet.material = suitMat;
    helmet.parent = this.astronautGroup;

    const visor = BAB.MeshBuilder.CreateBox('astroVisor', { width: 0.52, height: 0.4, depth: 0.12 }, this.scene);
    visor.position = new BAB.Vector3(0, 1.85, -0.35);
    visor.material = visorMat;
    visor.parent = this.astronautGroup;

    const legL = BAB.MeshBuilder.CreateBox('legL', { width: 0.28, height: 0.6, depth: 0.3 }, this.scene);
    legL.position = new BAB.Vector3(-0.2, 0.3, 0);
    legL.material = suitMat;
    legL.parent = this.astronautGroup;

    const legR = BAB.MeshBuilder.CreateBox('legR', { width: 0.28, height: 0.6, depth: 0.3 }, this.scene);
    legR.position = new BAB.Vector3(0.2, 0.3, 0);
    legR.material = suitMat;
    legR.parent = this.astronautGroup;

    this.astroLegs = { left: legL, right: legR };

    const botCoords = [
      { x: -3.4, z: 2.2, color: new BAB.Color3(0.3, 0.78, 0.45) },
      { x: 11.2, z: -6.2, color: new BAB.Color3(0.4, 0.8, 0.4) },
      { x: -2.2, z: -9.5, color: new BAB.Color3(0.75, 0.65, 0.62) }
    ];
    botCoords.forEach((b, idx) => {
      const botMat = new BAB.StandardMaterial(`botMat_${idx}`, this.scene);
      botMat.diffuseColor = b.color;
      const bot = BAB.MeshBuilder.CreateBox(`helperBot_${idx}`, { width: 0.55, height: 0.65, depth: 0.55 }, this.scene);
      bot.position = new BAB.Vector3(b.x, 0.45, b.z);
      bot.material = botMat;
      this.helperBots.push({ mesh: bot, baseY: 0.45, offset: idx * 2.0 });
    });
  }

  initDustParticles() {
    const BAB = this.BAB;
    this.dustSystem = new BAB.ParticleSystem('marsDustParticles', 280, this.scene);
    const dustTex = new BAB.DynamicTexture('dustParticleTex', 8, this.scene, false, BAB.Texture.NEAREST_SAMPLINGMODE);
    const ctx = dustTex.getContext();
    ctx.fillStyle = '#E07D48';
    ctx.fillRect(1, 1, 6, 6);
    dustTex.update();

    this.dustSystem.particleTexture = dustTex;
    this.dustSystem.emitter = new BAB.Vector3(-18, 1.5, 0);
    this.dustSystem.minEmitBox = new BAB.Vector3(0, -1, -15);
    this.dustSystem.maxEmitBox = new BAB.Vector3(0, 4, 15);
    this.dustSystem.color1 = new BAB.Color4(0.88, 0.48, 0.25, 0.65);
    this.dustSystem.color2 = new BAB.Color4(0.75, 0.35, 0.16, 0.45);
    this.dustSystem.colorDead = new BAB.Color4(0.5, 0.2, 0.1, 0.0);
    this.dustSystem.minSize = 0.22;
    this.dustSystem.maxSize = 0.48;
    this.dustSystem.minLifeTime = 2.0;
    this.dustSystem.maxLifeTime = 3.8;
    this.dustSystem.emitRate = 20;
    this.dustSystem.direction1 = new BAB.Vector3(9, -0.3, -1);
    this.dustSystem.direction2 = new BAB.Vector3(14, 0.4, 1);
    this.dustSystem.minEmitPower = 1.5;
    this.dustSystem.maxEmitPower = 3.5;
    this.dustSystem.start();
  }

  initPicking() {
    this.scene.onPointerMove = (evt, pickInfo) => {
      if (pickInfo.hit && pickInfo.pickedMesh && pickInfo.pickedMesh.metadata) {
        this.canvas.style.cursor = 'pointer';
      } else {
        this.canvas.style.cursor = 'default';
      }
    };

    this.scene.onPointerDown = (evt, pickInfo) => {
      if (pickInfo.hit && pickInfo.pickedMesh && pickInfo.pickedMesh.metadata) {
        const meta = pickInfo.pickedMesh.metadata;
        if (this.onModuleClick) {
          this.onModuleClick(meta.module, meta.label);
        }
      }
    };
  }

  initKeyboard() {
    this.keyDownHandler = (e) => {
      // Do not steal typing inside inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }
      this.keys[code] = true;

      // Press E to interact with nearby module
      if (code === 'KeyE' && this.controlsEnabled && this.currentNearby) {
        if (this.onModuleClick) {
          this.onModuleClick(this.currentNearby.module, `Entrando a ${this.currentNearby.title}...`);
        }
      }
    };

    this.keyUpHandler = (e) => {
      this.keys[e.code] = false;
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  setVirtualKey(code, isPressed) {
    this.keys[code] = isPressed;
  }

  setControlsEnabled(enabled) {
    this.controlsEnabled = enabled;
    if (!enabled) this.keys = {};
  }

  zoomCamera(direction) {
    if (!this.camera) return;

    const zoomFactor = direction < 0 ? 0.9 : 1.1;
    this.camera.radius = Math.max(
      this.camera.lowerRadiusLimit,
      Math.min(this.camera.upperRadiusLimit, this.camera.radius * zoomFactor)
    );
  }

  syncGameState(state) {
    if (!state) return;

    const { systemStatuses } = getTelemetrySnapshot(state);
    Object.entries(this.statusBeacons).forEach(([system, beacon]) => {
      const severity = systemStatuses[system];
      beacon.severity = severity;
      beacon.material.diffuseColor = this.statusBeaconColors[severity];
      beacon.material.emissiveColor = this.statusBeaconColors[severity];
    });

    if (this.hemiLight && this.sunLight) {
      if (state.isNight) {
        this.scene.clearColor = new this.BAB.Color4(0.04, 0.02, 0.05, 1.0);
        this.hemiLight.intensity = 0.28;
        this.sunLight.intensity = 0.22;
        this.domeLights.forEach((l) => { l.intensity = 2.0; });
      } else {
        this.scene.clearColor = new this.BAB.Color4(0.11, 0.04, 0.05, 1.0);
        this.hemiLight.intensity = 0.85;
        this.sunLight.intensity = 1.1;
        this.domeLights.forEach((l) => { l.intensity = 1.2; });
      }
    }

    const stage = state.crops ? state.crops.stage : 0;
    const isPlanted = state.crops ? state.crops.planted : false;
    this.cropMeshes.forEach((plant) => {
      if (!isPlanted && stage === 0) {
        plant.scaling.set(0.4, 0.2, 0.4);
      } else if (stage === 1) {
        plant.scaling.set(0.7, 0.55, 0.7);
      } else if (stage === 2) {
        plant.scaling.set(0.95, 0.95, 0.95);
      } else {
        plant.scaling.set(1.15, 1.35, 1.15);
      }
    });

    const dust = state.dust === undefined ? 15 : state.dust;
    if (this.dustSystem) {
      this.dustSystem.emitRate = Math.max(12, Math.round(dust * 2.8));
    }
    this.solarPanels.forEach(({ mat }) => {
      const dustFactor = Math.min(1, dust / 100);
      mat.diffuseColor = new this.BAB.Color3(1.0, 1.0 - dustFactor * 0.35, 1.0 - dustFactor * 0.6);
    });

    if (this.bunkerShieldMesh) {
      this.bunkerShieldMesh.material.alpha = state.bunkerActive ? 0.35 : 0.0;
    }

    if (state.roverTask === 'cleaning' && !this.roverAnim.active) {
      this.roverAnim.active = true;
      this.roverAnim.phase = 0;
    }
  }

  updatePlayerMovement() {
    if (!this.astronautGroup || !this.controlsEnabled) return;

    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      const len = Math.hypot(moveX, moveZ);
      const speed = 0.16;
      const nx = (moveX / len) * speed;
      const nz = (moveZ / len) * speed;

      const nextX = Math.max(-15, Math.min(15, this.astronautGroup.position.x + nx));
      const nextZ = Math.max(-14, Math.min(14, this.astronautGroup.position.z + nz));
      this.astronautGroup.position.x = nextX;
      this.astronautGroup.position.z = nextZ;

      // Face direction of movement (visor faces -Z locally)
      const targetAngle = Math.atan2(-moveX, -moveZ);
      this.astronautGroup.rotation.y = targetAngle;

      // Walking animation
      this.walkTime += 0.25;
      this.astronautGroup.position.y = Math.abs(Math.sin(this.walkTime)) * 0.14;
      if (this.astroLegs.left && this.astroLegs.right) {
        this.astroLegs.left.rotation.x = Math.sin(this.walkTime) * 0.6;
        this.astroLegs.right.rotation.x = -Math.sin(this.walkTime) * 0.6;
      }
    } else {
      // Idle pose
      this.astronautGroup.position.y = Math.abs(Math.sin(Date.now() * 0.002)) * 0.06;
      if (this.astroLegs.left && this.astroLegs.right) {
        this.astroLegs.left.rotation.x = 0;
        this.astroLegs.right.rotation.x = 0;
      }
    }

    // Smooth camera follow
    const camTarget = new this.BAB.Vector3(
      this.astronautGroup.position.x * 0.45,
      0.5,
      this.astronautGroup.position.z * 0.45
    );
    this.camera.target = this.BAB.Vector3.Lerp(this.camera.target, camTarget, 0.08);

    // Check proximity to outpost buildings
    let closest = null;
    let closestDist = Infinity;
    for (const z of this.interactiveZones) {
      const d = Math.hypot(this.astronautGroup.position.x - z.x, this.astronautGroup.position.z - z.z);
      if (d <= z.radius && d < closestDist) {
        closest = z;
        closestDist = d;
      }
    }

    const prevMod = this.currentNearby ? `${this.currentNearby.module}:${this.currentNearby.title}` : null;
    const nextMod = closest ? `${closest.module}:${closest.title}` : null;
    if (prevMod !== nextMod) {
      this.currentNearby = closest;
      if (this.onProximityChange) {
        this.onProximityChange(closest);
      }
    }
  }

  update() {
    const t = Date.now() * 0.003;

    this.updatePlayerMovement();

    const earthDistance = this.BAB.Vector3.Distance(this.camera.position, this.earth.position);
    this.earth.scaling.setAll(earthDistance / this.earthReferenceDistance);

    Object.values(this.statusBeacons).forEach(({ mesh, severity }) => {
      const pulse = severity === 'critical' ? 1 + (0.12 * (0.5 + 0.5 * Math.sin(t * 5))) : 1;
      mesh.scaling.setAll(pulse);
    });

    this.domeLights.forEach((light, i) => {
      const base = light.intensity > 1.5 ? 1.85 : 1.15;
      light.intensity = base + Math.sin(t * 2.0 + i) * 0.15;
    });

    this.helperBots.forEach((b) => {
      b.mesh.position.y = b.baseY + Math.sin(t * 1.5 + b.offset) * 0.12;
      b.mesh.rotation.y += 0.015;
    });

    if (this.roverGroup && this.roverAnim.active) {
      this.roverAnim.phase += 0.018;
      const p = this.roverAnim.phase;
      if (p < Math.PI) {
        const dist = Math.sin(p);
        this.roverGroup.position.x = 3.8 - dist * 13.5;
        this.roverGroup.position.z = -6.5 + dist * 6.5;
        this.roverGroup.rotation.y = p < Math.PI / 2 ? -0.4 : Math.PI - 0.4;
      } else {
        this.roverAnim.active = false;
        this.roverGroup.position.set(3.8, 0, -6.5);
        this.roverGroup.rotation.y = 0;
      }
    }
  }

  dispose() {
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    this.scene.dispose();
    this.engine.dispose();
  }
}
