import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Ruined Library', () => {
  it('shuffles the discard pile to draw when the deck is empty', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Ruined Library', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Ruined Library');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(0);
  });

  it('draws the card after the ones Golem revealed when Golem plays it', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Golem'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Ruined Library', 'Estate', 'Ruined Village', 'Gold', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Ruined Library');

    expect(game.alice.inPlay).toEqual(['Golem', 'Ruined Library', 'Ruined Village']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.actions).toBe(1);
  });
  it('draws nothing when the deck and discard pile are both empty', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Ruined Library', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Ruined Library');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    expect(game.alice.inPlay).toEqual(['Ruined Library']);
  });
});
