import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { noCard } from '../StandardCardEligibilityFunctions';
import { Turn } from '../turns/Turn';

export class TurnTracker {
  private currentTurn: Turn;
  private lastCompletedTurn: Turn | undefined = undefined;
  private cardsPlayedByUnofficialTurnNumber = new Map<number, CardCollection>();
  private cardsGainedByUnofficialTurnNumber = new Map<number, CardCollection>();
  private cardsBoughtByUnofficialTurnNumber = new Map<number, CardCollection>();
  private cleanupCardDrawOverride: number | undefined = undefined;
  private cleanupExtraCardsToDraw = 0;

  public constructor(private readonly preGameplayTurn: Turn) {
    this.currentTurn = preGameplayTurn;
  }

  public getCurrentTurn(): Turn {
    return this.currentTurn;
  }

  public getNumCardsPlayedThisTurn(): number {
    return this.cardsPlayedByUnofficialTurnNumber.get(this.currentTurn.getUnofficialNumber())?.size() ?? 0;
  }

  public endTurn(): void {
    this.lastCompletedTurn = this.currentTurn;
  }

  public startNewStandardTurn(): void {
    this.currentTurn = this.currentTurn.nextTurn();
    this.reset();
  }

  public startNewExtraTurn(): void {
    this.currentTurn = this.currentTurn.nextUnofficialTurn();
    this.reset();
  }

  private reset(): void {
    this.cleanupCardDrawOverride = undefined;
    this.cleanupExtraCardsToDraw = 0;
  }

  public addPlayedCard(card: Card): void {
    const unofficialTurnNumber = this.currentTurn.getUnofficialNumber();
    if (!this.cardsPlayedByUnofficialTurnNumber.has(unofficialTurnNumber)) {
      this.cardsPlayedByUnofficialTurnNumber.set(unofficialTurnNumber, new CardCollection());
    }
    this.cardsPlayedByUnofficialTurnNumber.get(unofficialTurnNumber)!.addCard(card);
  }

  public addGainedCard(card: Card): void {
    const unofficialTurnNumber = this.currentTurn.getUnofficialNumber();
    if (!this.cardsGainedByUnofficialTurnNumber.has(unofficialTurnNumber)) {
      this.cardsGainedByUnofficialTurnNumber.set(unofficialTurnNumber, new CardCollection());
    }
    this.cardsGainedByUnofficialTurnNumber.get(unofficialTurnNumber)!.addCard(card);
  }

  public addBoughtCard(card: Card): void {
    const unofficialTurnNumber = this.currentTurn.getUnofficialNumber();
    if (!this.cardsBoughtByUnofficialTurnNumber.has(unofficialTurnNumber)) {
      this.cardsBoughtByUnofficialTurnNumber.set(unofficialTurnNumber, new CardCollection());
    }
    this.cardsBoughtByUnofficialTurnNumber.get(unofficialTurnNumber)!.addCard(card);
  }

  public hasPlayedMatchingCardThisTurn(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return (
      this.cardsPlayedByUnofficialTurnNumber
        .get(this.currentTurn.getUnofficialNumber())
        ?.doesAnyMatch(cardEligibilityFunction) ?? false
    );
  }

  public hasGainedMatchingCardThisTurn(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return (
      this.cardsGainedByUnofficialTurnNumber
        .get(this.currentTurn.getUnofficialNumber())
        ?.doesAnyMatch(cardEligibilityFunction) ?? false
    );
  }

  public numMatchingCardsPlayedThisTurn(cardEligibilityFunction: CardEligibilityFunction): number {
    return (
      this.cardsPlayedByUnofficialTurnNumber
        .get(this.currentTurn.getUnofficialNumber())
        ?.numMatchingCards(cardEligibilityFunction) ?? 0
    );
  }

  public getCardsGainedOnTurnEligibilityFunction(turn: Turn): CardEligibilityFunction {
    return (
      this.cardsGainedByUnofficialTurnNumber.get(turn.getUnofficialNumber())?.toCardNameEligibilityFunction() ?? noCard
    );
  }

  public getCardsBoughtThisTurnEligibilityFunction(): CardEligibilityFunction {
    return (
      this.cardsBoughtByUnofficialTurnNumber
        .get(this.currentTurn.getUnofficialNumber())
        ?.toCardNameEligibilityFunction() ?? noCard
    );
  }

  public setNumCardsToDrawInCleanup(numCardsToDraw: number): void {
    this.cleanupCardDrawOverride = numCardsToDraw;
  }

  public setNumExtraCardsToDrawInCleanup(numExtraCardsToDraw: number): void {
    this.cleanupExtraCardsToDraw = numExtraCardsToDraw;
  }

  public getNumCardsToDrawInCleanup(defaultNumber: number): number {
    if (this.cleanupCardDrawOverride === undefined) {
      return defaultNumber + this.cleanupExtraCardsToDraw;
    }
    return this.cleanupCardDrawOverride + this.cleanupExtraCardsToDraw;
  }

  public getLastCompletedTurn(): Turn | undefined {
    return this.lastCompletedTurn;
  }
}
