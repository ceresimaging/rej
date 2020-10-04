// eslint-disable-next-line
import { Menu } from '@lumino/widgets'
import { ICommandPalette } from '@jupyterlab/apputils'
import { IMainMenu } from '@jupyterlab/mainmenu'
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base'

import { RejWidget, RejModel } from './rej-widget'

// Import the extension-entry.js without having our webpack
// touch it. This file is designed for the SECOND webpack-ing,
// Which will be done (whether we like it or not) by `jupyter lab build`.
import '!file-loader?name=extension-entry.js!./extension-entry.js'

window._debug = window._debug || {}

const extension = {
  id: 'rej:main',
  autoStart: true,
  requires: [
    ICommandPalette,
    IMainMenu,
    IJupyterWidgetRegistry,
  ],
  activate: (
    app, 
    palette,
    mainMenu,
    widgets,
  ) => {
    window._debug.jupyter = app

    const widgetProps = {
      name: '@ceresimaging/rej',
      version: process.env.npm_package_version,
      exports: { 
        RejWidget, 
        RejModel,
      }
    }
    console.log("Registering rej widget: ", widgetProps)
    widgets.registerWidget(widgetProps)

    /*
    const { commands, shell } = app
    
    const georefMenu = new Menu({ commands })
    georefMenu.title.label = 'Georeference'
    const command = 'georeference:open'
    commands.addCommand(command, {
      label: 'Open Georeference Widget',
      caption: 'Open Georeference Widget',
      execute: () => {
        const widget = new RejWidget()
        shell.add(widget, 'main')
      }
    })
    georefMenu.addItem({ command, args: { origin: 'from the menu' } })
    mainMenu.addMenu(georefMenu, { rank: 80 })
    */
    console.log("rej, well, um.... registered 🤔")
  }
}

console.log("rej loaded")

export default extension;
