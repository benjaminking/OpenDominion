import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Monkey extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Monkey'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.OTHER_PLAYER)
        .withExpiration(ie.createStartOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor, _attackCard: Card) => {
            await ie.drawCards(1);
            this.markAsFinished();
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
          new EffectAction(async (ie: InstructionExecutor, _targetCard: Card) => {
            await ie.drawCards(1);
          }),
        )
        .build(),
    );
    this.markAsUnfinished();

    return Promise.resolve();
  }
}
