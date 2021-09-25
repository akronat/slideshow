
const isElectron = () => /electron/i.test(navigator.userAgent);

export default isElectron;
