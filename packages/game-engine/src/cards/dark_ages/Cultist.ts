import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Cultist extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cultist'));
    // When you trash this, +3 Cards
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH)
        .self()
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.drawCards(3);
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    await ie.performAttack(this, this.attack.bind(this));

    // May play another Cultist from hand
    const choice: Card | Choice = await ie
      .chooseCard('You may play another Cultist from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(cardNameIs('Cultist'))
      .allowNoneOption()
      .choose();
    if (choice instanceof Card) {
      await ie.playCardFromHand(choice);
    }
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    // TODO: gainFromRuinsPile stub - attacked player gains from Ruins pile
    await attackedPlayer.getInstructionExecutor().gainFromRuinsPile();
  }
}
