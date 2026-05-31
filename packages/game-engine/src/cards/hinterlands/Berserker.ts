import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isActionCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Berserker extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Berserker'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(new EffectCondition((ie: InstructionExecutor) => ie.hasMatchingCardInPlay(isActionCard)))
        .addCondition(new EffectCondition(() => this.getLocation() !== CardLocation.PILE))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.playCardFromLocation(this, this.getLocation());
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cheaperThanBerserker = costsUpTo(Cost.Simple(4));
    const cardToGain = await ie
      .chooseCard('Choose a card costing less than Berserker to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(cheaperThanBerserker)
      .allowNoneOption()
      .choose();

    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }

    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().discardDownTo(3);
  }
}
