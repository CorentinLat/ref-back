import path from 'path';

const rootPath = path.join(__dirname, '../..');

const srcPath = path.join(rootPath, 'src');
const srcMainPath = path.join(srcPath, 'electron');

const releasePath = path.join(rootPath, 'release');
const appPath = path.join(releasePath, 'app');
const appNodeModulesPath = path.join(appPath, 'node_modules');
const srcNodeModulesPath = path.join(srcPath, 'node_modules');

const distPath = path.join(appPath, 'dist');
const distMainPath = path.join(distPath, 'electron');
const distRendererPath = path.join(distPath, 'angular');

export default {
  rootPath,
  srcPath,
  srcMainPath,
  releasePath,
  appPath,
  appNodeModulesPath,
  srcNodeModulesPath,
  distPath,
  distMainPath,
  distRendererPath,
};
