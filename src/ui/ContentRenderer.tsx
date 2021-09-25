import React from 'react';
import classnames from 'classnames';

import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';

import ContentData from '../api/ContentData';
import ContentType from '../api/ContentType';

const styles = ({ palette, spacing }: Theme) => createStyles({
  content: {
    width: '100%',
    height: '100%',
    objectFit: 'scale-down',
    pointerEvents: 'none',
  },
  contentStretch: {
    objectFit: 'contain',
  },
});

interface Props extends WithStyles<typeof styles> {
  className?: string;
  data: ContentData;
  isActive: boolean;
  stretch?: boolean;
}
const ContentRenderer: React.FC<Props> = ({
  classes, className, data, isActive, stretch = false,
}) => {
  const [dataUrl, setDataUrl] = React.useState('');
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    const onLoad = (err: string | undefined, url: string | undefined) => {
      setDataUrl(url ?? '');
      setError(err ?? '');
    };
    data.load(onLoad);
    return () => {
      data.cancelLoad(onLoad);
    };
  }, [data]);
  const imgVidClassName = classnames(classes.content, { [classes.contentStretch]: stretch });
  if (error) return <div>Error loading {data.contentSource.name}: {error}</div>;
  if (!dataUrl) return <div>Loading...</div>;
  if (data.getType() === ContentType.Image) {
    return <img className={imgVidClassName} src={dataUrl} alt="" />;
  }
  if (data.getType() === ContentType.Video) {
    const playPauseOnMount = (vid: HTMLVideoElement | null) => {
      if (vid && vid.paused && isActive) {
        vid.play();
      } else if (vid && !vid.paused && !isActive) {
        vid.pause();
      }
    };
    return <video
      autoPlay={isActive}
      className={imgVidClassName}
      loop
      muted={true} // TODO: Mute by default, but allow user to adjust volume later in controls?
      preload="auto"
      ref={playPauseOnMount}
      src={dataUrl}
    />;
  }
  return <div></div>;
};

export default withStyles(styles)(ContentRenderer);
