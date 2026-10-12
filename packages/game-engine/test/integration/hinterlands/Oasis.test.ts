import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Oasis', 'Village'];

describe('Oasis', () => {
  it('gives +1 Action and +$1 with nothing to draw and nothing to discard', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Oasis']);

    await game.start();
    await game.playAction('Oasis');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('must discard the card it drew when that is the only card in hand', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Oasis']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Oasis');

    const discard = game.expectDecision('chooseCard', 'Alice');
    expect(discard.noneAllowed).toBe(false);
    expect(discard.cardChoices.map((choice) => choice.card.name)).toEqual(['Gold']);
    await game.chooseCard('Gold');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.coins).toBe(1);
  });

  it('draws, then discards, on each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Oasis']);
    game.alice.setDeck(['Gold', 'Silver']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Oasis');

    // 1st play: the Gold is the only card in hand
    const first = game.expectDecision('chooseCard', 'Alice');
    expect(first.cardChoices.map((choice) => choice.card.name)).toEqual(['Gold']);
    await game.chooseCard('Gold');
    // 2nd play: the Silver is
    const second = game.expectDecision('chooseCard', 'Alice');
    expect(second.cardChoices.map((choice) => choice.card.name)).toEqual(['Silver']);
    await game.chooseCard('Silver');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Gold', 'Silver']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(2);
  });
});
