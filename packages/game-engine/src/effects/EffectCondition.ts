import { InstructionExecutor } from '../players/InstructionExecutor';

export class EffectCondition {
  private condition: (ie: InstructionExecutor) => boolean;

  constructor(condition: (ie: InstructionExecutor) => boolean) {
    this.condition = condition;
  }

  public isSatisfied(ie: InstructionExecutor): boolean {
    return this.condition(ie);
  }
}
