import rimraf from 'rimraf';

import webpackPaths from '../configs/webpack.paths';

const args = process.argv.slice(2);
const commandMap = {
  dist: webpackPaths.distPath,
  release: webpackPaths.releasePath,
};

args.forEach((x) => {
  const pathToRemove = commandMap[x];
  if (pathToRemove !== undefined) {
    rimraf.sync(pathToRemove);
  }
});
