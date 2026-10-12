import { CardSelectionPurpose } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

// The kingdom cards costing up to $5 that fill the rest of the kingdom
const cheapFillers = [
  'Village',
  'Smithy',
  'Market',
  'Festival',
  'Laboratory',
  'Council Room',
  'Workshop',
  'Cellar',
  'Chapel',
];

describe('Artisan', () => {
  it('must gain a card costing up to $5 into hand', async () => {
    const game = createGame({ kingdom: ['Artisan', 'Market'] });
    game.alice.setHand(['Artisan', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Artisan');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(false);
    const offered = decision.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Market', 'Duchy', 'Silver']));
    expect(offered).not.toContain('Gold');
    expect(offered).not.toContain('Artisan');
    await game.chooseCard('Market');

    expect(game.alice.hand).toEqual(['Copper', 'Estate', 'Market']);
  });

  it('must put a card from hand onto the deck, which can be the card it just gained', async () => {
    const game = createGame({ kingdom: ['Artisan'] });
    game.alice.setHand(['Artisan']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Artisan');
    await game.chooseCard('Silver');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(false);
    expect(decision.cardChoices.map((choice) => choice.card.name)).toEqual(['Silver']);
    await game.chooseCard('Silver');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.deck.slice(0, 2)).toEqual(['Silver', 'Estate']);
  });

  it('can gain a card that costs $5 or less because of Bridge', async () => {
    const game = createGame({ kingdom: ['Artisan', 'Bridge', 'Festival'] });
    game.alice.setHand(['Festival', 'Bridge', 'Artisan', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Bridge');
    await game.playAction('Artisan');
    const offeredNames = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(offeredNames).toContain('Gold');
    expect(offeredNames).not.toContain('Province');
    await game.chooseCard('Gold');
    await game.chooseCard('Copper');

    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.deck[0]).toBe('Copper');
  });

  it('still makes you put a card from hand onto the deck when there is nothing to gain', async () => {
    const game = createGame({ kingdom: ['Artisan'] });
    game.alice.setHand(['Artisan', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));
    for (const pile of ['Curse', 'Copper', 'Estate', 'Silver', 'Duchy', ...cheapFillers]) {
      game.setPileSize(pile, 0);
    }

    await game.start();
    await game.playAction('Artisan');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.selectionPurpose).toBe(CardSelectionPurpose.TOPDECK);
    expect(offered(decision).sort()).toEqual(['Copper', 'Estate']);
    await game.chooseCard('Estate');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.deck[0]).toBe('Estate');
  });

  it('asks nothing when there is nothing to gain and the hand is empty', async () => {
    const game = createGame({ kingdom: ['Artisan'] });
    game.alice.setHand(['Artisan']);
    game.alice.setDeck(coppers(10));
    for (const pile of ['Curse', 'Copper', 'Estate', 'Silver', 'Duchy', ...cheapFillers]) {
      game.setPileSize(pile, 0);
    }

    await game.start();
    await game.playAction('Artisan');

    expect(game.pending.kind).toBe('buyPhase');
    expect(game.alice.deck).toHaveLength(10);
  });

  it('must still put a card from hand onto the deck after Watchtower already put the gained card there', async () => {
    const game = createGame({ kingdom: ['Artisan', 'Watchtower'] });
    game.alice.setHand(['Artisan', 'Watchtower', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Artisan');
    await game.chooseCard('Duchy');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(offered(decision).sort()).toEqual(['Copper', 'Watchtower']);
    await game.chooseCard('Copper');

    expect(game.alice.deck.slice(0, 3)).toEqual(['Copper', 'Duchy', 'Copper']);
    expect(game.alice.hand).toEqual(['Watchtower']);
  });

  it('cannot gain a card costing a Potion, but can gain the Potion itself into hand', async () => {
    const game = createGame({ kingdom: ['Artisan', 'Familiar', 'Golem', 'Vineyard'] });
    game.alice.setHand(['Artisan', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Artisan');
    const offeredNames = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(offeredNames).toEqual(expect.arrayContaining(['Potion', 'Duchy']));
    expect(offeredNames).not.toContain('Familiar');
    expect(offeredNames).not.toContain('Golem');
    expect(offeredNames).not.toContain('Vineyard');
    await game.chooseCard('Potion');
    await game.chooseCard('Estate');

    expect(game.alice.hand).toEqual(['Potion']);
    expect(game.alice.deck[0]).toBe('Estate');
  });

  it('can only put back a card still in hand after the gained card has played itself (Berserker)', async () => {
    const game = createGame({ kingdom: ['Artisan', 'Berserker'] });
    game.alice.setHand(['Artisan', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Artisan');
    await game.chooseCard('Berserker');
    // Berserker is gained to hand with an Action (Artisan) in play, so it is played: gain a card costing less
    // than it, then each other player discards down to 3
    await game.chooseCard('Silver');
    await game.chooseCards(['Estate', 'Estate']);

    // Artisan goes on: Berserker has left the hand, so only the Estate and Copper can be put back
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.selectionPurpose).toBe(CardSelectionPurpose.TOPDECK);
    expect(offered(decision).sort()).toEqual(['Copper', 'Estate']);
    await game.chooseCard('Estate');

    expect(game.alice.inPlay).toEqual(['Artisan', 'Berserker']);
    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.deck[0]).toBe('Estate');
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });
});
