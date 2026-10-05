import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { both, isAttackCard, isTheSameCardAs, not } from '../../StandardCardEligibilityFunctions';

export class Urchin extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Urchin'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.performAttack(this, this.attack.bind(this));

    // When you play another Attack card with this in play, you may trash this to gain a Mercenary
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.PLAYED_CARD, EffectSource.SELF)
        .whereCardIs(both(isAttackCard, not(isTheSameCardAs(this))))
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.IN_PLAY))
        // TODO: this won't work with Royal Galley - need a while in play expiration
        .withExpiration(ie.createRestOfTurnEffectExpiration())
        .action(
          new EffectAction(async (ie: InstructionExecutor, _attackCard: Card) => {
            const trashedCard = await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
            if (!(trashedCard instanceof Card)) {
              return;
            }
            await ie.gainFromPile('Mercenary');
          }),
        )
        .build(),
    );
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().discardDownTo(4);
  }
}
