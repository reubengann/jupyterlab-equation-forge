import { ReactWidget } from '@jupyterlab/apputils';
import {
  DerivationPad,
  configurePadEnvironment,
  type PadEquation
} from '@physics-derivation-pad/ui';
import React, { useState } from 'react';

import { IPadState, IPadStorage } from './storage';

configurePadEnvironment({ fontsDirectory: null });

type PadViewProps = {
  initialState: IPadState;
  storage: IPadStorage;
};

function PadView({ initialState, storage }: PadViewProps): JSX.Element {
  const [state, setState] = useState(initialState);
  const updateState = (update: (current: IPadState) => IPadState): void => {
    setState(current => {
      const next = update(current);
      void storage.save(next);
      return next;
    });
  };

  return (
    <DerivationPad
      equations={state.document.equations}
      activeEquationId={state.activeEquationId}
      options={state.options}
      title="Physics Derivation Pad"
      description="Build and rewrite equations. The pad is saved in your JupyterLab workspace."
      onEquationsChange={(equations: PadEquation[]) => {
        updateState(current => ({
          ...current,
          document: { equations },
          activeEquationId: equations.some(
            equation => equation.id === current.activeEquationId
          )
            ? current.activeEquationId
            : (equations[0]?.id ?? null)
        }));
      }}
      onActiveEquationIdChange={activeEquationId => {
        updateState(current => ({ ...current, activeEquationId }));
      }}
      onOptionsChange={options => {
        updateState(current => ({ ...current, options }));
      }}
    />
  );
}

export class DerivationPadWidget extends ReactWidget {
  constructor(private readonly storage: IPadStorage) {
    super();
    this.addClass('jp-PhysicsDerivationPad-content');
    void this.load();
  }

  render(): JSX.Element {
    if (this.loadError) {
      return (
        <div className="jp-PhysicsDerivationPad-status" role="alert">
          Unable to load the saved derivation pad: {this.loadError.message}
        </div>
      );
    }
    if (!this.initialState) {
      return (
        <div className="jp-PhysicsDerivationPad-status">
          Loading derivation pad…
        </div>
      );
    }
    return <PadView initialState={this.initialState} storage={this.storage} />;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    void this.storage.flush();
    super.dispose();
  }

  private async load(): Promise<void> {
    try {
      this.initialState = await this.storage.load();
    } catch (error) {
      this.loadError =
        error instanceof Error ? error : new Error('Unknown storage error');
    }
    if (!this.isDisposed) {
      this.update();
    }
  }

  private initialState: IPadState | null = null;
  private loadError: Error | null = null;
}
