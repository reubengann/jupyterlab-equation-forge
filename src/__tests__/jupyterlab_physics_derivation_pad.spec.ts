import { serializePadDocument } from '@physics-derivation-pad/ui';

import {
  PAD_STATE_KEY,
  StateDBPadStorage,
  createDefaultPadState,
  parsePadState
} from '../storage';

describe('pad storage', () => {
  it('normalizes invalid persisted state', () => {
    const state = parsePadState({ document: { schemaVersion: -1 } });

    expect(state.document.equations).toHaveLength(1);
    expect(state.activeEquationId).toBe(state.document.equations[0].id);
    expect(state.options.wrapEquationCopiesInDisplayMath).toBe(true);
  });

  it('loads and serializes state through JupyterLab StateDB', async () => {
    const initial = createDefaultPadState();
    initial.options.wrapEquationCopiesInDisplayMath = false;
    const fetch = jest.fn().mockResolvedValue({
      document: serializePadDocument(initial.document),
      activeEquationId: initial.activeEquationId,
      options: initial.options
    });
    const save = jest.fn().mockResolvedValue(undefined);
    const storage = new StateDBPadStorage({ fetch, save } as never);

    const loaded = await storage.load();
    await storage.save(loaded);
    await storage.flush();

    expect(fetch).toHaveBeenCalledWith(PAD_STATE_KEY);
    expect(save).toHaveBeenCalledWith(
      PAD_STATE_KEY,
      expect.objectContaining({
        document: serializePadDocument(initial.document),
        options: { wrapEquationCopiesInDisplayMath: false }
      })
    );
  });
});
