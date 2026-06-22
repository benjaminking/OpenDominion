import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { GlobalEffectSetupRule } from '../../setup/GlobalEffectSetupRule';

export class Footpad extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Footpad'));
    this.addSetupRule(new GlobalEffectSetupRule(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .makeMandatory()
        .action(new EffectAction(async (ie: InstructionExecutor) => ie.drawCards(1)))
        .build()
    ));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoffers(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();
    await attackedIe.discardDownTo(3);
  }
}
