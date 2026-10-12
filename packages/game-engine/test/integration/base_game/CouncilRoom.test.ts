import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Council Room', () => {
  it('makes each other player draw a card, shuffling if needed, and skips players with no cards', async () => {
    const game = createGame({ kingdom: ['Council Room'], players: ['Alice', 'Bob', 'Cara', 'Dave'] });
    game.alice.setHand(['Council Room', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Silver']);
    const cara = game.player('Cara');
    cara.setDiscard(['Gold']);
    const dave = game.player('Dave');
    dave.setHand(['Estate']);

    await game.start();
    await game.playAction('Council Room');

    expect(game.alice.hand).toHaveLength(4 + 4);
    expect(game.alice.buys).toBe(2);
    expect(game.bob.hand).toEqual(['Silver']);
    expect(cara.hand).toEqual(['Gold']);
    expect(cara.discard).toEqual([]);
    expect(dave.hand).toEqual(['Estate']);
  });

  it("makes the other players draw in turn order from the player who played it, on a later player's turn", async () => {
    const game = createGame({ kingdom: ['Council Room'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck([...coppers(5), 'Gold']);
    game.bob.setHand(['Council Room', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    const cara = game.player('Cara');
    cara.setHand(['Estate']);
    cara.setDeck(['Silver']);

    await game.start();
    await game.endTurn();
    await game.playAction('Council Room');

    expect(game.bob.hand).toHaveLength(4 + 4);
    expect(game.bob.buys).toBe(2);
    expect(cara.hand).toEqual(['Estate', 'Silver']);
    // Alice drew her 5 Coppers in Clean-up; Council Room gives her the Gold
    expect(game.alice.hand).toEqual([...coppers(5), 'Gold']);
  });

  it('makes each other player draw once per play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Council Room', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Council Room', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate']);
    game.bob.setDeck(['Silver', 'Gold', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Council Room');

    expect(game.alice.hand).toHaveLength(3 + 8);
    expect(game.alice.buys).toBe(3);
    expect(game.bob.hand).toEqual(['Estate', 'Silver', 'Gold']);
  });

  it('draws only the 3 cards left in its deck and discard pile, shuffling midway, and still gives +1 Buy', async () => {
    const game = createGame({ kingdom: ['Council Room'] });
    game.alice.setHand(['Council Room', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold']);
    game.alice.setDiscard(['Estate']);
    game.bob.setDeck(['Duchy']);

    await game.start();
    await game.playAction('Council Room');

    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Gold', 'Estate']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.buys).toBe(2);
    expect(game.bob.hand).toEqual(['Duchy']);
  });
});
