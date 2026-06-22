import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { either, isActionCard, isTheSameCardAs,isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Farmhands: +1 Card, +2 Actions; when you gain this, you may set aside an
// Action or Treasure from your hand and play it at the start of your next turn.
export class Farmhands extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Farmhands'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const cardToSetAside: Card | Choice = await ie
              .chooseCard('You may set aside an Action or Treasure from your hand to play at start of next turn')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.PLAY_ALT)
              .whereCardIs(either(isActionCard, isTreasureCard))
              .allowNoneOption()
              .choose();
            if (!(cardToSetAside instanceof Card)) {
              return;
            }
            await ie.setCardAsideFromLocation(cardToSetAside, CardLocation.HAND);
            ie.addEffect(
              new Effect.Builder()
                .from(this)
                .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
                .onTurn(ie.createNextTurnEligibilityFunction())
                .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
                .makeMandatory()
                .action(
                  new EffectAction(async (ie: InstructionExecutor) => {
                    await ie.playCardFromLocation(cardToSetAside, CardLocation.SET_ASIDE);
                  }),
                )
                .build(),
            );
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);
  }
}
