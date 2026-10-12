import { CardInfoLookup } from '@dominion/card-info';
import { CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { OneTimeEffectExpirtation } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Daimyo extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Daimyo'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    let hasReplayed = false;

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.PLAYED_CARD, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .whereCardIs(
          new CardEligibilityFunction((card: Card) => card.hasType(CardType.ACTION) && !card.hasType(CardType.COMMAND)),
        )
        .withExpiration(new OneTimeEffectExpirtation())
        .addCondition(new EffectCondition(() => !hasReplayed))
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, effectContext: EffectContext) => {
            hasReplayed = true;
            await effectIe.replayCard(effectContext.getTargetCard()!);
          }),
        )
        .build(),
    );
  }
}
