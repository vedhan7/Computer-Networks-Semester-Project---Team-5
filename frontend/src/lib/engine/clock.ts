export class SimulatedClock {
  private startTime: number;
  private currentTime: number;
  private speed: number = 1;
  private isPlaying: boolean = false;
  private lastRealTime: number = 0;

  constructor(initialTimeMs: number) {
    this.startTime = initialTimeMs;
    this.currentTime = initialTimeMs;
  }

  public setSpeed(multiplier: number) {
    this.speed = multiplier;
  }

  public getSpeed() {
    return this.speed;
  }

  public play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastRealTime = Date.now();
    }
  }

  public pause() {
    this.isPlaying = false;
  }

  public isRunning() {
    return this.isPlaying;
  }

  public tick() {
    if (!this.isPlaying) return this.currentTime;

    const now = Date.now();
    const deltaMs = now - this.lastRealTime;
    this.lastRealTime = now;

    this.currentTime += deltaMs * this.speed;
    return this.currentTime;
  }

  public getTime() {
    return this.currentTime;
  }

  public jumpTo(timeMs: number) {
    this.currentTime = timeMs;
    if (this.isPlaying) {
      this.lastRealTime = Date.now();
    }
  }

  public reset() {
    this.currentTime = this.startTime;
    this.isPlaying = false;
  }
}
