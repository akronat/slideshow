
type OnEviction<K, V> = (key: K, val: V) => void;
interface Options<K, V> {
  max?: number;
  onEviction?: OnEviction<K, V>;
}
class LruCache<K, V> {
  readonly max: number;
  readonly cache: Map<K, V>;
  readonly onEviction: OnEviction<K, V>;

  constructor({ max = 10, onEviction = () => {} }: Options<K, V> = {}) {
      this.max = max;
      this.cache = new Map();
      this.onEviction = onEviction;
  }

  get(key: K) {
    let item = this.cache.get(key);
    if (item) {
      // refresh key
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, val: V) {
    if (this.cache.has(key)) {
      // refresh key
      this.cache.delete(key);
    } else if (this.cache.size === this.max) {
      this.evictOldest();
    }
    this.cache.set(key, val);
  }

  clear() {
    while (this.cache.size > 0) {
      this.evictOldest();
    }
  }

  private evictOldest() {
    const evictKey = this.first();
    const evictValue = this.cache.get(evictKey) as V;
    this.cache.delete(this.first());
    this.onEviction(evictKey, evictValue);
  }

  private first() {
    return this.cache.keys().next().value;
  }
}

export default LruCache;
