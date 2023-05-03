import { CSSProperties } from 'react';
import Size from '../util/Size';

class PlanPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly d: number;

  constructor(x: number, y: number, z: number, d: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.d = d;
  }
}

interface PathArgs {
  contentRatio: number;
  screenRatio: number;
}
type PathCreator = ((args: PathArgs) => PlanPoint[]);

const widerRatioPaths: PathCreator[] = [
  () => [
    new PlanPoint(0.1, 0.5, 0.8, 0.05),
    new PlanPoint(0.9, 0.5, 0.8, 0.05),
    new PlanPoint(0.5, 0.5, 0.2, 0.05),
  ],
  () => [
    new PlanPoint(0.9, 0.5, 0.8, 0.05),
    new PlanPoint(0.1, 0.5, 0.8, 0.05),
    new PlanPoint(0.5, 0.5, 0.2, 0.05),
  ],
];
const tallerRatioPaths: PathCreator[] = [
  () => [
    new PlanPoint(0.5, 0.1, 0.8, 0.05),
    new PlanPoint(0.5, 0.9, 0.8, 0.05),
    new PlanPoint(0.5, 0.5, 0.2, 0.05),
  ],
  () => [
    new PlanPoint(0.5, 0.9, 0.8, 0.05),
    new PlanPoint(0.5, 0.1, 0.8, 0.05),
    new PlanPoint(0.5, 0.5, 0.2, 0.05),
  ],
];
const similarRatioPaths: PathCreator[] = [
  ({ contentRatio }) => {
    const xOffset = contentRatio < 1 ? 0 : Math.random() * 0.2 - 0.1;
    const yOffset = contentRatio > 1 ? 0 : Math.random() * 0.2 - 0.1;
    return [
      new PlanPoint(0.5 + xOffset, 0.5 + yOffset, 0.4, 0.05),
      new PlanPoint(0.5, 0.5, 0.2, 0.05),
    ];
  },
  ({ contentRatio }) => {
    const xOffset = contentRatio < 1 ? 0 : Math.random() * 0.2 - 0.1;
    const yOffset = contentRatio > 1 ? 0 : Math.random() * 0.2 - 0.1;
    return [
      new PlanPoint(0.5 + xOffset, 0.5 + yOffset, 0.4, 0.05),
      new PlanPoint(0.5, 0.5, 0.0, 0.05),
    ];
  },
];

const randomItem = function<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
};

class ContentZoomPan {
  contentSize: Size;
  screenSize: Size;
  duration: number;
  timer: number = 0;
  plan: PlanPoint[] = [];
  doubleLoop: boolean;
  transitionMs: number;
  scaleMult: number = 1;
  current: number = 0;
  onTransform: (style: CSSProperties) => void = () => {};

  constructor(
    contentSize: Size,
    screenSize: Size,
    duration: number,
    onTransform: (style: CSSProperties) => void,
    doubleLoop = false,
  ) {
    this.contentSize = contentSize;
    this.screenSize = screenSize;
    this.duration = duration;
    this.onTransform = onTransform;
    this.transitionMs = duration;
    this.doubleLoop = doubleLoop;

    const cRat = contentSize.ratio();
    const sRat = screenSize.ratio();
    const args = { contentRatio: cRat, screenRatio: sRat };
    if (Math.abs(cRat - sRat) > 0.5) {
      if (cRat > sRat) {
        this.scaleMult = screenSize.height / (screenSize.width / cRat);
        this.plan = randomItem(widerRatioPaths)(args);
      } else {
        this.scaleMult = screenSize.width / (screenSize.height * cRat);
        this.plan = randomItem(tallerRatioPaths)(args);
      }
    } else {
      this.scaleMult = 2;
      this.plan = randomItem(similarRatioPaths)(args);
    }
    if (this.plan.length > 1) {
      if (Math.random() < 0.5) {
        this.plan.reverse();
      }
      if (this.doubleLoop) {
        this.plan = [...this.plan, ...[...this.plan].reverse().slice(1)];
      }
      const totalPause = this.plan.reduce((p, c) => p + (c.d * duration), 0);
      this.transitionMs = (this.duration - totalPause) / (this.plan.length - 1);
    }
  }

  start() {
    this.current = 0;
    if (this.plan.length === 0) return;
    const currPoint = this.plan[this.current];
    this.onTransform({
      transform: this.pointToTransform(currPoint),
      transition: 'none',
    });
    this.timer = window.setTimeout(this.nextPoint, currPoint.d * this.duration);
  }

  stop() {
    this.onTransform({
      transform: 'none',
      transition: 'none',
    });
    window.clearTimeout(this.timer);
  }

  private nextPoint = () => {
    window.clearTimeout(this.timer);
    this.current += 1;
    const currPoint = this.plan[this.current];
    const fullDuration = this.transitionMs + (currPoint.d * this.duration);
    this.onTransform({
      transform: this.pointToTransform(currPoint),
      transition: `transform ${this.transitionMs}ms ease`,
    });

    this.timer = window.setTimeout(() => {
      if (this.current < this.plan.length - 1) {
        this.nextPoint();
      } else {
        this.plan.reverse();
        this.start();
      }
    }, fullDuration);
  }

  private pointToTransform(pp: PlanPoint): string {
    const z = 1 + (pp.z * (this.scaleMult - 1));
    const x = (pp.x - 0.5) * (1 - z) * 100;
    const y = (pp.y - 0.5) * (1 - z) * 100;
    return `translate(${x}%, ${y}%) scale(${z})`;
  }
};

export default ContentZoomPan;
