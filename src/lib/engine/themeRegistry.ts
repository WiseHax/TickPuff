import type { ThemeConfig } from './types';

// Helper for generating colors across times of day if not fully custom
function generateColors(baseBgTop: string, baseBgBottom: string, accent: string) {
  return {
    morning: {
      bgTop: baseBgTop, bgBottom: baseBgBottom,
      text: '#ffffff', textMuted: 'rgba(255,255,255,0.7)', accent, glass: 'rgba(255,255,255,0.1)'
    },
    day: {
      bgTop: baseBgTop, bgBottom: baseBgBottom,
      text: '#ffffff', textMuted: 'rgba(255,255,255,0.7)', accent, glass: 'rgba(255,255,255,0.1)'
    },
    sunset: {
      bgTop: '#ff7e5f', bgBottom: '#feb47b', // Generic sunset override 
      text: '#ffffff', textMuted: 'rgba(255,255,255,0.7)', accent, glass: 'rgba(255,255,255,0.1)'
    },
    night: {
      bgTop: '#0f2027', bgBottom: '#203a43', // Generic night override
      text: '#ffffff', textMuted: 'rgba(255,255,255,0.6)', accent, glass: 'rgba(0,0,0,0.4)'
    },
    'late-night': {
      bgTop: '#000000', bgBottom: '#111111',
      text: '#ffffff', textMuted: 'rgba(255,255,255,0.4)', accent, glass: 'rgba(0,0,0,0.6)'
    }
  };
}

