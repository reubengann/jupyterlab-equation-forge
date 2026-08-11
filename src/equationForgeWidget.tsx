import { ReactWidget } from '@jupyterlab/apputils';
import {
  EquationForge,
  configureEquationForgeEnvironment,
  type EquationCopySurroundMode,
  type EquationForgeCommands,
  type EquationForgeOptions,
  type PadEquation
} from '@equation-forge/ui';
import React, { createRef, useEffect, useState } from 'react';

import { addEquationWithCurrentCommands } from './equationForgeCommands';
import { IEquationForgeState, IEquationForgeStorage } from './storage';

configureEquationForgeEnvironment({ fontsDirectory: null });

type EquationForgeViewProps = {
  initialState: IEquationForgeState;
  storage: IEquationForgeStorage;
  commandsRef: React.RefObject<EquationForgeCommands>;
  onCommandsReady: () => void;
  onStateChange: (state: IEquationForgeState) => void;
};

function EquationForgeView({
  initialState,
  storage,
  commandsRef,
  onCommandsReady,
  onStateChange
}: EquationForgeViewProps): JSX.Element {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    if (commandsRef.current) {
      onCommandsReady();
    }
  }, [commandsRef, onCommandsReady]);
  const updateState = (
    update: (current: IEquationForgeState) => IEquationForgeState
  ): void => {
    setState(current => {
      const next = update(current);
      void storage.save(next);
      onStateChange(next);
      return next;
    });
  };

  return (
    <EquationForge
      ref={commandsRef}
      equations={state.document.equations}
      activeEquationId={state.activeEquationId}
      options={state.options}
      showHeader={false}
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
        commandsRef={this.commandsRef}
        onCommandsReady={this.onCommandsReady}
        onStateChange={state => {
          this.currentOptions = state.options;
          this.optionsListeners.forEach(listener => listener(state.options));
        }}
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
      this.currentOptions = this.initialState.options;
      this.optionsListeners.forEach(listener =>
        listener(this.initialState!.options)
      );
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
  private readonly commandsRef = createRef<EquationForgeCommands>();
  private readonly commandsReady = new Promise<void>(resolve => {
    this.resolveCommandsReady = resolve;
  });
  private resolveCommandsReady!: () => void;
  private readonly onCommandsReady = (): void => {
    this.resolveCommandsReady();
  };
  private currentOptions: EquationForgeOptions | null = null;
  private readonly optionsListeners = new Set<
    (options: EquationForgeOptions) => void
  >();

  get options(): EquationForgeOptions | null {
    return this.currentOptions;
  }

  addEquation(): void {
    this.commandsRef.current?.addEquation();
  }

  async addEquationEntry(latex: string): Promise<void> {
    await addEquationWithCurrentCommands(
      this.commandsReady,
      this.commandsRef,
      latex
    );
  }

  setCopySurroundMode(mode: EquationCopySurroundMode): void {
    this.commandsRef.current?.setCopySurroundMode(mode);
  }

  setShowEquationNumbers(show: boolean): void {
    this.commandsRef.current?.setShowEquationNumbers(show);
  }

  onOptionsChanged(
    listener: (options: EquationForgeOptions) => void
  ): () => void {
    this.optionsListeners.add(listener);
    if (this.currentOptions) {
      listener(this.currentOptions);
    }
    return () => {
      this.optionsListeners.delete(listener);
    };
  }
}

function EquationForgeToolbarView({
  content
}: {
  content: EquationForgeWidget;
}): JSX.Element {
  const [options, setOptions] = useState(content.options);
  useEffect(() => content.onOptionsChanged(setOptions), [content]);

  return (
    <div className="jp-EquationForge-toolbarControls">
      <label>
        <span>Copy surround</span>
        <select
          aria-label="Copy surround"
          value={options?.copySurroundMode ?? 'display-math'}
          disabled={!options}
          onChange={event =>
            content.setCopySurroundMode(
              event.currentTarget.value as EquationCopySurroundMode
            )
          }
        >
          <option value="none">None</option>
          <option value="display-math">$$…$$</option>
          <option value="equation-environment">Equation environment</option>
        </select>
      </label>
      <button
        type="button"
        className="jp-ToolbarButtonComponent"
        aria-label="Show equation numbers"
        title="Show equation numbers"
        aria-pressed={options?.showEquationNumbers ?? false}
        disabled={!options}
        onClick={() =>
          content.setShowEquationNumbers(
            !(options?.showEquationNumbers ?? true)
          )
        }
      >
        Numbers
      </button>
    </div>
  );
}

export class EquationForgeToolbarControls extends ReactWidget {
  constructor(private readonly content: EquationForgeWidget) {
    super();
    this.addClass('jp-EquationForge-toolbarItem');
  }

  render(): JSX.Element {
    return <EquationForgeToolbarView content={this.content} />;
  }
}
