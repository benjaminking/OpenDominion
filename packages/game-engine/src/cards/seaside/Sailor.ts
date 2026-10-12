import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isDurationCard } from '../../StandardCardEligibilityFunctions';

export class Sailor extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sailor'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        // A gained card that has already moved on (e.g. topdecked by Watchtower or played by another Sailor) can't be
        // played
        .whereCardIs(isDurationCard)
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .action(
          new EffectAction(async (ie: InstructionExecutor, effectContext: EffectContext) => {
            const gainedCard = effectContext.getTargetCard()!;
            if (!effectContext.getLocationExpectation()!.isMet(gainedCard)) {
              ie.sendLostTrackMessage(gainedCard);
              return;
            }
            await ie.playCardFromLocation(gainedCard, effectContext.getGainLocation()!);
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
            await ie.addCoins(2);
            const cardToTrash: Card | Choice = await ie
              .chooseCard('You may trash a card from your hand')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.TRASH)
              .allowNoneOption()
              .choose();
            if (cardToTrash instanceof Card) {
              await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
            }
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
    return Promise.resolve();
  }
}
