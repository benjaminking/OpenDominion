import { Pile } from "../piles/Pile";
import { AddedPilePostAction } from "./AddedPilePostAction";
import { GameInitializer } from "./GameInitializer";
import { PileSpecification } from "./PileSpecification";
import { GameInitializationSetupRule, SetupRule, SetupRuleType } from "./SetupRule";

export class PileAddingSetupRule implements GameInitializationSetupRule {
    public constructor(private readonly pileSpecification: PileSpecification, private readonly addedPilePostAction: AddedPilePostAction | undefined = undefined) {
        
    }
    public setupRuleType: SetupRuleType.GAME_INITIALIZATION = SetupRuleType.GAME_INITIALIZATION;

    public applySetupRule(gameInitializer: GameInitializer): void {
        const addedPile: Pile | undefined = gameInitializer.addPile(this.pileSpecification);
        if (addedPile === undefined) {
            return;
        }
        this.addedPilePostAction?.performAction(addedPile);
    }
    
}