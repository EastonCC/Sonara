import { create } from 'zustand';
import { Track, InstrumentPreset, TrackEffects, DEFAULT_EFFECTS, AutomationPoint } from '../models/types';

const TRACK_COLORS = ['#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#1abc9c'];

const DEFAULT_TRACKS: Track[] = [
  {
    id: 1, name: 'Main Vocals', type: 'audio', instrument: 'triangle',
    color: '#e74c3c', muted: false, solo: false, volume: 80, pan: 0,
    clips: [{ id: 1, name: 'Vocal Take 1', startBeat: 0, duration: 16, notes: [] }],
    effects: { ...DEFAULT_EFFECTS }, volumeAutomation: [],
  },
  {
    id: 2, name: 'Keys', type: 'instrument', instrument: 'triangle',
    color: '#9b59b6', muted: false, solo: false, volume: 75, pan: -20,
    clips: [
      { id: 2, name: 'Chord Progression', startBeat: 4, duration: 8, notes: [
        { id: 201, pitch: 60, startBeat: 0, duration: 2, velocity: 80 },
        { id: 202, pitch: 64, startBeat: 0, duration: 2, velocity: 75 },
        { id: 203, pitch: 67, startBeat: 0, duration: 2, velocity: 75 },
        { id: 204, pitch: 62, startBeat: 2, duration: 2, velocity: 80 },
        { id: 205, pitch: 65, startBeat: 2, duration: 2, velocity: 75 },
        { id: 206, pitch: 69, startBeat: 2, duration: 2, velocity: 75 },
        { id: 207, pitch: 64, startBeat: 4, duration: 2, velocity: 80 },
        { id: 208, pitch: 67, startBeat: 4, duration: 2, velocity: 75 },
        { id: 209, pitch: 71, startBeat: 4, duration: 2, velocity: 75 },
        { id: 210, pitch: 60, startBeat: 6, duration: 2, velocity: 80 },
        { id: 211, pitch: 64, startBeat: 6, duration: 2, velocity: 75 },
        { id: 212, pitch: 67, startBeat: 6, duration: 2, velocity: 75 },
      ] },
      { id: 3, name: 'Melody', startBeat: 14, duration: 6, notes: [
        { id: 301, pitch: 72, startBeat: 0, duration: 1, velocity: 90 },
        { id: 302, pitch: 74, startBeat: 1, duration: 0.5, velocity: 85 },
        { id: 303, pitch: 76, startBeat: 1.5, duration: 1.5, velocity: 85 },
        { id: 304, pitch: 74, startBeat: 3, duration: 1, velocity: 80 },
        { id: 305, pitch: 72, startBeat: 4, duration: 2, velocity: 90 },
      ] },
    ],
  },
  {
    id: 3, name: 'Synth Line', type: 'instrument', instrument: 'sawtooth',
    color: '#f1c40f', muted: false, solo: false, volume: 70, pan: 30,
    clips: [{ id: 4, name: 'Synth Line', startBeat: 8, duration: 12, notes: [
      { id: 401, pitch: 48, startBeat: 0, duration: 3, velocity: 90 },
      { id: 402, pitch: 48, startBeat: 4, duration: 2, velocity: 85 },
      { id: 403, pitch: 50, startBeat: 7, duration: 3, velocity: 85 },
      { id: 404, pitch: 48, startBeat: 10, duration: 2, velocity: 90 },
    ] }],
    effects: { ...DEFAULT_EFFECTS }, volumeAutomation: [],
  },
  {
    id: 4, name: 'Drums', type: 'drums', instrument: 'membrane',
    color: '#3498db', muted: false, solo: false, volume: 85, pan: 0,
    clips: [{ id: 5, name: 'Beat', startBeat: 12, duration: 10, notes: [
      { id: 501, pitch: 36, startBeat: 0, duration: 0.5, velocity: 100 },
      { id: 502, pitch: 38, startBeat: 1, duration: 0.5, velocity: 90 },
      { id: 503, pitch: 36, startBeat: 2, duration: 0.5, velocity: 100 },
      { id: 504, pitch: 38, startBeat: 3, duration: 0.5, velocity: 90 },
      { id: 505, pitch: 42, startBeat: 0, duration: 0.25, velocity: 70 },
      { id: 506, pitch: 42, startBeat: 0.5, duration: 0.25, velocity: 60 },
      { id: 507, pitch: 42, startBeat: 1, duration: 0.25, velocity: 70 },
      { id: 508, pitch: 42, startBeat: 1.5, duration: 0.25, velocity: 60 },
      { id: 509, pitch: 42, startBeat: 2, duration: 0.25, velocity: 70 },
      { id: 510, pitch: 42, startBeat: 2.5, duration: 0.25, velocity: 60 },
      { id: 511, pitch: 42, startBeat: 3, duration: 0.25, velocity: 70 },
      { id: 512, pitch: 42, startBeat: 3.5, duration: 0.25, velocity: 60 },
      { id: 513, pitch: 36, startBeat: 4, duration: 0.5, velocity: 100 },
      { id: 514, pitch: 36, startBeat: 4.5, duration: 0.5, velocity: 80 },
      { id: 515, pitch: 38, startBeat: 5, duration: 0.5, velocity: 90 },
      { id: 516, pitch: 36, startBeat: 6, duration: 0.5, velocity: 100 },
      { id: 517, pitch: 38, startBeat: 7, duration: 0.5, velocity: 90 },
      { id: 518, pitch: 36, startBeat: 8, duration: 1, velocity: 100 },
    ] }],
    effects: { ...DEFAULT_EFFECTS }, volumeAutomation: [],
  },
];

