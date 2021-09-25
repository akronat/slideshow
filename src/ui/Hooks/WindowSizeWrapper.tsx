import { FunctionComponent } from 'react';
import useWindowSize from './useWindowSize';

type WindowSizeChildren = (width: number, height: number) => any;

interface WindowSizeProps {
  children: WindowSizeChildren;
}

const WindowSizeWrapper: FunctionComponent<WindowSizeProps> = ({
  children,
}) => {
  const [width, height] = useWindowSize();

  return children(width, height);
};

export default WindowSizeWrapper;
