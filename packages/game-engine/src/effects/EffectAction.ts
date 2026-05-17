import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { InstructionExecutor } from '../players/InstructionExecutor';

export class EffectAction {
  public constructor(
    private readonly action:
      | ((ie: InstructionExecutor, targetCard: Card) => Promise<void>)
      | ((ie: InstructionExecutor, targetCard: Card) => void)
      | ((ie: InstructionExecutor, targetCards: CardCollection) => Promise<void>)
      | ((ie: InstructionExecutor, targetCards: CardCollection) => void)
      | ((ie: InstructionExecutor) => Promise<void>)
      | ((ie: InstructionExecutor) => void),
  ) {}

  public async performAction(ie: InstructionExecutor, targetCards: Card | CardCollection | undefined): Promise<void> {
    if (targetCards instanceof Card) {
      await (this.action as (ie: InstructionExecutor, targetCard: Card) => Promise<void>)(ie, targetCards);
    } else if (targetCards instanceof CardCollection) {
      await (this.action as (ie: InstructionExecutor, targetCards: CardCollection) => Promise<void>)(ie, targetCards);
    } else {
      await (this.action as (ie: InstructionExecutor) => Promise<void>)(ie);
    }
  }
}
