import { InstructionExecutor } from '../players/InstructionExecutor';
import { EffectContext } from './EffectContext';

export class EffectAction {
  public constructor(
    private readonly action:
      | ((ie: InstructionExecutor, effectContext: EffectContext) => Promise<void>)
      | ((ie: InstructionExecutor, effectContext: EffectContext) => void)
      | ((ie: InstructionExecutor) => Promise<void>)
      | ((ie: InstructionExecutor) => void),
  ) {}

  public async performAction(ie: InstructionExecutor, effectContext: EffectContext): Promise<void> {
    await (this.action as (ie: InstructionExecutor, effectContext: EffectContext) => Promise<void>)(ie, effectContext);
  }
}
