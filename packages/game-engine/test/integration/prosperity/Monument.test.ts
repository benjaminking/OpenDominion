import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Monument', () => {
  it("played by King's Court gives +$6 and +3 VP, which count in the final score", async () => {
    const game = createGame({ kingdom: ['Monument', "King's Court"] });
    game.alice.setHand(["King's Court", 'Monument', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Monument');
    expect(game.alice.vpTokens).toBe(3);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(8);
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const aliceResult = game.state
      .getGameResult()!
      .playerResults.find((playerResult) => playerResult.playerName === 'Alice')!;
    // Province, Estate and 3 VP tokens
    expect(aliceResult.scoreReport.total).toBe(10);
  });

  it('played by Crystal Ball in the Buy phase, gives $2 to spend and +1 VP', async () => {
    const game = createGame({ kingdom: ['Monument', 'Crystal Ball'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Monument', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');

    expect(game.alice.coins).toBe(3);
    expect(game.alice.vpTokens).toBe(1);
  });
});
