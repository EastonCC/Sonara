import { create } from 'zustand';
import { Track, InstrumentPreset } from '../models/types';

const TRACK_COLORS = ['#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#1abc9c'];

const DEFAULT_TRACKS: Track[] = [
  {
    id: 1,
    name: 'Main Vocals',
    type: 'audio',
    instrument: 'triangle',
    color: '#e74c3c',
    muted: false,
    solo: false,
    volume: 80,
    pan: 0,
    clips: [{ id: 1, name: 'Vocal Take 1', startBeat: 0, duration: 16, notes: [] }],
  },
  {
    id: 2,
    name: 'Keys',
    type: 'instrument',
    instrument: 'triangle',
    color: '#9b59b6',
    muted: false,
    solo: false,
    volume: 75,
    pan: -20,
    clips: [
      {
        id: 2,
        name: 'Chord Progression',
        startBeat: 4,
        duration: 8,
        notes: [
          // C major chord
          { id: 100, pitch: 60, startBeat: 0, duration: 2, velocity: 100 },
          { id: 101, pitch: 64, startBeat: 0, duration: 2, velocity: 90 },
          { id: 102, pitch: 67, startBeat: 0, duration: 2, velocity: 85 },
          // F major chord
          { id: 103, pitch: 65, startBeat: 2, duration: 2, velocity: 100 },
          { id: 104, pitch: 69, startBeat: 2, duration: 2, velocity: 90 },
          { id: 105, pitch: 72, startBeat: 2, duration: 2, velocity: 85 },
          // G major chord
          { id: 106, pitch: 67, startBeat: 4, duration: 2, velocity: 100 },
          { id: 107, pitch: 71, startBeat: 4, duration: 2, velocity: 90 },
          { id: 108, pitch: 74, startBeat: 4, duration: 2, velocity: 85 },
          // C major chord
          { id: 109, pitch: 60, startBeat: 6, duration: 2, velocity: 100 },
          { id: 110, pitch: 64, startBeat: 6, duration: 2, velocity: 90 },
          { id: 111, pitch: 67, startBeat: 6, duration: 2, velocity: 85 },
        ],
      },
      {
        id: 3,
        name: 'Melody',
        startBeat: 14,
        duration: 6,
        notes: [
          { id: 120, pitch: 72, startBeat: 0, duration: 1, velocity: 100 },
          { id: 121, pitch: 74, startBeat: 1, duration: 1, velocity: 95 },
          { id: 122, pitch: 76, startBeat: 2, duration: 2, velocity: 100 },
          { id: 123, pitch: 74, startBeat: 4, duration: 1, velocity: 90 },
          { id: 124, pitch: 72, startBeat: 5, duration: 1, velocity: 95 },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Synth Line',
    type: 'instrument',
    instrument: 'sawtooth',
    color: '#f1c40f',
    muted: false,
    solo: false,
    volume: 70,
    pan: 30,
    clips: [
      {
        id: 4,
        name: 'Synth Line',
        startBeat: 8,
        duration: 12,
        notes: [
          { id: 130, pitch: 48, startBeat: 0, duration: 1, velocity: 100 },
          { id: 131, pitch: 48, startBeat: 2, duration: 1, velocity: 100 },
          { id: 132, pitch: 53, startBeat: 4, duration: 1, velocity: 100 },
          { id: 133, pitch: 53, startBeat: 6, duration: 1, velocity: 100 },
          { id: 134, pitch: 55, startBeat: 8, duration: 2, velocity: 100 },
          { id: 135, pitch: 48, startBeat: 10, duration: 2, velocity: 100 },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'Drums',
    type: 'drums',
    instrument: 'membrane',
    color: '#3498db',
    muted: false,
    solo: false,
    volume: 85,
    pan: 0,
    clips: [
      {
        id: 5,
        name: 'Beat',
        startBeat: 12,
        duration: 10,
        notes: [
          // Kick on beats (C2 = 36)
          { id: 140, pitch: 36, startBeat: 0, duration: 0.5, velocity: 127 },
          { id: 141, pitch: 36, startBeat: 2, duration: 0.5, velocity: 127 },
          { id: 142, pitch: 36, startBeat: 4, duration: 0.5, velocity: 127 },
          { id: 143, pitch: 36, startBeat: 6, duration: 0.5, velocity: 127 },
          { id: 144, pitch: 36, startBeat: 8, duration: 0.5, velocity: 127 },
          // Snare on 2 and 4 (D2 = 38)
          { id: 145, pitch: 38, startBeat: 1, duration: 0.5, velocity: 110 },
          { id: 146, pitch: 38, startBeat: 3, duration: 0.5, velocity: 110 },
          { id: 147, pitch: 38, startBeat: 5, duration: 0.5, velocity: 110 },
          { id: 148, pitch: 38, startBeat: 7, duration: 0.5, velocity: 110 },
          { id: 149, pitch: 38, startBeat: 9, duration: 0.5, velocity: 110 },
          // Hi-hat on every beat (F#2 = 42)
          { id: 150, pitch: 42, startBeat: 0, duration: 0.25, velocity: 80 },
          { id: 151, pitch: 42, startBeat: 0.5, duration: 0.25, velocity: 60 },
          { id: 152, pitch: 42, startBeat: 1, duration: 0.25, velocity: 80 },
          { id: 153, pitch: 42, startBeat: 1.5, duration: 0.25, velocity: 60 },
          { id: 154, pitch: 42, startBeat: 2, duration: 0.25, velocity: 80 },
          { id: 155, pitch: 42, startBeat: 2.5, duration: 0.25, velocity: 60 },
          { id: 156, pitch: 42, startBeat: 3, duration: 0.25, velocity: 80 },
          { id: 157, pitch: 42, startBeat: 3.5, duration: 0.25, velocity: 60 },
        ],
      },
    ],
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
  setTrackInstrument: (trackId: number, instrument: InstrumentPreset) => void;

  // Clips
  selectedClipId: number | null;
  selectClip: (clipId: number | null) => void;
  addClip: (trackId: number, startBeat: number) => void;
  moveClip: (clipId: number, newStartBeat: number, newTrackId?: number) => void;
  resizeClip: (clipId: number, newDuration: number, fromLeft?: boolean) => void;
  deleteClip: (clipId: number) => void;
  snapToBeat: (beat: number) => number;

  // Piano Roll
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

  // UI
  zoom: number;
  setZoom: (zoom: number) => void;
  snapEnabled: boolean;
  toggleSnap: () => void;
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
          type: 'instrument' as const,
          instrument: 'triangle' as const,
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
  setTrackInstrument: (trackId, instrument) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId ? { ...t, instrument } : t
      ),
    })),

  // Clips
  selectedClipId: null,
  selectClip: (clipId) => set({ selectedClipId: clipId }),
  addClip: (trackId, startBeat) =>
    set((s) => {
      const snap = s.snapEnabled ? s.snapToBeat(startBeat) : startBeat;
      const newClipId = Date.now() + Math.floor(Math.random() * 1000);
      return {
        tracks: s.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                clips: [
                  ...t.clips,
                  {
                    id: newClipId,
                    name: t.type === 'drums' ? 'Beat' : 'New Clip',
                    startBeat: Math.max(0, snap),
                    duration: 4,
                    notes: [],
                  },
                ],
              }
            : t
        ),
        selectedClipId: newClipId,
      };
    }),
  moveClip: (clipId, newStartBeat, newTrackId) =>
    set((s) => {
      const snap = s.snapEnabled ? s.snapToBeat(newStartBeat) : newStartBeat;
      const clampedBeat = Math.max(0, snap);

      // If moving to a different track
      if (newTrackId !== undefined) {
        let movedClip: typeof s.tracks[0]['clips'][0] | null = null;

        // Remove clip from current track
        const tracksWithoutClip = s.tracks.map((t) => {
          const clip = t.clips.find((c) => c.id === clipId);
          if (clip) {
            movedClip = { ...clip, startBeat: clampedBeat };
            return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
          }
          return t;
        });

        // Add clip to target track
        if (movedClip) {
          return {
            tracks: tracksWithoutClip.map((t) =>
              t.id === newTrackId
                ? { ...t, clips: [...t.clips, movedClip!] }
                : t
            ),
          };
        }
      }

      // Same track — just update startBeat
      return {
        tracks: s.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId ? { ...c, startBeat: clampedBeat } : c
          ),
        })),
      };
    }),
  resizeClip: (clipId, newDuration, fromLeft = false) =>
    set((s) => {
      const clampedDuration = Math.max(1, newDuration);
      return {
        tracks: s.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) => {
            if (c.id !== clipId) return c;
            if (fromLeft) {
              // Dragging left edge: adjust startBeat and duration together
              const delta = c.duration - clampedDuration;
              return {
                ...c,
                startBeat: Math.max(0, c.startBeat + delta),
                duration: clampedDuration,
              };
            }
            return { ...c, duration: clampedDuration };
          }),
        })),
      };
    }),
  deleteClip: (clipId) =>
    set((s) => ({
      selectedClipId: s.selectedClipId === clipId ? null : s.selectedClipId,
      tracks: s.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      })),
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
  selectNote: (noteId, addToSelection = false) =>
    set((s) => {
      if (noteId === null) return { selectedNoteIds: new Set() };
      if (addToSelection) {
        const next = new Set(s.selectedNoteIds);
        if (next.has(noteId)) next.delete(noteId);
        else next.add(noteId);
        return { selectedNoteIds: next };
      }
      return { selectedNoteIds: new Set([noteId]) };
    }),
  selectNotes: (noteIds) => set({ selectedNoteIds: new Set(noteIds) }),
  clearNoteSelection: () => set({ selectedNoteIds: new Set() }),
  addNote: (clipId, note) =>
    set((s) => ({
      tracks: s.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId
            ? {
                ...c,
                notes: [
                  ...c.notes,
                  { id: Date.now() + Math.random(), ...note },
                ],
              }
            : c
        ),
      })),
    })),
  moveNote: (clipId, noteId, newPitch, newStartBeat) =>
    set((s) => {
      const snap = s.snapEnabled ? Math.round(newStartBeat * 4) / 4 : newStartBeat;
      const clampedBeat = Math.max(0, snap);
      const clampedPitch = Math.max(0, Math.min(127, Math.round(newPitch)));
      return {
        tracks: s.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  notes: c.notes.map((n) =>
                    n.id === noteId
                      ? { ...n, pitch: clampedPitch, startBeat: clampedBeat }
                      : n
                  ),
                }
              : c
          ),
        })),
      };
    }),
  moveSelectedNotes: (clipId, deltaPitch, deltaBeat) =>
    set((s) => {
      const snapBeat = s.snapEnabled ? Math.round(deltaBeat * 4) / 4 : deltaBeat;
      const roundedPitch = Math.round(deltaPitch);
      return {
        tracks: s.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  notes: c.notes.map((n) =>
                    s.selectedNoteIds.has(n.id)
                      ? {
                          ...n,
                          pitch: Math.max(0, Math.min(127, n.pitch + roundedPitch)),
                          startBeat: Math.max(0, n.startBeat + snapBeat),
                        }
                      : n
                  ),
                }
              : c
          ),
        })),
      };
    }),
  resizeNote: (clipId, noteId, newDuration) =>
    set((s) => {
      const snap = s.snapEnabled ? Math.round(newDuration * 4) / 4 : newDuration;
      const clampedDuration = Math.max(0.25, snap);
      return {
        tracks: s.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  notes: c.notes.map((n) =>
                    n.id === noteId ? { ...n, duration: clampedDuration } : n
                  ),
                }
              : c
          ),
        })),
      };
    }),
  deleteNote: (clipId, noteId) =>
    set((s) => {
      const next = new Set(s.selectedNoteIds);
      next.delete(noteId);
      return {
        selectedNoteIds: next,
        tracks: s.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) }
              : c
          ),
        })),
      };
    }),
  deleteSelectedNotes: (clipId) =>
    set((s) => ({
      selectedNoteIds: new Set(),
      tracks: s.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId
            ? { ...c, notes: c.notes.filter((n) => !s.selectedNoteIds.has(n.id)) }
            : c
        ),
      })),
    })),
  setNoteVelocity: (clipId, noteId, velocity) =>
    set((s) => ({
      tracks: s.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId
            ? {
                ...c,
                notes: c.notes.map((n) =>
                  n.id === noteId
                    ? { ...n, velocity: Math.max(1, Math.min(127, velocity)) }
                    : n
                ),
              }
            : c
        ),
      })),
    })),

  // UI
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  snapEnabled: true,
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
}));

export default useDawStore;