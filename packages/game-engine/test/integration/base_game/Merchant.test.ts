import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Merchant', () => {
  it('gives +$1 for the first Silver only', async () => {
    const game = createGame({ kingdom: ['Merchant'] });
    game.alice.setHand(['Merchant', 'Silver', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant');
    await game.playTreasure('Silver');
    expect(game.alice.coins).toBe(3);
    await game.playTreasure('Silver');
    expect(game.alice.coins).toBe(5);
  });

  it('gives +$1 from each Merchant played when the first Silver is played', async () => {
    const game = createGame({ kingdom: ['Merchant'] });
    game.alice.setHand(['Merchant', 'Merchant', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant');
    await game.playAction('Merchant');
    await game.playTreasure('Silver');

    expect(game.alice.coins).toBe(4);
  });

  it('counts a Silver played along with other simple Treasures', async () => {
    const game = createGame({ kingdom: ['Merchant'] });
    game.alice.setHand(['Merchant', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant');
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(1 + 2 + 3 + 1);
  });

  it('gives +$1 twice for the first Silver when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Merchant', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Merchant', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Merchant');
    await game.playTreasure('Silver');

    // Each play of Merchant gives +$1 for the first Silver (wiki, Merchant)
    expect(game.alice.coins).toBe(4);
  });

  it('has no effect on a Silver played on a later turn', async () => {
    const game = createGame({ kingdom: ['Merchant'] });
    game.alice.setHand(['Merchant', 'Copper', 'Copper', 'Copper', 'Copper']);
    // Merchant draws the first Copper; clean-up draws the next 5
    game.alice.setDeck(['Copper', 'Silver', 'Copper', 'Copper', 'Copper', 'Copper', ...coppers(10)]);

    await game.start();
    await game.playAction('Merchant');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playTreasure('Silver');
    expect(game.alice.coins).toBe(2);
  });

  it('gives +$1 only once when the first Silver is played twice (Coronet)', async () => {
    const game = createGame({ kingdom: ['Merchant', 'Village'] });
    game.alice.setHand(['Village', 'Merchant', 'Coronet', 'Silver', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Merchant');
    await game.playAction('Coronet');
    await game.chooseCard('Silver');

    // The second play of the same Silver isn't the first time a Silver is played this turn
    expect(game.alice.coins).toBe(2 + 1 + 2);
  });

  it('gives nothing for a later Silver when the first Silver was played before Merchant', async () => {
    const game = createGame({ kingdom: ['Merchant', 'Village'] });
    game.alice.setHand(['Village', 'Coronet', 'Merchant', 'Silver', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    // Coronet, played as an Action, plays a Silver twice before Merchant is played
    await game.playAction('Coronet');
    await game.chooseNone();
    await game.chooseCard('Silver');
    expect(game.alice.coins).toBe(4);
    await game.playAction('Merchant');
    await game.playTreasure('Silver');

    // Wiki, Merchant: if you play your first Silver before Merchant, you get nothing for any later Silver
    expect(game.alice.coins).toBe(4 + 2);
  });

  it('gives +$1 per play for the first Silver when Merchant is played twice in the Buy phase (Coronet)', async () => {
    const game = createGame({ kingdom: ['Merchant'] });
    game.alice.setHand(['Coronet', 'Merchant', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    // Coronet plays Merchant twice, then Silver twice
    await game.playTreasure('Coronet');
    await game.chooseCard('Merchant');
    await game.chooseCard('Silver');

    expect(game.alice.coins).toBe(2 + 2 + 1 + 1);
    expect(game.alice.hand).toEqual(['Estate', 'Copper', 'Copper']);
  });

  it('gives +$1 for a Silver played twice and trashed by Counterfeit', async () => {
    const game = createGame({ kingdom: ['Merchant', 'Counterfeit'] });
    game.alice.setHand(['Merchant', 'Counterfeit', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant');
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Silver');

    expect(game.trash).toEqual(['Silver']);
    // Counterfeit $1, Silver $2 twice, Merchant $1 once
    expect(game.alice.coins).toBe(1 + 2 + 2 + 1);
  });

  it("gives nothing for a Silver played on the Outpost turn after Merchant's turn", async () => {
    const game = createGame({ kingdom: ['Merchant', 'Outpost'] });
    game.alice.setHand(['Merchant', 'Outpost', 'Copper', 'Copper', 'Estate']);
    // Merchant draws the first Copper; Outpost's 3-card hand is Silver, Copper, Copper
    game.alice.setDeck(['Copper', 'Silver', 'Copper', 'Copper', ...coppers(10)]);

    await game.start();
    await game.playAction('Merchant');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand.sort()).toEqual(['Copper', 'Copper', 'Silver']);
    await game.playTreasure('Silver');
    expect(game.alice.coins).toBe(2);
  });
});
