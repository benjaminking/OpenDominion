import { InstructionExecutor } from '../players/InstructionExecutor';
import { EffectContext, EffectContextBuilder } from './EffectContext';

export class EffectCondition {
  private condition: (ie: InstructionExecutor, effectContext: EffectContext) => boolean;

  constructor(condition: (ie: InstructionExecutor, effectContext: EffectContext) => boolean) {
    this.condition = condition;
  }

  public isSatisfied(
    ie: InstructionExecutor,
    effectContext: EffectContext = new EffectContextBuilder().build(),
  ): boolean {
    return this.condition(ie, effectContext);
  }
}
