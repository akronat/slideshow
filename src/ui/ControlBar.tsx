import React from 'react';
import classnames from 'classnames';

import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Badge from '@material-ui/core/Badge';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Slider from '@material-ui/core/Slider';
import TextField from '@material-ui/core/TextField';

import AddIcon from '@material-ui/icons/Add';
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';
import BlurOnIcon from '@material-ui/icons/BlurOn';
import ControlCameraIcon from '@material-ui/icons/ControlCamera';
import CropOriginalIcon from '@material-ui/icons/CropOriginal';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import HeightIcon from '@material-ui/icons/Height';
import ImageIcon from '@material-ui/icons/Image';
import LinkIcon from '@material-ui/icons/Link';
import MenuIcon from '@material-ui/icons/Menu';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import ShuffleIcon from '@material-ui/icons/Shuffle';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import VolumeMuteIcon from '@material-ui/icons/VolumeMute';

import SlideshowState from '../api/SlideshowState';
import isMobile from '../util/isMobile';
import MenuCollapser from './MenuCollapser';
import TransitionStyle from '../api/TransitionStyle';
import DisplayStyle from '../api/DisplayStyle';

const SIZE_THRESHOLDS = [800, 600];

const styles = ({ palette, spacing }: Theme) => createStyles({
  root: {
    backgroundColor: palette.controlPanel.main,
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    '&>*': {
      flex: '1 1 0',
    },
  },
  largeIcon: {
    fontSize: '3rem'
  },
  sideContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 'auto',
  },
  subContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centreNavControls: {
    display: 'flex',
    justifyContent: 'center',
    flexBasis: 'auto',
    flex: '0 0',
    alignItems: 'center',
  },
  speedContainer: {
    display: 'flex', // For some reason needed to properly size itself!?!?
  },
  speedSlider: {
    width: 100,
  },
  menuPaper: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
});

const displayStyleIconRenderers = {
  [DisplayStyle.Standard]: () => <CropOriginalIcon />,
  [DisplayStyle.Stretch]: () => <HeightIcon />,
  [DisplayStyle.ZoomPan]: () => <ControlCameraIcon />,
  [DisplayStyle.ZoomPanReturn]: () => <Badge badgeContent={'2'}><ControlCameraIcon /></Badge>,
};

const displayStyleSequence = {
  [DisplayStyle.Standard]: DisplayStyle.Stretch,
  [DisplayStyle.Stretch]: DisplayStyle.ZoomPan,
  [DisplayStyle.ZoomPan]: DisplayStyle.ZoomPanReturn,
  [DisplayStyle.ZoomPanReturn]: DisplayStyle.Standard,
};

const transitionStyleIcons = {
  [TransitionStyle.Fade]: BlurOnIcon,
  [TransitionStyle.Slide]: SwapHorizIcon,
  [TransitionStyle.Instant]: FlashOnIcon,
};

const transitionStyleSequence = {
  [TransitionStyle.Fade]: TransitionStyle.Slide,
  [TransitionStyle.Slide]: TransitionStyle.Instant,
  [TransitionStyle.Instant]: TransitionStyle.Fade,
};

