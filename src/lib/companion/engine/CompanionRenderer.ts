/**
 * The 3D layer: one transparent, full-window WebGL canvas drawn over the 2D
 * scenery, holding the companion and the GPU particle effects.
 *
 * Lifecycle: create → setWorld / setCompanion as state changes → dispose().
 * The render loop is owned here, capped by the performance profile, slowed
 * down while nothing moves, and stopped while the window is hidden.
 */
import * as THREE from 'three';
import { clamp, damp, lerp } from '$lib/core/math';
import { EffectsLayer } from '$lib/effects/EffectsLayer';
import type {
  AmbientEffect,
  CompanionActivity,
  CompanionDefinition,
  CompanionState,
  PerformanceProfile,
  ThemeColors,
  ThemeDefinition,
  TimeOfDay,
  WeatherType,
} from '$lib/types';
import { BehaviorController } from '../behavior/BehaviorController';
import { InteractionController } from '../interaction/InteractionController';
import { Navigator, type Vec3 } from '../navigation/Navigator';
import { StageMapper } from '../navigation/StageMapper';
import { loadGltfCompanion, loadProceduralCompanion, type LoadedCompanion } from './CompanionLoader';

export interface WorldContext {
  theme: ThemeDefinition;
  colors: ThemeColors;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  ambient: AmbientEffect[];
  sleepMode: boolean;
  focusActive: boolean;
  companionVisible: boolean;
}

export interface RendererOptions {
  host: HTMLElement;
  hitbox: HTMLElement | null;
  profile: PerformanceProfile;
  /** Called when the companion starts a new activity. */
  onStateChange?: (state: CompanionState) => void;
  /** Position to continue from (e.g. after the renderer is recreated). */
  initial?: { position: Vec3; heading: number };
}

const FOV = 30;
const CAMERA_POSITION = new THREE.Vector3(0, 4.3, 15);
const CAMERA_TARGET = new THREE.Vector3(0, 3, 0);
const SPAWN_SECONDS = 0.45;

interface LightPreset {
  key: string;
  keyIntensity: number;
  hemiIntensity: number;
  rimIntensity: number;
}

const LIGHTING: Record<TimeOfDay, LightPreset> = {
  morning: { key: '#ffe2c4', keyIntensity: 1.5, hemiIntensity: 1.05, rimIntensity: 0.5 },
  day: { key: '#fff6e8', keyIntensity: 1.7, hemiIntensity: 1.2, rimIntensity: 0.45 },
  sunset: { key: '#ffb074', keyIntensity: 1.5, hemiIntensity: 0.95, rimIntensity: 0.7 },
  night: { key: '#a8bcff', keyIntensity: 1.0, hemiIntensity: 0.75, rimIntensity: 0.9 },
  'late-night': { key: '#8697d8', keyIntensity: 0.8, hemiIntensity: 0.6, rimIntensity: 0.9 },
};

/** Activities during which the companion turns to face the viewer. */
const FACE_VIEWER: CompanionActivity[] = [
  'idle',
  'sit',
  'focus',
  'look',
  'react',
  'celebrate',
  'wake',
  'weather-react',
  'play',
];

