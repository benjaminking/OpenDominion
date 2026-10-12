import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');
const FIRST_OPTIONS = ['Discard 2 cards', 'Put a card from your hand onto your deck', 'Gain a Copper'];
const SECOND_OPTIONS = ['+$3', 'Trash your hand', 'Gain a Duchy'];

describe('Count', () => {
  it('with an empty hand, offers every option; putting a card onto the deck and trashing the hand do nothing', async () => {
    const game = createGame({ kingdom: ['Count'] });
    game.alice.setHand(['Count']);
    game.alice.setDeck(['Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Count');
    expect(game.pending.options).toEqual(FIRST_OPTIONS);
    await game.chooseOption('Put a card from your hand onto your deck');
    expect(game.pending.options).toEqual(SECOND_OPTIONS);
    await game.chooseOption('Trash your hand');

    expect(game.alice.deck[0]).toBe('Estate');
    expect(game.trash).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Count']);
  });

  it('discards the only card in hand when "Discard 2 cards" is chosen', async () => {
    const game = createGame({ kingdom: ['Count'] });
    game.alice.setHand(['Count', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Discard 2 cards');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards(['Estate']);
    }

    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.hand).toEqual([]);
    game.expectDecision('chooseOneOption', 'Alice');
    expect(game.pending.options).toEqual(SECOND_OPTIONS);
  });

  it('discards nothing when "Discard 2 cards" is chosen with an empty hand', async () => {
    const game = createGame({ kingdom: ['Count'] });
    game.alice.setHand(['Count']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Discard 2 cards');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards([]);
    }

    expect(game.alice.discard).toEqual([]);
    game.expectDecision('chooseOneOption', 'Alice');
    expect(game.pending.options).toEqual(SECOND_OPTIONS);
  });

  it('can gain a Duchy with an empty Duchy pile, gaining nothing', async () => {
    const game = createGame({ kingdom: ['Count'] });
    game.alice.setHand(['Count', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Duchy', 0);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Gain a Copper');
    await game.chooseOption('Gain a Duchy');

    expect(game.alice.discard).toEqual(['Copper']);
    game.expectDecision('treasurePhase', 'Alice');
  });
});

describe('Count: interactions', () => {
  it('played twice by Throne Room: each play makes its own two choices', async () => {
    const game = createGame({ kingdom: ['Count', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Count', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Count');
    // First play
    await game.chooseOption('Gain a Copper');
    await game.chooseOption('Trash your hand');
    expect(game.trash).toEqual(['Estate', 'Estate', 'Copper']);
    // Second play: the hand is empty, so putting a card onto the deck does nothing
    expect(game.pending.options).toEqual(FIRST_OPTIONS);
    await game.chooseOption('Put a card from your hand onto your deck');
    await game.chooseOption('+$3');

    expect(game.alice.coins).toBe(3);
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.alice.discard).toEqual(['Copper']);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Count']);
  });

  it('trashing your hand with a Fortress in it returns the Fortress to your hand', async () => {
    const game = createGame({ kingdom: ['Count', 'Fortress'] });
    game.alice.setHand(['Count', 'Fortress', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Gain a Copper');
    await game.chooseOption('Trash your hand');

    expect(game.trash).toEqual(['Estate', 'Copper', 'Copper']);
    expect(game.alice.hand).toEqual(['Fortress']);
  });

  it('trashing your hand with a Market Square in it trashes the Market Square too, so it cannot react', async () => {
    const game = createGame({ kingdom: ['Count', 'Market Square'] });
    game.alice.setHand(['Count', 'Market Square', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Gain a Copper');
    await game.chooseOption('Trash your hand');

    // No Market Square prompt: the turn moves on with an empty hand
    game.expectDecision('buyPhase', 'Alice');
    expect(game.trash).toEqual(['Market Square', 'Estate', 'Copper', 'Copper']);
    expect(game.pileSize('Gold')).toBe(golds);
  });

  it('discarding a Tunnel with "Discard 2 cards" lets it be revealed to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Count', 'Tunnel'] });
    game.alice.setHand(['Count', 'Tunnel', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Discard 2 cards');
    await game.chooseCards(['Tunnel', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Tunnel', 'Estate', 'Gold']));
    expect(game.alice.discard).toHaveLength(3);
    game.expectDecision('chooseOneOption', 'Alice');
    expect(game.pending.options).toEqual(SECOND_OPTIONS);
  });

  it('resolves the first choice before the second: a card put onto the deck is safe from "Trash your hand"', async () => {
    const game = createGame({ kingdom: ['Count'] });
    game.alice.setHand(['Count', 'Gold', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Put a card from your hand onto your deck');
    await game.chooseCard('Gold');
    expect(game.pending.options).toEqual(SECOND_OPTIONS);
    await game.chooseOption('Trash your hand');

    expect(game.trash).toEqual(['Estate', 'Estate', 'Copper']);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.deck.slice(0, 2)).toEqual(['Gold', 'Silver']);
  });

  it('resolves the first choice before the second: cards discarded are safe from "Trash your hand"', async () => {
    const game = createGame({ kingdom: ['Count'] });
    game.alice.setHand(['Count', 'Gold', 'Silver', 'Estate', 'Curse']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Discard 2 cards');
    await game.chooseCards(['Gold', 'Silver']);
    await game.chooseOption('Trash your hand');

    expect(game.alice.discard).toEqual(['Gold', 'Silver']);
    expect(game.trash).toEqual(['Estate', 'Curse']);
    expect(game.alice.hand).toEqual([]);
  });

  it('gaining a Duchy lets Hovel in hand be trashed', async () => {
    const game = createGame({ kingdom: ['Count'] });
    game.alice.setHand(['Count', 'Hovel', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Gain a Copper');
    await game.chooseOption('Gain a Duchy');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Hovel');

    expect(game.trash).toEqual(['Hovel']);
    expect(game.alice.discard).toEqual(['Copper', 'Duchy']);
  });

  it('gaining the last Duchy as the third empty Supply pile ends the game only after the turn', async () => {
    const game = createGame({ kingdom: ['Count'] });
    game.alice.setHand(['Count', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Duchy', 1);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Gain a Copper');
    await game.chooseOption('Gain a Duchy');

    expect(game.pileSize('Duchy')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.isFinished).toBe(true);
  });
});
