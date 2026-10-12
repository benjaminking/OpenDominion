import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

/** Replaces the Ruins pile with the given cards, listed top card first. */
const setRuinsPile = (game: GameHarness, names: string[]): void => {
  game.setPileSize('Ruins', 0);
  for (const name of [...names].reverse()) {
    const card = game.alice.createCard(name, CardLocation.PILE);
    card.markAsSupplyCard();
    game.state.piles.returnCardToPile(card);
  }
};

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

describe('BandOfMisfits', () => {
  it('offers only non-empty Supply piles of Action cards costing less than itself', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Village', 'Smithy', 'Market', 'Hermit', 'Urchin'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Village', 0);

    await game.start();
    await game.playAction('Band Of Misfits');

    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.noneAllowed).toBe(false);
    const offered = offeredNames(game);
    expect(offered).toContain('Smithy');
    expect(offered).toContain('Hermit');
    expect(offered).not.toContain('Village');
    expect(offered).not.toContain('Market');
    expect(offered).not.toContain('Band Of Misfits');
    // Madman and Mercenary are not in the Supply
    expect(offered).not.toContain('Madman');
    expect(offered).not.toContain('Mercenary');
  });

  it('does nothing when no Supply pile has a cheaper Action card', async () => {
    const game = createGame({
      kingdom: [
        'Band Of Misfits',
        'Market',
        'Festival',
        'Laboratory',
        'Council Room',
        'Gardens',
        'Village',
        'Altar',
        'Count',
        'Graverobber',
      ],
    });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Village', 0);

    await game.start();
    await game.playAction('Band Of Misfits');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    expect(game.alice.coins).toBe(0);
  });

  it('can only play the top card of the Ruins pile', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Cultist'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    setRuinsPile(game, ['Abandoned Mine', 'Ruined Village']);

    await game.start();
    await game.playAction('Band Of Misfits');

    const offered = offeredNames(game);
    expect(offered).toContain('Abandoned Mine');
    expect(offered).not.toContain('Ruined Village');
    await game.chooseCard('Abandoned Mine', CardLocation.PILE);

    expect(game.alice.coins).toBe(1);
    expect(game.pileSize('Ruins')).toBe(2);
    expect(game.state.piles.getTopCardOfPile('Ruins')?.getName()).toBe('Abandoned Mine');
  });

  it('plays a Mining Village that stays in the Supply, so it cannot be trashed for +$2', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Mining Village'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    const miningVillages = game.pileSize('Mining Village');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Mining Village', CardLocation.PILE);
    await game.chooseOption('Yes');

    expect(game.trash).toEqual([]);
    expect(game.pileSize('Mining Village')).toBe(miningVillages);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
  });

  it('plays a Death Cart that stays in the Supply, may trash an Action from hand for +$5, and gains no Ruins', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Death Cart', 'Village'] });
    game.alice.setHand(['Band Of Misfits', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const deathCarts = game.pileSize('Death Cart');
    const ruins = game.pileSize('Ruins');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Death Cart', CardLocation.PILE);
    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.noneAllowed).toBe(true);
    await game.chooseCard('Village', CardLocation.HAND);

    expect(game.alice.coins).toBe(5);
    expect(game.trash).toEqual(['Village']);
    expect(game.pileSize('Death Cart')).toBe(deathCarts);
    expect(game.pileSize('Ruins')).toBe(ruins);
    expect(game.alice.discard).toEqual([]);
  });

  it('plays a Hermit that stays in the Supply, so it is not exchanged for a Madman', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Hermit'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);
    const hermits = game.pileSize('Hermit');
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Hermit', CardLocation.PILE);
    // Hermit: nothing to trash, then gain a card costing up to $3
    await game.chooseCard('Silver', CardLocation.PILE);
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pileSize('Hermit')).toBe(hermits);
    expect(game.pileSize('Madman')).toBe(madmen);
    expect(game.alice.discard).not.toContain('Madman');
    // The Hermit was never in play, so it has lost track of itself
    expect(game.alice.log).toContain('Alice has lost track of Hermit');
  });

  it('plays a Duration card whose effect happens at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Fishing Village'] });
    game.alice.setHand(['Band Of Misfits', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Estate', 'Estate', 'Estate', 'Estate', ...COPPERS]);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);
    const fishingVillages = game.pileSize('Fishing Village');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Fishing Village', CardLocation.PILE);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    await game.endTurn();

    // Fishing Village's next-turn effect: +1 Action and +$1
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
    expect(game.pileSize('Fishing Village')).toBe(fishingVillages);
  });

  it('stays in play until the Clean-up of the turn a Duration card it played finishes', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Fishing Village'] });
    game.alice.setHand(['Band Of Misfits', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Estate', 'Estate', 'Estate', 'Estate', ...COPPERS]);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Fishing Village', CardLocation.PILE);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Band Of Misfits');
  });

  it('plays an Attack from the Supply that hits the other players', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Militia'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    const militias = game.pileSize('Militia');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Militia', CardLocation.PILE);
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.alice.coins).toBe(2);
    expect(game.pileSize('Militia')).toBe(militias);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
  });

  it('lets other players react to an Attack it plays from the Supply', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Militia', 'Beggar'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Beggar', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Copper', 'Copper']);

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Militia', CardLocation.PILE);

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Beggar']);
    await game.chooseEffect('Beggar');
    await game.chooseCards(['Estate']);

    expect(game.bob.hand).toEqual(['Estate', 'Copper', 'Copper']);
    expect(game.bob.deck[0]).toBe('Silver');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Beggar', 'Silver', 'Estate']));
  });

  it('chooses a card to play each time when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Throne Room', 'Village', 'Smithy'] });
    game.alice.setHand(['Throne Room', 'Band Of Misfits', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    const villages = game.pileSize('Village');
    const smithies = game.pileSize('Smithy');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Band Of Misfits');
    await game.chooseCard('Village', CardLocation.PILE);
    await game.chooseCard('Smithy', CardLocation.PILE);

    // Village: +1 Card, +2 Actions; Smithy: +3 Cards
    expect(game.alice.hand).toHaveLength(3 + 1 + 3);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Band Of Misfits']);
    expect(game.pileSize('Village')).toBe(villages);
    expect(game.pileSize('Smithy')).toBe(smithies);
  });

  it('plays a Throne Room from the Supply that plays a card from hand twice', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Throne Room', 'Village'] });
    game.alice.setHand(['Band Of Misfits', 'Village', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    const throneRooms = game.pileSize('Throne Room');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Throne Room', CardLocation.PILE);
    await game.chooseCard('Village', CardLocation.HAND);

    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits', 'Village']);
    expect(game.pileSize('Throne Room')).toBe(throneRooms);
  });
});

