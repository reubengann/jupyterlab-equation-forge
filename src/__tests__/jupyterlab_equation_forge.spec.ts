import { serializePadDocument } from '@equation-forge/ui';

import {
  EQUATION_FORGE_STATE_KEY,
  StateDBEquationForgeStorage,
  createDefaultEquationForgeState,
  parseEquationForgeState
} from '../storage';

describe('Equation Forge storage', () => {
  it('normalizes invalid persisted state', () => {
    const state = parseEquationForgeState({
      document: { schemaVersion: -1 }
    });

    expect(state.document.equations).toHaveLength(1);
    expect(state.activeEquationId).toBe(state.document.equations[0].id);
    expect(state.options.wrapEquationCopiesInDisplayMath).toBe(true);
  });

  it('loads and serializes state through JupyterLab StateDB', async () => {
    const initial = createDefaultEquationForgeState();
    initial.options.wrapEquationCopiesInDisplayMath = false;
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
        options: { wrapEquationCopiesInDisplayMath: false }
      })
    );
  });
});
