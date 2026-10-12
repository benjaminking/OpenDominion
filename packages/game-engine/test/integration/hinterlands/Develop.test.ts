import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './hinterlandsHelpers';

const KINGDOM = ['Develop', 'Village', 'Smithy', 'Market', 'Farmland', 'Border Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Develop', () => {
  it('gains nothing when no card costs exactly $1 more or $1 less than the trashed card', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Develop', 'Copper', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Develop');
    // Copper costs $0: nothing costs -$1, and no card in this game costs $1
    await game.chooseCard('Copper');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.deck).toEqual(COPPERS);
    expect(game.alice.discard).toEqual([]);
  });

  it('gains only the card at the one cost that exists, without offering to skip it', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Develop', 'Gold', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Develop');
    // Gold costs $6: nothing costs $7, so only a $5 card can be gained
    await game.chooseCard('Gold');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(false);
    expect(gain.cardChoices.map((choice) => choice.card.cost.coins)).toEqual(gain.cardChoices.map(() => 5));
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(expect.arrayContaining(['Market', 'Duchy']));
    await game.chooseCard('Market');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.trash).toEqual(['Gold']);
    expect(game.alice.deck).toEqual(['Market', ...COPPERS]);
  });

  it('lets the gained cards resolve their own on-gain abilities, in the order gained', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Develop', 'Market', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Develop');
    await game.chooseCard('Market');

    // $6 first: Farmland, onto the deck; its on-gain trashes a card from hand and gains one costing $2 more
    const firstGain = game.expectDecision('chooseCard', 'Alice');
    expect(firstGain.noneAllowed).toBe(false);
    const offered = firstGain.cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(expect.arrayContaining(['Farmland', 'Gold', 'Border Village', 'Smithy']));
    expect(offered).not.toContain('Market');
    expect(offered).not.toContain('Silver');
    await game.chooseCard('Farmland');
    expect(game.alice.deck[0]).toBe('Farmland');

    await game.chooseCard('Estate');
    await game.chooseCard('Smithy');
    expect(game.alice.discard).toEqual(['Smithy']);

    // Then the $4 card, onto the deck on top of Farmland
    const secondGain = game.expectDecision('chooseCard', 'Alice');
    const secondOffered = secondGain.cardChoices.map((choice) => choice.card.name);
    expect(secondOffered).toContain('Smithy');
    expect(secondOffered).not.toContain('Gold');
    expect(secondOffered).not.toContain('Silver');
    await game.chooseCard('Smithy');

    expect(game.alice.deck.slice(0, 3)).toEqual(['Smithy', 'Farmland', 'Copper']);
    expect(game.trash).toEqual(['Market', 'Estate']);
  });

  it('keeps the Potion in the costs: trashing a $3P card gains a $4P card and a $2P card', async () => {
    const game = createGame({ kingdom: ['Develop', 'Familiar', 'Golem', 'Scrying Pool', 'Village'] });
    game.alice.setHand(['Develop', 'Familiar', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Develop');
    await game.chooseCard('Familiar');

    const first = game.expectDecision('chooseCard', 'Alice');
    const offered = [...new Set(first.cardChoices.map((choice) => choice.card.name))].sort();
    expect(offered).toEqual(['Golem', 'Scrying Pool']);
    await game.chooseCard('Golem');

    const second = game.expectDecision('chooseCard', 'Alice');
    expect([...new Set(second.cardChoices.map((choice) => choice.card.name))]).toEqual(['Scrying Pool']);
    await game.chooseCard('Scrying Pool');

    expect(game.alice.deck.slice(0, 2)).toEqual(['Scrying Pool', 'Golem']);
    expect(game.trash).toEqual(['Familiar']);
  });

  it('uses reduced costs floored at $0: trashing a $0 Estate (Bridge and Highway) gains only a $1 card', async () => {
    const game = createGame({ kingdom: ['Develop', 'Bridge', 'Highway', 'Village', 'Smithy'] });
    game.alice.setHand(['Village', 'Bridge', 'Highway', 'Develop', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Highway');
    await game.playAction('Develop');
    expect(game.costOf('Estate').coins).toBe(0);
    await game.chooseCard('Estate');

    // $2 cheaper: $1 cards (originally $3) qualify; nothing can cost $1 less than $0
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(false);
    expect(offered(gain)).toEqual(expect.arrayContaining(['Silver', 'Village']));
    for (const name of ['Copper', 'Curse', 'Estate', 'Smithy', 'Bridge']) {
      expect(offered(gain)).not.toContain(name);
    }
    await game.chooseCard('Silver');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.trash).toEqual(['Estate']);
  });

  it('can gain the last Province, still gains the other card, and the game ends only after the turn', async () => {
    const game = createGame({ kingdom: ['Develop', "King's Court", 'Village'] });
    game.alice.setHand(['Develop', "King's Court", 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Develop');
    // King's Court costs $7: $8 and $6
    await game.chooseCard("King's Court");
    await game.chooseCard('Province');
    expect(game.pileSize('Province')).toBe(0);
    await game.chooseCard('Gold');

    expect(game.isFinished).toBe(false);
    expect(game.alice.deck.slice(0, 2)).toEqual(['Gold', 'Province']);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });

  it('plays a Berserker it gains onto the deck, since Develop is an Action in play, before the second gain', async () => {
    const game = createGame({ kingdom: ['Develop', 'Berserker', 'Smithy', 'Village'] });
    game.alice.setHand(['Develop', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Develop');
    await game.chooseCard('Smithy');
    // $5 first: Berserker, onto the deck, from where it is played
    await game.chooseCard('Berserker');
    expect(game.alice.inPlay).toEqual(['Develop', 'Berserker']);
    await game.chooseCard('Silver');
    await game.chooseCards(['Estate', 'Estate']);

    // Then the $3 card, onto the deck
    const second = game.expectDecision('chooseCard', 'Alice');
    expect(offered(second)).toContain('Village');
    expect(offered(second)).not.toContain('Berserker');
    await game.chooseCard('Village');

    expect(game.alice.deck).toEqual(['Village', ...COPPERS]);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
  });
});
