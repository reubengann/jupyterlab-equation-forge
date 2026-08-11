import type { EquationForgeCommands } from '@equation-forge/ui';

export interface ICommandRef {
  readonly current: EquationForgeCommands | null;
}

export async function addEquationWithCurrentCommands(
  commandsReady: Promise<void>,
  commandsRef: ICommandRef,
  latex: string
): Promise<void> {
  await commandsReady;
  const commands = commandsRef.current;
  if (!commands) {
    throw new Error('Equation Forge commands are unavailable');
  }
  commands.addEquation(latex, 'display');
}
