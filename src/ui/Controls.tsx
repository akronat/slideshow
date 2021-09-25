import React from 'react';
import classnames from 'classnames';

import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
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

import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import ShuffleIcon from '@material-ui/icons/Shuffle';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import HeightIcon from '@material-ui/icons/Height';
import MenuIcon from '@material-ui/icons/Menu';
import ImageIcon from '@material-ui/icons/Image';
import LinkIcon from '@material-ui/icons/Link';

import SlideshowState from '../api/SlideshowState';
import isMobile from '../util/isMobile';


const styles = () => createStyles({
  root: {
    backgroundColor: 'black',
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    '&>*': {
      flex: '1 1 0',
    },
    zIndex: 1000,
  },
  navControls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otherControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visualControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedContainer: {
    display: 'flex', // For some reason needed to properly size itself!?!?
  },
  speedSlider: {
    width: 100,
  }
});

interface Props extends WithStyles<typeof styles> {
  className?: string;
  state: SlideshowState;
  onNext?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBack?: () => void;
  onEnterFullscreen?: () => void;
  onExitFullscreen?: () => void;
  onShuffleChange?: (shuffle: boolean) => void;
  onStretchChange?: (stretch: boolean) => void;
  onSpeedChange?: (speed: number) => void;
  onFilesAdded?: (files: File[]) => void;
  onUrlsAdded?: (files: string[]) => void;
}
const Controls: React.FC<Props> = ({
  classes, className, state,
  onNext = () => {},
  onPlay = () => {},
  onPause = () => {},
  onBack = () => {},
  onEnterFullscreen = () => {},
  onExitFullscreen = () => {},
  onShuffleChange = () => {},
  onStretchChange = () => {},
  onSpeedChange = () => {},
  onFilesAdded = () => {},
  onUrlsAdded = () => {},
}) => {
  const [linkInputOpen, setLinkInputOpen] = React.useState(false);
  const [linkUrls, setLinkUrls] = React.useState<string[]>([]);
  const tmpInput = document.createElement('input');
  const dirPropName = ['webkitdirectory', 'mozdirectory', 'odirectory', 'msdirectory', 'directory'].find(p => p in tmpInput);
  return (
    <div className={classnames(classes.root, className)}>
      <div className={classes.visualControls}>
        <div>
          <IconButton><MenuIcon /></IconButton>
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
        <div>
          <IconButton
            color={state.isShuffled ? 'primary' : undefined}
            onClick={() => onShuffleChange(!state.isShuffled)}
          >
            <ShuffleIcon />
          </IconButton>
          <IconButton
            color={state.isStretched ? 'primary' : undefined}
            onClick={() => onStretchChange(!state.isStretched)}
          >
            <HeightIcon />
          </IconButton>
        </div>
      </div>
      <div className={classes.navControls}>
        {!isMobile() && <IconButton onClick={onBack}><NavigateBeforeIcon /></IconButton>}
        <IconButton onClick={() => (state.isPlaying ? onPause(): onPlay())}>
          {state.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        {!isMobile() && <IconButton onClick={onNext}><NavigateNextIcon /></IconButton>}
      </div>
      <div className={classes.otherControls}>
        <div className={classes.speedContainer}>
          <Slider
            className={classes.speedSlider}
            value={state.speed}
            max={5}
            min={1}
            onChange={(e, v) => { if (state.speed !== v) onSpeedChange(Number(v)); }}
            step={1}
          />
        </div>
        <div>
          <IconButton onClick={() => (state.isFullscreen ? onExitFullscreen(): onEnterFullscreen())}>
            {state.isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default withStyles(styles)(Controls);
