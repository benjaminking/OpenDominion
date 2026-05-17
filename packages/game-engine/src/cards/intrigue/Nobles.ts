import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Nobles extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Nobles'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(new ActionChoice('+3 Cards', async () => await ie.drawCards(3)))
      .from(
        new ActionChoice('+2 Actions', () => {
          ie.addActions(2);
        }),
      )
      .choose();
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }
}
