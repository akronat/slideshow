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

import DragAndDrop from './DragAndDrop';
import Controls from './Controls';
import WindowSizeWrapper from './Hooks/WindowSizeWrapper';
import Slider from './Slider';
import ContentRenderer from './ContentRenderer';
import SlideState from '../api/SlideState';
import SlideshowTimer from '../api/SlideshowTimer';
import { getUrlContentSource } from '../api/UrlContentSource';
import TransitionStyle from '../api/TransitionStyle';

const ShowControlsDuration = 4000;
const PreloadCount = 1;
const CacheSize = PreloadCount * 2 + 3;


const controlsHeight = 60;
const styles = ({ palette, spacing }: Theme) => createStyles({
  slideshow: {
    backgroundColor: 'black',
    display: 'flex',
    flexFlow: 'column',
  },
  mainArea: {
    width: '100%',
    height: `calc(100% - ${controlsHeight}px)`,
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
    backgroundColor: 'black',
  },
  controlsFullscreen: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'absolute',
    bottom: -controlsHeight,
    transitionProperty: 'bottom',
    transitionDuration: '1.0s',
  },
  controlsFullscreenTransition: {
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
        isPlaying: false,
        isFullscreen: false,
        isStretched: false,
        isShuffled: false,
        speed: 3,
        volume: 0, // Mute by default, but allow user to adjust volume later in controls.
        transitionStyle: TransitionStyle.Fade,
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

  handleStretchChange = (stretch: boolean) => {
    this.updateSsState({ isStretched: stretch });
    this.showControls();
  }

  handleTransitionStyleChange = (style: TransitionStyle) => {
    this.updateSsState({ transitionStyle: style });
    this.showControls();
  }

  handleVolumeChange = (volume: number) => {
    this.updateSsState({ volume });
    this.showControls();
  }

  showControls = () => {
    const { showControls, ssState } = this.state;
    if (this.showControlsTimeout) clearTimeout(this.showControlsTimeout);
    if (ssState.isFullscreen) {
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
    else if (e.key === 'f' && !ssState.isFullscreen) this.enterFullscreen();
    else if (e.key === 'f' && ssState.isFullscreen) this.exitFullscreen();
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
      stretch={ssState.isStretched}
      volume={ssState.volume}
      isActive={isActive}
    />
  }

  render() {
    const { classes } = this.props;
    const { ssState, showControls, slideIndex } = this.state;
    return (
      <WindowSizeWrapper>
        {(width, height) =>(
          <div
            className={classes.slideshow}
            onMouseMove={this.showControls}
            onMouseDown={this.showControls}
            ref={this.rootRef}
            style={{ width, height }}
          >
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
            <Controls
              className={classnames(classes.controls, {
                [classes.controlsFullscreen]: ssState.isFullscreen,
                [classes.controlsFullscreenTransition]: ssState.isFullscreen && showControls,
              })}
              screenWidth={width}
              state={ssState}
              onNext={this.handleNext}
              onPlay={this.handlePlay}
              onPause={this.handlePause}
              onBack={this.handlePrevious}
              onEnterFullscreen={this.enterFullscreen}
              onExitFullscreen={this.exitFullscreen}
              onShuffleChange={this.handleShuffleChange}
              onSpeedChange={this.handleSpeedChange}
              onTransitionStyleChange={this.handleTransitionStyleChange}
              onVolumeChange={this.handleVolumeChange}
              onStretchChange={this.handleStretchChange}
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
