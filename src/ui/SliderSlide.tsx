import React from 'react';
import SlideState from '../api/SlideState';

interface Props {
  slideState: SlideState;
  slideContentRenderer: (state: SlideState) => React.ReactNode;
}
const SliderSlide: React.FC<Props> = ({ slideState, slideContentRenderer }) => {
  const [slide, setSlide] = React.useState<React.ReactNode | undefined>(undefined);
  React.useEffect(() => setSlide(slideContentRenderer(slideState)), [slideState, slideContentRenderer]); // TODO: Is this doing anything with slideState as dependency?
  return <React.Fragment>{slide}</React.Fragment>;
};

export default SliderSlide;
