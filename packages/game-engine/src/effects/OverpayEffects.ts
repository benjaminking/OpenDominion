import { MoneyAmount } from '@dominion/common';

import { Card } from '../card/Card';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { isTheSameCardAs } from '../StandardCardEligibilityFunctions';
import { Effect } from './Effect';
import { EffectAction } from './EffectAction';
import { EffectCondition } from './EffectCondition';
import { EffectContext } from './EffectContext';
import { EffectSource } from './EffectSource';
import { EffectTriggerType } from './EffectTriggerType';

export function addOverpayEffects(
  card: Card,
  ability: (ie: InstructionExecutor, overpaid: MoneyAmount, effectContext: EffectContext) => Promise<void>,
): void {
  const pendingOverpays: MoneyAmount[] = [];

  card.addEffect(
    new Effect.Builder()
      .from(card)
      .triggerOn(EffectTriggerType.BUY, EffectSource.SELF)
      .whereCardIs(isTheSameCardAs(card))
      .action(
        new EffectAction(async (ie: InstructionExecutor) => {
          const overpaid: MoneyAmount | undefined = await ie.chooseOverpayAmount();
          if (overpaid !== undefined) {
            pendingOverpays.push(overpaid);
          }
        }),
      )
      .build(),
  );

  card.addEffect(
    new Effect.Builder()
      .from(card)
      .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
      .whereCardIs(isTheSameCardAs(card))
      .addCondition(new EffectCondition(() => pendingOverpays.length > 0))
      .makeMandatory()
      .action(
        new EffectAction(async (ie: InstructionExecutor, effectContext: EffectContext) => {
          const overpaid = pendingOverpays.shift();
          if (overpaid !== undefined) {
            await ability(ie, overpaid, effectContext);
          }
        }),
      )
      .build(),
  );
}
