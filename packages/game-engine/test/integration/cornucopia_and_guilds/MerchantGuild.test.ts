import { CardInfoLookup } from '@dominion/card-info';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Merchant Guild', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gives +1 Coffers per card gained in the Buy phase, at the end of the Buy phase', async () => {
    const game = createGame({ kingdom: ['Merchant Guild'] });
    game.alice.setHand(['Merchant Guild', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant Guild');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.alice.coffers).toBe(0);
    await game.buy('Silver');

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.coffers).toBe(2);
  });

  it('counts cards gained in the Buy phase other than by buying, but not cards gained in the Action phase', async () => {
    const findMatchingRandomizerName = CardInfoLookup.findMatchingRandomizerName.bind(CardInfoLookup);
    vi.spyOn(CardInfoLookup, 'findMatchingRandomizerName').mockImplementation((requirements, usedCardNames) =>
      requirements?.requiredCoinCosts?.join() === '3,4'
        ? 'Shop'
        : findMatchingRandomizerName(requirements, usedCardNames),
    );
    const game = createGame({ kingdom: ['Merchant Guild', 'Ferryman', 'Workshop'] });
    game.alice.setHand(['Village', 'Workshop', 'Merchant Guild', 'Gold', 'Gold']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Workshop');
    await game.chooseCard('Silver');
    await game.playAction('Merchant Guild');
    await game.playAllTreasures();
    // Buying Ferryman also gains a Shop
    await game.buy('Ferryman');
    await game.buy('Silver');

    expect(game.alice.coffers).toBe(3);
  });

  it('gives +1 Coffers per card for each Merchant Guild played', async () => {
    const game = createGame({ kingdom: ['Merchant Guild'] });
    game.alice.setHand(['Village', 'Merchant Guild', 'Merchant Guild', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Merchant Guild');
    await game.playAction('Merchant Guild');
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.endBuyPhase();

    expect(game.alice.coffers).toBe(2);
  });

  it('gives +2 Coffers per card when played twice by Coronet', async () => {
    const game = createGame({ kingdom: ['Merchant Guild'] });
    game.alice.setHand(['Coronet', 'Merchant Guild', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Merchant Guild');
    // Decline Coronet's optional Treasure play
    await game.chooseNone();
    expect(game.alice.buys).toBe(3);
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.buy('Copper');
    await game.endBuyPhase();

    expect(game.alice.coffers).toBe(4);
  });

  it('played twice in the Buy phase by Coronet, counts cards gained earlier in that Buy phase, twice', async () => {
    const game = createGame({ kingdom: ['Merchant Guild', 'Horn of Plenty'] });
    game.alice.setHand(['Copper', 'Copper', 'Horn of Plenty', 'Coronet', 'Merchant Guild']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Copper');
    await game.playTreasure('Copper');
    await game.playTreasure('Horn of Plenty');
    // Copper and Horn of Plenty: up to $2
    await game.chooseCard('Cellar');
    await game.playTreasure('Coronet');
    await game.chooseCard('Merchant Guild');
    expect(game.alice.buys).toBe(3);
    expect(game.alice.coins).toBe(4);
    await game.buy('Silver');
    await game.buy('Copper');
    await game.endBuyPhase();

    // Cellar, Silver and Copper, +2 Coffers each
    expect(game.alice.coffers).toBe(6);
  });

  it('does not count cards gained in the Buy phase of a later turn', async () => {
    const game = createGame({ kingdom: ['Merchant Guild'] });
    game.alice.setHand(['Merchant Guild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant Guild');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.coffers).toBe(0);
  });

  it('still gives its Coffers when the turn is ended straight from the Buy phase', async () => {
    const game = createGame({ kingdom: ['Merchant Guild'] });
    game.alice.setHand(['Merchant Guild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant Guild');
    await game.playAllTreasures();
    await game.buy('Silver');
    game.expectDecision('buyPhase', 'Alice');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.coffers).toBe(1);
  });

  it('counts the extra card Haggler gains when a card is bought, as it is gained in the Buy phase', async () => {
    const game = createGame({ kingdom: ['Merchant Guild', 'Haggler'] });
    game.alice.setHand(['Village', 'Haggler', 'Merchant Guild', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Haggler');
    await game.playAction('Merchant Guild');
    await game.playAllTreasures();
    // $2 + $1 + $2 + Copper from Village's draw
    await game.buy('Silver');
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Copper');
    await game.endBuyPhase();

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Silver', 'Copper']));
    expect(game.alice.coffers).toBe(2);
  });

  it('counts the Gold that Hoard gains when a Victory card is bought', async () => {
    const game = createGame({ kingdom: ['Merchant Guild', 'Hoard'] });
    game.alice.setHand(['Merchant Guild', 'Hoard', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant Guild');
    await game.playTreasure('Hoard');
    await game.playAllTreasures();
    await game.buy('Estate');
    await game.endBuyPhase();

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Estate', 'Gold']));
    expect(game.alice.coffers).toBe(2);
  });

  it('Coffers from Merchant Guilds played on different turns add up', async () => {
    const game = createGame({ kingdom: ['Merchant Guild'] });
    game.alice.setHand(['Merchant Guild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Merchant Guild', 'Merchant Guild', 'Silver', 'Silver', 'Village', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Merchant Guild');
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.endBuyPhase();
    expect(game.alice.coffers).toBe(1);
    await game.endTurn();

    // Alice's next turn: two Merchant Guilds and three gains in the Buy phase
    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Village');
    await game.playAction('Merchant Guild');
    await game.playAction('Merchant Guild');
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.buy('Copper');
    expect(game.alice.coffers).toBe(1);
    // The last Buy ends the Buy phase
    await game.buy('Copper');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.coffers).toBe(1 + 2 * 3);
  });

  it('counts only the Buy phase of the turn it was played on, not that of an Outpost extra turn', async () => {
    const game = createGame({ kingdom: ['Merchant Guild', 'Outpost'] });
    game.alice.setHand(['Village', 'Outpost', 'Merchant Guild', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Outpost');
    await game.playAction('Merchant Guild');
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.endBuyPhase();
    if (game.pending.kind === 'chooseExtraTurns') {
      await game.chooseExtraTurn('Outpost');
    }
    expect(game.alice.coffers).toBe(1);

    // Outpost's extra turn: a new turn, so Merchant Guild no longer applies
    expect(game.currentPlayerName).toBe('Alice');
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.coffers).toBe(1);
  });
});
