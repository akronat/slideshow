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
  data?: ContentData;
  stretch?: boolean;
}
const ContentRenderer: React.FC<Props> = ({
  classes, className, data, stretch = false,
}) => {
  const imgVidClassName = classnames(classes.content, { [classes.contentStretch]: stretch });
  if (data?.type === ContentType.Image) {
    return <img className={imgVidClassName} src={data.data ?? ''} alt="" />;
  }
  if (data?.type === ContentType.Video) {
    return <video
      className={imgVidClassName}
      src={data.data ?? ''}
      autoPlay
      loop
      // muted={true}
      // onEnded={e => slide?.onVideoEnded?.(e.currentTarget)}
    />;
  }
  return <div></div>;
};

export default withStyles(styles)(ContentRenderer);
