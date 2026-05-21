import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Duke } from '../../../src/cards/intrigue/Duke';
import { createCardHarness } from '../testHarness';

describe('Duke', () => {
  it('scores 0 when there are no Duchies', () => {
    const testHarness = createCardHarness();
    const duke = new Duke(testHarness.sharedGameState);
    expect(duke.score([])).toBe(0);
  });

  it('scores 1 per Duchy across all card groups', () => {
    const testHarness = createCardHarness();
    const duke = new Duke(testHarness.sharedGameState);
    const firstDuchy = new Duchy(testHarness.sharedGameState);
    firstDuchy.setId('duchy-1');
    const secondDuchy = new Duchy(testHarness.sharedGameState);
    secondDuchy.setId('duchy-2');
    const group = new CardCollection();
    group.addCard(firstDuchy);
    group.addCard(secondDuchy);
    expect(duke.score([group])).toBe(2);
  });
});