interface Props extends WithStyles<typeof styles> {
  className?: string;
  screenWidth?: number;
  state: SlideshowState;
  onNext?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBack?: () => void;
  onEnterFullscreen?: () => void;
  onExitFullscreen?: () => void;
  onDisplayStyleChange?: (style: DisplayStyle) => void;
  onShuffleChange?: (shuffle: boolean) => void;
  onSpeedChange?: (speed: number) => void;
  onTransitionStyleChange?: (style: TransitionStyle) => void;
  onVolumeChange?: (volume: number) => void;
  onFilesAdded?: (files: File[]) => void;
  onUrlsAdded?: (files: string[]) => void;
}
const ControlBar: React.FC<Props> = ({
  classes, className, screenWidth = 0, state,
  onNext = () => {},
  onPlay = () => {},
  onPause = () => {},
  onBack = () => {},
  onEnterFullscreen = () => {},
  onExitFullscreen = () => {},
  onShuffleChange = () => {},
  onDisplayStyleChange = () => {},
  onSpeedChange = () => {},
  onTransitionStyleChange = () => {},
  onVolumeChange = () => {},
  onFilesAdded = () => {},
  onUrlsAdded = () => {},
}) => {
  const [linkInputOpen, setLinkInputOpen] = React.useState(false);
  const [linkUrls, setLinkUrls] = React.useState<string[]>([]);
  const tmpInput = document.createElement('input');
  const dirPropName = ['webkitdirectory', 'mozdirectory', 'odirectory', 'msdirectory', 'directory'].find(p => p in tmpInput);
  const size = screenWidth && SIZE_THRESHOLDS.reduce((p, c, i) => screenWidth <= c ? i : p, -1);
  const renderDisplayStyleIcon = displayStyleIconRenderers[state.displayStyle];
  const TransitionStyleIcon = transitionStyleIcons[state.transitionStyle];
  return (
    <div className={classnames(classes.root, className)}>
      <div className={classes.sideContainer}>
        <div className={classes.subContainer}>
          <IconButton><MenuIcon /></IconButton>
          <MenuCollapser
            buttonContent={<Badge badgeContent={'^'}><AddIcon /></Badge>}
            collapse={size >= 0}
            menuProps={{
              anchorOrigin: {
                vertical: 'top',
                horizontal: 'center',
              },
              classes: { paper: classes.menuPaper },
              transformOrigin: {
                vertical: 'bottom',
                horizontal: 'center',
              },
            }}
          >
          {!isMobile() && (
            // Disable folder selection of mobiles for now, since it's VERY
            // iffy (i.e. I can't get it working at all...)
            <IconButton component="label">
              <input
                type="file"
                hidden
                multiple
                  onChange={ev => onFilesAdded(Array.from(ev.target.files as ArrayLike<File>))}
                // NOTE: Firefox Android requires the dom.webkitBlink.dirPicker.enabled
                // option to be set to true in about:config to allow picking of directories
                {...{ [dirPropName || 'multiple']: '' }}
              />
              <Badge badgeContent={'+'}><FolderOpenIcon /></Badge>
            </IconButton>
          )}
          <IconButton component="label">
            <input
              type="file"
              hidden
              multiple
                onChange={ev => onFilesAdded(Array.from(ev.target.files as ArrayLike<File>))}
            />
            <Badge badgeContent={'+'}><ImageIcon /></Badge>
          </IconButton>
          <IconButton component="label" onClick={() => setLinkInputOpen(true)}>
            <Badge badgeContent={'+'}><LinkIcon /></Badge>
          </IconButton>
          </MenuCollapser>
          <Dialog onClose={() => setLinkInputOpen(false)} open={linkInputOpen}>
            <DialogTitle>Enter URLs to add</DialogTitle>
            <DialogContent>
              <DialogContentText>
                URLs can be for media, or for compilations of media, such as a pastebin with a URL on each line.
              </DialogContentText>
              <TextField
                autoFocus
                fullWidth
                id="urls"
                label="URLs"
                margin="dense"
                onChange={e => setLinkUrls(e.target.value.split('\n'))}
                placeholder="https://example.com"
                multiline
                type="url"
                value={linkUrls.join('\n')}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLinkInputOpen(false)} color="primary">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onUrlsAdded(linkUrls);
                  setLinkInputOpen(false);
                }}
                color="primary"
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>
        </div>
        <div className={classes.subContainer}>
          <MenuCollapser
            buttonContent={<Badge badgeContent={'^'}><MoreVertIcon /></Badge>}
            collapse={size >= 1}
            menuProps={{
              anchorOrigin: {
                vertical: 'top',
                horizontal: 'center',
              },
              classes: { paper: classes.menuPaper },
              transformOrigin: {
                vertical: 'bottom',
                horizontal: 'center',
              },
            }}
          >
          <IconButton
            onClick={() => onShuffleChange(!state.isShuffled)}
            title={state.isShuffled ? 'Shuffle: On' : 'Shuffle: Off'}
          >
            {state.isShuffled ? <ShuffleIcon /> : <ArrowRightAltIcon />}
          </IconButton>
          <IconButton
            onClick={() => onDisplayStyleChange(displayStyleSequence[state.displayStyle])}
            title={`Display: ${DisplayStyle[state.displayStyle]}`}
          >
            {renderDisplayStyleIcon()}
          </IconButton>
            <IconButton
              onClick={() => onTransitionStyleChange(transitionStyleSequence[state.transitionStyle])}
              title={`Transition: ${TransitionStyle[state.transitionStyle]}`}
            >
              <TransitionStyleIcon />
            </IconButton>
          </MenuCollapser>
        </div>
        <div />
      </div>
      <div className={classes.centreNavControls}>
        {!isMobile() && <IconButton onClick={onBack}><NavigateBeforeIcon /></IconButton>}
        <IconButton onClick={() => (state.isPlaying ? onPause(): onPlay())} size="small">
          {state.isPlaying && <PauseIcon className={classes.largeIcon} />}
          {!state.isPlaying && <PlayArrowIcon className={classes.largeIcon} />}
        </IconButton>
        {!isMobile() && <IconButton onClick={onNext}><NavigateNextIcon /></IconButton>}
      </div>
      <div className={classes.sideContainer}>
        <div />
        <div className={classes.subContainer}>
          <Slider
            className={classes.speedSlider}
            value={state.speed}
            max={5}
            min={1}
            onChange={(e, v) => { if (state.speed !== v) onSpeedChange(Number(v)); }}
            step={1}
          />
        </div>
        <div className={classes.subContainer}>
          <IconButton
            color={state.volume === 0 ? 'primary' : undefined}
            onClick={() => onVolumeChange(state.volume === 0 ? 100 : 0 )}
          >
            <VolumeMuteIcon />
          </IconButton>
          <IconButton onClick={() => (state.isFullscreen ? onExitFullscreen(): onEnterFullscreen())}>
            {state.isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default withStyles(styles)(ControlBar);
