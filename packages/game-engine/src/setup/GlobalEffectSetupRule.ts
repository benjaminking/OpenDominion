import { Effect } from "../effects/Effect";
import { SharedGameState } from "../game-state/SharedGameState";
import { GameStateSetupRule, SetupRuleType } from "./SetupRule";

export class GlobalEffectSetupRule implements GameStateSetupRule {
    public constructor(private readonly effect: Effect) {}

    public setupRuleType: SetupRuleType.GAME_STATE = SetupRuleType.GAME_STATE;

    public applySetupRule(sharedGameState: SharedGameState): void {
        sharedGameState.addGlobalEffect(this.effect);
    }
}