// ─── Undo/Redo History ───

const MAX_HISTORY = 100;
interface HistoryEntry { tracks: Track[]; label: string }
let undoStack: HistoryEntry[] = [];
let redoStack: HistoryEntry[] = [];
const cloneTracks = (tracks: Track[]): Track[] => JSON.parse(JSON.stringify(tracks));
const pushUndo = (tracks: Track[], label: string) => {
  undoStack.push({ tracks: cloneTracks(tracks), label });
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
};

// ─── Store Interface ───

interface DawStore {
  projectName: string;
  setProjectName: (name: string) => void;

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

  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  toggleLoop: () => void;
  setLoopRegion: (start: number, end: number) => void;

  tracks: Track[];
  addTrack: () => void;
  deleteTrack: (trackId: number) => void;
  renameTrack: (trackId: number, name: string) => void;
  duplicateTrack: (trackId: number) => void;
  setTrackColor: (trackId: number, color: string) => void;
  toggleMute: (trackId: number) => void;
  toggleSolo: (trackId: number) => void;
  setTrackVolume: (trackId: number, volume: number) => void;
  setTrackInstrument: (trackId: number, instrument: InstrumentPreset) => void;
  setTrackEffects: (trackId: number, effects: Partial<TrackEffects>) => void;
  setVolumeAutomation: (trackId: number, points: AutomationPoint[]) => void;
  addAutomationPoint: (trackId: number, point: AutomationPoint) => void;
  removeAutomationPoint: (trackId: number, index: number) => void;

  selectedClipId: number | null;
  selectClip: (clipId: number | null) => void;
  addClip: (trackId: number, startBeat: number) => void;
  moveClip: (clipId: number, newStartBeat: number, newTrackId?: number) => void;
  resizeClip: (clipId: number, newDuration: number, fromLeft?: boolean) => void;
  deleteClip: (clipId: number) => void;
  snapToBeat: (beat: number) => number;

  pianoRollClipId: number | null;
  pianoRollTrackId: number | null;
  selectedNoteIds: Set<number>;
  openPianoRoll: (clipId: number, trackId: number) => void;
  closePianoRoll: () => void;
  selectNote: (noteId: number | null, addToSelection?: boolean) => void;
  selectNotes: (noteIds: number[]) => void;
  clearNoteSelection: () => void;
  addNote: (clipId: number, note: { pitch: number; startBeat: number; duration: number; velocity: number }) => void;
  moveNote: (clipId: number, noteId: number, newPitch: number, newStartBeat: number) => void;
  moveSelectedNotes: (clipId: number, deltaPitch: number, deltaBeat: number) => void;
  resizeNote: (clipId: number, noteId: number, newDuration: number) => void;
  deleteNote: (clipId: number, noteId: number) => void;
  deleteSelectedNotes: (clipId: number) => void;
  setNoteVelocity: (clipId: number, noteId: number, velocity: number) => void;

