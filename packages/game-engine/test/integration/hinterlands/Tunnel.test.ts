import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { finalScore } from './hinterlandsHelpers';

const KINGDOM = ['Tunnel', 'Oasis', 'Militia', 'Cartographer', 'Jack Of All Trades', 'Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Tunnel', () => {
  it('may be revealed to gain a Gold when discarded to Oasis', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Oasis', 'Tunnel', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Oasis');
    await game.chooseCard('Tunnel');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Tunnel']);
    expect(reaction.mandatoryEffects).toEqual([]);
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard).toEqual(['Tunnel', 'Gold']);
    expect(game.pileSize('Gold')).toBe(golds - 1);
  });

  it('does not have to be revealed', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Oasis', 'Tunnel', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Oasis');
    await game.chooseCard('Tunnel');
    await game.declineEffects();

    expect(game.alice.discard).toEqual(['Tunnel']);
    expect(game.pileSize('Gold')).toBe(golds);
  });

  it("gains a Gold when discarded on another player's turn, e.g. to Militia", async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Tunnel', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Tunnel', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Tunnel');

    expect([...game.bob.discard].sort()).toEqual(['Estate', 'Gold', 'Tunnel']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });

  it('gains a Gold when Cartographer discards it from the deck', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Cartographer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Tunnel', 'Silver', 'Silver', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Cartographer');
    await game.chooseCards(['Tunnel']);
    await game.chooseEffect('Tunnel');

    // Tunnel is in the discard pile when it reacts, so the Gold goes on top of it
    expect(game.alice.discard).toEqual(['Tunnel', 'Gold']);
    expect(game.alice.deck.slice(0, 4)).toEqual(['Silver', 'Silver', 'Silver', 'Copper']);
  });

  it('gains a Gold when Jack of All Trades discards it from the top of the deck', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Jack Of All Trades', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Jack Of All Trades');
    await game.chooseOption('Discard it');
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard).toEqual(['Silver', 'Tunnel', 'Gold']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
  });

  it('is not offered when discarded in Clean-up', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Tunnel', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAllTreasures();
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Tunnel');
    expect(game.pileSize('Gold')).toBe(golds);
  });

  it('gains a Gold for each Tunnel discarded at once', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Tunnel', 'Tunnel', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Tunnel', 'Tunnel']);
    await game.chooseEffect('Tunnel');

    const second = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(second.optionalEffects.map((effect) => effect.effectName)).toEqual(['Tunnel']);
    await game.chooseEffect('Tunnel');

    expect(game.bob.discard.filter((name) => name === 'Gold')).toHaveLength(2);
  });

  it('gains a Gold when Vassal discards it, and Vassal has no Action to play', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Vassal'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', ...COPPERS]);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseEffect('Tunnel');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Tunnel', 'Gold']);
    expect(game.alice.coins).toBe(2);
  });

  it('gains a Gold when discarded to Margrave', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Margrave'] });
    game.alice.setHand(['Margrave', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Tunnel', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Margrave');
    await game.chooseCards(['Tunnel', 'Estate', 'Copper']);
    await game.chooseEffect('Tunnel');

    game.expectDecision('treasurePhase', 'Alice');
    expect([...game.bob.discard].sort()).toEqual(['Copper', 'Estate', 'Gold', 'Tunnel']);
    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Gold']);
  });

  it('scores 2 VP for every Tunnel, wherever it is, at the end of the game', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Silver', 'Tunnel', 'Copper']);
    game.alice.setDeck(['Tunnel', ...COPPERS]);
    game.alice.setDiscard(['Tunnel']);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playTreasure('Gold');
    await game.playTreasure('Gold');
    await game.playTreasure('Silver');
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    // Province 6 VP + three Tunnels
    expect(finalScore(game, 'Alice')).toBe(12);
  });

  it("can't be revealed once a discarded Trail's +1 Card has shuffled it into the deck, so gains no Gold", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Trail'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Trail', 'Tunnel', 'Copper', 'Copper', 'Silver']);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Trail', 'Tunnel']);
    // Trail first: its +1 Card shuffles the discarded Tunnel into the deck and draws it
    await game.chooseEffect('Trail');

    // Tunnel is still offered, but has lost track of itself
    const decision = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(decision.optionalEffects.map((effect) => effect.effectName)).toEqual(['Tunnel']);
    await game.chooseEffect('Tunnel');

    expect(game.bob.log).toContain('Bob has lost track of Tunnel');
    expect(game.pileSize('Gold')).toBe(golds);
    expect(game.bob.hand).toContain('Tunnel');
    game.expectDecision('treasurePhase', 'Alice');
  });
});
