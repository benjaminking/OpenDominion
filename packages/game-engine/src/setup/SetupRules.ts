import { GameInitializationSetupRule, GameStateSetupRule, SetupRule, SetupRuleType } from "./SetupRule";

export class SetupRules {
    private _gameInitializationRules: GameInitializationSetupRule[] = [];
    private _gameStateRules: GameStateSetupRule[] = [];

    public add(setupRule: SetupRule): void {
        if (setupRule.setupRuleType === SetupRuleType.GAME_INITIALIZATION) {
            this._gameInitializationRules.push(setupRule);
        }
        else {
            this._gameStateRules.push(setupRule);
        }
    }

    public hasAnyGameInitializationSetupRules(): boolean {
        return this._gameInitializationRules.length > 0;
    }

    public hasAnyGameStateSetupRules(): boolean {
        return this._gameStateRules.length > 0;
    }

    public getNextGameInitializationSetupRule(): GameInitializationSetupRule {
        const nextRule = this._gameInitializationRules.pop();
        if (nextRule === undefined) {
            throw new Error("Tried to get a next setup rule from an empty rule list");
        }
        return nextRule;
    }

    public getNextGameStateSetupRule(): GameStateSetupRule {
        const nextRule = this._gameStateRules.pop();
        if (nextRule === undefined) {
            throw new Error("Tried to get a next setup rule from an empty rule list");
        }
        return nextRule;
    }
}