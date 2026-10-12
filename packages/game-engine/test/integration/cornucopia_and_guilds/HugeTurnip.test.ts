import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Huge Turnip', () => {
  it("counts every Coffers Alice has, including Baker's setup Coffers and ones from this turn", async () => {
    const game = createGame({ kingdom: ['Baker', 'Candlestick Maker'] });
    game.alice.setHand(['Candlestick Maker', 'Huge Turnip']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Candlestick Maker');
    expect(game.alice.coffers).toBe(2);
    await game.playTreasure('Huge Turnip');

    expect(game.alice.coffers).toBe(4);
    expect(game.alice.coins).toBe(4);
  });

  it('counts only the Coffers left after Butcher spends some', async () => {
    const game = createGame({ kingdom: ['Butcher'] });
    game.alice.setHand(['Butcher', 'Estate', 'Huge Turnip']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Butcher');
    await game.chooseCard('Estate');
    await game.chooseOption('1');
    await game.chooseCard('Silver');
    expect(game.alice.coffers).toBe(1);
    await game.playTreasure('Huge Turnip');

    expect(game.alice.coffers).toBe(3);
    expect(game.alice.coins).toBe(3);
  });

  it('with 3 Coffers already, gives +$5 and keeps all 5 Coffers', async () => {
    const game = createGame({ kingdom: ['Candlestick Maker'] });
    game.alice.setHand(['Huge Turnip', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start(() => {
      game.alice.player.getStatistics().addCoffers(3);
    });
    await game.playTreasure('Huge Turnip');

    expect(game.alice.coffers).toBe(5);
    expect(game.alice.coins).toBe(5);
  });
});
