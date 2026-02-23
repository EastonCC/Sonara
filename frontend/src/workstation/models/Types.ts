export interface MidiNote {
  id: number;
  pitch: number;     // MIDI note number (0-127), e.g. 60 = C4
  startBeat: number; // Position within the clip (relative to clip start)
  duration: number;  // Length in beats
  velocity: number;  // 0-127
}

export interface Clip {
  id: number;
  name: string;
  startBeat: number;
  duration: number;
  // For instrument/drum tracks
  notes: MidiNote[];
  // For audio tracks
  audioFileUrl?: string;
}

export type InstrumentPreset = 'triangle' | 'sawtooth' | 'square' | 'sine' | 'fm' | 'am' | 'fat' | 'membrane' | 'metal' | 'pluck';

export interface Track {
  id: number;
  name: string;
  type: 'audio' | 'instrument' | 'drums';
  instrument: InstrumentPreset;
  color: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  clips: Clip[];
}