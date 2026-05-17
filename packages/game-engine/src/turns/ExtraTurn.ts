import { Choice, ChoiceType, ExtraTurnChoice } from '@dominion/common';

import { Card } from '../card/Card';
import { Player } from '../players/Player';
import { ExtraTurnPrecondition } from './ExtraTurnPreconditions';
import { Turn } from './Turn';

export class ExtraTurn {
  public constructor(
    private readonly owner: Player,
    private readonly initiator: Card,
    private readonly restrictions: ExtraTurnPrecondition[],
  ) {}

  public canExtraTurnHappen(previousTurns: Turn[]): boolean {
    for (const restriction of this.restrictions) {
      if (!restriction.shouldExtraTurnHappen(this.owner, previousTurns)) {
        return false;
      }
    }
    return true;
  }

  public doesChoiceMatch(choice: Choice): boolean {
    return choice.type === ChoiceType.ExtraTurn && (choice as ExtraTurnChoice).card.id === this.initiator.getId();
  }

  public doOwnersMatch(otherExtraTurn: ExtraTurn): boolean {
    return this.initiator.getName() === otherExtraTurn.initiator.getName();
  }

  public toExtraTurnChoice(): ExtraTurnChoice {
    return {
      type: ChoiceType.ExtraTurn,
      card: this.initiator.getMetadata(),
      name: this.initiator.getName(),
    };
  }
}
