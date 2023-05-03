import ContentData from './ContentData';

const SpeedDelay = [35000, 25000, 18000, 10000, 5000];

class SlideshowTimer {
  onNext: () => void = () => {};
  getData: (index: number) => (ContentData | undefined) = () => undefined;
  private speed: number;

  private index: number;
  private timeout?: number;
  private startedAt: Date;

  private data?: ContentData;

  constructor(speed = 3) {
    this.index = 0;
    this.speed = speed;
    this.startedAt = new Date();
  }

  isPlaying() {
    return !!this.timeout;
  }

  start() {
    this.stop();
    this.startedAt = new Date();
    this.data = this.getData(this.index);
    if (!this.data?.isLoaded()) {
      this.data?.load(this.handleDataLoaded);
    }
    this.updateTimer();
  }
  
  stop() {
    clearTimeout(this.timeout);
    this.timeout = undefined;
    this.data?.cancelLoad(this.handleDataLoaded);
  }

  setIndex(index: number) {
    if (index !== this.index) {
      this.index = index;
      if (this.isPlaying()) {
        this.start();
      }
    }
  }

  setSpeed(speed: number) {
    this.speed = speed;
    if (this.isPlaying()) {
      this.updateTimer();
    }
  }

  slideDuration(): number {
    const stdDuration = SpeedDelay[this.speed - 1];
    const vidDuration = (this.data?.getDuration() ?? 0) * 1000;
    return Math.max(stdDuration, vidDuration);
  }

  private handleDataLoaded = () => {
    this.updateTimer();
  }

  private updateTimer() {
    clearTimeout(this.timeout);
    const delay = this.calculateRemainingDuration();
    this.timeout = window.setTimeout(this.onNext, delay);
  }

  private calculateRemainingDuration(): number {
    return this.slideDuration() - (+new Date() - +this.startedAt);
  }

}

export default SlideshowTimer;
