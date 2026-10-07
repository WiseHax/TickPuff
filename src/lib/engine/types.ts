export type TimeOfDay = 'morning' | 'day' | 'sunset' | 'night' | 'late-night';

export type WeatherType = 'clear' | 'rain' | 'heavy-rain' | 'snow' | 'fog' | 'petals' | 'leaves' | 'bubbles' | 'stars' | 'dust';

export type PetState = 'IDLE' | 'WALK' | 'RUN' | 'SLEEP' | 'SIT' | 'LOOK' | 'REACT' | 'PLAY' | 'HIDE';

export interface ThemeColors {
  bgTop: string;
  bgBottom: string;
  text: string;
  textMuted: string;
  accent: string;
  glass: string;
  ambientLight?: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  allowedWeather: WeatherType[];
  defaultWeather: WeatherType;
  availablePets: string[];
  defaultPet: string;
  colors: Record<TimeOfDay, ThemeColors>;
  clockStyle: {
    font: string;
    shadow: string;
  };
  audio: {
    ambience?: string;
    weather?: string;
  };
}

export interface EngineState {
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  activeThemeId: string;
  activePetId: string;
}
