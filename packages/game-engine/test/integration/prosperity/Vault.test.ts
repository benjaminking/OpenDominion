import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Vault', () => {
  it('lets each other player discard 2 cards to draw 1; a player with 1 card may discard it without drawing (3 players)', async () => {
    const game = createGame({ kingdom: ['Vault'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Vault', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Silver', ...coppers(10)]);
    game.bob.setHand(['Estate', 'Curse', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Silver']);
    cara.setHand(['Curse']);
    cara.setDeck(['Gold']);

    await game.start();
    await game.playAction('Vault');
    // Alice discards the 3 Estates, including the one she just drew
    await game.chooseCards(['Estate', 'Estate', 'Estate']);
    expect(game.alice.coins).toBe(3);

    const bobChoice = game.expectDecision('chooseCards', 'Bob');
    expect([...bobChoice.numSelectedEligibility].sort()).toEqual([0, 2]);
    await game.chooseCards(['Estate', 'Curse']);
    const caraChoice = game.expectDecision('chooseCards', 'Cara');
    expect([...caraChoice.numSelectedEligibility].sort()).toEqual([0, 1]);
    await game.chooseCards(['Curse']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.bob.deck).toEqual(['Silver']);
    expect(cara.hand).toEqual([]);
    expect(cara.deck).toEqual(['Gold']);
    expect(cara.discard).toEqual(['Curse']);
  });

  it('lets another player with no cards left to draw shuffle the 2 discarded cards and draw one of them', async () => {
    const game = createGame({ kingdom: ['Vault'] });
    game.alice.setHand(['Vault', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper']);

    await game.start();
    await game.playAction('Vault');
    await game.chooseCards([]);
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Estate']);
    expect(game.bob.deck).toEqual(['Estate']);
    expect(game.bob.discard).toEqual([]);
  });

  it('lets each other player choose in turn order, with 4 players', async () => {
    const game = createGame({ kingdom: ['Vault'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    const cara = game.player('Cara');
    const dan = game.player('Dan');
    game.alice.setHand(['Vault', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Gold']);
    cara.setHand(['Estate', 'Estate', 'Copper']);
    cara.setDeck(['Gold']);
    dan.setHand(['Curse']);
    dan.setDeck(['Gold']);

    await game.start();
    await game.playAction('Vault');
    await game.chooseCards([]);
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseCards', 'Cara');
    await game.chooseCards([]);
    game.expectDecision('chooseCards', 'Dan');
    await game.chooseCards(['Curse']);

    expect(game.bob.hand).toEqual(['Copper', 'Gold']);
    expect(cara.hand).toEqual(['Estate', 'Estate', 'Copper']);
    expect(dan.hand).toEqual([]);
    expect(dan.deck).toEqual(['Gold']);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('draws its 2 cards with a reshuffle in the middle when the deck runs out', async () => {
    const game = createGame({ kingdom: ['Vault'] });
    game.alice.setHand(['Vault', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Gold']);
    game.alice.setDiscard(['Silver']);
    game.bob.setHand(coppers(5));

    await game.start();
    await game.playAction('Vault');

    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    await game.chooseCards(['Estate', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.coins).toBe(4);
  });

  it('with no cards to draw and an empty hand, still lets the other players discard', async () => {
    const game = createGame({ kingdom: ['Vault'] });
    game.alice.setHand(['Vault']);
    game.bob.setHand(['Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Gold']);

    await game.start();
    await game.playAction('Vault');
    expect(game.alice.hand).toEqual([]);
    // (Alice is still asked, with nothing to choose)
    await game.chooseCards([]);
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.alice.coins).toBe(0);
    expect(game.bob.hand).toEqual(['Copper', 'Gold']);
  });

  it("lets another player's discarded Tunnel gain them a Gold before they draw", async () => {
    const game = createGame({ kingdom: ['Vault', 'Tunnel'] });
    game.alice.setHand(['Vault', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Tunnel', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver']);

    await game.start();
    await game.playAction('Vault');
    await game.chooseCards([]);
    await game.chooseCards(['Tunnel', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Tunnel');

    expect([...game.bob.discard].sort()).toEqual(['Estate', 'Gold', 'Tunnel']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('gives +$1 for a discarded Trail even though Trail then plays itself', async () => {
    const game = createGame({ kingdom: ['Vault', 'Trail'] });
    game.alice.setHand(['Vault', 'Trail', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Gold', ...coppers(5)]);
    game.bob.setHand(coppers(5));

    await game.start();
    await game.playAction('Vault');
    await game.chooseCards(['Trail', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Trail');
    if (game.pending.kind === 'chooseCards' && game.pending.playerName === 'Bob') {
      await game.chooseCards([]);
    }

    expect(game.alice.inPlay).toEqual(['Vault', 'Trail']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', 'Silver', 'Gold']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(1);
  });

  it('skips another player with no cards in hand', async () => {
    const game = createGame({ kingdom: ['Vault'] });
    game.alice.setHand(['Vault', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand([]);
    game.bob.setDeck(['Gold']);

    await game.start();
    await game.playAction('Vault');
    await game.chooseCards([]);

    expect(game.bob.hand).toEqual([]);
    expect(game.bob.deck).toEqual(['Gold']);
    expect(game.expectDecision('treasurePhase', 'Alice')).toBeDefined();
  });
});
