import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Dame Sylvia', () => {
  it('keeps its +$2 after trashing itself, and the coins can be spent', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Sylvia', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Sir Destry', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Sylvia');
    expect(game.trash).toEqual(['Sir Destry', 'Dame Sylvia']);

    await game.playAllTreasures();
    expect(game.alice.coins).toBe(5);
    await game.buy('Duchy');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Duchy');
  });

  it('gives +$2 for each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Knights', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Dame Sylvia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Copper', 'Silver', 'Gold', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Dame Sylvia');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.coins).toBe(4);
    expect(game.trash).toEqual(['Silver', 'Gold']);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Dame Sylvia']);
  });
});
