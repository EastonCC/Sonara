export interface Clip {
  id: number;
  name: string;
  startBeat: number;
  duration: number;
}

export interface Track {
  id: number;
  name: string;
  type: 'audio' | 'instrument' | 'drums';
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  clips: Clip[];
}