export const themeRegistry: Record<string, ThemeConfig> = {
  forest: {
    id: 'forest',
    name: 'Cozy Forest',
    description: 'A deep woodland cabin environment',
    allowedWeather: ['clear', 'rain', 'fog', 'snow'],
    defaultWeather: 'fog',
    availablePets: ['cat', 'fox', 'bear'],
    defaultPet: 'cat',
    clockStyle: { font: 'Pixelify Sans', shadow: '0 4px 20px rgba(0,0,0,0.8)' },
    audio: {},
    colors: {
      morning: { bgTop: '#8da684', bgBottom: '#4e6e58', text: '#e8f5e9', textMuted: '#a5d6a7', accent: '#4caf50', glass: 'rgba(78, 110, 88, 0.4)' },
      day: { bgTop: '#5b8266', bgBottom: '#2b4534', text: '#e8f5e9', textMuted: '#a5d6a7', accent: '#4caf50', glass: 'rgba(43, 69, 52, 0.4)' },
      sunset: { bgTop: '#d4886a', bgBottom: '#3a3b34', text: '#ffede4', textMuted: '#eab8a3', accent: '#ff9800', glass: 'rgba(58, 59, 52, 0.4)' },
      night: { bgTop: '#10161d', bgBottom: '#1a2a22', text: '#e8f5e9', textMuted: '#a5d6a7', accent: '#4caf50', glass: 'rgba(26, 42, 34, 0.4)' },
      'late-night': { bgTop: '#080a0e', bgBottom: '#0d1511', text: '#c8d5c9', textMuted: '#759677', accent: '#2e7d32', glass: 'rgba(13, 21, 17, 0.6)' }
    }
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura Dream',
    description: 'A quiet Japanese-inspired village',
    allowedWeather: ['clear', 'petals', 'rain'],
    defaultWeather: 'petals',
    availablePets: ['fox', 'cat', 'bunny'],
    defaultPet: 'fox',
    clockStyle: { font: 'Outfit', shadow: '0 4px 15px rgba(255, 64, 129, 0.4)' },
    audio: {},
    colors: {
      morning: { bgTop: '#ffcdd2', bgBottom: '#f8bbd0', text: '#4a148c', textMuted: '#7b1fa2', accent: '#c2185b', glass: 'rgba(255, 255, 255, 0.4)' },
      day: { bgTop: '#f8bbd0', bgBottom: '#e1bee7', text: '#4a148c', textMuted: '#7b1fa2', accent: '#c2185b', glass: 'rgba(255, 255, 255, 0.4)' },
      sunset: { bgTop: '#ffb74d', bgBottom: '#f06292', text: '#ffffff', textMuted: '#ffcdd2', accent: '#ff4081', glass: 'rgba(240, 98, 146, 0.4)' },
      night: { bgTop: '#2a1a24', bgBottom: '#3d2532', text: '#fce4ec', textMuted: '#f48fb1', accent: '#ff4081', glass: 'rgba(42, 26, 36, 0.4)' },
      'late-night': { bgTop: '#180e15', bgBottom: '#22141c', text: '#d9c2cb', textMuted: '#c46988', accent: '#d81b60', glass: 'rgba(24, 14, 21, 0.6)' }
    }
  },
  aquarium: {
    id: 'aquarium',
    name: 'Deep Aquarium',
    description: 'An underwater ecosystem',
    allowedWeather: ['clear', 'bubbles'],
    defaultWeather: 'bubbles',
    availablePets: ['jellyfish', 'fish', 'turtle'],
    defaultPet: 'jellyfish',
    clockStyle: { font: 'Space Mono', shadow: '0 4px 25px rgba(33, 150, 243, 0.6)' },
    audio: {},
    colors: {
      morning: { bgTop: '#81d4fa', bgBottom: '#0277bd', text: '#ffffff', textMuted: '#b3e5fc', accent: '#00b0ff', glass: 'rgba(2, 119, 189, 0.4)' },
      day: { bgTop: '#29b6f6', bgBottom: '#01579b', text: '#ffffff', textMuted: '#81d4fa', accent: '#00b0ff', glass: 'rgba(1, 87, 155, 0.4)' },
      sunset: { bgTop: '#ce93d8', bgBottom: '#1565c0', text: '#ffffff', textMuted: '#e1bee7', accent: '#b388ff', glass: 'rgba(21, 101, 192, 0.4)' },
      night: { bgTop: '#08111e', bgBottom: '#0d2b4f', text: '#e3f2fd', textMuted: '#90caf9', accent: '#2196f3', glass: 'rgba(15, 28, 46, 0.4)' },
      'late-night': { bgTop: '#03070d', bgBottom: '#06172e', text: '#bbdefb', textMuted: '#64b5f6', accent: '#1976d2', glass: 'rgba(6, 23, 46, 0.6)' }
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyber City',
    description: 'A neon-lit futuristic rooftop',
    allowedWeather: ['clear', 'rain', 'fog'],
    defaultWeather: 'rain',
    availablePets: ['robot', 'drone'],
    defaultPet: 'robot',
    clockStyle: { font: 'VT323', shadow: '0 0 20px #0ff, 0 0 40px #0ff' },
    audio: {},
    colors: {
      morning: { bgTop: '#2c3e50', bgBottom: '#000000', text: '#0ff', textMuted: '#0aa', accent: '#f0f', glass: 'rgba(0,0,0,0.6)' },
      day: { bgTop: '#34495e', bgBottom: '#111', text: '#0ff', textMuted: '#0aa', accent: '#f0f', glass: 'rgba(0,0,0,0.6)' },
      sunset: { bgTop: '#f39c12', bgBottom: '#2c3e50', text: '#0ff', textMuted: '#0aa', accent: '#f0f', glass: 'rgba(0,0,0,0.6)' },
      night: { bgTop: '#000428', bgBottom: '#004e92', text: '#0ff', textMuted: '#0aa', accent: '#f0f', glass: 'rgba(0,0,0,0.8)' },
      'late-night': { bgTop: '#000000', bgBottom: '#0a0a0a', text: '#0ff', textMuted: '#0aa', accent: '#f0f', glass: 'rgba(0,0,0,0.9)' }
    }
  },
  library: {
    id: 'library',
    name: 'Magic Library',
    description: 'A cozy magical study',
    allowedWeather: ['clear', 'dust'],
    defaultWeather: 'dust',
    availablePets: ['owl', 'cat'],
    defaultPet: 'owl',
    clockStyle: { font: 'Outfit', shadow: '0 4px 15px rgba(255, 193, 7, 0.3)' },
    audio: {},
    colors: {
      morning: { bgTop: '#d7ccc8', bgBottom: '#795548', text: '#fff3e0', textMuted: '#ffcc80', accent: '#ffb300', glass: 'rgba(121, 85, 72, 0.6)' },
      day: { bgTop: '#bcaaa4', bgBottom: '#5d4037', text: '#fff3e0', textMuted: '#ffcc80', accent: '#ffb300', glass: 'rgba(93, 64, 55, 0.6)' },
      sunset: { bgTop: '#ffcc80', bgBottom: '#4e342e', text: '#fff3e0', textMuted: '#ffcc80', accent: '#ffb300', glass: 'rgba(78, 52, 46, 0.6)' },
      night: { bgTop: '#2b1b17', bgBottom: '#1e1311', text: '#ffe0b2', textMuted: '#ffb74d', accent: '#ff9800', glass: 'rgba(30, 19, 17, 0.8)' },
      'late-night': { bgTop: '#140c0a', bgBottom: '#0a0605', text: '#ffcc80', textMuted: '#ffa726', accent: '#f57c00', glass: 'rgba(10, 6, 5, 0.9)' }
    }
  }
};
