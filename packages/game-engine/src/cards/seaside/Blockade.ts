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
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
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
    // The gained card can be moved on by "when you gain" abilities (e.g. Watchtower or Sailor) before it's set aside
    const gainExpectation = ie.createLocationExpectation(CardLocation.DISCARD);
    await ie.gainCardFromPile(cardToGain);

    // If the gained card doesn't end up set aside, nothing further happens
    if (!gainExpectation.isMet(cardToGain)) {
      ie.sendLostTrackMessage(cardToGain);
      return;
    }
    const setAsideExpectation = ie.createLocationExpectation(CardLocation.SET_ASIDE);
    const setAsideCard: Card | undefined = await ie.setCardAsideFromLocation(cardToGain, CardLocation.DISCARD);
    if (setAsideCard === undefined) {
      return;
    }
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            if (setAsideExpectation.isMet(cardToGain)) {
              ie.putCardIntoHandFromLocation(cardToGain, CardLocation.SET_ASIDE);
            } else {
              ie.sendLostTrackMessage(cardToGain);
            }
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();

    await ie.performAttack(this, (attackedPlayer: Player, attackingPlayer: Player) => {
      const ie = attackedPlayer.getInstructionExecutor();
      ie.addEffect(
        new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
          .whereCardIs(isACopyOf(cardToGain))
          .withExpiration(ie.createStartOfPlayersNextTurnEffectExpiration(attackingPlayer))
          .makeMandatory()
          .addCondition(
            new EffectCondition((_ie: InstructionExecutor) => cardToGain.getLocation() === CardLocation.SET_ASIDE),
          )
          // Only gains on the attacked player's own turn are cursed
          .addCondition(
            new EffectCondition(
              (ie: InstructionExecutor) =>
                ie.getSharedGameState().getCurrentPlayer().getName() === attackedPlayer.getName(),
            ),
          )
          .action(
            new EffectAction(async (ie: InstructionExecutor) => {
              await ie.gainFromPile('Curse');
            }),
          )
          .build(),
      );

      return Promise.resolve();
    });
  }
}
