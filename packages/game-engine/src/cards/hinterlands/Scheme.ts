import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { RestOfTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Scheme extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Scheme'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.DISCARD, EffectSource.SELF)
        .whereCardIs(isActionCard)
        .withExpiration(new RestOfTurnEffectExpiration(ie.getSharedGameState().getCurrentTurn()))
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, discardedCards: CardCollection) => {
            const actionToTopDeck = await effectIe
              .chooseCard('You may put one of your Action cards onto your deck')
              .from(discardedCards)
              .to(CardSelectionPurpose.TOPDECK)
              .allowNoneOption()
              .choose();
            if (actionToTopDeck instanceof Card) {
              await effectIe.topDeckCardFromLocation(actionToTopDeck, CardLocation.IN_PLAY);
            }
          }),
        )
        .build(),
    );
  }
}
