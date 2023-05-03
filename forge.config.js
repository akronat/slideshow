module.exports = {
  packagerConfig: {
    ignore: (path) => {
      if (!path || path.startsWith('/package.json') || path.startsWith('/build')) {
        return false;
      }
      return true;
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      config: {},
    },
  ],
};
