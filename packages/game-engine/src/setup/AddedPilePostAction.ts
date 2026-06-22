import { Pile } from "../piles/Pile";

export class AddedPilePostAction {
    public constructor(private readonly action: (pile: Pile) => void) { }

    public performAction(addedPile: Pile) {
        this.action(addedPile);
    }
}