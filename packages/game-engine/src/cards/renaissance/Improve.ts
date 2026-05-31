import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, canBeDiscardedInCleanup, costsExactly, isActionCard } from '../../StandardCardEligibilityFunctions';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';

export class Improve extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Improve'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    // At the start of Clean-up, may trash an Action card being discarded from play, gain one costing exactly $1 more.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.CLEANUP_START, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const cardToTrash: Card | Choice = await ie
              .chooseCard('Improve: you may trash an Action card to gain one costing exactly $1 more')
              .from(CardLocation.IN_PLAY)
              .to(CardSelectionPurpose.TRASH)
              .whereCardIs(both(isActionCard, canBeDiscardedInCleanup))
              .allowNoneOption()
              .choose();
            if (!(cardToTrash instanceof Card)) {
              return;
            }
            const trashed = await ie.trashCardFromLocation(cardToTrash, CardLocation.IN_PLAY);
            if (trashed === undefined) {
              return;
            }
            const cardToGain: Card | Choice = await ie
              .chooseCard(
                'Choose a card costing exactly $' + trashed.getCost().plus(1).coins.toFixed() + ' to gain',
              )
              .from(CardSelectionLocation.SUPPLY)
              .to(CardSelectionPurpose.GAIN)
              .whereCardIs(costsExactly(trashed.getCost().plus(1)))
              .allowNoneOption()
              .choose();
            if (cardToGain instanceof Card) {
              await ie.gainCardFromPile(cardToGain);
            }
          }),
        )
        .build(),
    );
  }
}
