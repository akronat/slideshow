import React from 'react';
import classnames from 'classnames';

import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';

import listFileEntries from '../util/listFileEntries';
import promiseAny from '../util/promiseAny';
import arrayUnique from '../util/arrayUnique';

import SlideManager from '../api/SlideManager';
import SlideshowState from '../api/SlideshowState';
import ContentData from '../api/ContentData';
import { getFileContentSource, getFileEntryContentSource } from '../api/FileContentSource';
import ContentSource from '../api/ContentSource';
import { getSetting, Settings, setSetting } from '../api/Settings';
import SlideState from '../api/SlideState';
import SlideshowTimer from '../api/SlideshowTimer';
import { getUrlContentSource } from '../api/UrlContentSource';

import DragAndDrop from './DragAndDrop';
import ControlBar from './ControlBar';
import WindowSizeWrapper from './hooks/WindowSizeWrapper';
import Slider from './Slider';
import ContentRenderer from './ContentRenderer';
import isElectron from '../util/isElectron';
import TitleBar from './TitleBar';

const ShowControlsDuration = 4000;
const PreloadCount = 1;
const CacheSize = PreloadCount * 2 + 3;


const titlebarHeight = 30;
const controlsHeight = 60;

const styles = ({ palette, spacing }: Theme) => createStyles({
  titlebar: {
    height: titlebarHeight,
    width: '100%',
    backgroundColor: palette.controlPanel.main,
    zIndex: 1000,
  },
  titlebarHideable: {
    backgroundColor: palette.controlPanelOverlay.main,
    position: 'absolute',
    top: -titlebarHeight,
    transitionProperty: 'top',
    transitionDuration: '1.0s',
  },
  titlebarHideableShow: {
    bottom: 'unset',
    top: 0,
    transitionDuration: '0.1s',
  },
  slideshow: {
    backgroundColor: 'black',
    display: 'flex',
    flexFlow: 'column',
    overflow: 'hidden',
  },
  mainArea: {
    width: '100%',
    height: '100%',
    flexGrow: 1,
  },
  dragDrop: {
    width: '100%',
    height: '100%',
  },
  controls: {
    width: '100%',
    height: controlsHeight,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: palette.controlPanel.main,
    zIndex: 1000,
  },
  controlsHideable: {
    backgroundColor: palette.controlPanelOverlay.main,
    position: 'absolute',
    bottom: -controlsHeight,
    transitionProperty: 'bottom',
    transitionDuration: '1.0s',
  },
  controlsHideableShow: {
    top: 'unset',
    bottom: 0,
    transitionDuration: '0.1s',
  },
});

interface Props extends WithStyles<typeof styles> {}
interface State {
  ssController: SlideManager | undefined;
  ssState: SlideshowState;
  data: ContentData | undefined;
  showControls: boolean;
  slideIndex: number;
}

class SlideshowMain extends React.Component<Props, State> {
  rootRef: React.RefObject<HTMLDivElement>;
  showControlsTimeout: NodeJS.Timeout | undefined;
  slideshowTimer: SlideshowTimer;

  constructor(props: Props) {
    super(props);
    this.state = {
      ssController: undefined,
      ssState: {
        displayStyle: getSetting(Settings.displayStyle),
        isBorderless: false,
        isFullscreen: false,
        isPlaying: false,
        isShuffled: getSetting(Settings.isShuffled),
        speed: getSetting(Settings.speed),
        volume: getSetting(Settings.volume),
        transitionStyle: getSetting(Settings.transitionStyle),
      },
      data: undefined,
      showControls: false,
      slideIndex: 0,
    };
    this.slideshowTimer = new SlideshowTimer();
    this.slideshowTimer.onNext = this.handleNext;
    this.rootRef = React.createRef<HTMLDivElement>();
  }

  componentDidMount() {
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    this.slideshowTimer.stop();
  }

  updateSsState(newSsState: Partial<SlideshowState>) {
    const { ssState } = this.state;
    this.setState({ ssState: { ...ssState, ...newSsState }});
    if (newSsState.displayStyle) setSetting(Settings.displayStyle, newSsState.displayStyle);
    if (newSsState.isShuffled) setSetting(Settings.isShuffled, newSsState.isShuffled);
    if (newSsState.speed) setSetting(Settings.speed, newSsState.speed);
    if (newSsState.transitionStyle) setSetting(Settings.transitionStyle, newSsState.transitionStyle);
    if (newSsState.volume) setSetting(Settings.volume, newSsState.volume);
  }

