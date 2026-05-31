import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isAttackCard } from '../../StandardCardEligibilityFunctions';

export class BattlePlan extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Battle Plan'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    await ie
      .chooseOneOption('You may reveal an Attack card from your hand for +1 Card')
      .from(
        new ActionChoice('Reveal an Attack card', async () => {
          const attackCards = ie.getMatchingCardsInHand(isAttackCard);
          if (attackCards.size() > 0) {
            await ie.revealCard(attackCards.getArbitraryCard());
            await ie.drawCards(1);
          }
        }),
      )
      .from(new ActionChoice('Do not reveal', async () => Promise.resolve()))
      .choose();

    await ie.rotateAnySupplyPile();
  }
}
