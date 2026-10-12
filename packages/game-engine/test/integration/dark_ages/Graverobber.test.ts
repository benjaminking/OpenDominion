import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');
const GAIN_FROM_TRASH = 'Gain a card from the trash costing $3-$6 onto your deck';
const TRASH_ACTION = 'Trash an Action card from your hand and gain a card costing up to $3 more';

describe('Graverobber', () => {
  it('can choose to gain from an empty trash, gaining nothing', async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Village'] });
    game.alice.setHand(['Graverobber', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Graverobber');

    game.expectDecision('chooseOneOption', 'Alice');
    expect(game.pending.options).toEqual([GAIN_FROM_TRASH, TRASH_ACTION]);
    await game.chooseOption(GAIN_FROM_TRASH);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck[0]).toBe('Estate');
    expect(game.alice.hand).toEqual(['Village', 'Copper', 'Copper', 'Copper']);
    expect(game.trash).toEqual([]);
  });

  it('gains a card costing up to $3 more than the trashed Action using its reduced cost (Bridge)', async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Village', 'Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Graverobber', 'Village', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Graverobber');
    await game.chooseOption(TRASH_ACTION);
    await game.chooseCard('Village');

    // Village costs $2 this turn, so up to $5: Gold (now $5) can be gained, Province ($7) can't
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Gold');
    expect(offered).not.toContain('Province');
    await game.chooseCard('Gold', CardLocation.PILE);

    expect(game.trash).toEqual(['Village']);
    expect(game.alice.discard).toEqual(['Gold']);
  });
});

