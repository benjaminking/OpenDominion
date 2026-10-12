import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Armory', () => {
  it('gains onto an empty deck, so the gained card is drawn in Clean-up before reshuffling', async () => {
    const game = createGame({ kingdom: ['Armory'] });
    game.alice.setHand(['Armory', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDiscard(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Armory');
    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Silver', CardLocation.PILE);

    expect(game.alice.deck).toEqual(['Silver']);
    expect(game.alice.discard).not.toContain('Silver');
    await game.endTurn();

    expect(game.alice.hand).toContain('Silver');
    expect(game.alice.hand).toHaveLength(5);
  });

  it('can gain a $5 card while Bridge makes it cost $4', async () => {
    const game = createGame({ kingdom: ['Armory', 'Bridge', 'Village', 'Market'] });
    game.alice.setHand(['Village', 'Bridge', 'Armory', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Armory');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Market');
    expect(offered).toContain('Duchy');
    expect(offered).not.toContain('Gold');
    await game.chooseCard('Market', CardLocation.PILE);

    expect(game.alice.deck[0]).toBe('Market');
  });
});

describe('Armory: interactions', () => {
  it('gaining a Death Cart puts it onto the deck and its 2 Ruins into the discard pile', async () => {
    const game = createGame({ kingdom: ['Armory', 'Death Cart'] });
    game.alice.setHand(['Armory', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);
    const ruins = game.pileSize('Ruins');

    await game.start();
    await game.playAction('Armory');
    await game.chooseCard('Death Cart', CardLocation.PILE);

    expect(game.alice.deck.slice(0, 2)).toEqual(['Death Cart', 'Estate']);
    expect(game.pileSize('Ruins')).toBe(ruins - 2);
    const discard = game.alice.cards(CardLocation.DISCARD);
    expect(discard).toHaveLength(2);
    expect(discard.every((card) => card.getPileName() === 'Ruins')).toBe(true);
  });

  it('played twice by Throne Room, the second gained card ends up on top', async () => {
    const game = createGame({ kingdom: ['Armory', 'Throne Room', 'Smithy'] });
    game.alice.setHand(['Throne Room', 'Armory', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Armory');
    await game.chooseCard('Smithy', CardLocation.PILE);
    await game.chooseCard('Silver', CardLocation.PILE);

    expect(game.alice.deck.slice(0, 3)).toEqual(['Silver', 'Smithy', 'Estate']);
    expect(game.alice.discard).toEqual([]);
  });

  it('gaining a Victory card onto the deck offers Hovel', async () => {
    const game = createGame({ kingdom: ['Armory'] });
    game.alice.setHand(['Armory', 'Hovel', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Armory');
    await game.chooseCard('Estate', CardLocation.PILE);
    await game.chooseEffect('Hovel');

    expect(game.alice.deck[0]).toBe('Estate');
    expect(game.trash).toEqual(['Hovel']);
  });

  it('cannot gain a card with a Potion in its cost, but can gain a Potion onto the deck', async () => {
    const game = createGame({ kingdom: ['Armory', 'Familiar', 'Apothecary'] });
    game.alice.setHand(['Armory', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Armory');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).not.toContain('Familiar');
    expect(offered).not.toContain('Apothecary');
    expect(offered).toContain('Potion');
    await game.chooseCard('Potion', CardLocation.PILE);
    expect(game.alice.deck.slice(0, 2)).toEqual(['Potion', 'Estate']);
  });

  it('with Highway and Bridge in play, can gain a $6 card (now $4) but not a $7 one', async () => {
    const game = createGame({ kingdom: ['Armory', 'Highway', 'Bridge', "King's Court"] });
    game.alice.setHand(['Highway', 'Bridge', 'Armory', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Armory');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Gold');
    expect(offered).not.toContain("King's Court");
    expect(offered).not.toContain('Province');
    await game.chooseCard('Gold', CardLocation.PILE);
    expect(game.alice.deck[0]).toBe('Gold');
  });

  it('played by Coronet in the Buy phase can gain a Peddler, which costs $2 less per Action in play then', async () => {
    const game = createGame({ kingdom: ['Armory', 'Peddler', 'Quarry', 'Hunting Grounds'] });
    game.alice.setHand(['Coronet', 'Armory', 'Quarry', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);

    await game.start();
    // In the Action phase Peddler costs $8
    expect(game.costOf('Peddler').coins).toBe(8);
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Armory');

    // Coronet and Armory in play: Peddler costs $8 - $4 - $2 (Quarry); Hunting Grounds $6 - $2 (Quarry)
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Peddler');
    expect(offered).toContain('Hunting Grounds');
    expect(offered).not.toContain('Gold');
    expect(offered).not.toContain('Duchy');
    await game.chooseCard('Peddler', CardLocation.PILE);
    await game.chooseCard('Hunting Grounds', CardLocation.PILE);

    expect(game.alice.deck.slice(0, 3)).toEqual(['Hunting Grounds', 'Peddler', 'Estate']);
  });

  it('gaining the last card of a third Supply pile onto the deck ends the game only after the turn', async () => {
    const game = createGame({ kingdom: ['Armory'] });
    game.alice.setHand(['Armory', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Workshop', 1);

    await game.start();
    await game.playAction('Armory');
    await game.chooseCard('Workshop', CardLocation.PILE);

    expect(game.alice.deck[0]).toBe('Workshop');
    expect(game.isFinished).toBe(false);
    game.expectDecision('treasurePhase', 'Alice');
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });

  it('when Trader exchanges the gained card, the Silver goes to the discard pile, not onto the deck', async () => {
    const game = createGame({ kingdom: ['Armory', 'Trader'] });
    game.alice.setHand(['Armory', 'Trader', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);
    const smithies = game.pileSize('Smithy');

    await game.start();
    await game.playAction('Armory');
    await game.chooseCard('Smithy', CardLocation.PILE);
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Trader');

    expect(game.pileSize('Smithy')).toBe(smithies);
    expect(game.alice.deck[0]).toBe('Estate');
    expect(game.alice.discard).toEqual(['Silver']);
  });
});
