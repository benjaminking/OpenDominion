import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { finalScore, offered } from './hinterlandsHelpers';

const KINGDOM = ['Farmland', 'Border Village', 'Smithy', 'Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Farmland', () => {
  it('when bought, trashes a card from hand and gains a non-Farmland card costing exactly $2 more', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Smithy', 'Estate', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Farmland');

    const trash = game.expectDecision('chooseCard', 'Alice');
    expect(trash.noneAllowed).toBe(false);
    expect(trash.cardChoices.map((choice) => choice.card.name)).toEqual(['Smithy', 'Estate']);
    await game.chooseCard('Smithy');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(false);
    expect([...new Set(gain.cardChoices.map((choice) => choice.card.name))].sort()).toEqual(['Border Village', 'Gold']);
    await game.chooseCard('Gold');

    expect(game.trash).toEqual(['Smithy']);
    expect(game.alice.discard.slice(0, 2)).toEqual(['Farmland', 'Gold']);
  });

  it('does nothing when bought with no cards left in hand', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Farmland');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.trash).toEqual([]);
    expect(game.alice.discard[0]).toBe('Farmland');
  });

  it('still trashes the card when nothing costs exactly $2 more', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Province', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Farmland');
    // Province is the only card left in hand, and nothing costs $10
    await game.chooseCard('Province');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.trash).toEqual(['Province']);
    expect(game.alice.discard[0]).toBe('Farmland');
    expect(game.alice.discard).not.toContain('Province');
  });

  it('lets the card it gains resolve its own on-gain ability, e.g. Border Village', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Smithy', 'Estate', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Farmland');
    await game.chooseCard('Smithy');
    await game.chooseCard('Border Village');

    // Border Village's on-gain: a card costing less than $6
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).not.toContain('Gold');
    await game.chooseCard('Village');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.trash).toEqual(['Smithy']);
    expect(game.alice.discard.slice(0, 3)).toEqual(['Farmland', 'Border Village', 'Village']);
  });

  it('uses the Buy-phase costs with Quarry: trashing Smithy ($2) gains a $4 card such as Border Village', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Quarry'] });
    game.alice.setHand(['Quarry', 'Gold', 'Gold', 'Smithy', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playAllTreasures();
    await game.buy('Farmland');
    await game.chooseCard('Smithy');

    // Actions cost $2 less: Border Village ($6) costs $4, as does Quarry (a Treasure); Smithy itself costs $2
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain).sort()).toEqual(['Border Village', 'Quarry']);
    await game.chooseCard('Border Village');
    // Border Village costs $4 too, so Silver is cheaper
    await game.chooseCard('Silver');

    expect(game.trash).toEqual(['Smithy']);
    expect(game.alice.discard.slice(0, 3)).toEqual(['Farmland', 'Border Village', 'Silver']);
  });

  it("uses Peddler's Buy-phase cost: trashing an Estate can gain a Peddler", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Peddler'] });
    game.alice.setHand(['Village', 'Village', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAllTreasures();
    await game.buy('Farmland');
    await game.chooseCard('Estate');

    // Two Actions in play: Peddler costs $4
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toEqual(expect.arrayContaining(['Peddler', 'Smithy']));
    expect(offered(gain)).not.toContain('Silver');
    await game.chooseCard('Peddler');

    expect(game.alice.discard.slice(0, 2)).toEqual(['Farmland', 'Peddler']);
  });

  it('floors the trashed card at $0: with $3 off, trashing an Estate gains a card that now costs $2', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Bridge', 'Highway', 'Laboratory'] });
    game.alice.setHand(['Village', 'Bridge', 'Highway', 'Highway', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAllTreasures();
    expect(game.costOf('Farmland').coins).toBe(3);
    await game.buy('Farmland');
    await game.chooseCard('Estate');

    // Estate costs $0 (not -$1), so the gained card costs $2 now: originally $5
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toEqual(expect.arrayContaining(['Laboratory', 'Duchy', 'Highway']));
    expect(offered(gain)).not.toContain('Smithy');
    expect(offered(gain)).not.toContain('Gold');
    await game.chooseCard('Laboratory');

    expect(game.trash).toEqual(['Estate']);
  });

  it('keeps the Potion in the cost: trashing a Scrying Pool ($2P) gains a Golem ($4P)', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Scrying Pool', 'Golem'] });
    game.alice.setHand(['Scrying Pool', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Farmland');
    await game.chooseCard('Scrying Pool');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toEqual(['Golem']);
    await game.chooseCard('Golem');

    expect(game.alice.discard.slice(0, 2)).toEqual(['Farmland', 'Golem']);
  });

  it('can gain the last Province; the game ends after the turn and every Farmland scores 2 VP', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Festival'] });
    game.alice.setHand(['Festival', 'Gold', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Farmland', ...COPPERS]);
    game.alice.setDiscard(['Farmland']);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Festival');
    await game.playTreasure('Gold');
    await game.playTreasure('Gold');
    await game.buy('Farmland');
    await game.chooseCard('Gold');
    await game.chooseCard('Province');

    expect(game.pileSize('Province')).toBe(0);
    expect(game.isFinished).toBe(false);
    game.expectDecision('buyPhase', 'Alice');
    await game.buy('Copper');

    expect(game.isFinished).toBe(true);
    // Province 6 VP, and three Farmlands (deck, discard pile, and the one just gained)
    expect(finalScore(game, 'Alice')).toBe(12);
  });
});
