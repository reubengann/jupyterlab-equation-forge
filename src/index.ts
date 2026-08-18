import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  ICommandPalette,
  MainAreaWidget,
  ToolbarButton,
  WidgetTracker
} from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { IStateDB } from '@jupyterlab/statedb';
import { LabIcon, addIcon } from '@jupyterlab/ui-components';

import {
  EquationForgeToolbarControls,
  EquationForgeWidget
} from './equationForgeWidget';
import { addCaptureModeToolbarButton } from './captureModeToolbar';
import { StateDBEquationForgeStorage } from './storage';

export const PLUGIN_ID = 'jupyterlab-equation-forge:plugin';
export const OPEN_COMMAND = 'jupyterlab-equation-forge:open';
export const ADD_EQUATION_COMMAND =
  'jupyterlab-equation-forge:add-equation-entry';
export const WIDGET_ID = 'jupyterlab-equation-forge:main';

export const equationForgeIcon = new LabIcon({
  name: 'jupyterlab-equation-forge:icon',
  svgstr:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M4 3h16v18H4V3zm2 2v14h12V5H6zm2 2h8v2H8V7zm0 4h3v2H8v-2zm5 0h3v2h-3v-2zm-5 4h3v2H8v-2zm5 0h3v2h-3v-2z"/></svg>'
});

export type ActivateOptions = {
  app: JupyterFrontEnd;
  restorer: ILayoutRestorer;
  stateDB: IStateDB;
  launcher: ILauncher | null;
  palette: ICommandPalette | null;
};

export function activate({
  app,
  restorer,
  stateDB,
  launcher,
  palette
}: ActivateOptions): void {
  const tracker = new WidgetTracker<MainAreaWidget<EquationForgeWidget>>({
    namespace: 'jupyterlab-equation-forge'
  });
  let widget: MainAreaWidget<EquationForgeWidget> | null = null;

  app.commands.addCommand(OPEN_COMMAND, {
    label: 'Open Equation Forge',
    caption: 'Open Equation Forge',
    icon: equationForgeIcon,
    execute: () => {
      if (!widget || widget.isDisposed) {
        const content = new EquationForgeWidget(
          new StateDBEquationForgeStorage(stateDB)
        );
        widget = new MainAreaWidget({ content });
        widget.id = WIDGET_ID;
        widget.title.label = 'Equation Forge';
        widget.title.icon = equationForgeIcon;
        widget.title.closable = true;
        widget.toolbar.addItem(
          'addEquation',
          new ToolbarButton({
            icon: addIcon,
            label: 'Add item',
            tooltip: 'Add equation',
            onClick: () => content.addEquation()
          })
        );
        widget.toolbar.addItem(
          'equationForgeOptions',
          new EquationForgeToolbarControls(content)
        );
        addCaptureModeToolbarButton(app, widget);
      }

      if (!widget.isAttached) {
        app.shell.add(widget, 'main');
      }
      if (!tracker.has(widget)) {
        void tracker.add(widget);
      }

      app.shell.activateById(widget.id);
      return widget;
    }
  });

  app.commands.addCommand(ADD_EQUATION_COMMAND, {
    describedBy: {
      args: {
        type: 'object',
        properties: {
          latex: { type: 'string' }
        },
        required: ['latex']
      }
    },
    label: 'Add Equation Entry',
    caption: 'Add a new Equation Forge entry containing the supplied LaTeX',
    execute: async args => {
      const latex = args['latex'];
      if (typeof latex !== 'string') {
        throw new TypeError(
          `${ADD_EQUATION_COMMAND} requires a string "latex" argument`
        );
      }
      await app.commands.execute(OPEN_COMMAND);
      await widget!.content.addEquationEntry(latex);
    }
  });

  launcher?.add({
    command: OPEN_COMMAND,
    category: 'Other',
    rank: 10
  });
  palette?.addItem({
    command: OPEN_COMMAND,
    category: 'Equation Forge'
  });

  void restorer.restore(tracker, {
    command: OPEN_COMMAND,
    name: () => WIDGET_ID
  });
}

/**
 * Initialization data for the jupyterlab-equation-forge extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'Equation Forge main-area workspace for JupyterLab.',
  autoStart: true,
  requires: [ILayoutRestorer, IStateDB],
  optional: [ILauncher, ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    stateDB: IStateDB,
    launcher: ILauncher | null,
    palette: ICommandPalette | null
  ) => {
    activate({ app, restorer, stateDB, launcher, palette });
  }
};

export default plugin;
