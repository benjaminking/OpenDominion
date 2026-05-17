import { CardCollection } from "./card/CardCollection";

export class ChangeListener {
  private action: (c: CardCollection) => void;

  constructor(action: (c: CardCollection) => void) {
    this.action = action;
  }

  public trigger(cards: CardCollection) {
    this.action(cards);
  }
}
