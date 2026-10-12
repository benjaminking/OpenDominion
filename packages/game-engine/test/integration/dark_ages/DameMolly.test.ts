import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Dame Molly', () => {
  it('keeps its +2 Actions after it is trashed by its own attack', async () => {
    const game = createGame({ kingdom: ['Knights', 'Village', 'Smithy'] });
    game.alice.setHand(['Dame Molly', 'Smithy', 'Smithy', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Dame Sylvia', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Molly');
    expect(game.trash).toEqual(['Dame Sylvia', 'Dame Molly']);
    expect(game.alice.actions).toBe(2);

    await game.playAction('Smithy');
    await game.playAction('Smithy');
    expect(game.alice.inPlay).toEqual(['Smithy', 'Smithy']);
    expect(game.alice.hand).toHaveLength(8);
  });

  it('still gives +2 Actions and stays in play when no other player has a card to reveal', async () => {
    const game = createGame({ kingdom: ['Knights', 'Smithy'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Dame Molly', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Dame Molly');

    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.inPlay).toEqual(['Dame Molly']);
    expect(game.trash).toEqual([]);
  });
});
