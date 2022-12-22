import {
    app,
    Menu,
    shell,
    BrowserWindow,
    MenuItemConstructorOptions,
} from 'electron';

import checkUpdates from './utils/update';

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
            label: 'Perf\'Arbitres++',
            submenu: [
                {
                    label: 'À propos de Perf\'Arbitres++',
                    selector: 'orderFrontStandardAboutPanel:',
                },
                { type: 'separator' },
                {
                    label: 'Masquer Perf\'Arbitres++',
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
                        shell.openExternal('https://github.com/CorentinLat/perf-arbitres-plus-plus/wiki');
                    },
                },
                { type: 'separator' },
                {
                    label: 'Vérifier les mises à jour',
                    click() {
                        checkUpdates();
                    },
                },
                { type: 'separator' },
                {
                    label: 'Contribuer',
                    click() {
                        shell.openExternal('https://github.com/CorentinLat/perf-arbitres-plus-plus');
                    },
                },
                {
                    label: 'Suggestion ?',
                    click() {
                        shell.openExternal('https://github.com/CorentinLat/perf-arbitres-plus-plus/issues');
                    },
                },
            ],
        };

        const subMenuView =
            process.env.NODE_ENV === 'development' ||
            process.env.DEBUG_PROD === 'true'
                ? subMenuViewDev
                : subMenuViewProd;

        return [subMenuAbout, subMenuView, subMenuWindow, subMenuHelp];
    }

    buildDefaultTemplate() {
        const templateDefault = [
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
                        label: 'Documentation',
                        click() {
                            shell.openExternal('https://github.com/CorentinLat/perf-arbitres-plus-plus/wiki');
                        },
                    },
                    {
                        label: 'Vérifier les mises à jour',
                        click() {
                            checkUpdates();
                        },
                    },
                    {
                        label: 'Contribuer',
                        click() {
                            shell.openExternal('https://github.com/CorentinLat/perf-arbitres-plus-plus');
                        },
                    },
                    {
                        label: 'Suggestion ?',
                        click() {
                            shell.openExternal('https://github.com/CorentinLat/perf-arbitres-plus-plus/issues');
                        },
                    },
                ],
            },
        ];

        return templateDefault;
    }
}
