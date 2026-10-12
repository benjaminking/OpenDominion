import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Rabble', () => {
  it('makes each other player discard revealed Actions and Treasures and put the rest back in any order (3 players)', async () => {
    const game = createGame({ kingdom: ['Rabble', 'Village'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Rabble', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Estate', 'Copper', 'Duchy', 'Gold']);
    cara.setDeck(['Village', 'Silver', 'Gold', 'Estate']);

    await game.start();
    await game.playAction('Rabble');
    expect(game.alice.hand).toHaveLength(7);
    // Bob chooses the order of Estate and Duchy; the card chosen first ends up lower
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Duchy');

    expect(game.bob.discard).toEqual(['Copper']);
    expect(game.bob.deck).toEqual(['Estate', 'Duchy', 'Gold']);
    expect([...cara.discard].sort()).toEqual(['Gold', 'Silver', 'Village']);
    expect(cara.deck).toEqual(['Estate']);
    expect(game.pending.playerName).toBe('Alice');
  });

  it("shuffles the target's discard pile to reveal 3 cards", async () => {
    const game = createGame({ kingdom: ['Rabble'] });
    game.alice.setHand(['Rabble', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Estate']);
    game.bob.setDiscard(['Copper', 'Silver']);

    await game.start();
    await game.playAction('Rabble');

    // Bob reveals Estate, then shuffles and reveals Copper and Silver
    expect(game.bob.deck).toEqual(['Estate']);
    expect([...game.bob.discard].sort()).toEqual(['Copper', 'Silver']);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('reveals only what the target has when they have fewer than 3 cards', async () => {
    const game = createGame({ kingdom: ['Rabble'] });
    game.alice.setHand(['Rabble', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Duchy', 'Silver']);

    await game.start();
    await game.playAction('Rabble');

    expect(game.bob.deck).toEqual(['Duchy']);
    expect(game.bob.discard).toEqual(['Silver']);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('discards revealed cards that are Actions or Treasures even if they are also Victory cards', async () => {
    const game = createGame({ kingdom: ['Rabble', 'Mill', 'Farm'] });
    game.alice.setHand(['Rabble', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Mill', 'Farm', 'Estate', 'Copper']);

    await game.start();
    await game.playAction('Rabble');

    expect([...game.bob.discard].sort()).toEqual(['Farm', 'Mill']);
    expect(game.bob.deck).toEqual(['Estate', 'Copper']);
  });

  it('draws its 3 cards with a reshuffle in the middle when the deck runs out', async () => {
    const game = createGame({ kingdom: ['Rabble'] });
    game.alice.setHand(['Rabble', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold', 'Gold']);
    game.bob.setDeck(['Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Rabble');

    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Silver', 'Gold', 'Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('does nothing to a player with no cards in their deck or discard pile', async () => {
    const game = createGame({ kingdom: ['Rabble'] });
    game.alice.setHand(['Rabble', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(5));
    game.bob.setHand(coppers(5));

    await game.start();
    await game.playAction('Rabble');

    expect(game.bob.hand).toEqual(coppers(5));
    expect(game.bob.discard).toEqual([]);
    expect(game.expectDecision('treasurePhase', 'Alice')).toBeDefined();
  });

  it("lets the target play a Weaver it discards, during the attacker's turn; a Treasure-Reaction is discarded too", async () => {
    const game = createGame({ kingdom: ['Rabble', 'Weaver', "Fool's Gold", 'Tunnel'] });
    game.alice.setHand(['Rabble', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Weaver', "Fool's Gold", 'Tunnel', 'Copper']);

    await game.start();
    await game.playAction('Rabble');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');

    expect(game.bob.inPlay).toEqual(['Weaver']);
    expect([...game.bob.discard].sort()).toEqual(["Fool's Gold", 'Silver', 'Silver']);
    // Tunnel is a Victory-Reaction, so it goes back
    expect(game.bob.deck).toEqual(['Tunnel', 'Copper']);
    expect(game.pending.playerName).toBe('Alice');
    await game.endTurn();

    // Bob's Weaver is discarded in Alice's clean-up
    expect(game.bob.inPlay).toEqual([]);
    expect(game.bob.discard).toContain('Weaver');
  });
});
