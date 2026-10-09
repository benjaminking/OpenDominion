import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { Player } from '../../src/players/Player';
import { TurnTracker } from '../../src/players/TurnTracker';
import { anyCard, cardNameIs, noCard } from '../../src/StandardCardEligibilityFunctions';
import { Turn } from '../../src/turns/Turn';
import { TurnPhase } from '../../src/turns/TurnPhase';

const createPlayer = (name = 'Alice'): Player =>
  ({
    getName: () => name,
  }) as Player;

let nextCardId = 0;
const createCard = (name: string): Card => {
  const id = `${name}-${(nextCardId++).toFixed()}`;
  return {
    getId: vi.fn(() => id),
    getName: vi.fn(() => name),
  } as unknown as Card;
};

const createTracker = () => new TurnTracker(new Turn(createPlayer(), 0, 0));

describe('TurnTracker', () => {
  it('starts in the pre-game turn with nothing completed', () => {
    const tracker = createTracker();

    expect(tracker.getCurrentTurn().getNumber()).toBe(0);
    expect(tracker.getCurrentTurn().getUnofficialNumber()).toBe(0);
    expect(tracker.getLastCompletedTurn()).toBeUndefined();
    expect(tracker.getNumCardsPlayedThisTurn()).toBe(0);
    expect(tracker.numMatchingCardsGainedThisTurn(anyCard)).toBe(0);
    expect(tracker.numMatchingCardsGainedThisTurnByPhase(anyCard, TurnPhase.BUY)).toBe(0);
  });

  it('counts gains made in each turn phase separately', () => {
    const tracker = createTracker();
    tracker.startNewStandardTurn();

    tracker.addGainedCard(createCard('Silver'));
    tracker.updateTurnPhase(TurnPhase.BUY);
    tracker.addGainedCard(createCard('Gold'));
    tracker.addGainedCard(createCard('Silver'));
    tracker.updateTurnPhase(TurnPhase.CLEANUP);
    tracker.addGainedCard(createCard('Curse'));

    expect(tracker.numMatchingCardsGainedThisTurn(anyCard)).toBe(4);
    expect(tracker.numMatchingCardsGainedThisTurn(cardNameIs('Silver'))).toBe(2);
    expect(tracker.numMatchingCardsGainedThisTurnByPhase(anyCard, TurnPhase.ACTION)).toBe(1);
    expect(tracker.numMatchingCardsGainedThisTurnByPhase(anyCard, TurnPhase.BUY)).toBe(2);
    expect(tracker.numMatchingCardsGainedThisTurnByPhase(cardNameIs('Silver'), TurnPhase.BUY)).toBe(1);
    expect(tracker.numMatchingCardsGainedThisTurnByPhase(anyCard, TurnPhase.CLEANUP)).toBe(1);
  });

  it('only counts plays and gains from the current turn after a new turn starts', () => {
    const tracker = createTracker();
    tracker.startNewStandardTurn();
    tracker.addPlayedCard(createCard('Village'));
    tracker.updateTurnPhase(TurnPhase.BUY);
    tracker.addGainedCard(createCard('Gold'));

    tracker.endTurn();
    tracker.startNewStandardTurn();

    expect(tracker.getNumCardsPlayedThisTurn()).toBe(0);
    expect(tracker.hasPlayedMatchingCardThisTurn(anyCard)).toBe(false);
    expect(tracker.hasGainedMatchingCardThisTurn(anyCard)).toBe(false);
    expect(tracker.numMatchingCardsGainedThisTurn(anyCard)).toBe(0);
    expect(tracker.numMatchingCardsGainedThisTurnByPhase(anyCard, TurnPhase.BUY)).toBe(0);
  });

  it('treats extra turns as separate unofficial turns for tracking', () => {
    const tracker = createTracker();
    tracker.startNewStandardTurn();
    tracker.addPlayedCard(createCard('Outpost'));

    tracker.endTurn();
    tracker.startNewExtraTurn();

    expect(tracker.getCurrentTurn().getNumber()).toBe(1);
    expect(tracker.getCurrentTurn().getUnofficialNumber()).toBe(2);
    expect(tracker.getLastCompletedTurn()?.getUnofficialNumber()).toBe(1);
    expect(tracker.getNumCardsPlayedThisTurn()).toBe(0);
  });

  it('builds a name-based eligibility function for the cards gained on a given turn', () => {
    const tracker = createTracker();
    tracker.startNewStandardTurn();
    tracker.addGainedCard(createCard('Silver'));
    tracker.endTurn();
    const completedTurn = tracker.getLastCompletedTurn()!;
    tracker.startNewStandardTurn();
    tracker.addGainedCard(createCard('Gold'));

    const gainedOnCompletedTurn = tracker.getCardsGainedOnTurnEligibilityFunction(completedTurn);

    expect(completedTurn.getNumber()).toBe(1);
    expect(gainedOnCompletedTurn.matches(createCard('Silver'))).toBe(true);
    expect(gainedOnCompletedTurn.matches(createCard('Gold'))).toBe(false);
    expect(tracker.getCardsGainedOnTurnEligibilityFunction(tracker.getCurrentTurn().nextTurn())).toBe(noCard);
  });

  it('matches the cards bought this turn, including ones bought after the function was created', () => {
    const tracker = createTracker();
    tracker.startNewStandardTurn();
    const boughtThisTurn = tracker.getCardsBoughtThisTurnEligibilityFunction();
    const province = createCard('Province');

    expect(boughtThisTurn.matches(province)).toBe(false);

    tracker.addBoughtCard(province);

    expect(boughtThisTurn.matches(province)).toBe(true);
    expect(boughtThisTurn.matches(createCard('Province'))).toBe(false);
    expect(boughtThisTurn.matches(createCard('Duchy'))).toBe(false);
  });

  it('resets cleanup draw adjustments at the start of each turn', () => {
    const tracker = createTracker();
    tracker.setNumCardsToDrawInCleanup(3);
    tracker.setNumExtraCardsToDrawInCleanup(1);
    expect(tracker.getNumCardsToDrawInCleanup(5)).toBe(4);

    tracker.startNewStandardTurn();

    expect(tracker.getNumCardsToDrawInCleanup(5)).toBe(5);
  });
});
