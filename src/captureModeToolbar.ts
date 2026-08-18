import type { JupyterFrontEnd } from '@jupyterlab/application';
import {
  CommandToolbarButton,
  type MainAreaWidget
} from '@jupyterlab/apputils';

import type { EquationForgeWidget } from './equationForgeWidget';

export const TOGGLE_CAPTURE_MODE_COMMAND =
  'math-notebook-tools:toggle-capture-mode';

export function addCaptureModeToolbarButton(
  app: JupyterFrontEnd,
  widget: MainAreaWidget<EquationForgeWidget>
): void {
  if (!app.commands.hasCommand(TOGGLE_CAPTURE_MODE_COMMAND)) {
    return;
  }
  widget.toolbar.addItem(
    'captureMode',
    new CommandToolbarButton({
      commands: app.commands,
      id: TOGGLE_CAPTURE_MODE_COMMAND,
      args: { toolbar: true }
    })
  );
}
