import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Baron', () => {
  it('gains an Estate when declining to discard one, even with an Estate in hand', async () => {
    const game = createGame({ kingdom: ['Baron'] });
    game.alice.setHand(['Baron', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Baron');
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(true);
    await game.chooseNone();

    expect(game.alice.hand).toContain('Estate');
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.buys).toBe(2);
  });

  it('discards the only Estate on the first play by Throne Room and gains one on the second', async () => {
    const game = createGame({ kingdom: ['Baron', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Baron', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    const estatesBefore = game.pileSize('Estate');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Baron');
    await game.chooseCard('Estate');

    expect(game.alice.coins).toBe(4);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.discard).toEqual(['Estate', 'Estate']);
    expect(game.pileSize('Estate')).toBe(estatesBefore - 1);
  });

  it('gains nothing when not discarding an Estate and the Estate pile is empty', async () => {
    const game = createGame({ kingdom: ['Baron'] });
    game.alice.setHand(['Baron', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.setPileSize('Estate', 0);

    await game.start();
    await game.playAction('Baron');

    expect(game.alice.discard).toEqual([]);
    expect(game.alice.buys).toBe(2);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('does not treat Overgrown Estate as an Estate', async () => {
    const game = createGame({ kingdom: ['Baron'], useShelters: true });
    game.alice.setHand(['Baron', 'Overgrown Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Baron');

    // No Estate to discard: an Estate is gained straight away
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.hand).toContain('Overgrown Estate');
    expect(game.alice.coins).toBe(0);
  });

  it('can empty the Estate pile as the third empty Supply pile, ending the game after the turn', async () => {
    const game = createGame({ kingdom: ['Baron', 'Village', 'Smithy'] });
    game.alice.setHand(['Baron', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Estate', 1);

    await game.start();
    await game.playAction('Baron');

    expect(game.pileSize('Estate')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });

  it('still gives +$4 for discarding an Estate when the Estate pile is empty', async () => {
    const game = createGame({ kingdom: ['Baron'] });
    game.alice.setHand(['Baron', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Estate', 0);

    await game.start();
    await game.playAction('Baron');
    await game.chooseCard('Estate');

    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.coins).toBe(4);
  });

  it('offers only Estates, not Shelters such as Hovel, Necropolis or Overgrown Estate', async () => {
    const game = createGame({ kingdom: ['Baron'], useShelters: true });
    game.alice.setHand(['Baron', 'Estate', 'Hovel', 'Necropolis', 'Overgrown Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Baron');

    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name)).toEqual(['Estate']);
    await game.chooseCard('Estate');
    expect(game.alice.coins).toBe(4);
  });
});
