import { useLayoutEffect, useState } from 'react';
import Size from '../../util/Size';

const useWindowSize = (): Size => {
  const [size, setSize] = useState(new Size(0, 0));
  useLayoutEffect(() => {
    function updateSize() {
      setSize(new Size(window.innerWidth, window.innerHeight));
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

export default useWindowSize;