describe('Graverobber: interactions', () => {
  it('gains a card from the trash onto an empty deck, so it is drawn in Clean-up', async () => {
    const game = createGame({ kingdom: ['Graverobber'] });
    game.alice.setHand(['Graverobber', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Estate', 'Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.setTrash(['Gold', 'Copper']);

    await game.start();
    await game.playAction('Graverobber');
    await game.chooseOption(GAIN_FROM_TRASH);
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Gold']);
    await game.chooseCard('Gold', CardLocation.TRASH);

    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.deck).toEqual(['Gold']);
    await game.endTurn();

    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.hand).toHaveLength(5);
  });

  it('cannot gain a card with a Potion in its cost from the trash', async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Familiar', 'Golem'] });
    game.alice.setHand(['Graverobber', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setTrash(['Familiar', 'Golem', 'Silver']);

    await game.start();
    await game.playAction('Graverobber');
    await game.chooseOption(GAIN_FROM_TRASH);

    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Silver']);
  });

  it('gaining a Death Cart from the trash also gains 2 Ruins', async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Death Cart'] });
    game.alice.setHand(['Graverobber', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);
    game.setTrash(['Death Cart']);
    const ruins = game.pileSize('Ruins');

    await game.start();
    await game.playAction('Graverobber');
    await game.chooseOption(GAIN_FROM_TRASH);
    await game.chooseCard('Death Cart', CardLocation.TRASH);

    expect(game.alice.deck.slice(0, 2)).toEqual(['Death Cart', 'Estate']);
    expect(game.pileSize('Ruins')).toBe(ruins - 2);
    expect(game.alice.cards(CardLocation.DISCARD).filter((card) => card.getPileName() === 'Ruins')).toHaveLength(2);
  });

  it('trashing a Fortress still counts: it returns to hand and you gain a card costing up to $7', async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Fortress'] });
    game.alice.setHand(['Graverobber', 'Fortress', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Graverobber');
    await game.chooseOption(TRASH_ACTION);
    await game.chooseCard('Fortress');

    game.expectDecision('chooseCard', 'Alice');
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Gold');
    expect(offered).not.toContain('Province');
    await game.chooseCard('Gold', CardLocation.PILE);

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Fortress']);
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it("trashing a Catacombs resolves its gain of a cheaper card before Graverobber's gain", async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Catacombs'] });
    game.alice.setHand(['Graverobber', 'Catacombs', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Graverobber');
    await game.chooseOption(TRASH_ACTION);
    await game.chooseCard('Catacombs');

    expect(game.pending.prompt).toBe('Gain a card costing less than $5');
    await game.chooseCard('Silver', CardLocation.PILE);
    expect(game.pending.prompt).toBe('Gain a card costing up to $8');
    await game.chooseCard('Province', CardLocation.PILE);

    expect(game.trash).toEqual(['Catacombs']);
    expect(game.alice.discard).toEqual(['Silver', 'Province']);
  });

  it('uses current costs for cards in the trash: with Bridge, a $7 card can be gained but a $3 card cannot', async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Bridge', 'Village', "King's Court"] });
    game.alice.setHand(['Village', 'Bridge', 'Graverobber', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setTrash(["King's Court", 'Silver', 'Province']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Graverobber');
    await game.chooseOption(GAIN_FROM_TRASH);

    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(["King's Court"]);
    await game.chooseCard("King's Court", CardLocation.TRASH);
    expect(game.alice.deck[0]).toBe("King's Court");
  });

  it('trashing an Action with a Potion in its cost (Familiar, $3P) gains a card costing up to $6P', async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Familiar', 'Golem'] });
    game.alice.setHand(['Graverobber', 'Familiar', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Graverobber');
    await game.chooseOption(TRASH_ACTION);
    await game.chooseCard('Familiar');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Golem');
    expect(offered).toContain('Familiar');
    expect(offered).toContain('Gold');
    expect(offered).not.toContain('Province');
    await game.chooseCard('Golem', CardLocation.PILE);

    expect(game.trash).toEqual(['Familiar']);
    expect(game.alice.discard).toEqual(['Golem']);
  });

  it('trashing an Action without a Potion in its cost cannot gain a card with one', async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Familiar', 'Village'] });
    game.alice.setHand(['Graverobber', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Graverobber');
    await game.chooseOption(TRASH_ACTION);
    await game.chooseCard('Village');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Gold');
    expect(offered).not.toContain('Familiar');
  });

  it('can trash an Action-Victory card (Nobles, $6) and gain a Province', async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Nobles'] });
    game.alice.setHand(['Graverobber', 'Nobles', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Graverobber');
    await game.chooseOption(TRASH_ACTION);
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Nobles']);
    await game.chooseCard('Nobles');
    await game.chooseCard('Province', CardLocation.PILE);

    expect(game.trash).toEqual(['Nobles']);
    expect(game.alice.discard).toEqual(['Province']);
  });

  it("uses the trashed card's cost floored at $0: with three Highways, trashing Chapel ($0) gains up to $3, e.g. Gold", async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Highway', 'Chapel'] });
    game.alice.setHand(['Highway', 'Highway', 'Highway', 'Graverobber', 'Chapel']);
    game.alice.setDeck(COPPERS);

    await game.start();
    for (let i = 0; i < 3; i++) {
      await game.playAction('Highway');
    }
    expect(game.costOf('Chapel').coins).toBe(0);
    expect(game.costOf('Gold').coins).toBe(3);
    await game.playAction('Graverobber');
    await game.chooseOption(TRASH_ACTION);
    await game.chooseCard('Chapel');

    expect(game.pending.prompt).toBe('Gain a card costing up to $3');
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Gold');
    expect(offered).not.toContain('Province');
    await game.chooseCard('Gold', CardLocation.PILE);
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it("played twice by Coronet in the Buy phase uses Peddler's reduced cost, both in the trash and in hand", async () => {
    const game = createGame({ kingdom: ['Graverobber', 'Peddler', "King's Court"] });
    game.alice.setHand(['Coronet', 'Graverobber', 'Peddler', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);
    game.setTrash(['Peddler']);

    await game.start();
    expect(game.costOf('Peddler').coins).toBe(8);
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Graverobber');

    // First play: Coronet and Graverobber are in play, so Peddler costs $4 and can be gained from the trash
    await game.chooseOption(GAIN_FROM_TRASH);
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Peddler']);
    await game.chooseCard('Peddler', CardLocation.TRASH);
    expect(game.alice.deck.slice(0, 2)).toEqual(['Peddler', 'Estate']);

    // Second play: trashing the Peddler from hand ($4) gains a card costing up to $7
    await game.chooseOption(TRASH_ACTION);
    await game.chooseCard('Peddler');
    expect(game.pending.prompt).toBe('Gain a card costing up to $7');
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain("King's Court");
    expect(offered).not.toContain('Province');
    await game.chooseCard("King's Court", CardLocation.PILE);

    expect(game.trash).toEqual(['Peddler']);
    expect(game.alice.discard).toEqual(["King's Court"]);
  });
});
