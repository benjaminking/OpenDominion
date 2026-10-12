import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Vineyard', () => {
  it('is worth 1 VP per 3 Action cards across all zones, at the 2/3/5/6 boundaries', () => {
    const game = createGame({ kingdom: ['Vineyard', 'Village'] });
    game.alice.setHand(['Vineyard', 'Village']);
    game.alice.setDeck(['Village', 'Copper']);
    expect(game.alice.score).toBe(0);

    game.alice.setDiscard(['Village']);
    expect(game.alice.score).toBe(1);

    game.alice.setDiscard(['Village', 'Village', 'Village']);
    expect(game.alice.score).toBe(1);

    game.alice.setDiscard(['Village', 'Village', 'Village', 'Village', 'Vineyard']);
    // 6 Actions: each of the 2 Vineyards is worth 2 VP
    expect(game.alice.score).toBe(4);
  });

  it('counts Action-Victory cards as Actions', () => {
    const game = createGame({ kingdom: ['Vineyard', 'Mill'] });
    game.alice.setDeck(['Vineyard', 'Mill', 'Mill', 'Mill', 'Copper']);

    // Vineyard: 1 VP for the 3 Mills; each Mill is worth 1 VP itself
    expect(game.alice.score).toBe(4);
  });

  it('counts the Actions in play during the turn', async () => {
    const game = createGame({ kingdom: ['Vineyard', 'Village'] });
    game.alice.setHand(['Village', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Copper', ...copies('Copper', 8)]);
    game.alice.setDiscard(['Vineyard']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');

    expect(game.alice.inPlay).toEqual(['Village', 'Village']);
    expect(game.alice.score).toBe(1);
  });

  it('counts Action cards on the Native Village mat', async () => {
    const game = createGame({ kingdom: ['Vineyard', 'Native Village', 'Village'] });
    game.alice.setHand(['Native Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', ...copies('Copper', 10)]);
    game.alice.setDiscard(['Vineyard', 'Village']);

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption('Put the top card of your deck face down on your Native Village mat');

    // Native Village in play, Village on the mat and Village in the discard pile: 3 Actions
    expect(game.alice.deck).not.toContain('Village');
    expect(game.alice.score).toBe(1);
  });

  it('is scored when the game ends', async () => {
    const game = createGame({ kingdom: ['Vineyard', 'Village'] });
    game.setPileSize('Province', 1);
    game.alice.setHand(['Gold', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Village', 'Village', 'Vineyard', 'Copper', 'Copper']);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const aliceResult = game.state.getGameResult()?.playerResults.find((result) => result.playerName === 'Alice');
    expect(aliceResult?.scoreReport.total).toBe(7);
    expect(aliceResult?.scoreReport.elements).toEqual(
      expect.arrayContaining([expect.objectContaining({ cardName: 'Vineyard', count: 1, totalPoints: 1 })]),
    );
  });

  it('counts Action cards set aside, on the Island mat, staying in play as Durations and that are also Treasures', async () => {
    const game = createGame({ kingdom: ['Vineyard', 'Festival', 'Haven', 'Island', 'Wharf', 'Mill'] });
    game.alice.setHand(['Festival', 'Haven', 'Island', 'Wharf', 'Coronet']);
    game.alice.setDeck(['Mill', ...copies('Copper', 15)]);
    game.alice.setDiscard(['Vineyard']);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Haven');
    await game.chooseCard('Coronet');
    await game.playAction('Island');
    await game.chooseCard('Mill');
    await game.playAction('Wharf');
    await game.endTurn();

    // Festival is discarded; Haven and Wharf stay in play, Coronet is set aside, Island and Mill are on the mat
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Haven', 'Wharf']);
    expect(game.alice.setAside).toEqual(['Coronet']);
    expect(game.alice.islandMat).toEqual(['Island', 'Mill']);
    // 6 Action cards: Vineyard 2 VP, Island 2 VP, Mill 1 VP
    expect(game.alice.score).toBe(5);
  });

  it("counts Action-Shelters, Ruins and Knights, but not Victory-Shelters, Treasure-Victory cards or another player's Actions", () => {
    const game = createGame({ kingdom: ['Vineyard', 'Knights', 'Marauder', 'Farm', 'Village'], useShelters: true });
    game.alice.setHand(['Vineyard', 'Necropolis', 'Ruined Village']);
    game.alice.setDeck(['Dame Josephine', 'Overgrown Estate', 'Hovel', 'Farm']);
    game.alice.setDiscard([]);
    game.bob.setHand(['Village', 'Village', 'Village']);

    // 3 Actions (Necropolis, Ruined Village, Dame Josephine): Vineyard 1 VP, Dame Josephine 2 VP, Farm 2 VP
    expect(game.alice.score).toBe(5);
    game.bob.setDeck(['Village', 'Village', 'Village']);
    expect(game.alice.score).toBe(5);

    // A 6th Action makes it 2 VP
    game.alice.setDiscard(['Village', 'Village', 'Village']);
    expect(game.alice.score).toBe(6);
  });
});
