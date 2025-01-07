import { app, dialog, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron';

import { logsPath } from './utils/path';
import { checkUpdates } from './utils/update';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
    selector?: string;
    submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
    mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

    buildMenu(): Menu {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
            this.setupDevelopmentEnvironment();
        }

        const template = process.platform === 'darwin'
            ? this.buildDarwinTemplate()
            : this.buildDefaultTemplate();

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        return menu;
    }

    setupDevelopmentEnvironment(): void {
        this.mainWindow.webContents.on('context-menu', (_, props) => {
            const { x, y } = props;

            Menu.buildFromTemplate([
                {
                    label: 'Inspect element',
                    click: () => {
                        this.mainWindow.webContents.inspectElement(x, y);
                    },
                },
            ]).popup({ window: this.mainWindow });
        });
    }

    buildDarwinTemplate(): MenuItemConstructorOptions[] {
        const subMenuAbout: DarwinMenuItemConstructorOptions = {
            label: 'Ref\'Back',
            submenu: [
                {
                    label: 'À propos de Ref\'Back',
                    click: () => this.displayAboutDialog(),
                },
                { type: 'separator' },
                {
                    label: 'Masquer Ref\'Back',
                    accelerator: 'Command+H',
                    selector: 'hide:',
                },
                {
                    label: 'Masquer les autres',
                    accelerator: 'Command+Shift+H',
                    selector: 'hideOtherApplications:',
                },
                { label: 'Tout afficher', selector: 'unhideAllApplications:' },
                { type: 'separator' },
                {
                    label: 'Quitter',
                    accelerator: 'Command+Q',
                    click: () => {
                        app.quit();
                    },
                },
            ],
        };
        const subMenuEdit: DarwinMenuItemConstructorOptions =
            {
                label: 'Édition',
                submenu: [
                    {
                        label: 'Annuler',
                        accelerator: 'Command+Z',
                        role: 'undo',
                    },
                    {
                        label: 'Rétablir',
                        accelerator: 'Shift+Command+Z',
                        role: 'redo',
                    },
                    {
                        type: 'separator',
                    },
                    {
                        label: 'Couper',
                        accelerator: 'Command+X',
                        role: 'cut',
                    },
                    {
                        label: 'Copier',
                        accelerator: 'Command+C',
                        role: 'copy',
                    },
                    {
                        label: 'Coller',
                        accelerator: 'Command+V',
                        role: 'paste',
                    },
                    {
                        label: 'Tout sélectionner',
                        accelerator: 'Command+A',
                        role: 'selectAll',
                    },
                ],
            };
        const subMenuViewDev: MenuItemConstructorOptions = {
            label: 'Présentation',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'Command+R',
                    click: () => {
                        this.mainWindow.webContents.reload();
                    },
                },
                {
                    label: 'Toggle Full Screen',
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'Alt+Command+I',
                    click: () => {
                        this.mainWindow.webContents.toggleDevTools();
                    },
                },
            ],
        };
        const subMenuViewProd: MenuItemConstructorOptions = {
            label: 'Présentation',
            submenu: [
                {
                    label: 'Activer/Quitter plein écran',
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    },
                },
            ],
        };
        const subMenuWindow: DarwinMenuItemConstructorOptions = {
            label: 'Fenêtre',
            submenu: [
                { label: 'Minimiser', accelerator: 'Command+M', selector: 'performMiniaturize:' },
                { label: 'Fermer', accelerator: 'Command+W', selector: 'performClose:' },
                { type: 'separator' },
                { label: 'Tout ramener au premier plan', selector: 'arrangeInFront:' },
            ],
        };
        const subMenuHelp: MenuItemConstructorOptions = {
            label: 'Aide',
            submenu: [
                {
                    label: 'Documentation',
                    click() {
                        shell.openExternal('https://corentin-1.gitbook.io/ref-back');
                    },
                },
                {
                    label: 'Dossier logs',
                    click() {
                        shell.openPath(logsPath);
                    },
                },
                { type: 'separator' },
                {
                    label: 'Vérifier les mises à jour',
                    click() {
                        checkUpdates(true);
                    },
                },
                { type: 'separator' },
                {
                    label: 'Contribuer',
                    click() {
                        shell.openExternal('https://github.com/CorentinLat/ref-back');
                    },
                },
                {
                    label: 'Suggestion ?',
                    click() {
                        shell.openExternal('https://github.com/CorentinLat/ref-back/issues');
                    },
                },
            ],
        };

        const subMenuView =
            process.env.NODE_ENV === 'development' ||
            process.env.DEBUG_PROD === 'true'
                ? subMenuViewDev
                : subMenuViewProd;

        return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
    }

    buildDefaultTemplate(): MenuItemConstructorOptions[] {
        return [
            {
                label: '&Fichier',
                submenu: [
                    {
                        label: '&Fermer',
                        accelerator: 'Ctrl+W',
                        click: () => {
                            this.mainWindow.close();
                        },
                    },
                ],
            },
            {
                label: '&Édition',
                submenu: [
                    {
                        label: 'Annuler',
                        accelerator: 'Ctrl+Z',
                        role: 'undo',
                    },
                    {
                        label: 'Rétablir',
                        accelerator: 'Shift+Ctrl+Z',
                        role: 'redo',
                    },
                    {
                        type: 'separator',
                    },
                    {
                        label: 'Couper',
                        accelerator: 'Ctrl+X',
                        role: 'cut',
                    },
                    {
                        label: 'Copier',
                        accelerator: 'Ctrl+C',
                        role: 'copy',
                    },
                    {
                        label: 'Coller',
                        accelerator: 'Ctrl+V',
                        role: 'paste',
                    },
                    {
                        label: 'Tout sélectionner',
                        accelerator: 'Ctrl+A',
                        role: 'selectAll',
                    },
                ],
            },
            {
                label: '&Présentation',
                submenu:
                    process.env.NODE_ENV === 'development' ||
                    process.env.DEBUG_PROD === 'true'
                        ? [
                            {
                                label: '&Reload',
                                accelerator: 'Ctrl+R',
                                click: () => {
                                    this.mainWindow.webContents.reload();
                                },
                            },
                            {
                                label: 'Toggle &Full Screen',
                                accelerator: 'F11',
                                click: () => {
                                    this.mainWindow.setFullScreen(
                                        !this.mainWindow.isFullScreen(),
                                    );
                                },
                            },
                            {
                                label: 'Toggle &Developer Tools',
                                accelerator: 'Alt+Ctrl+I',
                                click: () => {
                                    this.mainWindow.webContents.toggleDevTools();
                                },
                            },
                        ]
                        : [
                            {
                                label: 'Activer/Quitter &Plein Écran',
                                accelerator: 'F11',
                                click: () => {
                                    this.mainWindow.setFullScreen(
                                        !this.mainWindow.isFullScreen(),
                                    );
                                },
                            },
                        ],
            },
            {
                label: 'Aide',
                submenu: [
                    {
                        label: 'À Propos',
                        click: () => this.displayAboutDialog(),
                    },
                    {
                        label: 'Documentation',
                        click() {
                            shell.openExternal('https://corentin-1.gitbook.io/ref-back');
                        },
                    },
                    {
                        label: 'Dossier logs',
                        click() {
                            shell.openPath(logsPath);
                        },
                    },
                    {
                        label: 'Vérifier les mises à jour',
                        click() {
                            checkUpdates(true);
                        },
                    },
                    {
                        label: 'Contribuer',
                        click() {
                            shell.openExternal('https://github.com/CorentinLat/ref-back');
                        },
                    },
                    {
                        label: 'Suggestion ?',
                        click() {
                            shell.openExternal('https://github.com/CorentinLat/ref-back/issues');
                        },
                    },
                ],
            },
        ];
    }

    private displayAboutDialog() {
        dialog.showMessageBox(this.mainWindow, {
            message: 'Ref\'Back a pour but de vous aider à réaliser vos feedbacks de match.\n' +
                'Copyright (C) 2025 Corentin Latappy\n' +
                '\n' +
                'This program is free software: you can redistribute it and/or modify' +
                ' it under the terms of the GNU General Public License as published by' +
                ' the Free Software Foundation, in version 3 of the License.\n' +
                '\n' +
                'This program is distributed in the hope that it will be useful,' +
                ' but WITHOUT ANY WARRANTY; without even the implied warranty of' +
                ' MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the' +
                ' GNU General Public License for more details.\n' +
                '\n' +
                'You should have received a copy of the GNU General Public License' +
                ' along with this program. If not, see https://www.gnu.org/licenses/',
            title: 'À Propos',
            type: 'none',
        });
    }
}
