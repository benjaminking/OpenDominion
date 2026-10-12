import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Sir Bailey', () => {
  it('draws from a reshuffled discard pile and gives an Action to play another card', async () => {
    const game = createGame({ kingdom: ['Knights', 'Smithy'] });
    game.alice.setHand(['Sir Bailey', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Smithy']);
    game.bob.setDeck(['Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Bailey');

    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.hand).toContain('Smithy');
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(1);
    game.expectDecision('actionPhase', 'Alice');
  });

  it('still draws, gives +1 Action and attacks on its second Throne Room play after trashing itself', async () => {
    const game = createGame({ kingdom: ['Knights', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Sir Bailey', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);
    game.bob.setDeck(['Dame Anna', 'Copper', 'Gold', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Sir Bailey');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Dame Anna', 'Sir Bailey', 'Gold']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.inPlay).toEqual(['Throne Room']);
    expect(game.bob.discard).toEqual(['Copper', 'Estate']);
  });

  it('still gives +1 Action and attacks when there is nothing to draw', async () => {
    const game = createGame({ kingdom: ['Knights', 'Smithy'] });
    game.alice.setHand(['Sir Bailey', 'Smithy', 'Copper']);
    game.bob.setDeck(['Gold', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Bailey');

    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.hand).toEqual(['Smithy', 'Copper']);
    expect(game.alice.actions).toBe(1);
    expect(game.trash).toEqual(['Gold']);
    expect(game.alice.inPlay).toEqual(['Sir Bailey']);
  });
});
