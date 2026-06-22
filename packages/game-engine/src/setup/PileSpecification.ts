import { Card } from "../card/Card";
import { CardEligibilityFunction } from "../CardEligibilityFunction";

export class PileSpecification {
    public constructor(private readonly randomizerEligibilityFunction: CardEligibilityFunction,
        private readonly isSupply = false,
        private readonly isKingdom = false) {

    }

    public doesRandomizerMatch(randomizer: Card): boolean {
        return this.randomizerEligibilityFunction.matches(randomizer);
    }
}