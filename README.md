# Documentation pour les Utilisateurs

[Documentation](https://corentin-1.gitbook.io/ref-back)

---

# For Developers

[![Angular Logo](https://www.vectorlogo.zone/logos/angular/angular-icon.svg)](https://angular.io/) [![Electron Logo](https://www.vectorlogo.zone/logos/electronjs/electronjs-icon.svg)](https://electronjs.org/)

![Maintained](https://img.shields.io/badge/maintained-yes-brightgreen)
[![Make a pull request](https://img.shields.io/badge/PRs-welcome-red.svg)](http://makeapullrequest.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

[![Ref'Back Release](https://github.com/CorentinLat/ref-back/actions/workflows/release.yml/badge.svg)](https://github.com/CorentinLat/ref-back/actions/workflows/release.yml)

## Introduction

**Project build thanks to :** https://github.com/maximegris/angular-electron

Currently runs with:

- Angular v13.3.1
- Electron v18.0.1

/!\ Hot reload only pertains to the renderer process. The main electron process is not able to be hot reloaded, only restarted.

/!\ Angular CLI & Electron Builder needs Node 14 or later to work correctly.

## Getting Started

*Clone this repository locally:*

``` bash
git clone https://github.com/CorentinLat/ref-back
```

*Install dependencies with npm (used by Electron renderer process):*

``` bash
npm install
```

*Install NodeJS dependencies with npm (used by Electron main process):*

``` bash
cd app/
npm install
```

Why two package.json ? This project follow [Electron Builder two package.json structure](https://www.electron.build/tutorials/two-package-structure) in order to optimize final bundle and be still able to use Angular `ng add` feature.
## To build for development

- **in a first terminal window** -> `npm run angular:serve`
- **in a second terminal window** -> `npm run electron:serve`

And Voila! You can launch the application in a local development environment with hot reload!

The application code is managed by `src/electron/main.ts`.

## Project structure

| Folder       | Description                                      |
|--------------|--------------------------------------------------|
| src/electron | Electron main process folder (NodeJS)            |
| src/angular  | Electron renderer process folder (Web / Angular) |

## Included Commands

| Command                  | Description                                                                          |
|--------------------------|--------------------------------------------------------------------------------------|
| `npm run angular:serve`  | Starts the Angular Live Development Server (DEV mode)                                |
| `npm run electron:serve` | Starts the Electron application (DEV mode)                                           |
| `npm run package`        | Builds your application and creates an app consumable based on your operating system |

**The application is optimised. Only /dist folder and NodeJS dependencies are included in the final bundle.**
