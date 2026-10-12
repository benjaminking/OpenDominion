import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

const isRuins = (game: ReturnType<typeof createGame>, name: string): boolean =>
  game.alice.cards(CardLocation.DISCARD).some((card) => card.getName() === name && card.getPileName() === 'Ruins');

describe('DeathCart', () => {
  it('gains 2 Ruins when bought', async () => {
    const game = createGame({ kingdom: ['Death Cart'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);
    const ruins = game.pileSize('Ruins');

    await game.start();
    await game.playAllTreasures();
    await game.buy('Death Cart');

    expect(game.pileSize('Ruins')).toBe(ruins - 2);
    const discard = game.alice.cards(CardLocation.DISCARD);
    expect(discard.filter((card) => card.getPileName() === 'Ruins')).toHaveLength(2);
    expect(game.alice.discard).toContain('Death Cart');
  });

  it('gains 2 Ruins when gained without buying it', async () => {
    const game = createGame({ kingdom: ['Death Cart', 'Workshop'] });
    game.alice.setHand(['Workshop', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    const ruins = game.pileSize('Ruins');

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Death Cart', CardLocation.PILE);

    expect(game.pileSize('Ruins')).toBe(ruins - 2);
    expect(game.alice.cards(CardLocation.DISCARD).filter((card) => card.getPileName() === 'Ruins')).toHaveLength(2);
  });

  it('gains only the last Ruins when just one is left', async () => {
    const game = createGame({ kingdom: ['Death Cart'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Ruins', 1);
    const lastRuins = game.state.piles.getTopCardOfPile('Ruins')!.getName();

    await game.start();
    await game.playAllTreasures();
    await game.buy('Death Cart');

    expect(game.pileSize('Ruins')).toBe(0);
    expect(isRuins(game, lastRuins)).toBe(true);
    expect(game.alice.cards(CardLocation.DISCARD).filter((card) => card.getPileName() === 'Ruins')).toHaveLength(1);
  });

  it('is still gained, with no Ruins, when the Ruins pile is empty', async () => {
    const game = createGame({ kingdom: ['Death Cart'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Ruins', 0);
    const deathCarts = game.pileSize('Death Cart');

    await game.start();
    await game.playAllTreasures();
    await game.buy('Death Cart');

    expect(game.pileSize('Death Cart')).toBe(deathCarts - 1);
    expect(game.alice.discard.filter((name) => name === 'Death Cart')).toHaveLength(1);
    expect(game.alice.cards(CardLocation.DISCARD).filter((card) => card.getPileName() === 'Ruins')).toHaveLength(0);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('played twice by Throne Room: trashes itself the first time, then can only trash an Action from hand', async () => {
    const game = createGame({ kingdom: ['Death Cart', 'Throne Room', 'Village'] });
    game.alice.setHand(['Throne Room', 'Death Cart', 'Village', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Death Cart');

    expect(game.pending.cardChoices.map((choice) => `${choice.card.name}@${choice.card.location}`).sort()).toEqual([
      `Death Cart@${CardLocation.IN_PLAY}`,
      `Village@${CardLocation.HAND}`,
    ]);
    await game.chooseCard('Death Cart', CardLocation.IN_PLAY);
    expect(game.alice.coins).toBe(5);

    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Village']);
    await game.chooseCard('Village', CardLocation.HAND);

    expect(game.alice.coins).toBe(10);
    expect(game.trash).toEqual(['Death Cart', 'Village']);
    expect(game.alice.inPlay).toEqual(['Throne Room']);
  });
});

describe('DeathCart: interactions', () => {
  it('ends the game when its 2 Ruins empty the Ruins pile as the third empty Supply pile', async () => {
    const game = createGame({ kingdom: ['Death Cart'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Ruins', 2);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Death Cart');

    expect(game.pileSize('Ruins')).toBe(0);
    expect(game.alice.cards(CardLocation.DISCARD).filter((card) => card.getPileName() === 'Ruins')).toHaveLength(2);
    expect(game.isFinished).toBe(true);
    expect(game.gameResult).toBeDefined();
  });

  it('trashing a Cultist from hand gives its +3 Cards as well as +$5', async () => {
    const game = createGame({ kingdom: ['Death Cart', 'Cultist'] });
    game.alice.setHand(['Death Cart', 'Cultist', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Death Cart');
    await game.chooseCard('Cultist', CardLocation.HAND);

    expect(game.trash).toEqual(['Cultist']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Silver', 'Silver']);
    expect(game.alice.coins).toBe(5);
  });

  it("played three times by King's Court: trashes itself, then an Action from hand, then has nothing left to trash", async () => {
    const game = createGame({ kingdom: ['Death Cart', "King's Court", 'Village'] });
    game.alice.setHand(["King's Court", 'Death Cart', 'Village', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Death Cart');
    await game.chooseCard('Death Cart', CardLocation.IN_PLAY);
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toEqual(['Village']);
    await game.chooseCard('Village', CardLocation.HAND);

    // Third play: nothing to trash, so no +$5
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.coins).toBe(10);
    expect(game.trash).toEqual(['Death Cart', 'Village']);
    expect(game.alice.inPlay).toEqual(["King's Court"]);
  });

  it("gains 2 Ruins for a player who gains it on another player's turn (Swindler)", async () => {
    const game = createGame({ kingdom: ['Death Cart', 'Swindler', 'Smithy'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Smithy', ...COPPERS]);
    const ruins = game.pileSize('Ruins');

    await game.start();
    await game.playAction('Swindler');
    // Bob's Smithy ($4) is trashed; Alice picks a $4 card for him to gain
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Death Cart', CardLocation.PILE);

    expect(game.trash).toEqual(['Smithy']);
    expect(game.pileSize('Ruins')).toBe(ruins - 2);
    const bobDiscard = game.bob.cards(CardLocation.DISCARD);
    expect(bobDiscard.map((card) => card.getName())).toContain('Death Cart');
    expect(bobDiscard.filter((card) => card.getPileName() === 'Ruins')).toHaveLength(2);
    expect(game.alice.discard).toEqual([]);
    expect(game.currentPlayerName).toBe('Alice');
  });

  it('still gains 2 Ruins after Watchtower trashes the gained Death Cart first', async () => {
    const game = createGame({ kingdom: ['Death Cart', 'Watchtower'] });
    game.alice.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const ruins = game.pileSize('Ruins');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Death Cart');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Watchtower']);
    expect(game.pending.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Death Cart']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    // Watchtower is offered again for each Ruins; keep them
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }

    expect(game.trash).toEqual(['Death Cart']);
    expect(game.pileSize('Ruins')).toBe(ruins - 2);
    expect(game.alice.cards(CardLocation.DISCARD).filter((card) => card.getPileName() === 'Ruins')).toHaveLength(2);
  });

  it('still gains 2 Ruins after Trader exchanges the gained Death Cart for a Silver', async () => {
    const game = createGame({ kingdom: ['Death Cart', 'Trader'] });
    game.alice.setHand(['Trader', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const ruins = game.pileSize('Ruins');
    const deathCarts = game.pileSize('Death Cart');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Death Cart');
    await game.chooseEffect('Trader');
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }

    expect(game.pileSize('Death Cart')).toBe(deathCarts);
    expect(game.pileSize('Ruins')).toBe(ruins - 2);
    const discard = game.alice.cards(CardLocation.DISCARD);
    expect(discard.map((card) => card.getName())).toContain('Silver');
    expect(discard.map((card) => card.getName())).not.toContain('Death Cart');
    expect(discard.filter((card) => card.getPileName() === 'Ruins')).toHaveLength(2);
  });

  it('played twice by Procession: after it trashes itself, Procession still gains an Action costing exactly $5', async () => {
    const game = createGame({ kingdom: ['Death Cart', 'Procession', 'Village', 'Market'] });
    game.alice.setHand(['Procession', 'Death Cart', 'Village', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Death Cart');
    await game.chooseCard('Death Cart', CardLocation.IN_PLAY);
    await game.chooseCard('Village', CardLocation.HAND);

    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toContain('Market');
    await game.chooseCard('Market', CardLocation.PILE);

    expect(game.alice.coins).toBe(10);
    expect(game.trash).toEqual(['Death Cart', 'Village']);
    expect(game.alice.discard).toEqual(['Market']);
    expect(game.alice.inPlay).toEqual(['Procession']);
  });

  it('offers multi-type Action cards (Mill, Coronet, Moat) from hand but no card without the Action type', async () => {
    const game = createGame({ kingdom: ['Death Cart', 'Mill', 'Moat', 'Farm'] });
    game.alice.setHand(['Death Cart', 'Mill', 'Coronet', 'Moat', 'Farm', 'Silver', 'Estate', 'Curse']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Death Cart');

    expect(game.pending.cardChoices.map((choice) => `${choice.card.name}@${choice.card.location}`).sort()).toEqual([
      `Coronet@${CardLocation.HAND}`,
      `Death Cart@${CardLocation.IN_PLAY}`,
      `Mill@${CardLocation.HAND}`,
      `Moat@${CardLocation.HAND}`,
    ]);
    await game.chooseCard('Coronet', CardLocation.HAND);

    expect(game.alice.coins).toBe(5);
    expect(game.trash).toEqual(['Coronet']);
    expect(game.alice.inPlay).toEqual(['Death Cart']);
  });
});
