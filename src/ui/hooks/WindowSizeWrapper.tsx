import { FunctionComponent } from 'react';
import Size from '../../util/Size';
import useWindowSize from './useWindowSize';

type WindowSizeChildren = (size: Size) => any;

interface WindowSizeProps {
  children: WindowSizeChildren;
}

const WindowSizeWrapper: FunctionComponent<WindowSizeProps> = ({ children }) => children(useWindowSize());

export default WindowSizeWrapper;
