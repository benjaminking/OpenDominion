import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness, TestPlayer } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// The harness can read the Island and Native Village mats but has no setup helpers for them
const putOnIslandMat = (player: TestPlayer, names: string[]): void => {
  for (const name of names) {
    player.player.getOwnedCards().addCardToIslandMat(player.createCard(name, CardLocation.ISLAND_MAT));
  }
};

const putOnNativeVillageMat = (player: TestPlayer, names: string[]): void => {
  for (const name of names) {
    player.player.getOwnedCards().addCardToNativeVillageMat(player.createCard(name, CardLocation.NATIVE_VILLAGE_MAT));
  }
};

const finalScoreOf = (game: GameHarness, playerName: string): number | undefined =>
  game.gameResult?.playerResults.find((result) => result.playerName === playerName)?.scoreReport.total;

describe('Scoring', () => {
  it('counts Victory cards and Curses in every zone, set aside and on mats, plus VP tokens', async () => {
    const game = createGame({ kingdom: ['Haven', 'Island', 'Native Village', 'Bishop', 'Charlatan'] });
    game.alice.setHand(['Haven', 'Bishop', 'Province', 'Estate', 'Gold', 'Gold']);
    game.alice.setDeck(['Silver', 'Estate', ...coppers(5), 'Duchy']);
    game.alice.setDiscard(['Estate', 'Charlatan Curse']);
    putOnIslandMat(game.alice, ['Duchy']);
    putOnNativeVillageMat(game.alice, ['Estate', 'Charlatan Curse']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Haven');
    // Haven draws the Silver and sets the Province aside until Alice's next turn
    await game.chooseCard('Province');
    await game.playAction('Bishop');
    // Trashing an Estate: +1 VP, and +1 VP for its $2
    await game.chooseCard('Estate');
    await game.chooseNone();
    expect(game.alice.vpTokens).toBe(2);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    expect(game.alice.setAside).toEqual(['Province']);
    // Set aside Province (6), bought Province (6), Estate in deck (1), Duchy in deck (3), Estate and Curse in the
    // discard pile (1 - 1), Island mat Duchy (3), Native Village mat Estate and Curse (1 - 1), VP tokens (2)
    expect(finalScoreOf(game, 'Alice')).toBe(21);
  });
});
