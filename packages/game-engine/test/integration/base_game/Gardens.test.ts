import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { finalScore } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Gardens', () => {
  it('counts cards in every zone, including in play, going from 19 to 20 cards', async () => {
    const game = createGame({ kingdom: ['Gardens'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(['Gardens', 'Gardens', ...coppers(8)]);
    game.alice.setDiscard(coppers(4));

    await game.start();
    await game.playAllTreasures();
    // 19 cards (5 of them in play): each Gardens is worth 1
    expect(game.alice.inPlay).toHaveLength(5);
    expect(game.alice.score).toBe(2);

    await game.buy('Copper');
    // 20 cards: each Gardens is worth 2
    expect(game.alice.score).toBe(4);
  });

  it('counts cards on a Native Village mat at the end of the game', async () => {
    const game = createGame({ kingdom: ['Gardens', 'Native Village'] });
    game.alice.setHand(['Native Village', 'Gold', 'Gold', 'Silver']);
    game.alice.setDeck(['Copper', 'Gardens', 'Copper', 'Copper', 'Copper']);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption('Put the top card of your deck face down on your Native Village mat');
    await game.playAllTreasures();
    await game.buy('Province');

    // Buying the last Province ends the game. Alice owns 10 cards, one of them on her Native Village mat,
    // and mat cards are returned to the deck for scoring (Seaside rulebook, Native Village)
    expect(game.isFinished).toBe(true);
    const aliceResult = game.state.getGameResult()!.playerResults.find((result) => result.playerName === 'Alice')!;
    expect(aliceResult.scoreReport.total).toBe(6 + 1);
  });

  it('counts a card set aside by Haven when the game ends', async () => {
    const game = createGame({ kingdom: ['Gardens', 'Haven'] });
    game.alice.setHand(['Haven', 'Gold', 'Gold', 'Silver', 'Estate']);
    game.alice.setDeck(['Copper', 'Gardens', ...coppers(12)]);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Estate');
    await game.playAllTreasures();
    await game.buy('Province');

    // 20 cards, one of them set aside: Province 6 + Estate 1 + Gardens 2
    expect(game.isFinished).toBe(true);
    expect(game.alice.setAside).toEqual(['Estate']);
    expect(finalScore(game, 'Alice')).toBe(6 + 1 + 2);
  });

  it("counts only its owner's cards, not other players' cards or the trash", async () => {
    const game = createGame({ kingdom: ['Gardens', 'Chapel'] });
    game.alice.setHand(['Chapel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gardens', ...coppers(14)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(20));

    await game.start();
    // 20 cards
    expect(game.alice.score).toBe(2);
    await game.playAction('Chapel');
    await game.chooseCards(['Copper', 'Copper', 'Copper', 'Copper']);

    // 16 cards left: trashed cards no longer count
    expect(game.trash).toHaveLength(4);
    expect(game.alice.score).toBe(1);
    await game.endTurn();
    expect(game.alice.score).toBe(1);
  });

  it('is worth 0 with fewer than 10 cards and 1 with exactly 10', async () => {
    const game = createGame({ kingdom: ['Gardens', 'Workshop'] });
    game.alice.setHand(['Workshop', 'Gardens', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(4));

    await game.start();
    expect(game.alice.score).toBe(0);
    await game.playAction('Workshop');
    // Gaining a second Gardens: 10 cards, each Gardens worth 1
    await game.chooseCard('Gardens');

    expect(game.alice.score).toBe(2);
  });
});