  undo: () => void;
  redo: () => void;
  pushUndoSnapshot: (label: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string;
  redoLabel: string;
  undoVersion: number;

  zoom: number;
  setZoom: (zoom: number) => void;
  snapEnabled: boolean;
  toggleSnap: () => void;
}

// Helper: wraps a tracks mutation with undo
const withUndo = (
  set: (fn: (s: DawStore) => Partial<DawStore>) => void,
  label: string,
  fn: (s: DawStore) => Partial<DawStore>
) => {
  set((s) => {
    pushUndo(s.tracks, label);
    return { ...fn(s), canUndo: true, canRedo: false, undoLabel: label, redoLabel: '' };
  });
};

const useDawStore = create<DawStore>((set, get) => ({
  projectName: 'Untitled Project',
  setProjectName: (projectName) => set({ projectName }),

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

  // Loop
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 0,
  toggleLoop: () =>
    set((s) => {
      if (!s.loopEnabled) {
        let start = s.loopStart;
        let end = s.loopEnd;
        if (start === 0 && end === 0) {
          let lastBeat = 0;
          s.tracks.forEach((t) =>
            t.clips.forEach((c) => {
              const clipEnd = c.startBeat + c.duration;
              if (clipEnd > lastBeat) lastBeat = clipEnd;
            })
          );
          end = lastBeat > 0 ? lastBeat : 16;
        }
        return { loopEnabled: true, loopStart: start, loopEnd: end };
      }
      return { loopEnabled: false };
    }),
  setLoopRegion: (start, end) =>
    set({ loopStart: Math.min(start, end), loopEnd: Math.max(start, end) }),

  // Tracks
  tracks: DEFAULT_TRACKS,
  addTrack: () => withUndo(set, 'Add Track', (s) => ({
    tracks: [...s.tracks, {
      id: Date.now(), name: `Track ${s.tracks.length + 1}`,
      type: 'instrument' as const, instrument: 'triangle' as const,
      color: TRACK_COLORS[s.tracks.length % TRACK_COLORS.length],
      muted: false, solo: false, volume: 75, pan: 0, clips: [],
      effects: { ...DEFAULT_EFFECTS }, volumeAutomation: [],
    }],
  })),
  deleteTrack: (trackId) => withUndo(set, 'Delete Track', (s) => ({
    tracks: s.tracks.filter((t) => t.id !== trackId),
  })),
  renameTrack: (trackId, name) => withUndo(set, 'Rename Track', (s) => ({
    tracks: s.tracks.map((t) => t.id === trackId ? { ...t, name } : t),
  })),
  duplicateTrack: (trackId) => withUndo(set, 'Duplicate Track', (s) => {
    const source = s.tracks.find((t) => t.id === trackId);
    if (!source) return {};
    const newId = Date.now();
    const cloned: Track = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: `${source.name} (copy)`,
      clips: source.clips.map((c) => ({
        ...JSON.parse(JSON.stringify(c)),
        id: Date.now() + Math.floor(Math.random() * 10000),
      })),
    };
    const idx = s.tracks.findIndex((t) => t.id === trackId);
    const newTracks = [...s.tracks];
    newTracks.splice(idx + 1, 0, cloned);
    return { tracks: newTracks };
  }),
  setTrackColor: (trackId, color) => withUndo(set, 'Change Color', (s) => ({
    tracks: s.tracks.map((t) => t.id === trackId ? { ...t, color } : t),
  })),
  toggleMute: (trackId) => set((s) => ({
    tracks: s.tracks.map((t) => t.id === trackId ? { ...t, muted: !t.muted } : t),
  })),
  toggleSolo: (trackId) => set((s) => ({
    tracks: s.tracks.map((t) => t.id === trackId ? { ...t, solo: !t.solo } : t),
  })),
  setTrackVolume: (trackId, volume) => set((s) => ({
    tracks: s.tracks.map((t) => t.id === trackId ? { ...t, volume } : t),
  })),
  setTrackInstrument: (trackId, instrument) => withUndo(set, 'Change Instrument', (s) => ({
    tracks: s.tracks.map((t) => t.id === trackId ? { ...t, instrument } : t),
  })),
  setTrackEffects: (trackId, effects) => set((s) => ({
    tracks: s.tracks.map((t) => t.id === trackId
      ? { ...t, effects: { ...(t.effects || DEFAULT_EFFECTS), ...effects } }
      : t),
  })),
  setVolumeAutomation: (trackId, points) => set((s) => ({
    tracks: s.tracks.map((t) => t.id === trackId ? { ...t, volumeAutomation: points } : t),
  })),
  addAutomationPoint: (trackId, point) => set((s) => ({
    tracks: s.tracks.map((t) => t.id === trackId ? {
      ...t,
      volumeAutomation: [...(t.volumeAutomation || []), point].sort((a, b) => a.beat - b.beat),
    } : t),
  })),
  removeAutomationPoint: (trackId, index) => set((s) => ({
    tracks: s.tracks.map((t) => t.id === trackId ? {
      ...t,
      volumeAutomation: (t.volumeAutomation || []).filter((_, i) => i !== index),
    } : t),
  })),

  // Clips
  selectedClipId: null,
  selectClip: (clipId) => set({ selectedClipId: clipId }),
  addClip: (trackId, startBeat) => withUndo(set, 'Add Clip', (s) => {
    const snap = s.snapEnabled ? s.snapToBeat(startBeat) : startBeat;
    const newClipId = Date.now() + Math.floor(Math.random() * 1000);
    return {
      tracks: s.tracks.map((t) => t.id === trackId ? {
        ...t, clips: [...t.clips, {
          id: newClipId, name: t.type === 'drums' ? 'Beat' : 'New Clip',
          startBeat: Math.max(0, snap), duration: 4, notes: [],
        }],
    effects: { ...DEFAULT_EFFECTS }, volumeAutomation: [],
      } : t),
      selectedClipId: newClipId,
    };
  }),
  moveClip: (clipId, newStartBeat, newTrackId) => set((s) => {
    const snap = s.snapEnabled ? s.snapToBeat(newStartBeat) : newStartBeat;
    const clampedBeat = Math.max(0, snap);
    if (newTrackId !== undefined) {
      let movedClip: typeof s.tracks[0]['clips'][0] | null = null;
      const tracksWithoutClip = s.tracks.map((t) => {
        const clip = t.clips.find((c) => c.id === clipId);
        if (clip) {
          movedClip = { ...clip, startBeat: clampedBeat };
          return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
        }
        return t;
      });
      if (movedClip) {
        return {
          tracks: tracksWithoutClip.map((t) =>
            t.id === newTrackId ? { ...t, clips: [...t.clips, movedClip!] } : t
          ),
        };
      }
    }
    return {
      tracks: s.tracks.map((t) => ({
        ...t, clips: t.clips.map((c) => c.id === clipId ? { ...c, startBeat: clampedBeat } : c),
      })),
    };
  }),
  resizeClip: (clipId, newDuration, fromLeft = false) => set((s) => {
    const clampedDuration = Math.max(1, newDuration);
    return {
      tracks: s.tracks.map((t) => ({
        ...t, clips: t.clips.map((c) => {
          if (c.id !== clipId) return c;
          if (fromLeft) {
            const delta = c.duration - clampedDuration;
            return { ...c, startBeat: Math.max(0, c.startBeat + delta), duration: clampedDuration };
          }
          return { ...c, duration: clampedDuration };
        }),
      })),
    };
  }),
  deleteClip: (clipId) => withUndo(set, 'Delete Clip', (s) => ({
    selectedClipId: s.selectedClipId === clipId ? null : s.selectedClipId,
    tracks: s.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => c.id !== clipId) })),
  })),
  snapToBeat: (beat: number) => Math.round(beat),

  // Piano Roll
  pianoRollClipId: null,
  pianoRollTrackId: null,
  selectedNoteIds: new Set<number>(),
  openPianoRoll: (clipId, trackId) =>
    set({ pianoRollClipId: clipId, pianoRollTrackId: trackId, selectedNoteIds: new Set() }),
  closePianoRoll: () =>
    set({ pianoRollClipId: null, pianoRollTrackId: null, selectedNoteIds: new Set() }),
  selectNote: (noteId, addToSelection = false) => set((s) => {
    if (noteId === null) return { selectedNoteIds: new Set() };
    if (addToSelection) {
      const next = new Set(s.selectedNoteIds);
      if (next.has(noteId)) next.delete(noteId); else next.add(noteId);
      return { selectedNoteIds: next };
    }
    return { selectedNoteIds: new Set([noteId]) };
  }),
  selectNotes: (noteIds) => set({ selectedNoteIds: new Set(noteIds) }),
  clearNoteSelection: () => set({ selectedNoteIds: new Set() }),
  addNote: (clipId, note) => withUndo(set, 'Add Note', (s) => ({
    tracks: s.tracks.map((t) => ({
      ...t, clips: t.clips.map((c) => c.id === clipId ? {
        ...c, notes: [...c.notes, { id: Date.now() + Math.random(), ...note }],
      } : c),
    })),
  })),
  moveNote: (clipId, noteId, newPitch, newStartBeat) => set((s) => {
    const snap = s.snapEnabled ? Math.round(newStartBeat * 4) / 4 : newStartBeat;
    return {
      tracks: s.tracks.map((t) => ({
        ...t, clips: t.clips.map((c) => c.id === clipId ? {
          ...c, notes: c.notes.map((n) => n.id === noteId
            ? { ...n, pitch: Math.max(0, Math.min(127, Math.round(newPitch))), startBeat: Math.max(0, snap) }
            : n),
        } : c),
      })),
    };
  }),
  moveSelectedNotes: (clipId, deltaPitch, deltaBeat) => set((s) => {
    const snapBeat = s.snapEnabled ? Math.round(deltaBeat * 4) / 4 : deltaBeat;
    const roundedPitch = Math.round(deltaPitch);
    return {
      tracks: s.tracks.map((t) => ({
        ...t, clips: t.clips.map((c) => c.id === clipId ? {
          ...c, notes: c.notes.map((n) => s.selectedNoteIds.has(n.id) ? {
            ...n,
            pitch: Math.max(0, Math.min(127, n.pitch + roundedPitch)),
            startBeat: Math.max(0, n.startBeat + snapBeat),
          } : n),
        } : c),
      })),
    };
  }),
  resizeNote: (clipId, noteId, newDuration) => set((s) => {
    const snap = s.snapEnabled ? Math.round(newDuration * 4) / 4 : newDuration;
    return {
      tracks: s.tracks.map((t) => ({
        ...t, clips: t.clips.map((c) => c.id === clipId ? {
          ...c, notes: c.notes.map((n) => n.id === noteId ? { ...n, duration: Math.max(0.25, snap) } : n),
        } : c),
      })),
    };
  }),
  deleteNote: (clipId, noteId) => withUndo(set, 'Delete Note', (s) => {
    const next = new Set(s.selectedNoteIds); next.delete(noteId);
    return {
      selectedNoteIds: next,
      tracks: s.tracks.map((t) => ({
        ...t, clips: t.clips.map((c) => c.id === clipId
          ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c),
      })),
    };
  }),
  deleteSelectedNotes: (clipId) => withUndo(set, 'Delete Notes', (s) => ({
    selectedNoteIds: new Set(),
    tracks: s.tracks.map((t) => ({
      ...t, clips: t.clips.map((c) => c.id === clipId
        ? { ...c, notes: c.notes.filter((n) => !s.selectedNoteIds.has(n.id)) } : c),
    })),
  })),
  setNoteVelocity: (clipId, noteId, velocity) => withUndo(set, 'Change Velocity', (s) => ({
    tracks: s.tracks.map((t) => ({
      ...t, clips: t.clips.map((c) => c.id === clipId ? {
        ...c, notes: c.notes.map((n) => n.id === noteId
          ? { ...n, velocity: Math.max(1, Math.min(127, velocity)) } : n),
      } : c),
    })),
  })),

  // Undo/Redo
  pushUndoSnapshot: (label: string) => {
    const { tracks, undoVersion } = get();
    pushUndo(tracks, label);
    set({ canUndo: true, canRedo: false, undoLabel: label, redoLabel: '', undoVersion: undoVersion + 1 });
  },
  undo: () => {
    if (undoStack.length === 0) return;
    const current = get();
    const entry = undoStack.pop()!;
    redoStack.push({ tracks: cloneTracks(current.tracks), label: entry.label });
    const prevLabel = undoStack.length > 0 ? undoStack[undoStack.length - 1].label : '';
    set({
      tracks: entry.tracks,
      canUndo: undoStack.length > 0,
      canRedo: true,
      undoLabel: prevLabel,
      redoLabel: entry.label,
      undoVersion: current.undoVersion + 1,
    });
  },
  redo: () => {
    if (redoStack.length === 0) return;
    const current = get();
    const entry = redoStack.pop()!;
    undoStack.push({ tracks: cloneTracks(current.tracks), label: entry.label });
    const nextLabel = redoStack.length > 0 ? redoStack[redoStack.length - 1].label : '';
    set({
      tracks: entry.tracks,
      canUndo: true,
      canRedo: redoStack.length > 0,
      undoLabel: entry.label,
      redoLabel: nextLabel,
      undoVersion: current.undoVersion + 1,
    });
  },
  canUndo: false,
  canRedo: false,
  undoLabel: '',
  redoLabel: '',
  undoVersion: 0,

  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  snapEnabled: true,
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
}));

export default useDawStore;