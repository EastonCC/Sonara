import audioEngine from './AudioEngine';
import useDawStore from '../state/dawStore';
import { Track } from '../models/types';

let animationFrameId: number | null = null;
let unsubscribeTracks: (() => void) | null = null;

// Sync the Zustand store's currentTime with Tone.Transport using rAF
const startPlayheadSync = () => {
  const update = () => {
    const { isPlaying, setCurrentTime, loopEnabled, loopStart, loopEnd, bpm } = useDawStore.getState();
    if (isPlaying) {
      const currentTime = audioEngine.getCurrentTime();

      // Loop check: if past loop end, jump back to loop start
      if (loopEnabled && loopEnd > loopStart) {
        const loopEndTime = (loopEnd / bpm) * 60;
        const loopStartTime = (loopStart / bpm) * 60;
        if (currentTime >= loopEndTime) {
          const { tracks } = useDawStore.getState();
          audioEngine.stop();
          audioEngine.play(tracks, bpm, loopStartTime);
          setCurrentTime(loopStartTime);
          animationFrameId = requestAnimationFrame(update);
          return;
        }
      }

      setCurrentTime(currentTime);
      animationFrameId = requestAnimationFrame(update);
    }
  };
  animationFrameId = requestAnimationFrame(update);
};

const stopPlayheadSync = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

// Subscribe to track/mute/solo changes and reschedule during playback
const startTrackSubscription = () => {
  if (unsubscribeTracks) return; // Already subscribed

  let previousTracks = useDawStore.getState().tracks;

  unsubscribeTracks = useDawStore.subscribe((state) => {
    // Only reschedule if tracks actually changed and we're playing
    if (state.tracks !== previousTracks && state.isPlaying) {
      previousTracks = state.tracks;

      // Debounce: reschedule on next animation frame to batch rapid updates
      requestAnimationFrame(() => {
        const { tracks, bpm } = useDawStore.getState();
        audioEngine.reschedule(tracks, bpm);
      });
    } else {
      previousTracks = state.tracks;
    }
  });
};

const stopTrackSubscription = () => {
  if (unsubscribeTracks) {
    unsubscribeTracks();
    unsubscribeTracks = null;
  }
};

// Initialize the engine (call from a user gesture)
export const initAudio = async () => {
  await audioEngine.initialize();
};

// Play: schedule notes and start transport
export const play = () => {
  const { tracks, bpm, currentTime } = useDawStore.getState();

  if (!audioEngine.isReady()) {
    console.warn('Audio engine not initialized. Call initAudio() first.');
    return;
  }

  audioEngine.play(tracks, bpm, currentTime);
  startPlayheadSync();
  startTrackSubscription();
};

// Pause: keep position
export const pause = () => {
  audioEngine.pause();
  stopPlayheadSync();
  stopTrackSubscription();
};

// Stop: reset to beginning
export const stop = () => {
  audioEngine.stop();
  stopPlayheadSync();
  stopTrackSubscription();
  useDawStore.getState().setCurrentTime(0);
};

// Rewind: go to start without stopping play state
export const rewind = () => {
  const { isPlaying, tracks, bpm } = useDawStore.getState();
  audioEngine.stop();
  useDawStore.getState().setCurrentTime(0);

  if (isPlaying) {
    audioEngine.play(tracks, bpm, 0);
  }
};

// Seek: jump to a specific time in seconds
export const seek = (timeInSeconds: number) => {
  const { isPlaying, tracks, bpm } = useDawStore.getState();
  audioEngine.stop();
  useDawStore.getState().setCurrentTime(timeInSeconds);

  if (isPlaying) {
    audioEngine.play(tracks, bpm, timeInSeconds);
  }
};

// Called when tracks/clips change during playback — reschedule
export const reschedule = () => {
  const { isPlaying, tracks, bpm, currentTime } = useDawStore.getState();
  if (isPlaying) {
    audioEngine.stop();
    audioEngine.play(tracks, bpm, currentTime);
  }
};

// Update BPM in real time
export const updateBpm = (newBpm: number) => {
  const { isPlaying, tracks, currentTime, bpm: oldBpm } = useDawStore.getState();

  if (isPlaying) {
    // Convert current position from seconds to beats (using old BPM),
    // then back to seconds using the new BPM
    const currentBeat = (currentTime / 60) * oldBpm;
    const newTimeInSeconds = (currentBeat / newBpm) * 60;

    // Stop, reschedule with new BPM from the correct position
    audioEngine.stop();
    useDawStore.getState().setCurrentTime(newTimeInSeconds);
    audioEngine.play(tracks, newBpm, newTimeInSeconds);
  } else {
    // Not playing — just convert the playhead position
    const currentBeat = (currentTime / 60) * oldBpm;
    const newTimeInSeconds = (currentBeat / newBpm) * 60;
    audioEngine.setBpm(newBpm);
    useDawStore.getState().setCurrentTime(newTimeInSeconds);
  }
};

// Preview note methods for piano roll interaction
export const previewNoteOn = (pitch: number, velocity?: number) => {
  audioEngine.previewNoteOn(pitch, velocity);
};

export const previewNoteChange = (pitch: number, velocity?: number) => {
  audioEngine.previewNoteChange(pitch, velocity);
};

export const previewNoteOff = () => {
  audioEngine.previewNoteOff();
};

export const previewNoteOffSingle = (pitch: number) => {
  audioEngine.previewNoteOffSingle(pitch);
};

export const setPreviewRelease = (seconds: number) => {
  audioEngine.setPreviewRelease(seconds);
};

export const rebuildPreviewSynth = (instrument: string) => {
  audioEngine.rebuildPreviewSynth(instrument);
};

// Rebuild a track's synth when instrument changes
export const rebuildTrackSynth = (track: Track) => {
  audioEngine.rebuildTrackSynth(track);
  // Reschedule if playing so the new sound is used
  const { isPlaying, tracks, bpm } = useDawStore.getState();
  if (isPlaying) {
    audioEngine.reschedule(tracks, bpm);
  }
};

// Clean up on unmount
export const dispose = () => {
  stopPlayheadSync();
  stopTrackSubscription();
  audioEngine.dispose();
};