
const buildArray = <T>(length: number, fill: (index: number) => T) => {
  return Array.from({ length }).map((_, i) => fill(i));
};

export default buildArray;
