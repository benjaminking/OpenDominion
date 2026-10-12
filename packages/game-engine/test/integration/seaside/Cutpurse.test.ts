import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './seasideHelpers';

describe('Cutpurse', () => {
  it('makes each other player discard one Copper, or reveal a hand without one', async () => {
    const game = createGame({ kingdom: ['Cutpurse'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Cutpurse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Copper', 'Copper', 'Estate', 'Estate', 'Silver']);
    cara.setHand(['Estate', 'Silver', 'Silver', 'Gold', 'Estate']);

    await game.start();
    await game.playAction('Cutpurse');

    expect(game.alice.coins).toBe(2);
    expect(game.bob.hand).toEqual(['Copper', 'Estate', 'Estate', 'Silver']);
    expect(game.bob.discard).toEqual(['Copper']);
    expect(cara.hand).toHaveLength(5);
    expect(cara.discard).toEqual([]);
    expect(cara.log).toContain('Cara reveals Estate, Silver, Silver, Gold, Estate');
  });
  it('makes a player discard a Copper for each play when played twice by Throne Room, revealing once out of Coppers', async () => {
    const game = createGame({ kingdom: ['Cutpurse', 'Throne Room'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Throne Room', 'Cutpurse', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Estate', 'Estate']);
    cara.setHand(['Copper', 'Silver', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Cutpurse');

    expect(game.alice.coins).toBe(4);
    expect(game.bob.hand).toEqual(['Copper', 'Estate', 'Estate']);
    expect(game.bob.discard).toEqual(['Copper', 'Copper']);
    expect(cara.hand).toEqual(['Silver', 'Estate', 'Estate', 'Estate']);
    expect(cara.discard).toEqual(['Copper']);
    expect(cara.log).toContain('Cara reveals Silver, Estate, Estate, Estate');
  });

  it('lets each player react separately: a player who reveals Moat keeps their Copper, the next one discards', async () => {
    const game = createGame({ kingdom: ['Cutpurse', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Cutpurse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Estate', 'Estate']);
    cara.setHand(['Moat', 'Copper', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Cutpurse');
    // Bob is asked first, as he is next in turn order
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.declineEffects();

    expect(game.bob.hand).toHaveLength(5);
    expect(game.bob.discard).toEqual([]);
    expect(cara.discard).toEqual(['Copper']);
  });

  it('makes a player with an empty hand reveal it, and nothing else happens', async () => {
    const game = createGame({ kingdom: ['Cutpurse'] });
    game.alice.setHand(['Cutpurse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand([]);
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.playAction('Cutpurse');

    expect(game.alice.coins).toBe(2);
    expect(game.bob.hand).toEqual([]);
    expect(game.bob.discard).toEqual([]);
    expect(game.bob.deck).toHaveLength(5);
    game.expectDecision('treasurePhase', 'Alice');
  });
});
