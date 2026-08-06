import { IStateDB } from '@jupyterlab/statedb';
import {
  createDefaultPadDocument,
  parseStoredPadState,
  serializePadDocument,
  type EquationCopySurroundMode,
  type EquationForgeOptions,
  type PadDocument
} from '@equation-forge/ui';

export const EQUATION_FORGE_STATE_KEY =
  'jupyterlab-equation-forge:document-state';

export interface IEquationForgeState {
  document: PadDocument;
  activeEquationId: string | null;
  options: EquationForgeOptions;
}

export interface IEquationForgeStorage {
  load(): Promise<IEquationForgeState>;
  save(state: IEquationForgeState): Promise<void>;
  flush(): Promise<void>;
}

type StoredEquationForgeState = {
  document?: unknown;
  activeEquationId?: unknown;
  options?: {
    copySurroundMode?: unknown;
    showEquationNumbers?: unknown;
    wrapEquationCopiesInDisplayMath?: unknown;
  };
};

function isCopySurroundMode(value: unknown): value is EquationCopySurroundMode {
  return (
    value === 'none' ||
    value === 'display-math' ||
    value === 'equation-environment'
  );
}

export function createDefaultEquationForgeState(): IEquationForgeState {
  const document = createDefaultPadDocument();
  return {
    document,
    activeEquationId: document.equations[0]?.id ?? null,
    options: {
      copySurroundMode: 'display-math',
      showEquationNumbers: true
    }
  };
}

export function parseEquationForgeState(value: unknown): IEquationForgeState {
  if (!value || typeof value !== 'object') {
    return createDefaultEquationForgeState();
  }

  const candidate = value as StoredEquationForgeState;
  const document = parseStoredPadState(candidate.document);
  const requestedActiveId =
    typeof candidate.activeEquationId === 'string'
      ? candidate.activeEquationId
      : null;
  const activeEquationId = document.equations.some(
    equation => equation.id === requestedActiveId
  )
    ? requestedActiveId
    : (document.equations[0]?.id ?? null);
  const storedOptions = candidate.options;

  return {
    document,
    activeEquationId,
    options: {
      copySurroundMode: isCopySurroundMode(storedOptions?.copySurroundMode)
        ? storedOptions.copySurroundMode
        : typeof storedOptions?.wrapEquationCopiesInDisplayMath === 'boolean'
          ? storedOptions.wrapEquationCopiesInDisplayMath
            ? 'display-math'
            : 'none'
          : 'display-math',
      showEquationNumbers:
        typeof storedOptions?.showEquationNumbers === 'boolean'
          ? storedOptions.showEquationNumbers
          : true
    }
  };
}

export class StateDBEquationForgeStorage implements IEquationForgeStorage {
  constructor(
    private readonly stateDB: IStateDB,
    private readonly key = EQUATION_FORGE_STATE_KEY
  ) {}

  async load(): Promise<IEquationForgeState> {
    const stored = await this.stateDB.fetch(this.key);
    if (stored !== null && stored !== undefined) {
      return parseEquationForgeState(stored);
    }

    return createDefaultEquationForgeState();
  }

  save(state: IEquationForgeState): Promise<void> {
    const stored = {
      document: serializePadDocument(state.document),
      activeEquationId: state.activeEquationId,
      options: state.options
    };
    this.pendingSave = this.pendingSave.then(() =>
      this.stateDB.save(this.key, stored)
    );
    return this.pendingSave;
  }

  flush(): Promise<void> {
    return this.pendingSave;
  }

  private pendingSave: Promise<void> = Promise.resolve();
}
