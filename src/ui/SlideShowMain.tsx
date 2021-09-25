import React from 'react';
import classnames from 'classnames';

import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';

import listFileEntries from '../util/listFileEntries';
import promiseAny from '../util/promiseAny';

import SlideshowController from '../api/SlideshowController';
import SlideshowState from '../api/SlideshowState';
import ContentData from '../api/ContentData';
import { getFileContentSource, getFileEntryContentSource } from '../api/FileContentSource';
import ContentSource from '../api/ContentSource';

import DragAndDrop from './DragAndDrop';
import Controls from './Controls';
import WindowSizeWrapper from './Hooks/WindowSizeWrapper';
import arrayUnique from '../util/arrayUnique';
import ContentRenderer from './ContentRenderer';

const showControlsDuration = 4000;


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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  ssController: SlideshowController | undefined;
  ssState: SlideshowState;
  data: ContentData | undefined;
  showControlsTimeout: NodeJS.Timeout | undefined;
}

class SlideshowMain extends React.Component<Props, State> {
  rootRef: React.RefObject<HTMLDivElement>;

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
      },
      data: undefined,
      showControlsTimeout: undefined,
    };
    this.rootRef = React.createRef<HTMLDivElement>();
  }

  componentDidMount() {
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  componentWillUnmount() {
    const { ssController } = this.state;
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    ssController?.stop();
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
    const { ssController } = this.state;
    ssController?.stop();
    this.updateSsState({ isPlaying: false });
    this.showControls();
  }

  handlePlay = () => {
    const { ssController } = this.state;
    if (ssController) {
      ssController.start();
      this.updateSsState({ isPlaying: true });
    }
    this.showControls();
  }

  handleShuffleChange = (shuffle: boolean) => {
    const { ssController } = this.state;
    if (shuffle) {
      ssController?.shuffle();
    } else {
      ssController?.unshuffle();
    }
    this.updateSsState({ isShuffled: shuffle });
    this.showControls();
  }

  handleSpeedChange = (speed: number) => {
    const { ssController } = this.state;
    ssController?.setSpeed(speed);
    this.updateSsState({ speed });
  }

  handleStretchChange = (stretch: boolean) => {
    this.updateSsState({ isStretched: stretch });
    this.showControls();
  }

  showControls = () => {
    const { showControlsTimeout, ssState } = this.state;
    if (showControlsTimeout) clearTimeout(showControlsTimeout);
    if (ssState.isFullscreen) {
      this.setState({ showControlsTimeout: setTimeout(this.handleShowControlsTimeout, showControlsDuration)});
    }
  }

  handleFullscreenChange = () => {
    this.updateSsState({ isFullscreen: !!document.fullscreenElement });
  }

  handleDrop = async (items: DataTransferItemList) => {
    const fileItems = Array.from(items).filter(i => i.kind === 'file');
    const files = await listFileEntries(...fileItems.map(i => i.webkitGetAsEntry()));
    const { values, reasons } = await promiseAny(files.map(f => getFileEntryContentSource(f)));
    reasons.forEach(r => console.log(`Error adding file: ${r}`));
    this.addNewSources(values);
  }

  handleFilesLoaded = (files: File[]) => {
    this.addNewSources(files.map(f => getFileContentSource(f)));
  }

  handleKeyUp = (e: KeyboardEvent) => {
    const { ssController, ssState } = this.state;
    let handled = true;
    if (e.key === 'ArrowLeft') ssController?.back();
    else if (e.key === ' ' && !ssState.isPlaying) this.handlePlay();
    else if (e.key === ' ' && ssState.isPlaying) this.handlePause();
    else if (e.key === 'ArrowRight') ssController?.next();
    else if (e.key === 'Enter' && !ssState.isFullscreen) this.enterFullscreen();
    else if (e.key === 'Enter' && ssState.isFullscreen) this.exitFullscreen();
    else if (e.key === 'f' && !ssState.isFullscreen) this.enterFullscreen();
    else if (e.key === 'f' && ssState.isFullscreen) this.exitFullscreen();
    else {
      handled = false;
      console.log('Unknown key pressed:', e);
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  handleShowControlsTimeout = () => {
    this.setState({ showControlsTimeout: undefined });
  }

  addNewSources(sources: ContentSource[]) {
    const { ssController, ssState, data } = this.state;
    ssController?.stop();
    const curSid = data?.contentSource.id;
    const newSources = arrayUnique([...(ssController?.sources ?? []), ...sources], s => s.id);
    const newSsc = new SlideshowController(newSources, curSid);
    newSsc.onDataChange = (data: ContentData) => this.setState({ data });

    this.setState({ data: undefined, ssController: newSsc });
    newSsc.next();
    if (ssState.isShuffled) {
      newSsc.shuffle();
    }
    if (ssState.isPlaying) {
      newSsc.start();
    }
  }

  render() {
    const { classes } = this.props;
    const { ssController, ssState, data, showControlsTimeout } = this.state;
    return (
      <WindowSizeWrapper>
        {(width, height) =>(
          <div
            className={classes.slideshow}
            onMouseMove={this.showControls}
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
                <ContentRenderer data={data} stretch={ssState.isStretched} />
              </DragAndDrop>
            </div>
            <Controls
              className={classnames(classes.controls, {
                [classes.controlsFullscreen]: ssState.isFullscreen,
                [classes.controlsFullscreenTransition]: ssState.isFullscreen && showControlsTimeout,
              })}
              state={ssState}
              onNext={() => ssController?.next()}
              onPlay={this.handlePlay}
              onPause={this.handlePause}
              onBack={() => ssController?.back()}
              onEnterFullscreen={this.enterFullscreen}
              onExitFullscreen={this.exitFullscreen}
              onShuffleChange={this.handleShuffleChange}
              onSpeedChange={this.handleSpeedChange}
              onStretchChange={this.handleStretchChange}
              onFilesLoaded={this.handleFilesLoaded}
            />
          </div>
        )}
      </WindowSizeWrapper>
    );
  }
}

export default withStyles(styles)(SlideshowMain);