  enterFullscreen = () => {
    this.rootRef.current?.requestFullscreen();
    this.showControls();
  }

  exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  handlePause = () => {
    this.slideshowTimer.stop();
    this.updateSsState({ isPlaying: false });
    this.showControls();
  }

  handlePlay = () => {
    this.slideshowTimer.start();
    this.updateSsState({ isPlaying: true });
    this.showControls();
  }

  handleShuffleChange = (shuffle: boolean) => {
    const { ssController, slideIndex } = this.state;
    const startAtSid = ssController?.getDataForIndex(slideIndex).contentSource.id;
    const startAtIndex = slideIndex + CacheSize;
    if (shuffle) {
      ssController?.shuffle({ startAtSid, startAtIndex });
    } else {
      ssController?.unshuffle({ startAtSid, startAtIndex });
    }
    this.updateSsState({ isShuffled: shuffle });
    this.showControls();
    this.setSlideIndex(startAtIndex);
  }

  handleSpeedChange = (speed: number) => {
    this.slideshowTimer.setSpeed(speed);
    this.updateSsState({ speed });
    this.showControls();
  }

  handlePlainSssChange = (state: Partial<SlideshowState>) => {
    this.updateSsState(state);
    this.showControls();
  }

  showControls = () => {
    const { showControls } = this.state;
    if (this.showControlsTimeout) clearTimeout(this.showControlsTimeout);
    if (this.constrolsHideable()) {
      this.showControlsTimeout = setTimeout(this.handleShowControlsTimeout, ShowControlsDuration);
      if (!showControls) {
        this.setState({ showControls: true });
      }
    }
  }

  handleFullscreenChange = () => {
    this.updateSsState({ isFullscreen: !!document.fullscreenElement });
  }

  handleDrop = async (items: DataTransferItemList) => {
    const fileItems = Array.from(items).filter(i => i.kind === 'file');
    const files = await listFileEntries(...fileItems.map(i => i.webkitGetAsEntry()));
    const { values, reasons } = await promiseAny(files.map(f => getFileEntryContentSource(f)));
    reasons.forEach(r => console.error(`Error adding file: ${r}`));
    this.addNewSources(values);
  }

  handleFilesAdded = (files: File[]) => {
    this.addNewSources(files.map(f => getFileContentSource(f)));
  }

  handleUrlsAdded = async (urls: string[]) => {
    // const types = await Promise.all(urls.map(fetchUrlMimeType));
    // const newSources: ContentSource[] = [];
    // types.forEach((type, i) => {
    //   if (type.startsWith('image/')) {
    //     newSources.push(getUrlContentSource(urls[i]));
    //   } else if (type === 'text/plain') {
    //     console.log('Loading compilation files not yet supported...');
    //   } else {
    //     console.warn(`Unknown content type of URL ${urls[i]}: ${type}`);
    //   }
    // });
    // this.addNewSources(newSources);
    this.addNewSources(urls.map(getUrlContentSource));
  }

