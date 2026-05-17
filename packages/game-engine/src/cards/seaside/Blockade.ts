import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

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
import { costsUpTo, isACopyOf } from '../../StandardCardEligibilityFunctions';

export class Blockade extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Blockade'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing up to $4 to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .choose();
    if (!(cardToGain instanceof Card)) {
      return;
    }
    await ie.gainCardFromPile(cardToGain);

    await ie.setCardAsideFromLocation(cardToGain, CardLocation.DISCARD);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor, _targetCard: Card) => {
            ie.putCardIntoHandFromLocation(cardToGain, CardLocation.SET_ASIDE);
            this.markAsFinished();
          }),
        )
        .build(),
    );

    await ie.performAttack(this, (attackedPlayer: Player, attackingPlayer: Player) => {
      const ie = attackedPlayer.getInstructionExecutor();
      ie.addEffect(
        new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.GAIN, EffectSource.OTHER_PLAYER)
          .whereCardIs(isACopyOf(cardToGain))
          .withExpiration(ie.createStartOfPlayersNextTurnEffectExpiration(attackingPlayer))
          .makeMandatory()
          .addCondition(
            new EffectCondition((_ie: InstructionExecutor) => cardToGain.getLocation() === CardLocation.SET_ASIDE),
          )
          .action(
            new EffectAction(async (ie: InstructionExecutor, _attackCard: Card) => {
              await ie.gainFromPile('curse');
            }),
          )
          .build(),
      );
      this.markAsFinished();

      return Promise.resolve();
    });
  }
}
