import React from 'react';
import Hammer from 'react-hammerjs';
import classnames from 'classnames';

import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import SliderSlide from './SliderSlide';
import buildArray from '../util/buildArray';
import SlideState from '../api/SlideState';
import TransitionStyle from '../api/TransitionStyle';

const styles = ({ palette, spacing }: Theme) => createStyles({
  root: {
    overflow: 'hidden',
    height: '100%',
    width: '100%',
  },
  slider: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  slide: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  slideFadeTransition: {
    // TODO: Calculate transition duration based on flock velocity when flick occurs?
    transition: 'opacity 400ms ease', // cubic-bezier(0.5, 0, 0.5, 1)',
  },
  slideSlideTransition: {
    // TODO: Calculate transition duration based on flock velocity when flick occurs?
    transition: 'transform 200ms ease-out', // cubic-bezier(0.5, 0, 0.5, 1)`,
  },
  slideInstantTransition: {},
});

interface Props extends WithStyles<typeof styles> {
  className?: string;
  slideIndex: number;
  slideContentRenderer: (state: SlideState) => React.ReactNode,
  preloadCount?: number;
  onNext?: () => void;
  onBack?: () => void;
  /** Minimum % pan to trigger slide change */
  panSensitivity?: number;
  /** Minimum flick velocity to trigger slide change */
  flickSensitivity?: number;
  transitionStyle?: TransitionStyle;
}
const Slider: React.FC<Props> = ({
  classes, className,
  slideIndex,
  slideContentRenderer,
  preloadCount = 1,
  onNext = () => {},
  onBack = () => {},
  panSensitivity = 25,
  flickSensitivity = 1.0,
  transitionStyle = TransitionStyle.Slide,
}) => {
  const [swipePanX, setSwipePanX] = React.useState<number>(0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const handlePan: HammerListener = (e) => {
    if (rootRef.current) {
      const panPerc = 100 * e.deltaX / rootRef.current.clientWidth;
      setSwipePanX(panPerc);
      if (e.isFinal) {
        setSwipePanX(0);
        if (e.velocityX > flickSensitivity) {
          onBack();
        } else if (e.velocityX < -flickSensitivity) {
          onNext();
        } else if (panPerc <= -panSensitivity) {
          onNext();
        } else if (panPerc >= panSensitivity) {
          onBack();
        }
      }
    }
  };

  const renderSlide = (slideNum: number) => {
    const offset = slideNum - preloadCount;
    const translate = swipePanX + offset * 100;
    let opacity = 1;
    if (transitionStyle === TransitionStyle.Fade) {
      if (offset === 0) {
        opacity = 1 - (Math.abs(swipePanX) / 100);
      } else if (offset * Math.sign(swipePanX) === -1) {
        // This is the next or previous slide and is fading in
        opacity = Math.abs(swipePanX) / 100;
      } else {
        opacity = 0;
      }
    } else if (transitionStyle === TransitionStyle.Instant) {
      opacity = offset === 0 ? 1 : 0;
    }

    return (
      <div
        className={classnames(classes.slide, {
          [classes.slideFadeTransition]: !swipePanX && transitionStyle === TransitionStyle.Fade,
          [classes.slideInstantTransition]: !swipePanX && transitionStyle === TransitionStyle.Instant,
          [classes.slideSlideTransition]: !swipePanX && transitionStyle === TransitionStyle.Slide,
        })}
        key={slideIndex + offset}
        style={{
          transform: `translateX(${translate}%)`,
          opacity,
          zIndex: opacity === 0 ? 0 : 1,
        }}
      >
        <SliderSlide
          slideState={{
            index: slideIndex + offset,
            isActive: offset === 0 && swipePanX === 0,
          }}
          slideContentRenderer={slideContentRenderer}
        />
      </div>
    );
  };

  return (
    <div className={classnames(classes.root, className)} ref={rootRef}>
      <Hammer onPan={handlePan}>
        <div className={classes.slider}>
          {buildArray(preloadCount * 2 + 1, renderSlide)}
        </div>
      </Hammer>
    </div>
  );
}

export default withStyles(styles)(Slider);
