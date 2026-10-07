/**
 * Owns the active weather effect and the theme's ambient effects, and
 * rebuilds them only when the effect or density actually changes.
 */
import type * as THREE from 'three';
import type { AmbientEffect, WeatherType } from '$lib/types';
import { ParticleField } from './ParticleField';
import { AMBIENT_PRESETS, WEATHER_PRESETS } from './presets';

export class EffectsLayer {
  private weatherType: WeatherType = 'clear';
  private weather: ParticleField | null = null;
  private ambient = new Map<AmbientEffect, ParticleField>();
  private wantedAmbient: AmbientEffect[] = [];
  private density = 1;
  private scale = 500;
  private pixelRatio = 1;
  private dim = 1;

  constructor(private readonly scene: THREE.Scene) {}

  /** True when any particle is on screen (used to pick the frame rate). */
  get active(): boolean {
    return this.weather !== null || this.ambient.size > 0;
  }

  setDensity(density: number) {
    if (density === this.density) return;
    this.density = density;
    this.rebuildWeather();
    this.clearAmbient();
    this.setAmbient(this.wantedAmbient);
  }

  setWeather(type: WeatherType) {
    if (type === this.weatherType) return;
    this.weatherType = type;
    this.rebuildWeather();
  }

  private rebuildWeather() {
    this.weather?.dispose();
    this.weather = null;
    const preset = WEATHER_PRESETS[this.weatherType];
    if (preset && this.density > 0) this.weather = this.add(new ParticleField(preset, this.density));
  }

  setAmbient(effects: AmbientEffect[]) {
    this.wantedAmbient = [...effects];
    for (const [effect, field] of this.ambient) {
      if (!effects.includes(effect)) {
        field.dispose();
        this.ambient.delete(effect);
      }
    }
    if (this.density <= 0) return;
    for (const effect of effects) {
      if (!this.ambient.has(effect))
        this.ambient.set(effect, this.add(new ParticleField(AMBIENT_PRESETS[effect], this.density)));
    }
  }

  /** Calmer effects while the world sleeps. */
  setDim(multiplier: number) {
    this.dim = multiplier;
    this.each((field) => field.setOpacity(multiplier));
  }

  setScale(scale: number, pixelRatio = 1) {
    this.scale = scale;
    this.pixelRatio = pixelRatio;
    this.each((field) => field.setScale(scale, pixelRatio));
  }

  update(time: number) {
    this.each((field) => field.update(time));
  }

  dispose() {
    this.weather?.dispose();
    this.weather = null;
    this.clearAmbient();
  }

  private add(field: ParticleField): ParticleField {
    field.setScale(this.scale, this.pixelRatio);
    field.setOpacity(this.dim);
    this.scene.add(field.points);
    return field;
  }

  private clearAmbient() {
    this.ambient.forEach((field) => field.dispose());
    this.ambient.clear();
  }

  private each(fn: (field: ParticleField) => void) {
    if (this.weather) fn(this.weather);
    this.ambient.forEach(fn);
  }
}
