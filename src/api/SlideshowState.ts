import DisplayStyle from './DisplayStyle';
import { setSetting, Settings } from './Settings';
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

export const saveSlideshowStateToSettings = (state: Partial<SlideshowState>) => {
  if (state.displayStyle !== undefined) setSetting(Settings.displayStyle, state.displayStyle);
  if (state.isShuffled !== undefined) setSetting(Settings.isShuffled, state.isShuffled);
  if (state.speed !== undefined) setSetting(Settings.speed, state.speed);
  if (state.transitionStyle !== undefined) setSetting(Settings.transitionStyle, state.transitionStyle);
  if (state.volume !== undefined) setSetting(Settings.volume, state.volume);
};

export default SlideshowState;
