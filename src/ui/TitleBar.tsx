import React from 'react';
import classnames from 'classnames';

import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import MaximizeIcon from '@material-ui/icons/Maximize';
import MinimizeIcon from '@material-ui/icons/Minimize';


const styles = ({ palette, spacing }: Theme) => createStyles({
  titlebar: {
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    backgroundColor: palette.controlPanel.main,
    justifyContent: 'space-between',
    position: 'relative',
  },
  dragRegion: {
    top: 6,
    left: 6,
    display: 'block',
    position: 'absolute',
    width: 'calc(100% - 12px)',
    height: 'calc(100% - 6px)',
    zIndex: -1,
    appRegion: 'drag',
  },
  section: {
    display: 'flex',
    height: '100%',
  },
  logo: {
    height: '100%',
    padding: spacing(0.5),
  },
  button: {
    borderRadius: 0,
    appRegion: 'no-drag',
  },
  closeButton: {
    '&:hover': {
      backgroundColor: palette.error.main,
    },
  },
});

interface Props extends WithStyles<typeof styles> {
  className?: string;
  slideTitle?: string;
}
const TitleBar: React.FC<Props> = ({
  classes,
  className,
  slideTitle,
}) => (
  <div className={classnames(className, classes.titlebar)}>
    <div className={classes.dragRegion}></div>
    <div className={classes.section}>
      <img className={classes.logo} src={`${process.env.PUBLIC_URL}/logo192.png`} alt="" />
      <Typography display="inline" variant="subtitle1">Slideshow</Typography>
    </div>
    <div className={classes.section}>
      <Typography display="inline" variant="subtitle1">{slideTitle}</Typography>
    </div>
    <div className={classes.section}>
      <IconButton className={classes.button} onClick={() => global.electronIpc?.send('minimize')}><MinimizeIcon /></IconButton>
      <IconButton className={classes.button} onClick={() => global.electronIpc?.send('maximize')}><MaximizeIcon /></IconButton>
      <IconButton className={classnames(classes.button, classes.closeButton)} onClick={() => global.electronIpc?.send('close')}><CloseIcon /></IconButton>
    </div>
  </div>
);

export default withStyles(styles)(TitleBar);
