import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { RestOfTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { both, isActionCard } from '../../StandardCardEligibilityFunctions';

export class Cauldron extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cauldron'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    ie.addBuys(1);

    // Only the gain of the third Action counts. The gain of an earlier Action can still be resolving when the third is
    // gained (e.g. Border Village gaining an Action), and mustn't give out Curses again once it's looked at again.
    let thirdActionGained: Card | undefined = undefined;
    const couldBeThirdActionGained = new CardEligibilityFunction((gainedCard: Card) => {
      if (thirdActionGained === undefined && ie.numMatchingCardsGainedThisTurn(isActionCard) === 3) {
        thirdActionGained = gainedCard;
      }
      return thirdActionGained === undefined || thirdActionGained === gainedCard;
    });

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(both(isActionCard, couldBeThirdActionGained))
        .addCondition(new EffectCondition(() => ie.numMatchingCardsGainedThisTurn(isActionCard) === 3))
        .withExpiration(new RestOfTurnEffectExpiration(ie.getSharedGameState().getCurrentTurn()))
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe.performAttack(this, this.attack.bind(this));
          }),
        )
        .build(),
    );
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().gainCardFromPile('Curse');
  }
}
