import { ReactWidget } from '@jupyterlab/apputils';
import {
  EquationForge,
  configureEquationForgeEnvironment,
  type EquationForgeOptions,
  type PadEquation
} from '@equation-forge/ui';
import React, { useState } from 'react';

import { IEquationForgeState, IEquationForgeStorage } from './storage';

configureEquationForgeEnvironment({ fontsDirectory: null });

type EquationForgeViewProps = {
  initialState: IEquationForgeState;
  storage: IEquationForgeStorage;
};

function EquationForgeView({
  initialState,
  storage
}: EquationForgeViewProps): JSX.Element {
  const [state, setState] = useState(initialState);
  const updateState = (
    update: (current: IEquationForgeState) => IEquationForgeState
  ): void => {
    setState(current => {
      const next = update(current);
      void storage.save(next);
      return next;
    });
  };

  return (
    <EquationForge
      equations={state.document.equations}
      activeEquationId={state.activeEquationId}
      options={state.options}
      title="Equation Forge"
      description="Build and rewrite equations. Equation Forge is saved in your JupyterLab workspace."
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
      onOptionsChange={(options: EquationForgeOptions) => {
        updateState(current => ({ ...current, options }));
      }}
    />
  );
}

export class EquationForgeWidget extends ReactWidget {
  constructor(private readonly storage: IEquationForgeStorage) {
    super();
    this.addClass('jp-EquationForge-content');
    void this.load();
  }

  render(): JSX.Element {
    if (this.loadError) {
      return (
        <div className="jp-EquationForge-status" role="alert">
          Unable to load saved Equation Forge state: {this.loadError.message}
        </div>
      );
    }
    if (!this.initialState) {
      return (
        <div className="jp-EquationForge-status">Loading Equation Forge…</div>
      );
    }
    return (
      <EquationForgeView
        initialState={this.initialState}
        storage={this.storage}
      />
    );
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

  private initialState: IEquationForgeState | null = null;
  private loadError: Error | null = null;
}
