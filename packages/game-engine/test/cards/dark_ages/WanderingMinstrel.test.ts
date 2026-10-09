import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { WanderingMinstrel } from '../../../src/cards/dark_ages/WanderingMinstrel';
import { CardHarness, createCardHarness } from '../testHarness';

const withId = <T extends Card>(card: T, id: string): T => {
  card.setId(id);
  return card;
};

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

// Cards are listed top-first.
const stackDeck = (harness: CardHarness, cards: Card[]): void => {
  for (const card of [...cards].reverse()) {
    harness.addToDeck(card);
  }
};

describe('WanderingMinstrel', () => {
  it('gives +1 Card and +2 Actions and puts the revealed Actions back in the chosen order', async () => {
    const testHarness = createCardHarness();
    const revealedSmithy = withId(new Smithy(testHarness.sharedGameState), 'smithy-deck-3');
    stackDeck(testHarness, [
      withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'),
      withId(new Village(testHarness.sharedGameState), 'village-deck-1'),
      withId(new Estate(testHarness.sharedGameState), 'estate-deck-2'),
      revealedSmithy,
      withId(new Gold(testHarness.sharedGameState), 'gold-deck-4'),
    ]);

    testHarness.pickCard(revealedSmithy); // placed first, so Village ends up on top
    await new WanderingMinstrel(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0']);
    // bottom -> top
    expect(idsOf(testHarness.deck)).toEqual(['gold-deck-4', 'smithy-deck-3', 'village-deck-1']);
  });

  // BUG: discardCardsFromRevealedSet(nonActions) empties nonActions before discarding, so they vanish
  it('discards the revealed non-Action cards', async () => {
    const testHarness = createCardHarness();
    stackDeck(testHarness, [
      withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'),
      withId(new Village(testHarness.sharedGameState), 'village-deck-1'),
      withId(new Estate(testHarness.sharedGameState), 'estate-deck-2'),
      withId(new Gold(testHarness.sharedGameState), 'gold-deck-3'),
    ]);

    await new WanderingMinstrel(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.deck)).toEqual(['village-deck-1']);
    expect(idsOf(testHarness.discard)).toEqual(['estate-deck-2', 'gold-deck-3']);
  });

  it('works with fewer than 3 cards left to reveal', async () => {
    const testHarness = createCardHarness();
    stackDeck(testHarness, [
      withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'),
      withId(new Village(testHarness.sharedGameState), 'village-deck-1'),
    ]);

    await new WanderingMinstrel(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0']);
    expect(idsOf(testHarness.deck)).toEqual(['village-deck-1']);
    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });
});
