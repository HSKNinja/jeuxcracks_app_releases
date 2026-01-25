const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    executableName: "JeuxCracksLauncher",
    asar: true,
  },
  makers: [],
  plugins: []
};
