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
import { cardNameIs, isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Sauna (Action): +1 Card, +1 Action. You may play an Avanto from your hand.
// This turn, when you play a Silver, you may trash a card from your hand.
export class Sauna extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sauna'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const avanto: Card | Choice = await ie
      .chooseCard('You may play an Avanto from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(cardNameIs('Avanto'))
      .allowNoneOption()
      .choose();
    if (avanto instanceof Card) {
      await ie.playCardFromLocation(avanto, CardLocation.HAND);
    }
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.PLAYED_CARD, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .whereCardIs(cardNameIs('Silver'))
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            const cardToTrash: Card | Choice = await effectIe
              .chooseCard('You may trash a card from your hand')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.TRASH)
              .allowNoneOption()
              .choose();
            if (cardToTrash instanceof Card) {
              await effectIe.trashCardFromLocation(cardToTrash, CardLocation.HAND);
            }
          }),
        )
        .build(),
    );
  }
}
