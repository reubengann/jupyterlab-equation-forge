import { IStateDB } from '@jupyterlab/statedb';
import {
  createDefaultPadDocument,
  parseStoredPadState,
  serializePadDocument,
  type DerivationPadOptions,
  type PadDocument
} from '@physics-derivation-pad/ui';

export const PAD_STATE_KEY = 'jupyterlab-physics-derivation-pad:document-state';

export interface IPadState {
  document: PadDocument;
  activeEquationId: string | null;
  options: DerivationPadOptions;
}

export interface IPadStorage {
  load(): Promise<IPadState>;
  save(state: IPadState): Promise<void>;
  flush(): Promise<void>;
}

type StoredPadState = {
  document?: unknown;
  activeEquationId?: unknown;
  options?: {
    wrapEquationCopiesInDisplayMath?: unknown;
  };
};

export function createDefaultPadState(): IPadState {
  const document = createDefaultPadDocument();
  return {
    document,
    activeEquationId: document.equations[0]?.id ?? null,
    options: {
      wrapEquationCopiesInDisplayMath: true
    }
  };
}

export function parsePadState(value: unknown): IPadState {
  if (!value || typeof value !== 'object') {
    return createDefaultPadState();
  }

  const candidate = value as StoredPadState;
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

  return {
    document,
    activeEquationId,
    options: {
      wrapEquationCopiesInDisplayMath:
        typeof candidate.options?.wrapEquationCopiesInDisplayMath === 'boolean'
          ? candidate.options.wrapEquationCopiesInDisplayMath
          : true
    }
  };
}

export class StateDBPadStorage implements IPadStorage {
  constructor(
    private readonly stateDB: IStateDB,
    private readonly key = PAD_STATE_KEY
  ) {}

  async load(): Promise<IPadState> {
    return parsePadState(await this.stateDB.fetch(this.key));
  }

  save(state: IPadState): Promise<void> {
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
