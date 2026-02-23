import { create } from 'zustand';
import { Track } from '../models/Types';

const TRACK_COLORS = ['#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#1abc9c'];

const DEFAULT_TRACKS: Track[] = [
  {
    id: 1,
    name: 'Main Vocals',
    type: 'audio',
    color: '#e74c3c',
    muted: false,
    solo: false,
    volume: 80,
    pan: 0,
    clips: [{ id: 1, name: 'Vocal Take 1', startBeat: 0, duration: 16 }],
  },
  {
    id: 2,
    name: 'Keys',
    type: 'instrument',
    color: '#9b59b6',
    muted: false,
    solo: false,
    volume: 75,
    pan: -20,
    clips: [
      { id: 2, name: 'Instrument', startBeat: 4, duration: 8 },
      { id: 3, name: 'Instrument', startBeat: 14, duration: 6 },
    ],
  },
  {
    id: 3,
    name: 'Synth Line',
    type: 'instrument',
    color: '#f1c40f',
    muted: false,
    solo: false,
    volume: 70,
    pan: 30,
    clips: [{ id: 4, name: 'Synth Line', startBeat: 8, duration: 12 }],
  },
  {
    id: 4,
    name: 'Bass Drum',
    type: 'drums',
    color: '#3498db',
    muted: false,
    solo: false,
    volume: 85,
    pan: 0,
    clips: [{ id: 5, name: 'Instrument', startBeat: 12, duration: 10 }],
  },
];

interface DawStore {
  // Project
  projectName: string;
  setProjectName: (name: string) => void;

  // Transport
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  musicalKey: string;
  togglePlay: () => void;
  toggleRecord: () => void;
  setCurrentTime: (time: number) => void;
  setBpm: (bpm: number) => void;
  setMusicalKey: (key: string) => void;
  rewind: () => void;
  stop: () => void;

  // Tracks
  tracks: Track[];
  addTrack: () => void;
  deleteTrack: (trackId: number) => void;
  toggleMute: (trackId: number) => void;
  toggleSolo: (trackId: number) => void;
  setTrackVolume: (trackId: number, volume: number) => void;

  // UI
  zoom: number;
  setZoom: (zoom: number) => void;
}

const useDawStore = create<DawStore>((set) => ({
  // Project
  projectName: 'Untitled Project',
  setProjectName: (projectName) => set({ projectName }),

  // Transport
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  bpm: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  musicalKey: 'C',
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  toggleRecord: () => set((s) => ({ isRecording: !s.isRecording })),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setBpm: (bpm) => set({ bpm }),
  setMusicalKey: (musicalKey) => set({ musicalKey }),
  rewind: () => set({ currentTime: 0 }),
  stop: () => set({ isPlaying: false, currentTime: 0 }),

  // Tracks
  tracks: DEFAULT_TRACKS,
  addTrack: () =>
    set((s) => ({
      tracks: [
        ...s.tracks,
        {
          id: Date.now(),
          name: `Track ${s.tracks.length + 1}`,
          type: 'instrument',
          color: TRACK_COLORS[s.tracks.length % TRACK_COLORS.length],
          muted: false,
          solo: false,
          volume: 75,
          pan: 0,
          clips: [],
        },
      ],
    })),
  deleteTrack: (trackId) =>
    set((s) => ({
      tracks: s.tracks.filter((t) => t.id !== trackId),
    })),
  toggleMute: (trackId) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      ),
    })),
  toggleSolo: (trackId) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId ? { ...t, solo: !t.solo } : t
      ),
    })),
  setTrackVolume: (trackId, volume) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId ? { ...t, volume } : t
      ),
    })),

  // UI
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
}));

export default useDawStore;