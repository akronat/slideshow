import TransitionStyle from './TransitionStyle';

type SlideshowState = {
  isPlaying: boolean;
  isFullscreen: boolean;
  isStretched: boolean;
  isShuffled: boolean;
  speed: number;
  volume: number;
  transitionStyle: TransitionStyle;
};

export default SlideshowState;
