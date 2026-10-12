import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offered } from './hinterlandsHelpers';

const KINGDOM = ['Border Village', 'Highway', 'Workshop', 'Laboratory', 'Smithy', 'Nomads', 'Festival'];
const COPPERS = Array<string>(10).fill('Copper');

describe('BorderVillage', () => {
  it('gains a cheaper card when bought, putting Border Village in the discard pile first', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const borderVillages = game.pileSize('Border Village');
    const laboratories = game.pileSize('Laboratory');

    await game.start();
    await game.playAllTreasures();
    await game.buy('Border Village');

    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Laboratory', 'Duchy', 'Smithy', 'Silver', 'Copper']));
    expect(offered).not.toContain('Border Village');
    expect(offered).not.toContain('Gold');
    expect(gain.noneAllowed).toBe(false);
    await game.chooseCard('Laboratory');

    expect(game.alice.discard.slice(0, 2)).toEqual(['Border Village', 'Laboratory']);
    expect(game.pileSize('Border Village')).toBe(borderVillages - 1);
    expect(game.pileSize('Laboratory')).toBe(laboratories - 1);
  });

  it('uses the current costs when Highways make it cheaper', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Highway', 'Highway', 'Workshop', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Workshop');

    // Border Village costs $4 now, so Workshop can gain it
    await game.chooseCard('Border Village');

    // Gold also costs $4 and is not cheaper; Laboratory costs $3 and is
    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Laboratory');
    expect(offered).not.toContain('Gold');
    expect(offered).not.toContain('Border Village');
    await game.chooseCard('Laboratory');

    expect(game.alice.discard).toEqual(['Border Village', 'Laboratory']);
  });

  it("can chain into the gained card's own on-gain ability", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Festival', 'Gold', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Festival');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
    await game.buy('Border Village');

    // Gaining Nomads with Border Village gives +$2, which is then spent with Festival's +Buy
    await game.chooseCard('Nomads');
    expect(game.alice.coins).toBe(3);
    await game.buy('Silver');

    expect(game.alice.discard.slice(0, 3)).toEqual(['Border Village', 'Nomads', 'Silver']);
  });

  it('can gain a Trail, which may then be played', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Trail'] });
    game.alice.setHand(['Festival', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Festival');
    await game.playAllTreasures();
    await game.buy('Border Village');
    await game.chooseCard('Trail');
    await game.chooseEffect('Trail');

    // Played in the Buy phase: it draws the Silver, which can't be played after a buy
    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.inPlay).toContain('Trail');
    expect(game.alice.hand).toEqual(['Silver']);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.discard).toEqual(['Border Village']);
  });

  it('compares Potion costs: a $4P card is not cheaper than Border Village, but a Potion is', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Golem', 'Familiar'] });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Border Village');

    const gain = game.expectDecision('chooseCard', 'Alice');
    const offered = gain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Potion');
    expect(offered).not.toContain('Golem');
    expect(offered).not.toContain('Familiar');
  });

  it('gains nothing when cost reductions make it cost $0', async () => {
    const game = createGame({ kingdom: ['Border Village', 'Quarry', 'Village'] });
    game.alice.setHand(['Quarry', 'Quarry', 'Quarry', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Quarry');
    await game.playTreasure('Quarry');
    await game.playTreasure('Quarry');
    // It is an Action: $6 - 3 x $2
    expect(game.costOf('Border Village').coins).toBe(0);
    await game.buy('Border Village');

    // Nothing costs less than $0: no prompt, and the only Buy is used up
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard[0]).toBe('Border Village');
    expect(game.alice.discard).toHaveLength(6);
  });

  it('compares the reduced costs when Quarry and Highway are stacked', async () => {
    const game = createGame({ kingdom: ['Border Village', 'Quarry', 'Highway', 'Laboratory'] });
    game.alice.setHand(['Highway', 'Quarry', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Copper', ...coppers(10)]);

    await game.start();
    await game.playAction('Highway');
    await game.playTreasure('Quarry');
    await game.playAllTreasures();
    // $6 - $1 - $2 = $3
    await game.buy('Border Village');

    // Actions cost $3 less, other cards $1 less
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toEqual(expect.arrayContaining(['Laboratory', 'Highway', 'Smithy', 'Silver', 'Estate']));
    expect(offered(gain)).not.toContain('Gold');
    expect(offered(gain)).not.toContain('Duchy');
    expect(offered(gain)).not.toContain('Quarry');
    expect(offered(gain)).not.toContain('Border Village');
    await game.chooseCard('Laboratory');

    expect(game.alice.discard.slice(0, 2)).toEqual(['Border Village', 'Laboratory']);
  });

  it("compares with Peddler's Buy-phase cost, but not with $P costs", async () => {
    const game = createGame({ kingdom: ['Border Village', 'Peddler', 'Familiar', 'Village', 'Festival'] });
    game.alice.setHand(['Village', 'Festival', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Copper', ...coppers(10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Festival');
    await game.playAllTreasures();
    await game.buy('Border Village');

    // Two Actions in play: Peddler costs $4
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toContain('Peddler');
    expect(offered(gain)).toContain('Potion');
    expect(offered(gain)).not.toContain('Familiar');
    await game.chooseCard('Peddler');

    expect(game.alice.discard.slice(0, 2)).toEqual(['Border Village', 'Peddler']);
  });

  it('can gain the last Duchy as the third empty pile; the game ends only after the turn', async () => {
    const game = createGame({ kingdom: ['Border Village', 'Festival', 'Village', 'Smithy'] });
    game.alice.setHand(['Festival', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Duchy', 1);

    await game.start();
    await game.playAction('Festival');
    await game.playAllTreasures();
    await game.buy('Border Village');
    await game.chooseCard('Duchy');

    expect(game.pileSize('Duchy')).toBe(0);
    expect(game.isFinished).toBe(false);
    game.expectDecision('buyPhase', 'Alice');
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Border Village', 'Duchy', 'Silver']));
  });
});
