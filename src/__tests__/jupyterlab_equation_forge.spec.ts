import {
  serializePadDocument,
  type EquationForgeCommands
} from '@equation-forge/ui';
import { CommandRegistry } from '@lumino/commands';

import {
  TOGGLE_CAPTURE_MODE_COMMAND,
  addCaptureModeToolbarButton
} from '../captureModeToolbar';
import { addEquationWithCurrentCommands } from '../equationForgeCommands';
import {
  EQUATION_FORGE_STATE_KEY,
  StateDBEquationForgeStorage,
  createDefaultEquationForgeState,
  parseEquationForgeState
} from '../storage';

jest.mock('@jupyterlab/apputils', () => ({
  CommandToolbarButton: class {
    constructor(readonly options: unknown) {}
  }
}));

describe('Equation Forge storage', () => {
  it('normalizes invalid persisted state', () => {
    const state = parseEquationForgeState({
      document: { schemaVersion: -1 }
    });

    expect(state.document.equations).toHaveLength(1);
    expect(state.activeEquationId).toBe(state.document.equations[0].id);
    expect(state.options).toEqual({
      copySurroundMode: 'display-math',
      showEquationNumbers: true
    });
  });

  it('migrates the legacy display-math copy option', () => {
    expect(
      parseEquationForgeState({
        options: { wrapEquationCopiesInDisplayMath: false }
      }).options
    ).toEqual({
      copySurroundMode: 'none',
      showEquationNumbers: true
    });
  });

  it('loads and serializes state through JupyterLab StateDB', async () => {
    const initial = createDefaultEquationForgeState();
    initial.options.copySurroundMode = 'equation-environment';
    initial.options.showEquationNumbers = false;
    const fetch = jest.fn().mockResolvedValue({
      document: serializePadDocument(initial.document),
      activeEquationId: initial.activeEquationId,
      options: initial.options
    });
    const save = jest.fn().mockResolvedValue(undefined);
    const storage = new StateDBEquationForgeStorage({
      fetch,
      save
    } as never);

    const loaded = await storage.load();
    await storage.save(loaded);
    await storage.flush();

    expect(fetch).toHaveBeenCalledWith(EQUATION_FORGE_STATE_KEY);
    expect(save).toHaveBeenCalledWith(
      EQUATION_FORGE_STATE_KEY,
      expect.objectContaining({
        document: serializePadDocument(initial.document),
        options: {
          copySurroundMode: 'equation-environment',
          showEquationNumbers: false
        }
      })
    );
  });
});

describe('Equation Forge external insertion', () => {
  it('uses the latest command handle and appends in display mode', async () => {
    const firstAdd = jest.fn();
    const latestAdd = jest.fn();
    const commandsRef = {
      current: { addEquation: firstAdd } as unknown as EquationForgeCommands
    };
    const ready = Promise.resolve();

    await addEquationWithCurrentCommands(ready, commandsRef, 'x=y');
    commandsRef.current = {
      addEquation: latestAdd
    } as unknown as EquationForgeCommands;
    await addEquationWithCurrentCommands(ready, commandsRef, 'F=ma');

    expect(firstAdd).toHaveBeenCalledWith('x=y', 'display');
    expect(latestAdd).toHaveBeenCalledWith('F=ma', 'display');
  });
});

describe('Equation Forge capture mode integration', () => {
  it('adds the shared capture command when it is available', () => {
    const commands = new CommandRegistry();
    commands.addCommand(TOGGLE_CAPTURE_MODE_COMMAND, {
      label: 'Toggle Capture Mode',
      execute: () => undefined
    });
    const addItem = jest.fn();

    addCaptureModeToolbarButton(
      { commands } as never,
      { toolbar: { addItem } } as never
    );

    expect(addItem).toHaveBeenCalledWith('captureMode', expect.anything());
  });

  it('omits the capture button when Math Notebook Tools is absent', () => {
    const addItem = jest.fn();

    addCaptureModeToolbarButton(
      { commands: new CommandRegistry() } as never,
      { toolbar: { addItem } } as never
    );

    expect(addItem).not.toHaveBeenCalled();
  });
});
