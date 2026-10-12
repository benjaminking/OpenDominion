import { CardInfoLookup } from '@dominion/card-info';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

// Alice plays her Treasures, buys Stonemason and reaches the overpay choice.
const buyStonemason = async (game: GameHarness): Promise<void> => {
  await game.start();
  await game.playAllTreasures();
  await game.buy('Stonemason');
  if (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect('Stonemason');
  }
  game.expectDecision('chooseOneOption', 'Alice');
};

describe('Stonemason', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not offer to overpay $0, so it cannot gain Action cards costing $0', async () => {
    const game = createGame({ kingdom: ['Stonemason', 'Cultist'] });
    game.alice.setHand(coppers(4));
    game.alice.setDeck(coppers(10));

    await buyStonemason(game);

    expect(game.pending.options).toContain('$1');
    expect(game.pending.options).not.toContain('$0');
  });

  it('overpaying gains two Action cards each costing exactly the amount overpaid', async () => {
    const game = createGame({ kingdom: ['Stonemason'] });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await buyStonemason(game);
    await game.chooseOption('$3');

    // Silver costs $3 but isn't an Action
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Village', 'Workshop']));
    expect(offeredNames(game)).not.toContain('Silver');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Village');
    await game.chooseCard('Village');

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Stonemason', 'Village', 'Village']));
    expect(game.pileSize('Village')).toBe(8);
  });

  it('overpaying an amount that no Action costs gains nothing', async () => {
    const game = createGame({ kingdom: ['Stonemason'] });
    game.alice.setHand(['Gold', 'Copper']);
    game.alice.setDeck(coppers(10));

    await buyStonemason(game);
    await game.chooseOption('$1');

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard.filter((name) => name !== 'Gold' && name !== 'Copper')).toEqual(['Stonemason']);
  });

  it('overpaying with a Potion gains Action cards costing that amount plus a Potion', async () => {
    const game = createGame({ kingdom: ['Stonemason', 'University'] });
    game.alice.setHand(['Potion', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(10));

    await buyStonemason(game);
    await game.chooseOption('$2P');
    expect(offeredNames(game)).toEqual(['University']);
    await game.chooseCard('University');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('University');
    }

    expect(game.alice.discard.filter((name) => name === 'University')).toHaveLength(2);
  });

  it('trashing a card from hand and gaining two cheaper cards are both mandatory', async () => {
    const game = createGame({ kingdom: ['Stonemason'] });
    game.alice.setHand(['Stonemason', 'Gold', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Stonemason');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Gold');

    expect(game.pending.noneAllowed).toBe(false);
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Duchy', 'Silver']));
    expect(offeredNames(game)).not.toContain('Gold');
    await game.chooseCard('Duchy');
    await game.chooseCard('Silver');

    expect(game.trash).toEqual(['Gold']);
    expect(game.alice.discard).toEqual(['Duchy', 'Silver']);
  });

  it('gains nothing when it trashes a Copper, since nothing costs less than $0', async () => {
    const game = createGame({ kingdom: ['Stonemason'] });
    game.alice.setHand(['Stonemason', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Stonemason');
    await game.chooseCard('Copper');

    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.discard).toEqual([]);
    game.expectDecision('buyPhase', 'Alice');
  });

  it("overpaying $5 can gain two Ferrymen, and each one gains a card from Ferryman's pile", async () => {
    const findMatchingRandomizerName = CardInfoLookup.findMatchingRandomizerName.bind(CardInfoLookup);
    vi.spyOn(CardInfoLookup, 'findMatchingRandomizerName').mockImplementation((requirements, usedCardNames) =>
      requirements?.requiredCoinCosts?.join() === '3,4'
        ? 'Shop'
        : findMatchingRandomizerName(requirements, usedCardNames),
    );
    const game = createGame({ kingdom: ['Stonemason', 'Ferryman'] });
    vi.restoreAllMocks();
    game.alice.setHand(['Gold', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(10));

    await buyStonemason(game);
    await game.chooseOption('$5');
    expect(offeredNames(game)).toContain('Ferryman');
    await game.chooseCard('Ferryman');
    await game.chooseCard('Ferryman');

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard.filter((name) => name !== 'Gold' && name !== 'Copper').sort()).toEqual([
      'Ferryman',
      'Ferryman',
      'Shop',
      'Shop',
      'Stonemason',
    ]);
    expect(game.pileSize('Shop')).toBe(8);
  });

  it('overpaying $2P offers every Action costing exactly $2P, and the two gains can differ', async () => {
    const game = createGame({ kingdom: ['Stonemason', 'University', 'Apothecary', 'Alchemist'] });
    game.alice.setHand(['Potion', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(10));

    await buyStonemason(game);
    await game.chooseOption('$2P');
    // Alchemist costs $3P
    expect(offeredNames(game).sort()).toEqual(['Apothecary', 'University']);
    await game.chooseCard('University');
    await game.chooseCard('Apothecary');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Stonemason', 'University', 'Apothecary']));
    expect(game.alice.potions).toBe(0);
  });

  it('with no $ left after buying it, the only choice is not to overpay', async () => {
    const game = createGame({ kingdom: ['Stonemason'] });
    game.alice.setHand(['Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await buyStonemason(game);

    expect(game.pending.options).toEqual(["Don't overpay"]);
    await game.chooseOption("Don't overpay");
    expect(game.pending.playerName).toBe('Bob');
  });

  it('trashing a card costing $2P gains cards costing less, which excludes $3 and $2P cards', async () => {
    const game = createGame({ kingdom: ['Stonemason', 'University', 'Apothecary', 'Vineyard'] });
    game.alice.setHand(['Stonemason', 'University']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Stonemason');
    await game.chooseCard('University');

    expect(game.pending.prompt).toBe('Gain a card costing less than $2P');
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Copper', 'Estate', 'Vineyard', 'Stonemason']));
    expect(offeredNames(game)).not.toContain('Silver');
    expect(offeredNames(game)).not.toContain('Apothecary');
    expect(offeredNames(game)).not.toContain('University');
    await game.chooseCard('Vineyard');
    await game.chooseCard('Estate');

    expect(game.alice.discard).toEqual(['Vineyard', 'Estate']);
  });

  it('with Bridge in play, compares reduced costs: a Silver ($2) gains cards costing less than $2', async () => {
    const game = createGame({ kingdom: ['Stonemason', 'Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Stonemason', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Stonemason');
    await game.chooseCard('Silver');

    // Estate costs $1; Village ($3) costs $2
    expect(game.pending.prompt).toBe('Gain a card costing less than $2');
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Estate', 'Copper']));
    expect(offeredNames(game)).not.toContain('Village');
    await game.chooseCard('Estate');
    await game.chooseCard('Estate');
    expect(game.alice.discard).toEqual(['Estate', 'Estate']);
  });

  it('with costs reduced to $0, trashing an Estate gains nothing, since nothing costs less than $0', async () => {
    const game = createGame({ kingdom: ['Stonemason', 'Bridge', 'Throne Room'] });
    game.alice.setHand(['Village', 'Throne Room', 'Bridge', 'Stonemason', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Throne Room');
    await game.chooseCard('Bridge');
    await game.playAction('Stonemason');
    await game.chooseCard('Estate');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).toEqual([]);
  });

  it("overpaying gains Action cards at their current cost: Peddler's Buy-phase cost with two Actions in play", async () => {
    const game = createGame({ kingdom: ['Stonemason', 'Peddler'] });
    game.alice.setHand(['Village', 'Village', 'Gold', 'Gold']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAllTreasures();
    expect(game.costOf('Peddler').coins).toBe(4);
    await game.buy('Stonemason');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Stonemason');
    }
    await game.chooseOption('$4');
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Peddler', 'Smithy']));
    await game.chooseCard('Peddler');
    await game.chooseCard('Peddler');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Stonemason', 'Peddler', 'Peddler']));
  });

  it('overpaying with Quarry in play gains Action cards costing $2 less, and Stonemason itself costs $0', async () => {
    const game = createGame({ kingdom: ['Stonemason', 'Quarry'] });
    game.alice.setHand(['Quarry', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    await game.playTreasure('Quarry');
    expect(game.costOf('Stonemason').coins).toBe(0);
    await game.buy('Stonemason');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Stonemason');
    }
    expect(game.pending.options).toContain('$3');
    await game.chooseOption('$3');

    // Market and Laboratory ($5) cost $3; Silver costs $3 but isn't an Action
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Market', 'Laboratory']));
    expect(offeredNames(game)).not.toContain('Silver');
    expect(offeredNames(game)).not.toContain('Village');
    await game.chooseCard('Market');
    await game.chooseCard('Laboratory');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Stonemason', 'Market', 'Laboratory']));
  });
});
