import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Monkey extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Monkey'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const sharedGameState = ie.getSharedGameState();
    const playerToTheRight = sharedGameState.getPlayerRightOfCurrent();
    // A card the player to the right gained (and then e.g. trashed) can later be gained by someone else
    const isNowAnotherPlayersCard = (gainedCard: Card): boolean =>
      sharedGameState.getCurrentTurnOrder().some(
        (player) =>
          player.getName() !== playerToTheRight.getName() &&
          player
            .getOwnedCards()
            .getAllCards()
            .some((card: Card) => card.getId() === gainedCard.getId()),
      );
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.OTHER_PLAYER)
        // Only the player to the right's gains count. A gain is recorded on the gaining player's turn tracker
        // before the GAIN trigger fires.
        .whereCardIs(
          new CardEligibilityFunction(
            (gainedCard: Card) =>
              playerToTheRight.getTurnTracker().hasGainedMatchingCardThisTurn(isTheSameCardAs(gainedCard)) &&
              !isNowAnotherPlayersCard(gainedCard),
          ),
        )
        .withExpiration(ie.createStartOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.drawCards(1);
          }),
        )
        .build(),
    );

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.drawCards(1);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();

    return Promise.resolve();
  }
}
