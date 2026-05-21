import { describe, expect, it } from 'vitest';

import {
  attacks,
  cardValueInDeck,
  cardValueInHand,
  doublers,
  drawToX,
  nonTerminalDraw,
  terminalDraw,
  villages,
} from '../src/CardHeuristics';

describe('CardHeuristics', () => {
  it('exposes representative hand/deck card values', () => {
    expect(cardValueInHand.get('silver')).toBe(3);
    expect(cardValueInDeck.get('province')).toBe(8);
  });

  it('contains representative action heuristics', () => {
    expect(villages.get('village')).toBe(2);
    expect(terminalDraw.get('smithy')).toBe(3);
    expect(nonTerminalDraw.get('laboratory')).toBe(2);
    expect(attacks.get('militia')).toBe(1);
    expect(drawToX.get('library')).toBe(7);
    expect(doublers.get('throne_room')).toBe(2);
  });
});
