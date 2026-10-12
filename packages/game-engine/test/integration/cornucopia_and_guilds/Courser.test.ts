import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Courser', () => {
  it('does the two chosen options in the order listed, so it draws before gaining the Silvers', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Courser']);

    await game.start();
    await game.playAction('Courser');
    expect(game.pending.numToSelect).toBe(2);
    await game.chooseOptions(['Gain 4 Silvers', '+2 Cards']);

    // Drawing first found nothing; the Silvers stay in the discard pile
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
  });

  it('gains only the Silvers that are left', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Courser']);
    game.setPileSize('Silver', 2);

    await game.start();
    await game.playAction('Courser');
    await game.chooseOptions(['+2 Actions', 'Gain 4 Silvers']);

    expect(game.alice.discard).toEqual(['Silver', 'Silver']);
    expect(game.pileSize('Silver')).toBe(0);
    expect(game.alice.actions).toBe(2);
  });

  it('played twice by Throne Room, chooses two options each time, so all four can be chosen', async () => {
    const game = createGame({ kingdom: ['Throne Room'] });
    game.alice.setHand(['Throne Room', 'Courser']);
    game.alice.setDeck(['Gold', 'Gold', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Courser');
    await game.chooseOptions(['+2 Cards', '+2 Actions']);
    expect(game.pending.numToSelect).toBe(2);
    expect(game.pending.options).toEqual(['+2 Cards', '+2 Actions', '+$2', 'Gain 4 Silvers']);
    await game.chooseOptions(['+$2', 'Gain 4 Silvers']);

    expect(game.alice.hand).toEqual(['Gold', 'Gold']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
  });

  it('played twice by Throne Room, can choose the same two options again', async () => {
    const game = createGame({ kingdom: ['Throne Room'] });
    game.alice.setHand(['Throne Room', 'Courser']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Courser');
    await game.chooseOptions(['+2 Cards', '+$2']);
    await game.chooseOptions(['+2 Cards', '+$2']);

    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.coins).toBe(4);
  });

  // Every pair of options, chosen in reverse order. They still happen in the order listed on the card, so with one
  // card left to draw, +2 Cards draws only that card and never the Silvers.
  it.each([
    ['+2 Actions', '+2 Cards'],
    ['+$2', '+2 Cards'],
    ['Gain 4 Silvers', '+2 Cards'],
    ['+$2', '+2 Actions'],
    ['Gain 4 Silvers', '+2 Actions'],
    ['Gain 4 Silvers', '+$2'],
  ])('choosing "%s" and "%s" does exactly those two options, in the order listed', async (first, second) => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Courser']);
    game.alice.setDeck(['Gold']);
    const chosen = [first, second];

    await game.start();
    await game.playAction('Courser');
    await game.chooseOptions(chosen);

    const drew = chosen.includes('+2 Cards');
    expect(game.alice.hand).toEqual(drew ? ['Gold'] : []);
    expect(game.alice.deck).toEqual(drew ? [] : ['Gold']);
    expect(game.alice.actions).toBe(chosen.includes('+2 Actions') ? 2 : 0);
    expect(game.alice.coins).toBe(chosen.includes('+$2') ? 2 : 0);
    expect(game.alice.discard).toEqual(chosen.includes('Gain 4 Silvers') ? Array<string>(4).fill('Silver') : []);
  });

  it('choosing the same option twice does it only once, since the two options must be different', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Courser']);
    game.alice.setDeck(['Gold', 'Gold', 'Gold']);

    await game.start();
    await game.playAction('Courser');
    expect(new Set(game.pending.options).size).toBe(4);
    await game.chooseOptions(['+$2', '+$2']);

    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.actions).toBe(0);
  });

  it('gaining the last Silvers as the third empty Supply pile ends the game only after the turn', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Courser', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Silver', 3);

    await game.start();
    await game.playAction('Courser');
    await game.chooseOptions(['+$2', 'Gain 4 Silvers']);

    expect(game.pileSize('Silver')).toBe(0);
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver']);
    expect(game.isFinished).toBe(false);
    game.expectDecision('treasurePhase', 'Alice');
    await game.endTurn();

    expect(game.isFinished).toBe(true);
  });
});
