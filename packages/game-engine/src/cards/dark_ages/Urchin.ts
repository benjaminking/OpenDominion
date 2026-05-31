import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isAttackCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

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
        .triggerOn(EffectTriggerType.ABOUT_TO_PLAY_CARD, EffectSource.SELF)
        .whereCardIs(isAttackCard)
        .addCondition(new EffectCondition(() => this.getLocation() === CardLocation.IN_PLAY))
        .withExpiration(ie.createStartOfMyNextTurnEffectExpiration())
        .action(
          new EffectAction(async (ie: InstructionExecutor, attackCard: Card) => {
            // Don't trigger when Urchin itself is played (e.g., via Throne Room)
            if (isTheSameCardAs(this).matches(attackCard)) {
              return;
            }
            await ie
              .chooseOneOption('Trash this Urchin to gain a Mercenary from the Mercenary pile?')
              .from(
                new ActionChoice('Yes', async () => {
                  await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
                  // TODO: gain from Mercenary pile (stub - gainFromPile returns undefined if pile absent)
                  await ie.gainFromPile('mercenary');
                }),
              )
              .from(new ActionChoice('No', () => {}))
              .choose();
          }),
        )
        .build(),
    );
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().discardDownTo(4);
  }
}
