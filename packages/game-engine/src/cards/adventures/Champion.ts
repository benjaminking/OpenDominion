import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { NoEffectExpiration } from '../../effects/StandardEffectExpirations';

export class Champion extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Champion'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    // For the rest of the game: when another player plays an Attack it doesn't affect you,
    // and when you play an Action card you first get +1 Action.
    // Stub: these permanent effects require infrastructure not yet implemented.
    // markAsUnfinished() so this card stays in play permanently
    this.markAsUnfinished();
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.ABOUT_TO_PLAY_CARD, EffectSource.SELF)
        .withExpiration(new NoEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            // TODO: implement permanent +1 Action when playing Action cards
          }),
        )
        .build(),
    );
  }
}