  handleKeyUp = (e: KeyboardEvent) => {
    const { ssState } = this.state;
    let handled = true;
    if (e.key === 'ArrowLeft') this.handlePrevious();
    else if (e.key === ' ' && !ssState.isPlaying) this.handlePlay();
    else if (e.key === ' ' && ssState.isPlaying) this.handlePause();
    else if (e.key === 'ArrowRight') this.handleNext();
    else if (e.key === 'Enter' && !ssState.isFullscreen) this.enterFullscreen();
    else if (e.key === 'Enter' && ssState.isFullscreen) this.exitFullscreen();
    else if (e.key === '\\') this.handlePlainSssChange({ isBorderless: !ssState.isBorderless });
    else if (e.key === 'F11') this.handlePlainSssChange({ isBorderless: !ssState.isBorderless });
    else if (e.key === 'f' && !ssState.isFullscreen) this.enterFullscreen();
    else if (e.key === 'f' && ssState.isFullscreen) this.exitFullscreen();
    else if (e.key === 'Escape') {
      this.exitFullscreen();
      this.handlePlainSssChange({ isBorderless: false });
    }
    else if (e.key === 'F12' && isElectron()) global.electronIpc?.send('openDevTools');
    else {
      handled = false;
      // console.log('Unknown key pressed:', e);
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  handleShowControlsTimeout = () => {
    this.setState({ showControls: false });
  }

  handleNext = () => {
    this.setSlideIndex(this.state.slideIndex + 1);
  }

  handlePrevious = () => {
    this.setSlideIndex(this.state.slideIndex - 1);
  }

  addNewSources(sources: ContentSource[]) {
    const { ssController, ssState, slideIndex } = this.state;
    this.slideshowTimer.stop();
    const startAtSid = ssController?.getDataForIndex(slideIndex).contentSource.id;
    const startAtIndex = slideIndex + CacheSize;
    ssController?.cleanup();
    const newSources = arrayUnique([...(ssController?.sources ?? []), ...sources], s => s.id);
    const newSsc = new SlideManager(newSources, { cacheSize: CacheSize, startAtSid, startAtIndex });
    this.slideshowTimer.getData = index => newSsc.getDataForIndex(index);
    if (ssState.isShuffled) {
      newSsc.shuffle({ startAtSid, startAtIndex });
    }
    if (ssState.isPlaying) {
      this.slideshowTimer.start();
    }
    this.setState({
      data: undefined,
      ssController: newSsc,
    });
    this.setSlideIndex(startAtIndex);
  }

  setSlideIndex(index: number) {
    this.setState({ slideIndex: index });
    this.slideshowTimer.setIndex(index);
  }

  renderSlideContent = ({ index, isActive }: SlideState) => {
    const { ssController, ssState } = this.state;
    return ssController && <ContentRenderer
      data={ssController.getDataForIndex(index)}
      duration={isActive ? this.slideshowTimer.slideDuration() : undefined}
      isActive={isActive}
      displayStyle={ssState.displayStyle}
      volume={ssState.volume}
    />
  }

  constrolsHideable() {
    const { ssState } = this.state;
    return ssState.isFullscreen || ssState.isBorderless;
  }

  render() {
    const { classes } = this.props;
    const { ssState, showControls, slideIndex, ssController } = this.state;
    return (
      <WindowSizeWrapper>
        {(size) =>(
          <div
            className={classes.slideshow}
            onMouseMove={this.showControls}
            onMouseDown={this.showControls}
            ref={this.rootRef}
            style={{ width: size.width, height: size.height }}
          >
            {isElectron() && <TitleBar
              className={classnames(classes.titlebar, {
                [classes.titlebarHideable]: this.constrolsHideable(),
                [classes.titlebarHideableShow]: this.constrolsHideable() && showControls,
              })}
              slideTitle={ssController?.getDataForIndex(slideIndex).contentSource.name}
            />}
            <div
              className={classes.mainArea}
              onDoubleClick={() => {
                if (!document.fullscreenElement) this.enterFullscreen();
                if (!!document.fullscreenElement) this.exitFullscreen();
              }}
            >
              <DragAndDrop className={classes.dragDrop} onDrop={this.handleDrop}>
                <Slider
                  onNext={this.handleNext}
                  onBack={this.handlePrevious}
                  slideContentRenderer={this.renderSlideContent}
                  slideIndex={slideIndex}
                  preloadCount={PreloadCount}
                  transitionStyle={ssState.transitionStyle}
                />
              </DragAndDrop>
            </div>
            <ControlBar
              className={classnames(classes.controls, {
                [classes.controlsHideable]: this.constrolsHideable(),
                [classes.controlsHideableShow]: this.constrolsHideable() && showControls,
              })}
              screenWidth={size.width}
              state={ssState}
              onNext={this.handleNext}
              onPlay={this.handlePlay}
              onPause={this.handlePause}
              onBack={this.handlePrevious}
              onEnterFullscreen={this.enterFullscreen}
              onExitFullscreen={this.exitFullscreen}
              onDisplayStyleChange={(displayStyle) => this.handlePlainSssChange({ displayStyle })}
              onShuffleChange={this.handleShuffleChange}
              onSpeedChange={this.handleSpeedChange}
              onTransitionStyleChange={(transitionStyle) => this.handlePlainSssChange({ transitionStyle })}
              onVolumeChange={(volume) => this.handlePlainSssChange({ volume })}
              onFilesAdded={this.handleFilesAdded}
              onUrlsAdded={this.handleUrlsAdded}
            />
          </div>
        )}
      </WindowSizeWrapper>
    );
  }
}

export default withStyles(styles)(SlideshowMain);
