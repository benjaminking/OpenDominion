import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, putOnNativeVillageMat } from './seasideHelpers';

const PUT_ON_MAT = 'Put the top card of your deck face down on your Native Village mat';
const TAKE_FROM_MAT = 'Put all the cards from your Native Village mat into your hand';

describe('Native Village', () => {
  it('puts the top card of the deck on its mat, shuffling first if the deck is empty, and keeps it there', async () => {
    const game = createGame({ kingdom: ['Native Village'] });
    game.alice.setHand(['Native Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Gold']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption(PUT_ON_MAT);
    expect(game.alice.nativeVillageMat).toEqual(['Gold']);
    expect(game.alice.discard).toEqual([]);
    await game.endTurn();

    expect(game.alice.nativeVillageMat).toEqual(['Gold']);
    expect(game.alice.hand).not.toContain('Gold');
  });

  it('puts all the cards from its mat into hand', async () => {
    const game = createGame({ kingdom: ['Native Village'] });
    game.alice.setHand(['Native Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    putOnNativeVillageMat(game.alice, ['Gold', 'Silver']);

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption(TAKE_FROM_MAT);

    expect(game.alice.nativeVillageMat).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold', 'Silver']);
  });

  it('offers both options even when the deck, discard pile and mat are all empty', async () => {
    const game = createGame({ kingdom: ['Native Village'] });
    game.alice.setHand(['Native Village', 'Copper']);

    await game.start();
    await game.playAction('Native Village');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual([PUT_ON_MAT, TAKE_FROM_MAT]);
    await game.chooseOption(PUT_ON_MAT);

    expect(game.alice.nativeVillageMat).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper']);
  });

  it('counts the cards on its mat at the end of the game', async () => {
    const game = createGame({ kingdom: ['Native Village'] });
    game.alice.setHand(coppers(5));
    putOnNativeVillageMat(game.alice, ['Estate', 'Duchy']);
    game.setPileSize('Province', 0);

    await game.start();
    await game.endTurn();

    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(4);
  });

  it('can put the top card on its mat and then take the whole mat into hand when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Native Village', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Native Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);
    putOnNativeVillageMat(game.alice, ['Silver']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Native Village');
    await game.chooseOption(PUT_ON_MAT);
    expect(game.alice.nativeVillageMat).toEqual(['Silver', 'Gold']);
    await game.chooseOption(TAKE_FROM_MAT);

    expect(game.alice.nativeVillageMat).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.alice.actions).toBe(4);
  });

  it('keeps the mat out of a reshuffle, and its cards can be taken into hand on a later turn', async () => {
    const game = createGame({ kingdom: ['Native Village'] });
    game.alice.setHand(['Native Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Native Village', 'Native Village', 'Copper', 'Copper', 'Copper']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption(PUT_ON_MAT);
    expect(game.alice.nativeVillageMat).toEqual(['Gold']);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.deck).toEqual([]);
    await game.playAction('Native Village');
    // The deck is empty: the discard pile (Native Village and 4 Coppers) is shuffled, without the mat
    await game.chooseOption(PUT_ON_MAT);
    expect(game.alice.nativeVillageMat).toHaveLength(2);
    expect(game.alice.nativeVillageMat[0]).toBe('Gold');
    expect(game.alice.deck).toHaveLength(4);
    expect(game.alice.deck).not.toContain('Gold');

    await game.playAction('Native Village');
    await game.chooseOption(TAKE_FROM_MAT);
    expect(game.alice.nativeVillageMat).toEqual([]);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.hand).toContain('Gold');
  });

  it('counts a card it put on its mat only once for scoring', async () => {
    const game = createGame({ kingdom: ['Native Village'] });
    game.alice.setHand(['Native Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.setPileSize('Province', 0);

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption(PUT_ON_MAT);
    expect(game.alice.nativeVillageMat).toEqual(['Estate']);

    expect(game.alice.score).toBe(1);
    await game.endTurn();

    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(1);
  });
  it("puts a card on its mat on each of two plays by King's Court, shuffling for the second, and takes them all on the third", async () => {
    const game = createGame({ kingdom: ['Native Village', "King's Court"] });
    game.alice.setHand(["King's Court", 'Native Village', 'Copper']);
    game.alice.setDeck(['Gold']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Native Village');
    await game.chooseOption(PUT_ON_MAT);
    await game.chooseOption(PUT_ON_MAT);
    expect(game.alice.nativeVillageMat).toEqual(['Gold', 'Silver']);
    expect(game.alice.discard).toEqual([]);
    await game.chooseOption(TAKE_FROM_MAT);

    expect(game.alice.nativeVillageMat).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Gold', 'Silver']);
    expect(game.alice.actions).toBe(6);
  });
});
