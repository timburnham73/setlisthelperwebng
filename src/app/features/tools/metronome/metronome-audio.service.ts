import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class MetronomeAudioService implements OnDestroy {
  private audioContext: AudioContext | null = null;
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private currentBeat = 0;
  private bpm = 120;
  private beatsPerMeasure = 4;
  private isPlaying = false;

  private readonly scheduleAheadTime = 0.1;
  private readonly timerInterval = 25;

  beat$ = new Subject<number>();

  start(bpm: number, beatsPerMeasure: number): void {
    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    this.scheduler();
    this.timerHandle = setInterval(() => this.scheduler(), this.timerInterval);
  }

  stop(): void {
    this.isPlaying = false;
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  setBeatsPerMeasure(beats: number): void {
    this.beatsPerMeasure = beats;
    if (this.currentBeat >= beats) {
      this.currentBeat = 0;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  ngOnDestroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private scheduler(): void {
    if (!this.audioContext || !this.isPlaying) return;

    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      this.advanceBeat();
    }
  }

  private scheduleNote(beat: number, time: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    if (beat === 0) {
      osc.frequency.value = 1000;
      gain.gain.value = 0.5;
      osc.start(time);
      osc.stop(time + 0.05);
    } else {
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start(time);
      osc.stop(time + 0.03);
    }

    // Emit beat for visual indicator (approximate, using setTimeout for UI sync)
    const delay = (time - this.audioContext.currentTime) * 1000;
    setTimeout(() => this.beat$.next(beat), Math.max(0, delay));
  }

  private advanceBeat(): void {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
  }
}
