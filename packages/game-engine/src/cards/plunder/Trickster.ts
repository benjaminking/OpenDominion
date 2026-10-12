import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { OnceThisTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { both, canBeDiscardedInCleanup, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Trickster extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Trickster'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, this.attack.bind(this));

    // By the time "when you discard" abilities resolve, the cards are already in the discard pile, so the Treasure is
    // chosen as Clean-up starts instead (as Herbalist does)
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.CLEANUP_START, EffectSource.SELF)
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .addCondition(
          new EffectCondition((effectIe: InstructionExecutor) =>
            effectIe.hasMatchingCardInPlay(both(isTreasureCard, canBeDiscardedInCleanup)),
          ),
        )
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            const cardToSetAside: Card | Choice = await effectIe
              .chooseCard('You may set aside a Treasure you would discard from play')
              .from(CardLocation.IN_PLAY)
              .to(CardSelectionPurpose.OTHER)
              .whereCardIs(both(isTreasureCard, canBeDiscardedInCleanup))
              .allowNoneOption()
              .choose();
            if (!(cardToSetAside instanceof Card)) {
              return;
            }

            await effectIe.setCardAsideFromLocation(cardToSetAside, CardLocation.IN_PLAY);
            effectIe.addEffect(
              new Effect.Builder()
                .from(this)
                .triggerOn(EffectTriggerType.TURN_END, EffectSource.SELF)
                .onTurn(effectIe.createThisTurnEligibilityFunction())
                .withExpiration(new OnceThisTurnEffectExpiration(effectIe.getSharedGameState().getCurrentTurn()))
                .makeMandatory()
                .action(
                  new EffectAction((turnEndIe: InstructionExecutor) => {
                    turnEndIe.putCardIntoHandFromLocation(cardToSetAside, CardLocation.SET_ASIDE);
                  }),
                )
                .build(),
            );
          }),
        )
        .build(),
    );
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().gainFromPile('Curse');
  }
}
