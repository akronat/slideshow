import DisplayStyle from './DisplayStyle';
import TransitionStyle from './TransitionStyle';

type SlideshowState = {
  displayStyle: DisplayStyle;
  isBorderless: boolean;
  isFullscreen: boolean;
  isPlaying: boolean;
  isShuffled: boolean;
  speed: number;
  volume: number;
  transitionStyle: TransitionStyle;
};

export default SlideshowState;
