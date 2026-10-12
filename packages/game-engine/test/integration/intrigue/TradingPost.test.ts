import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('TradingPost', () => {
  it('trashes the only card in hand and gains no Silver', async () => {
    const game = createGame({ kingdom: ['Trading Post'] });
    game.alice.setHand(['Trading Post', 'Estate']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    const silversBefore = game.pileSize('Silver');

    await game.start();
    await game.playAction('Trading Post');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards(['Estate']);
    }

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toEqual([]);
    expect(game.pileSize('Silver')).toBe(silversBefore);
  });

  it('requires exactly 2 cards from a larger hand and puts the Silver into hand', async () => {
    const game = createGame({ kingdom: ['Trading Post'] });
    game.alice.setHand(['Trading Post', 'Estate', 'Curse', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Trading Post');
    expect(game.expectDecision('chooseCards', 'Alice').numSelectedEligibility).toEqual([2]);
    await game.chooseCards(['Estate', 'Curse']);

    expect(game.trash).toEqual(['Estate', 'Curse']);
    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
  });

  it('trashes 2 cards but gains nothing when the Silver pile is empty', async () => {
    const game = createGame({ kingdom: ['Trading Post'] });
    game.alice.setHand(['Trading Post', 'Estate', 'Curse', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.setPileSize('Silver', 0);

    await game.start();
    await game.playAction('Trading Post');
    await game.chooseCards(['Estate', 'Curse']);

    expect(game.trash).toEqual(['Estate', 'Curse']);
    expect(game.alice.hand).toEqual(['Copper']);
  });

  it('still gains a Silver when one of the trashed cards is a Fortress that returns to hand', async () => {
    const game = createGame({ kingdom: ['Trading Post', 'Fortress'] });
    game.alice.setHand(['Trading Post', 'Fortress', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Trading Post');
    await game.chooseCards(['Fortress', 'Estate']);

    // Official FAQ (Fortress): "You still trashed Fortress, even though you got it back"
    expect(game.trash).toEqual(['Estate']);
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Fortress', 'Silver']);
  });

  it('lets Market Square react to the trashing before the Silver is gained', async () => {
    const game = createGame({ kingdom: ['Trading Post', 'Market Square'] });
    game.alice.setHand(['Trading Post', 'Market Square', 'Estate', 'Curse']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Trading Post');
    await game.chooseCards(['Estate', 'Curse']);
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Estate', 'Curse']);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
    expect(game.alice.hand).toEqual(['Silver']);
  });

  it('does nothing with an empty hand', async () => {
    const game = createGame({ kingdom: ['Trading Post'] });
    game.alice.setHand(['Trading Post']);
    game.alice.setDeck(coppers(10));
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.playAction('Trading Post');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards([]);
    }

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual([]);
    expect(game.pileSize('Silver')).toBe(silvers);
  });

  it('resolves when-trash abilities of both trashed cards, in the chosen order, before gaining the Silver', async () => {
    const game = createGame({ kingdom: ['Trading Post', 'Fortress', 'Rats'] });
    game.alice.setHand(['Trading Post', 'Fortress', 'Rats', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Trading Post');
    await game.chooseCards(['Fortress', 'Rats']);

    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect([...order.mandatoryEffects.map((effect) => effect.effectName)].sort()).toEqual(['Fortress', 'Rats']);
    await game.chooseEffect('Rats');

    expect(game.trash).toEqual(['Rats']);
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Fortress', 'Gold', 'Silver']);
  });

  it('trashes 2 cards and gains a Silver on each play by Throne Room, and can trash the Silver it gained', async () => {
    const game = createGame({ kingdom: ['Trading Post', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Trading Post', 'Estate', 'Curse', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Trading Post');
    await game.chooseCards(['Estate', 'Curse']);
    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
    await game.chooseCards(['Copper', 'Silver']);

    expect(game.trash).toEqual(['Estate', 'Curse', 'Copper', 'Silver']);
    expect(game.alice.hand).toEqual(['Silver']);
  });
});
