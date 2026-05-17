import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

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

export class SeaWitch extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sea Witch'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    await ie.performAttack(this, this.curseAttack.bind(this));
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.drawCards(2);
            const cardsToDiscard: CardCollection = await ie
              .chooseCards('Choose 2 cards to discard')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.DISCARD)
              .whereNumCardsIs(exactlyNChecked(2))
              .choose();
            await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }

  public async curseAttack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    await ie.gainCardFromPile('Curse');
  }
}
