import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { IStateDB } from '@jupyterlab/statedb';
import { LabIcon } from '@jupyterlab/ui-components';

import { DerivationPadWidget } from './padWidget';
import { StateDBPadStorage } from './storage';

export const PLUGIN_ID = 'jupyterlab-physics-derivation-pad:plugin';
export const OPEN_COMMAND = 'jupyterlab-physics-derivation-pad:open';
export const WIDGET_ID = 'jupyterlab-physics-derivation-pad:main';

export const derivationPadIcon = new LabIcon({
  name: 'jupyterlab-physics-derivation-pad:icon',
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
  const tracker = new WidgetTracker<MainAreaWidget<DerivationPadWidget>>({
    namespace: 'jupyterlab-physics-derivation-pad'
  });
  let widget: MainAreaWidget<DerivationPadWidget> | null = null;

  app.commands.addCommand(OPEN_COMMAND, {
    label: 'Open Physics Derivation Pad',
    caption: 'Open the Physics Derivation Pad',
    icon: derivationPadIcon,
    execute: async () => {
      if (!widget || widget.isDisposed) {
        const content = new DerivationPadWidget(new StateDBPadStorage(stateDB));
        widget = new MainAreaWidget({ content });
        widget.id = WIDGET_ID;
        widget.title.label = 'Physics Derivation Pad';
        widget.title.icon = derivationPadIcon;
        widget.title.closable = true;
        await tracker.add(widget);
        app.shell.add(widget, 'main');
      }

      app.shell.activateById(widget.id);
      return widget;
    }
  });

  launcher?.add({
    command: OPEN_COMMAND,
    category: 'Other',
    rank: 10
  });
  palette?.addItem({
    command: OPEN_COMMAND,
    category: 'Physics'
  });

  void restorer.restore(tracker, {
    command: OPEN_COMMAND,
    name: () => WIDGET_ID
  });
}

/**
 * Initialization data for the jupyterlab-physics-derivation-pad extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'Physics Derivation Pad main-area workspace for JupyterLab.',
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
