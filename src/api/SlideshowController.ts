import buildArray from '../util/buildArray';
import LruCache from '../util/LruCache';
import modulo from '../util/modulo';
import shuffleList from '../util/shuffleList';
import ContentData from './ContentData';
import ContentSource from './ContentSource';

interface StartAt {
  startAtSid?: string;
  startAtIndex?: number;
}
interface Options extends StartAt {
  cacheSize?: number;
}

class SlideshowController {
  readonly sources: ContentSource[] = [];
  private playlist: number[] = [];
  private cache: LruCache<string, ContentData>;

  private indexOffset: number = 0;

  constructor(sources: ContentSource[], { startAtSid, cacheSize = 10, startAtIndex = 0 }: Options = {}) {
    this.sources = sources;
    this.playlist = buildArray(sources.length, i => i);
    this.indexOffset = Math.max(0, sources.findIndex(s => s.id === startAtSid)) - startAtIndex;
    this.cache = new LruCache({ max: cacheSize, onEviction: (id, cd) => cd.cleanup() });
  }

  getDataForIndex(index: number) {
    const plIndex = modulo(index + this.indexOffset, this.playlist.length);
    const source = this.sources[this.playlist[plIndex]];
    let data = this.cache.get(source.id);
    if (data) {
      return data;
    }
    data = new ContentData(source);
    this.cache.set(source.id, data);
    return data;
  }

  cleanup() {
    this.cache.clear();
  }

  private ratePow(rating: number) {
    if (rating === 0) {
      return 0;
    }
    return Math.pow(2, rating - 1);
  }

  shuffle({ startAtIndex = 0, startAtSid }: StartAt) {
    const currentFileIndex = this.sources.findIndex(s => s.id === startAtSid);
    const ratings = this.sources.map(f => 3 /*f.GetMetaData().rating*/);
    const maxRating = ratings.reduce((p, c) => Math.max(p, c))  ;
    const numSeqs = this.ratePow(maxRating);
    const instances = buildArray(this.sources.length, () => Array(numSeqs).fill(false));
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

    if (currentFileIndex >= 0) {
      // Prevent the current slide from showing up in the first section, since
      // it's already showing and we'll add it to the front of the list soon.
      instances[currentFileIndex][0] = false;
    }

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
    if (currentFileIndex >= 0) {
      this.playlist.unshift(currentFileIndex);
    }
    this.indexOffset = -startAtIndex
  }

  unshuffle({ startAtIndex = 0, startAtSid }: StartAt) {
    this.indexOffset = Math.max(0, this.sources.findIndex(s => s.id === startAtSid)) - startAtIndex;
    this.playlist = buildArray(this.sources.length, i => i);
  }
}

export default SlideshowController;
