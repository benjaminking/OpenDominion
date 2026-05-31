import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class SinisterPlot extends Project {
  private _tokens = 0;

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sinister Plot'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // At the start of your turn, add a token here, or remove all tokens for +1 Card each.
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie
              .chooseOneOption('Sinister Plot: add a token or remove all tokens for +1 Card each')
              .from(
                new ActionChoice('Add a token', () => {
                  this._tokens++;
                }),
              )
              .from(
                new ActionChoice('Remove all tokens for +' + this._tokens.toFixed() + ' Cards', async () => {
                  const count = this._tokens;
                  this._tokens = 0;
                  await ie.drawCards(count);
                }),
              )
              .choose();
          }),
        )
        .build(),
    );
  }
}