export class CompanionRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  private readonly hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  private readonly key = new THREE.DirectionalLight(0xffffff, 1.5);
  private readonly rim = new THREE.DirectionalLight(0xffffff, 0.5);
  private readonly actor = new THREE.Group();
  private readonly shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly mapper: StageMapper;
  private readonly effects: EffectsLayer;
  private readonly interaction: InteractionController;
  private readonly navigator: Navigator;
  private readonly behavior = new BehaviorController('calm');
  private readonly headPosition = new THREE.Vector3();
  private readonly resizeObserver: ResizeObserver;

  private profile: PerformanceProfile;
  private world: WorldContext | null = null;
  private companion: LoadedCompanion | null = null;
  private loadToken = 0;
  private spawn = 1;
  private arrived = false;
  private lastPlan = -1;
  private lastActivity: CompanionActivity | null = null;
  private raf = 0;
  private lastFrame = 0;
  private time = 0;
  private disposed = false;
  /** Set until the first world arrives (no stage to place the companion on yet). */
  private placeAtStageCenter = false;
  private readonly onVisibility = () => this.syncLoop();
  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  };
  private readonly onContextRestored = () => this.syncLoop();

  constructor(private readonly options: RendererOptions) {
    this.profile = options.profile;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: options.profile.antialias,
      powerPreference: options.profile.mode === 'BEAUTIFUL' ? 'default' : 'low-power',
    });
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.className = 'companion-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    options.host.appendChild(canvas);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);

    this.camera.position.copy(CAMERA_POSITION);
    this.camera.lookAt(CAMERA_TARGET);
    this.mapper = new StageMapper(this.camera);

    this.key.position.set(4, 8, 6);
    this.rim.position.set(-5, 4, -6);
    this.scene.add(this.hemi, this.key, this.rim, this.actor);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: createShadowTexture(), transparent: true, depthWrite: false, opacity: 0.32 }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 1;
    this.scene.add(this.shadow);

    this.effects = new EffectsLayer(this.scene);
    this.effects.setDensity(options.profile.particleDensity);

    this.resize();
    this.navigator = new Navigator(options.initial?.position ?? { x: 0, y: 0, z: 0 });
    if (options.initial) this.navigator.heading = options.initial.heading;
    else this.placeAtStageCenter = true;

    this.interaction = new InteractionController(options.hitbox, {
      onPoke: () => this.behavior.poke(),
      onHoverChange: () => undefined,
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(options.host);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.syncLoop();
  }

  /** Whether switching to `profile` needs a new renderer (antialias is fixed at creation). */
  needsRecreate(profile: PerformanceProfile): boolean {
    return profile.antialias !== this.profile.antialias;
  }

  setProfile(profile: PerformanceProfile) {
    this.profile = profile;
    this.effects.setDensity(profile.particleDensity);
    this.resize();
  }

  snapshot(): { position: Vec3; heading: number } {
    return { position: { ...this.navigator.position }, heading: this.navigator.heading };
  }

  setWorld(world: WorldContext) {
    const previousTheme = this.world?.theme.id;
    this.world = world;
    if (this.placeAtStageCenter || (previousTheme && previousTheme !== world.theme.id)) {
      // A new world: start in the middle of its stage (it's a different place).
      this.placeAtStageCenter = false;
      const stage = world.theme.stage;
      const center = this.mapper.toWorld((stage.minX + stage.maxX) / 2, 0.4);
      this.navigator.position.x = center.x;
      this.navigator.position.z = center.z;
      this.navigator.stop();
      this.lastPlan = -1;
    }
    this.applyLighting();
    this.effects.setWeather(world.weather);
    this.effects.setAmbient(world.ambient);
    this.effects.setDim(world.sleepMode ? 0.45 : 1);
    this.actor.visible = world.companionVisible;
    this.shadow.visible = world.companionVisible;
    this.syncLoop();
  }

  setCompanion(definition: CompanionDefinition) {
    if (this.companion?.definition.id === definition.id) return;
    const token = ++this.loadToken;
    this.install(loadProceduralCompanion(definition));
    if (definition.model.kind === 'gltf') {
      loadGltfCompanion(definition)
        .then((loaded) => {
          if (this.disposed || token !== this.loadToken) loaded.dispose();
          else this.install(loaded, false);
        })
        .catch((error) =>
          console.warn(
            `[tickpuff] Could not load ${definition.model.kind} model for ${definition.id}; using the procedural fallback.`,
            error,
          ),
        );
    }
  }

  /** A focus session finished. */
  celebrate() {
    this.behavior.celebrate();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.interaction.dispose();
    this.companion?.dispose();
    this.companion = null;
    this.effects.dispose();
    this.shadow.geometry.dispose();
    this.shadow.material.map?.dispose();
    this.shadow.material.dispose();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('webglcontextlost', this.onContextLost);
    canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }

  private install(loaded: LoadedCompanion, animateSpawn = true) {
    this.companion?.dispose();
    this.actor.clear();
    this.companion = loaded;
    loaded.rig.root.scale.setScalar(loaded.definition.scale);
    this.actor.add(loaded.rig.root);
    this.behavior.setPersonality(loaded.definition.personality);
    if (animateSpawn) this.spawn = 0;
    this.lastActivity = null;
    // Keep the current altitude sensible for the new companion's range.
    const range = loaded.definition.altitude;
    this.navigator.position.y = range ? clamp(this.navigator.position.y, range.min, range.max) : 0;
  }

  private applyLighting() {
    if (!this.world) return;
    const { colors, timeOfDay, sleepMode, theme } = this.world;
    const preset = LIGHTING[timeOfDay];
    const dim = sleepMode ? 0.6 : 1;
    const sky = new THREE.Color(colors.bgTop).lerp(new THREE.Color(0xffffff), 0.55);
    this.hemi.color.copy(sky);
    this.hemi.groundColor.set(colors.bgBottom);
    this.hemi.intensity = preset.hemiIntensity * dim;
    this.key.color.set(preset.key);
    if (theme.stage.medium === 'water') this.key.color.lerp(new THREE.Color('#bfe6ff'), 0.5);
    this.key.intensity = preset.keyIntensity * dim;
    this.rim.color.set(colors.accent);
    this.rim.intensity = preset.rimIntensity * dim;
  }

  private resize() {
    const width = Math.max(1, this.options.host.clientWidth);
    const height = Math.max(1, this.options.host.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, this.profile.pixelRatioCap);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    const pixelsPerUnit = (height * ratio) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    this.effects.setScale(pixelsPerUnit, ratio);
    if (this.raf === 0 && !this.disposed) this.renderer.render(this.scene, this.camera);
  }

  private shouldRun(): boolean {
    return !this.disposed && document.visibilityState !== 'hidden';
  }

  private syncLoop() {
    if (this.shouldRun() && this.raf === 0) {
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    } else if (!this.shouldRun() && this.raf !== 0) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private readonly frame = (now: number) => {
    if (!this.shouldRun()) {
      this.raf = 0;
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
    const resting = !this.effects.active && (this.lastActivity === 'sleep' || !this.world?.companionVisible);
    const fps = resting ? this.profile.restingFps : this.profile.maxFps;
    const elapsed = now - this.lastFrame;
    if (elapsed < 1000 / fps - 2) return;
    const dt = Math.min(0.1, elapsed / 1000);
    this.lastFrame = now;
    this.time += dt;
    this.step(dt);
    this.effects.update(this.time);
    this.renderer.render(this.scene, this.camera);
  };

  private step(dt: number) {
    const world = this.world;
    const companion = this.companion;
    if (!world || !companion) return;
    const { definition, rig, animator } = companion;
    const stage = world.theme.stage;

    if (!world.companionVisible) {
      this.interaction.updateHitbox(this.camera, this.actor.position, 0, 0, false);
      return;
    }

    const output = this.behavior.update(dt, {
      stage,
      timeOfDay: world.timeOfDay,
      weather: world.weather,
      sleepMode: world.sleepMode,
      focusActive: world.focusActive,
      hovered: this.interaction.hovered,
      arrived: this.arrived,
      position: this.mapper.toStage(this.navigator.position),
    });
    this.arrived = false;

    if (output.plan !== this.lastPlan) {
      this.lastPlan = output.plan;
      if (output.destination) {
        const ground = this.mapper.toWorld(output.destination.x, output.destination.depth);
        const speed = output.pace === 'run' ? definition.speed.run : definition.speed.walk;
        this.navigator.moveTo({ x: ground.x, y: this.altitudeFor(output.destination.altitude), z: ground.z }, speed);
      } else {
        this.navigator.stop();
      }
    }
    this.navigator.setRestHeading(
      output.activity === 'sleep' ? -0.5 : FACE_VIEWER.includes(output.activity) ? 0 : null,
    );

    const { arrived } = this.navigator.update(dt);
    this.arrived = arrived;
    this.navigator.constrain((position) => this.mapper.clampToStage(position, stage.minX, stage.maxX));

    // Hovering companions settle down to rest; ground companions stay on the ground.
    const range = definition.altitude;
    if (!range) this.navigator.position.y = 0;
    else if (!this.navigator.destination && output.activity === 'sleep') {
      this.navigator.position.y = damp(this.navigator.position.y, range.min, 1.2, dt);
    }

    this.actor.position.set(this.navigator.position.x, this.navigator.position.y, this.navigator.position.z);
    this.actor.rotation.y = this.navigator.heading;

    // Spawn "pop" when a companion appears.
    if (this.spawn < 1) {
      this.spawn = Math.min(1, this.spawn + dt / SPAWN_SECONDS);
      const t = this.spawn;
      const pop = 1 + Math.sin(t * Math.PI) * 0.15;
      this.actor.scale.setScalar(Math.max(0.01, t * pop));
    } else {
      this.actor.scale.setScalar(1);
    }

    let lookYaw = 0;
    let lookPitch = 0;
    if (output.watchPointer) {
      rig.head.getWorldPosition(this.headPosition);
      ({ yaw: lookYaw, pitch: lookPitch } = this.interaction.lookAngles(
        this.camera,
        this.headPosition,
        this.navigator.heading,
      ));
    }
    animator.update(dt, this.time, {
      activity: output.activity,
      activityTime: output.activityTime,
      speed: this.navigator.speed,
      runSpeed: definition.speed.run,
      lookYaw,
      lookPitch,
      lookWeight: output.watchPointer ? 1 : 0,
    });

    // Blob shadow on the ground, smaller and fainter the higher we float.
    const scale = definition.scale;
    const lift = clamp(this.navigator.position.y / 4, 0, 0.7);
    const size = rig.footprint * 2.2 * scale * (1 - lift * 0.6);
    this.shadow.position.set(this.navigator.position.x, 0.01, this.navigator.position.z);
    this.shadow.scale.set(size, size * 0.8, 1);
    this.shadow.material.opacity = lerp(0.32, 0.08, lift);

    this.interaction.updateHitbox(
      this.camera,
      this.actor.position,
      rig.height * scale,
      Math.max(0.8, rig.footprint * 2 * scale),
      true,
    );

    if (output.activity !== this.lastActivity) {
      this.lastActivity = output.activity;
      this.options.onStateChange?.({
        id: definition.id,
        activity: output.activity,
        moving: this.navigator.speed > 0.05,
      });
    }
  }

  private altitudeFor(fraction: number): number {
    const range = this.companion?.definition.altitude;
    return range ? lerp(range.min, range.max, clamp(fraction, 0, 1)) : 0;
  }
}

function createShadowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0.9)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.45)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
