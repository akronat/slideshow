import shuffleList from '../util/shuffleList';
import ContentData from './ContentData';
import ContentSource from './ContentSource';

const SpeedDelay = [25000, 15000, 10000, 5000, 2000];

class SlideshowController {
  sources: ContentSource[] = [];
  playlist: number[] = [];
  onDataChange: (dataUrl: ContentData) => void = () => {};
  
  private index: number = -1;
  private data: ContentData | undefined;
  private timeout: NodeJS.Timeout | null = null;
  private speed: number = 3;

  constructor(sources: ContentSource[], startAtSid?: string) {
    this.sources = sources;
    this.playlist = Array(sources.length).fill(0).map((v, i) => i);
    this.index = Math.max(-1, sources.findIndex(s => s.id === startAtSid) - 1);
  }

  private handleTimeout = () => {
    this.next();
  }

  isPlaying() {
    return !!this.timeout;
  }

  start() {
    this.stop();
    const delay = this.calculateDuration();
    this.timeout = setTimeout(this.handleTimeout, delay);
  }

  private calculateDuration(): number {
    const stdDuration = SpeedDelay[this.speed - 1];
    const vidDuration = (this.data?.length || 0) * 1000;
    return Math.max(stdDuration, vidDuration);
  }

  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  next() {
    if (!this.playlist.length) return;
    if (this.index < 0) this.index = -1;
    this.changeImage(1, this.isPlaying());
  }

  back() {
    if (!this.playlist.length) return;
    if (this.index < 0) this.index = 0;
    this.changeImage(-1, this.isPlaying());
  }

  private changeImage = (direction: 1 | -1, isPlaying: boolean) => {
    this.stop();
    this.index = (this.playlist.length + this.index + direction) % this.playlist.length;
    const fileIndex = this.playlist[this.index];
    const data = new ContentData(this.sources[fileIndex]);
    data.load().then(() => {
      this.data = data;
      if (isPlaying) {
        this.start();
      }
      this.onDataChange(data);
    }).catch((reason) => {
      console.error(reason);
      setTimeout(() => this.changeImage(direction, isPlaying), 0);
    });
  }

  setSpeed(speed: number) {
    this.speed = speed;
    if (this.timeout) {
      this.stop();
      this.start();
    }
  }
  

  private ratePow(rating: number) {
    if (rating === 0) {
      return 0;
    }
    return Math.pow(2, rating - 1);
  }

  shuffle() {
    const currentFileIndex = this.playlist[this.index];
    const ratings = this.sources.map(f => /*f.GetMetaData().rating*/ 3);
    const maxRating = ratings.reduce((p, c) => Math.max(p, c))  ;
    const numSeqs = this.ratePow(maxRating);
    const instances = Array(this.sources.length).fill(0).map(() => Array(numSeqs).fill(false));
    for (let i = 0; i < this.sources.length; i++) {
      let count = 0;
      const numWanted = Math.min(numSeqs, this.ratePow(ratings[i]));
      while (count < numWanted) {
        const target = Math.floor(Math.random() * (numSeqs - count));
        let cur = -1;
        let j = -1;
        while (cur < target) {
          j++;
          if (!instances[i][j]) {
            cur++;
          }
        }
        instances[i][j] = true;
        count++;
      }
    }

    // Prevent the current slide from showing up in the first section, since
    // it's already showing and we'll add it to the front of the list soon.
    instances[currentFileIndex][0] = false;

    const allSections: number[] = [];
    let section: number[];
    for (let i = 0; i < numSeqs; i++) {
      section = [];
      for (let j = 0; j < this.sources.length; j++) {
        if (instances[j][i]) {
            section.push(j);
        }
      }
      shuffleList(section);
      allSections.push(...section);
    }
    this.playlist = allSections;
    this.playlist.unshift(currentFileIndex);
    this.index = 0;

    // TODO: Reload any next/previous preload stuff once implemented!
  }

  unshuffle() {
    this.index = this.playlist[this.index];
    this.playlist = Array(this.sources.length).fill(0).map((v, i) => i);

    // TODO: Reload any next/previous preload stuff once implemented!
  }
}

export default SlideshowController;