describe('BandOfMisfits: interactions', () => {
  it('cannot play an Action whose cost has a Potion, since that is not less than $5', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Familiar', 'Golem', 'Smithy'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Band Of Misfits');

    const offered = offeredNames(game);
    expect(offered).toContain('Smithy');
    expect(offered).not.toContain('Familiar');
    expect(offered).not.toContain('Golem');
  });

  it('compares current costs: with Bridge it costs $4, so it can play Smithy ($3) but not Market ($4)', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Bridge', 'Village', 'Smithy', 'Market'] });
    game.alice.setHand(['Village', 'Bridge', 'Band Of Misfits', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Band Of Misfits');

    expect(game.pending.prompt).toBe('Choose a non-Command Action card from the Supply costing less than $4 to play');
    const offered = offeredNames(game);
    expect(offered).toContain('Smithy');
    expect(offered).toContain('Bridge');
    expect(offered).not.toContain('Market');
    expect(offered).not.toContain('Band Of Misfits');
    await game.chooseCard('Smithy', CardLocation.PILE);

    // Copper x2, +1 Card (Village), +3 Cards (Smithy)
    expect(game.alice.hand).toHaveLength(6);
  });

  it('plays Sir Martin from the top of the Knights pile; when it trashes a Knight, Sir Martin stays in the Supply', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Knights'] });
    game.setPile('Knights', ['Sir Martin', 'Dame Anna', 'Sir Bailey']);
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Dame Josephine', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Band Of Misfits');
    // Bob reveals Dame Josephine and Copper; Dame Josephine is the only card costing $3-$6, so it is trashed
    await game.chooseCard('Sir Martin', CardLocation.PILE);

    expect(game.trash).toEqual(['Dame Josephine']);
    expect(game.pileCards('Knights')).toEqual(['Sir Martin', 'Dame Anna', 'Sir Bailey']);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
  });

  it("plays an Attack from the Supply that another player's Lighthouse blocks", async () => {
    const game = createGame({ players: ['Bob', 'Alice'], kingdom: ['Band Of Misfits', 'Militia', 'Lighthouse'] });
    game.bob.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Estate', 'Estate', 'Copper', 'Copper', 'Silver', ...COPPERS]);
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Militia', CardLocation.PILE);

    // Bob is not asked to discard
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.coins).toBe(2);
    expect(game.bob.hand).toHaveLength(5);
  });

  it('plays an Urchin that stays in the Supply, so a later Attack cannot trash it for a Mercenary', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Urchin', 'Militia'] });
    game.alice.setHand(['Band Of Misfits', 'Militia', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    const urchins = game.pileSize('Urchin');
    const mercenaries = game.pileSize('Mercenary');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Urchin', CardLocation.PILE);
    // Urchin: +1 Card, +1 Action; Bob discards down to 4
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate']);

    await game.playAction('Militia');
    // No offer to trash the Urchin: Bob just discards down to 3
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate']);

    expect(game.pileSize('Urchin')).toBe(urchins);
    expect(game.pileSize('Mercenary')).toBe(mercenaries);
    expect(game.trash).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits', 'Militia']);
  });

  it('plays a Treasure Map that stays in the Supply: the Treasure Map from hand is trashed, but no Golds are gained', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Treasure Map'] });
    game.alice.setHand(['Band Of Misfits', 'Treasure Map', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const treasureMaps = game.pileSize('Treasure Map');
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Treasure Map', CardLocation.PILE);
    await game.chooseCard('Treasure Map', CardLocation.HAND);

    expect(game.trash).toEqual(['Treasure Map']);
    expect(game.pileSize('Treasure Map')).toBe(treasureMaps);
    expect(game.pileSize('Gold')).toBe(golds);
    expect(game.alice.deck).not.toContain('Gold');
  });

  it('stays in play for a Duration it played even after that card is bought from the Supply', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Fishing Village'] });
    game.alice.setHand(['Band Of Misfits', 'Gold', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Estate', 'Estate', 'Estate', 'Estate', ...COPPERS]);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Fishing Village', CardLocation.PILE);
    await game.playAllTreasures();
    // The top Fishing Village is the one Band of Misfits played
    await game.buy('Fishing Village');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Fishing Village');
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    await game.endTurn();

    // Fishing Village's next-turn effect still happens: +1 Action and +$1
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Band Of Misfits');
  });

  it('played by Throne Room as a Duration and a non-Duration: stays in play for the Duration', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Throne Room', 'Fishing Village', 'Smithy'] });
    game.alice.setHand(['Throne Room', 'Band Of Misfits', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Band Of Misfits');
    await game.chooseCard('Fishing Village', CardLocation.PILE);
    await game.chooseCard('Smithy', CardLocation.PILE);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
    await game.endTurn();

    expect(game.alice.inPlay).toContain('Band Of Misfits');
    await game.endTurn();

    // Fishing Village's next-turn effect: +1 Action and +$1
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(1);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('played by Coronet in the Buy phase, can play a Peddler made cheaper by the Action cards in play', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Peddler'] });
    game.alice.setHand(['Coronet', 'Band Of Misfits', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', ...COPPERS]);
    const peddlers = game.pileSize('Peddler');

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Band Of Misfits');

    // Coronet and Band of Misfits are Actions in play during the Buy phase, so Peddler costs $8 - $4 = $4
    expect(game.costOf('Peddler').coins).toBe(4);
    expect(offeredNames(game)).toContain('Peddler');
    await game.chooseCard('Peddler', CardLocation.PILE);
    await game.chooseCard('Peddler', CardLocation.PILE);
    // Coronet's Treasure option
    await game.chooseNone();

    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', 'Silver']);
    expect(game.pileSize('Peddler')).toBe(peddlers);
    expect(game.alice.inPlay).toEqual(['Coronet', 'Band Of Misfits']);
  });

  it("plays a Lighthouse from the Supply that protects against another player's Attack until the next turn", async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Lighthouse', 'Militia'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Lighthouse', CardLocation.PILE);
    expect(game.alice.coins).toBe(1);
    await game.endTurn();

    await game.playAction('Militia');
    // Alice is not asked to discard
    game.expectDecision('treasurePhase', 'Bob');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    await game.endTurn();

    // Lighthouse's +$1 at the start of the next turn
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(1);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('plays a Haven from the Supply: the set-aside card comes back next turn', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Haven'] });
    game.alice.setHand(['Band Of Misfits', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Haven', CardLocation.PILE);
    await game.chooseCard('Gold');
    expect(game.alice.setAside).toEqual(['Gold']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.setAside).toEqual([]);
  });

  it('plays an Island that stays in the Supply: only the card from hand goes onto the Island mat', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Island'] });
    game.alice.setHand(['Band Of Misfits', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const islands = game.pileSize('Island');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Island', CardLocation.PILE);
    await game.chooseCard('Estate');

    expect(game.alice.islandMat).toEqual(['Estate']);
    expect(game.pileSize('Island')).toBe(islands);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
  });

  it('the card it plays from the Supply counts as an Action played this turn (Conspirator)', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Conspirator', 'Village'] });
    game.alice.setHand(['Village', 'Band Of Misfits', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Conspirator', CardLocation.PILE);

    // Village, Band of Misfits and Conspirator: 3 Actions played, so +1 Card and +1 Action
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toHaveLength(3 + 1 + 1);
  });

  // User ruling: Band of Misfits stays in play for as long as the card it played would have
  it('stays in play when the Throne Room it played from the Supply plays a Duration twice', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Throne Room', 'Fishing Village'] });
    game.alice.setHand(['Band Of Misfits', 'Fishing Village', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(COPPERS);
    const throneRooms = game.pileSize('Throne Room');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Throne Room', CardLocation.PILE);
    await game.chooseCard('Fishing Village', CardLocation.HAND);
    expect(game.pileSize('Throne Room')).toBe(throneRooms);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Band Of Misfits', 'Fishing Village']);
    await game.endTurn();
    // Both of Fishing Village's plays resolve at the start of Alice's next turn
    expect(game.alice.actions).toBe(3);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits', 'Fishing Village']);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Band Of Misfits', 'Fishing Village']));
  });

  // User ruling: a card played from the Supply that gains a copy of itself gains the copy being played
  it('gains the Rats being played when it plays Rats from the Supply', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Rats'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const playedRats = game.state.piles.getTopCardOfPile('Rats')!;
    const rats = game.pileSize('Rats');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Rats', CardLocation.PILE);
    await game.chooseCard('Copper');

    expect(game.pileSize('Rats')).toBe(rats - 1);
    expect(game.alice.cards(CardLocation.DISCARD)).toContain(playedRats);
    expect(game.trash).toEqual(['Copper']);
  });

  it('with four Highways in play costs $1: can play $0 Actions, including ones floored at $0, but not a $1 one', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Highway', 'Death Cart', 'Smithy', 'Market'] });
    setRuinsPile(game, ['Abandoned Mine', 'Survivors']);
    game.alice.setHand(['Highway', 'Highway', 'Highway', 'Highway', 'Band Of Misfits']);
    game.alice.setDeck(COPPERS);

    await game.start();
    for (let i = 0; i < 4; i++) {
      await game.playAction('Highway');
    }
    await game.playAction('Band Of Misfits');

    expect(game.pending.prompt).toBe('Choose a non-Command Action card from the Supply costing less than $1 to play');
    const offered = offeredNames(game);
    // Smithy ($4) and Village ($3) cost $0 this turn; Market ($5) costs $1
    expect(offered).toContain('Abandoned Mine');
    expect(offered).toContain('Smithy');
    expect(offered).toContain('Village');
    expect(offered).not.toContain('Market');
    await game.chooseCard('Abandoned Mine', CardLocation.PILE);
    expect(game.alice.coins).toBe(1);
    expect(game.pileCards('Ruins')).toEqual(['Abandoned Mine', 'Survivors']);
  });

  it('with five Highways in play costs $0, so nothing costs less, not even a $0 Ruins', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Highway', 'Death Cart'] });
    setRuinsPile(game, ['Abandoned Mine', 'Survivors']);
    game.alice.setHand(['Highway', 'Highway', 'Highway', 'Highway', 'Highway', 'Band Of Misfits']);
    game.alice.setDeck(COPPERS);

    await game.start();
    for (let i = 0; i < 5; i++) {
      await game.playAction('Highway');
    }
    expect(game.costOf('Band Of Misfits').coins).toBe(0);
    await game.playAction('Band Of Misfits');

    // No choice to make: the turn moves on
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.coins).toBe(0);
    expect(game.alice.inPlay).toContain('Band Of Misfits');
  });

  it('plays an Action-Victory card (Mill) from the Supply, leaving it there', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Mill'] });
    game.alice.setHand(['Band Of Misfits', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...COPPERS]);
    const mills = game.pileSize('Mill');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Mill', CardLocation.PILE);
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(2);
    expect(game.pileSize('Mill')).toBe(mills);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
  });

  it('plays an Action-Reaction card (Beggar) from the Supply, gaining 3 Coppers to hand', async () => {
    const game = createGame({ kingdom: ['Band Of Misfits', 'Beggar'] });
    game.alice.setHand(['Band Of Misfits', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    const beggars = game.pileSize('Beggar');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Beggar', CardLocation.PILE);

    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    expect(game.pileSize('Beggar')).toBe(beggars);
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
  });
});
