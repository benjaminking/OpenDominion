import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Priest extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Priest'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card from your hand to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }
    await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);

    // For the rest of this turn, whenever you trash a card, +$2.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createStartOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor, cards: CardCollection) => {
            await ie.addCoins(2 * cards.size());
          }),
        )
        .build(),
    );
  }
}
