import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Nobles', () => {
  it('can make a different choice for each play when played by Throne Room', async () => {
    const game = createGame({ kingdom: ['Nobles', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Nobles', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Gold', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Nobles');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual(['+3 Cards', '+2 Actions']);
    await game.chooseOption('+2 Actions');
    await game.chooseOption('+3 Cards');

    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Silver', 'Gold']);
  });

  it('is worth 2VP each in any zone, including in play', async () => {
    const game = createGame({ kingdom: ['Nobles'] });
    game.alice.setHand(['Nobles', 'Nobles', 'Copper']);
    game.alice.setDeck(['Nobles', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Nobles']);

    await game.start();
    await game.playAction('Nobles');
    await game.chooseOption('+2 Actions');

    expect(game.alice.inPlay).toEqual(['Nobles']);
    expect(game.alice.score).toBe(8);
  });

  it('is scored at the end of the game together with VP tokens and Nobles in play', async () => {
    const game = createGame({ kingdom: ['Nobles', 'Monument', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Monument', 'Nobles', 'Gold', 'Gold']);
    game.alice.setDeck(['Gold', 'Gold', 'Nobles', ...coppers(10)]);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Nobles');
    await game.chooseOption('+2 Actions');
    await game.playAction('Throne Room');
    await game.chooseCard('Monument');
    expect(game.alice.vpTokens).toBe(2);
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const aliceResult = game.gameResult?.playerResults.find((result) => result.playerName === 'Alice');
    // Province 6 + 2 Nobles (in play and in the deck) 4 + 2 VP tokens
    expect(aliceResult?.scoreReport.total).toBe(12);
  });

  it('is played as an Action by Golem from the deck, with a choice', async () => {
    const game = createGame({ kingdom: ['Nobles', 'Golem'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Nobles', 'Estate', 'Village', 'Silver', 'Silver', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Nobles');
    await game.chooseOption('+3 Cards');

    expect(game.alice.inPlay).toEqual(['Golem', 'Nobles', 'Village']);
    expect(game.alice.hand.filter((name) => name === 'Silver')).toHaveLength(3);
    expect(game.alice.actions).toBe(2);
  });

  it('is worth 2VP while set aside by Haven', async () => {
    const game = createGame({ kingdom: ['Nobles', 'Haven'] });
    game.alice.setHand(['Haven', 'Nobles', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Nobles');

    expect(game.alice.setAside).toEqual(['Nobles']);
    expect(game.alice.score).toBe(2);
  });

  it('draws only what is left for +3 Cards when the deck and discard pile hold fewer than 3 cards', async () => {
    const game = createGame({ kingdom: ['Nobles'] });
    game.alice.setHand(['Nobles', 'Copper']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Nobles');
    await game.chooseOption('+3 Cards');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('is not counted once trashed, and moves with its owner when passed with Masquerade', async () => {
    const game = createGame({ kingdom: ['Nobles', 'Masquerade'] });
    game.alice.setHand(['Masquerade', 'Nobles', 'Nobles', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Copper', 'Copper']);

    await game.start();
    expect(game.alice.score).toBe(4);
    await game.playAction('Masquerade');
    await game.chooseCard('Nobles');
    await game.chooseCard('Copper');
    expect(game.alice.score).toBe(2);
    expect(game.bob.score).toBe(2);
    await game.chooseCard('Nobles');

    expect(game.trash).toEqual(['Nobles']);
    expect(game.alice.score).toBe(0);
  });
});
