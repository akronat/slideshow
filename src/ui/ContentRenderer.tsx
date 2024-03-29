import React from 'react';
import classnames from 'classnames';

import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';

import ContentData from '../api/ContentData';
import ContentType from '../api/ContentType';
import ContentZoomPan from '../api/ContentZoomPan';
import Size from '../util/Size';
import DisplayStyle from '../api/DisplayStyle';
import ContentSource from '../api/ContentSource';

const styles = ({ palette, spacing }: Theme) => createStyles({
  root: {
    width: '100%',
    height: '100%',
  },
  content: {
    width: '100%',
    height: '100%',
    objectFit: 'scale-down',
    pointerEvents: 'none',
  },
  contentStretch: {
    objectFit: 'contain',
  },
  contentZoomPan: {
    objectFit: 'contain',
  },
});

interface Props extends WithStyles<typeof styles> {
  className?: string;
  data: ContentData;
  duration?: number;
  isActive: boolean;
  displayStyle?: DisplayStyle;
  volume?: number;
  onSourceInvalid?: (source: ContentSource) => void;
}
const ContentRenderer: React.FC<Props> = ({
  classes,
  className,
  data,
  duration = 0,
  isActive,
  displayStyle = DisplayStyle.Standard,
  volume = 0,
  onSourceInvalid = () => undefined,
}) => {
  const [dataUrl, setDataUrl] = React.useState('');
  const [error, setError] = React.useState('');
  const [transform, setTransform] = React.useState({});

  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onLoad = (err: string | undefined, url: string | undefined) => {
      setDataUrl(url ?? '');
      setError(err ?? '');
      if (err) {
        console.warn(`Unable to load "${data.contentSource.name}" as image or video: ${err}`);
        onSourceInvalid(data.contentSource);
      }
    };
    data.load(onLoad);
    return () => {
      data.cancelLoad(onLoad);
    };
  }, [data, onSourceInvalid]);

  const contentSize = data.getSize();
  const contentType = data.getType();
  const displaySize = new Size(rootRef.current?.clientWidth || 1, rootRef.current?.clientHeight || 1);
  React.useEffect(() => {
    const isZoomPan = [DisplayStyle.ZoomPan, DisplayStyle.ZoomPanReturn].includes(displayStyle);
    if (isActive && isZoomPan && contentType === ContentType.Image) {
      const zoomer = new ContentZoomPan(
        new Size(contentSize.width, contentSize.height),
        new Size(displaySize.width, displaySize.height),
        duration,
        setTransform,
        displayStyle === DisplayStyle.ZoomPanReturn,
      );
      zoomer.start();
      return () => zoomer.stop();
    }
  }, [isActive, displayStyle, duration, displaySize.width, displaySize.height, contentSize.width, contentSize.height, contentType]);

  const imgVidClassName = classnames(classes.content, {
    [classes.contentStretch]: displayStyle === DisplayStyle.Stretch,
    [classes.contentZoomPan]: [DisplayStyle.ZoomPan, DisplayStyle.ZoomPanReturn].includes(displayStyle),
  });
  let content = null;
  if (error) return content = <span>Error loading {data.contentSource.name}: {error}</span>;
  else if (!dataUrl) return <span>Loading...</span>;
  else if (contentType === ContentType.Image) {
    content = <img className={imgVidClassName} src={dataUrl} alt="" style={transform} />;
  } else if (contentType === ContentType.Video) {
    const playPauseOnMount = (vid: HTMLVideoElement | null) => {
      if (vid && vid.paused && isActive) {
        vid.play();
      } else if (vid && !vid.paused && !isActive) {
        vid.pause();
      }
    };
    content = <video
      autoPlay={isActive}
      className={imgVidClassName}
      loop
      muted={volume === 0}
      preload="auto"
      ref={playPauseOnMount}
      src={dataUrl}
      style={transform}
    />;
  }
  return <div className={classes.root} ref={rootRef}>{content}</div>;
};

export default withStyles(styles)(ContentRenderer);
