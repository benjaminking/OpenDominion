import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class HauntedCastle extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Haunted Castle'));

    // On gain during buy phase: each other player with 5+ cards puts 2 onto their deck
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.performAttack(this, async (attackedPlayer: Player) => {
              const attackedIe = attackedPlayer.getInstructionExecutor();
              const handSize = attackedPlayer.getOwnedCards().getHand().size();
              if (handSize >= 5) {
                const cardsToTopDeck: CardCollection = await attackedIe
                  .chooseCards('Choose 2 cards to put onto your deck')
                  .from(CardLocation.HAND)
                  .to(CardSelectionPurpose.TOPDECK)
                  .whereNumCardsIs(exactlyNChecked(2))
                  .choose();
                for (const card of cardsToTopDeck.asCardArray()) {
                  await attackedIe.topDeckCardFromLocation(card, CardLocation.HAND);
                }
              }
            });
          }),
        )
        .build(),
    );
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }
}
