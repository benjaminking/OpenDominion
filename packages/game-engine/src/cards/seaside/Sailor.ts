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
import { isDurationCard } from '../../StandardCardEligibilityFunctions';

export class Sailor extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sailor'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isDurationCard)
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .action(
          // TODO: need to have the gain location to make sure the card is there
          new EffectAction(async (ie: InstructionExecutor, card: Card) => {
            await ie.playCardFromLocation(card, card.getLocation());
          }),
        )
        .build(),
    );
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.addCoins(2);
            const cardToTrash: Card | Choice = await ie
              .chooseCard('You may trash a card from your hand')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.TRASH)
              .allowNoneOption()
              .choose();
            if (cardToTrash instanceof Card) {
              await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
            }
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
    return Promise.resolve();
  }
}
