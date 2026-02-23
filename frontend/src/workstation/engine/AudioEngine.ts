import * as Tone from 'tone';
import { Track, MidiNote, InstrumentPreset } from '../models/types';

// Convert MIDI note number to note name (e.g. 60 -> 'C4')
const midiToNote = (midi: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = noteNames[midi % 12];
  return `${note}${octave}`;
};

// Convert velocity (0-127) to Tone.js volume-friendly value (0-1)
const velocityToGain = (velocity: number): number => {
  return velocity / 127;
};

interface TrackNodes {
  synth: Tone.PolySynth | Tone.NoiseSynth;
  gain: Tone.Gain;
  panner: Tone.Panner;
  scheduledEvents: number[];
}

class AudioEngine {
  private trackNodes: Map<number, TrackNodes> = new Map();
  private isInitialized = false;
  private scheduledEvents: number[] = [];

  // Preview synth for real-time note audition (piano roll dragging)
  private previewSynth: Tone.PolySynth | null = null;
  private previewGain: Tone.Gain | null = null;
  private currentPreviewNote: string | null = null;

  // Must be called from a user gesture (click/tap)
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await Tone.start();
    this.isInitialized = true;
    console.log('AudioEngine initialized');
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Create a synth based on instrument preset
  private createSynth(preset: InstrumentPreset, trackType: string): Tone.PolySynth {
    switch (preset) {
      case 'sawtooth':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4 },
        });
      case 'square':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'square' },
          envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.3 },
        });
      case 'sine':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8 },
        });
      case 'fm':
        return new Tone.PolySynth(Tone.FMSynth, {
          modulationIndex: 3,
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 },
        });
      case 'am':
        return new Tone.PolySynth(Tone.AMSynth, {
          envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.4 },
        });
      case 'membrane':
        return new Tone.PolySynth(Tone.MembraneSynth, {
          envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
        });
      case 'metal':
        return new Tone.PolySynth(Tone.MetalSynth as any, {
          envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
        });
      case 'pluck':
        // PluckSynth doesn't support PolySynth, use a pluck-like regular synth
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
        });
      case 'fat':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'fatsawtooth', spread: 20, count: 3 } as any,
          envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.5 },
        });
      case 'triangle':
      default:
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.4 },
        });
    }
  }

  // Create or update the audio nodes for a track
  private ensureTrackNodes(track: Track): TrackNodes {
    let nodes = this.trackNodes.get(track.id);

    if (!nodes) {
      const panner = new Tone.Panner(track.pan / 100).toDestination();
      const gain = new Tone.Gain(track.volume / 100).connect(panner);

      const synth = this.createSynth(track.instrument, track.type);
      synth.connect(gain);

      nodes = { synth, gain, panner, scheduledEvents: [] };
      this.trackNodes.set(track.id, nodes);
    }

    // Update gain and pan to match current track state
    nodes.gain.gain.value = track.muted ? 0 : track.volume / 100;
    nodes.panner.pan.value = track.pan / 100;

    return nodes;
  }

  // Schedule all notes for all tracks
  schedulePlayback(tracks: Track[], bpm: number, startTime: number = 0): void {
    // Clear any previously scheduled events
    this.clearSchedule();

    Tone.getTransport().bpm.value = bpm;

    // Check if any track has solo enabled
    const hasSolo = tracks.some((t) => t.solo);

    tracks.forEach((track) => {
      // Skip muted tracks, or non-solo tracks when solo is active
      const shouldPlay = hasSolo ? track.solo : !track.muted;
      if (!shouldPlay) return;
      if (track.type === 'audio') return; // Audio tracks handled separately later

      const nodes = this.ensureTrackNodes(track);

      track.clips.forEach((clip) => {
        clip.notes.forEach((note) => {
          // Absolute beat position = clip start + note position within clip
          const absoluteBeat = clip.startBeat + note.startBeat;

          // Convert beats to Tone.js time notation (bars:beats:sixteenths)
          const timeInSeconds = (absoluteBeat / bpm) * 60;

          // Skip notes that are before our start position
          if (timeInSeconds < startTime) return;

          const noteName = midiToNote(note.pitch);
          const durationInSeconds = (note.duration / bpm) * 60;
          const velocity = velocityToGain(note.velocity);

          const eventId = Tone.getTransport().schedule((time) => {
            if (nodes.synth instanceof Tone.PolySynth) {
              nodes.synth.triggerAttackRelease(
                noteName,
                durationInSeconds,
                time,
                velocity
              );
            }
          }, timeInSeconds);

          nodes.scheduledEvents.push(eventId);
          this.scheduledEvents.push(eventId);
        });
      });
    });
  }

  // Clear all scheduled events
  clearSchedule(): void {
    this.scheduledEvents.forEach((id) => {
      Tone.getTransport().clear(id);
    });
    this.scheduledEvents = [];
    this.trackNodes.forEach((nodes) => {
      nodes.scheduledEvents = [];
    });
  }

  // Reschedule without stopping transport — seamless update during playback
  reschedule(tracks: Track[], bpm: number): void {
    this.clearSchedule();
    const currentTime = Tone.getTransport().seconds;
    this.schedulePlayback(tracks, bpm, currentTime);
  }

  // Start playback
  play(tracks: Track[], bpm: number, fromTime: number = 0): void {
    this.schedulePlayback(tracks, bpm, fromTime);
    Tone.getTransport().seconds = fromTime;
    Tone.getTransport().start();
  }

  // Pause playback
  pause(): void {
    Tone.getTransport().pause();
  }

  // Stop and reset
  stop(): void {
    Tone.getTransport().stop();
    this.clearSchedule();
    this.releaseAllNotes();
  }

  // Release any currently sounding notes
  private releaseAllNotes(): void {
    this.trackNodes.forEach((nodes) => {
      if (nodes.synth instanceof Tone.PolySynth) {
        nodes.synth.releaseAll();
      }
    });
  }

  // Get current transport time in seconds
  getCurrentTime(): number {
    return Tone.getTransport().seconds;
  }

  // Update track volume/pan/mute in real time (no re-schedule needed)
  updateTrackParams(track: Track): void {
    const nodes = this.trackNodes.get(track.id);
    if (nodes) {
      nodes.gain.gain.value = track.muted ? 0 : track.volume / 100;
      nodes.panner.pan.value = track.pan / 100;
    }
  }

  // Rebuild a track's synth when instrument preset changes
  rebuildTrackSynth(track: Track): void {
    const nodes = this.trackNodes.get(track.id);
    if (nodes) {
      // Release and dispose old synth
      if (nodes.synth instanceof Tone.PolySynth) {
        nodes.synth.releaseAll();
      }
      nodes.synth.dispose();

      // Create new synth with updated preset
      const newSynth = this.createSynth(track.instrument, track.type);
      newSynth.connect(nodes.gain);
      nodes.synth = newSynth;
    }
  }

  // Set BPM
  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm;
  }

  // Ensure preview synth exists
  private ensurePreviewSynth(): void {
    if (!this.previewSynth) {
      this.previewGain = new Tone.Gain(0.5).toDestination();
      this.previewSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.4,
          release: 0.15,
        },
      }).connect(this.previewGain);
    }
  }

  // Play a preview note immediately (for clicking a note or starting a drag)
  previewNoteOn(pitch: number, velocity: number = 100): void {
    if (!this.isInitialized) return;
    this.ensurePreviewSynth();

    const noteName = midiToNote(pitch);

    // Release previous preview note if different
    if (this.currentPreviewNote && this.currentPreviewNote !== noteName) {
      this.previewSynth!.triggerRelease(this.currentPreviewNote);
    }

    // Only trigger attack if it's a new note
    if (this.currentPreviewNote !== noteName) {
      this.previewSynth!.triggerAttack(noteName, undefined, velocityToGain(velocity));
      this.currentPreviewNote = noteName;
    }
  }

  // Update preview to a new pitch (while dragging — seamless pitch change)
  previewNoteChange(pitch: number, velocity: number = 100): void {
    if (!this.isInitialized || !this.previewSynth) return;

    const noteName = midiToNote(pitch);
    if (this.currentPreviewNote === noteName) return; // Same note, skip

    // Release old, trigger new
    if (this.currentPreviewNote) {
      this.previewSynth.triggerRelease(this.currentPreviewNote);
    }
    this.previewSynth.triggerAttack(noteName, undefined, velocityToGain(velocity));
    this.currentPreviewNote = noteName;
  }

  // Stop preview note (on mouse up)
  previewNoteOff(): void {
    if (!this.previewSynth || !this.currentPreviewNote) return;
    this.previewSynth.triggerRelease(this.currentPreviewNote);
    this.currentPreviewNote = null;
  }

  // Clean up everything
  dispose(): void {
    this.stop();
    this.previewNoteOff();
    if (this.previewSynth) {
      this.previewSynth.dispose();
      this.previewSynth = null;
    }
    if (this.previewGain) {
      this.previewGain.dispose();
      this.previewGain = null;
    }
    this.trackNodes.forEach((nodes) => {
      nodes.synth.dispose();
      nodes.gain.dispose();
      nodes.panner.dispose();
    });
    this.trackNodes.clear();
  }
}

// Singleton instance
const audioEngine = new AudioEngine();
export default audioEngine;