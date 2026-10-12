import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Ruined Village', () => {
  it('replaces the Action it used, so another Action can be played', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Smithy'] });
    game.alice.setHand(['Ruined Village', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Ruined Village');
    expect(game.alice.actions).toBe(1);
    await game.playAction('Smithy');

    expect(game.alice.inPlay).toEqual(['Ruined Village', 'Smithy']);
    expect(game.alice.actions).toBe(0);
  });

  it('gives +1 Action when Golem plays it, leaving an Action to play another card', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Golem', 'Smithy'] });
    game.alice.setHand(['Golem', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Ruined Village', 'Copper', 'Ruined Village', ...COPPERS]);

    await game.start();
    await game.playAction('Golem');

    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Golem', 'Ruined Village', 'Ruined Village']);
    expect(game.alice.actions).toBe(2);
    await game.playAction('Smithy');
    expect(game.alice.hand).toHaveLength(6);
  });
});
