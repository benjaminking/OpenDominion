import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

// A full kingdom with no Action costing $5, so nothing costs exactly $1 more than Rats
const KINGDOM_WITHOUT_5_COST_ACTIONS = [
  'Procession',
  'Rats',
  'Village',
  'Smithy',
  'Cellar',
  'Chapel',
  'Workshop',
  'Moneylender',
  'Gardens',
  'Militia',
];

describe('Procession', () => {
  it('plays Madman twice, drawing only for the first play, and still gains a $1 Action when it fails to trash it', async () => {
    const game = createGame({ kingdom: ['Procession', 'Hermit', 'Poor House'] });
    game.alice.setHand(['Procession', 'Madman', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Madman');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Poor House']);
    await game.chooseCard('Poor House');

    expect(game.pileSize('Madman')).toBe(madmen + 1);
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.actions).toBe(4);
    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toEqual(['Poor House']);
    expect(game.alice.inPlay).toEqual(['Procession']);
  });

  it('gains an Action costing $1 more than a Pillage that already trashed itself', async () => {
    const game = createGame({ kingdom: ['Procession', 'Pillage', 'Altar'] });
    game.alice.setHand(['Procession', 'Pillage', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Pillage');
    // Only the first play trashes Pillage, so only it gains Spoils and attacks
    await game.chooseCard('Gold');
    await game.chooseCard('Altar', CardLocation.PILE);

    expect(game.trash).toEqual(['Pillage']);
    expect(game.alice.discard).toEqual(['Spoils', 'Spoils', 'Altar']);
    // Pillage's second play and Procession have both lost track of it
    expect(game.alice.log.filter((line) => line === 'Alice has lost track of Pillage')).toHaveLength(2);
    expect(game.bob.hand).toHaveLength(5);
    expect(game.alice.inPlay).toEqual(['Procession']);
  });

  it("resolves Rats' when-trashed draw, then gains nothing when no Action costs exactly $1 more", async () => {
    const game = createGame({ kingdom: KINGDOM_WITHOUT_5_COST_ACTIONS });
    game.alice.setHand(['Procession', 'Rats', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', 'Copper', 'Gold', ...COPPERS]);
    const rats = game.pileSize('Rats');

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Rats');
    await game.chooseCard('Estate');
    await game.chooseCard('Estate');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Estate', 'Estate', 'Rats']);
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Copper', 'Gold']);
    expect(game.alice.discard).toEqual(['Rats', 'Rats']);
    expect(game.pileSize('Rats')).toBe(rats - 2);
    expect(game.alice.actions).toBe(2);
  });

  it('can play another Procession twice, which plays and upgrades two different Actions', async () => {
    const game = createGame({ kingdom: KINGDOM_WITHOUT_5_COST_ACTIONS.slice(0, 9).concat('Market') });
    const [outer] = game.alice.setHand(['Procession', 'Procession', 'Village', 'Smithy', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction(outer);
    await game.chooseCard('Procession');
    // The inner Procession's first play: Village twice, trash it, gain a $4 Action
    await game.chooseCard('Village');
    await game.chooseCard('Smithy', CardLocation.PILE);
    // Its second play: Smithy twice, trash it, gain a $5 Action
    await game.chooseCard('Smithy', CardLocation.HAND);
    await game.chooseCard('Market', CardLocation.PILE);
    // Finally the outer Procession trashes the inner one ($4) and gains a $5 Action
    await game.chooseCard('Market', CardLocation.PILE);

    expect(game.trash).toEqual(['Village', 'Smithy', 'Procession']);
    expect(game.alice.discard).toEqual(['Smithy', 'Market', 'Market']);
    expect(game.alice.inPlay).toEqual(['Procession']);
    expect(game.alice.hand).toHaveLength(9);
    expect(game.alice.actions).toBe(4);
  });

  it('plays Fortress twice; Fortress returns to hand when trashed, and an Action costing exactly $5 is still gained', async () => {
    const game = createGame({ kingdom: [...KINGDOM_WITHOUT_5_COST_ACTIONS.slice(0, 8), 'Fortress', 'Market'] });
    game.alice.setHand(['Procession', 'Fortress', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Fortress');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain an Action card costing exactly $5');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Market']);
    await game.chooseCard('Market');

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Gold', 'Fortress']);
    expect(game.alice.discard).toEqual(['Market']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.inPlay).toEqual(['Procession']);
  });

  it('plays Mystic twice, naming a card each time, then upgrades it to an Action costing $6', async () => {
    const game = createGame({ kingdom: ['Procession', 'Mystic', 'Artisan'] });
    game.alice.setHand(['Procession', 'Mystic', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Mystic');
    await game.chooseCard('Gold');
    // The second play reveals Silver, which was not named
    await game.chooseCard('Gold');
    await game.chooseCard('Artisan');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(2);
    expect(game.trash).toEqual(['Mystic']);
    expect(game.alice.discard).toEqual(['Artisan']);
  });

  it('plays Band of Misfits twice as two different Supply cards, then trashes it and gains an Action costing $6', async () => {
    const game = createGame({ kingdom: ['Procession', 'Band Of Misfits', 'Village', 'Smithy', 'Artisan'] });
    game.alice.setHand(['Procession', 'Band Of Misfits', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...COPPERS]);
    const villages = game.pileSize('Village');

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Band Of Misfits');
    await game.chooseCard('Village', CardLocation.PILE);
    await game.chooseCard('Smithy', CardLocation.PILE);

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Artisan']);
    await game.chooseCard('Artisan');

    expect(game.trash).toEqual(['Band Of Misfits']);
    expect(game.alice.discard).toEqual(['Artisan']);
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.actions).toBe(2);
    expect(game.pileSize('Village')).toBe(villages);
    expect(game.alice.inPlay).toEqual(['Procession']);
  });

  it('gains nothing when the only Action pile costing exactly $1 more is empty', async () => {
    const game = createGame({ kingdom: [...KINGDOM_WITHOUT_5_COST_ACTIONS.slice(0, 9), 'Market'] });
    game.alice.setHand(['Procession', 'Smithy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Market', 0);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Smithy');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Smithy']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.hand).toHaveLength(9);
  });

  it('compares current costs, so with Bridge in play a $3 Smithy upgrades to a $5 Action that costs $4', async () => {
    const game = createGame({ kingdom: [...KINGDOM_WITHOUT_5_COST_ACTIONS.slice(0, 8), 'Bridge', 'Market'] });
    game.alice.setHand(['Village', 'Bridge', 'Procession', 'Smithy', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Procession');
    await game.chooseCard('Smithy');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain an Action card costing exactly $4');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Market']);
    await game.chooseCard('Market');

    expect(game.trash).toEqual(['Smithy']);
    expect(game.alice.discard).toEqual(['Market']);
  });

  it('keeps the Potion in the cost: a University ($2P) upgrades to a $3P Action, not a $3 one', async () => {
    const game = createGame({ kingdom: ['Procession', 'University', 'Familiar', 'Village'] });
    game.alice.setHand(['Procession', 'University', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('University');
    await game.chooseNone();
    await game.chooseNone();

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain an Action card costing exactly $3P');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Familiar']);
    await game.chooseCard('Familiar');

    expect(game.trash).toEqual(['University']);
    expect(game.alice.discard).toEqual(['Familiar']);
    expect(game.alice.actions).toBe(4);
  });

  it('can play a Necropolis (a non-Supply Action-Shelter) twice and upgrade it to an Action costing $2', async () => {
    const game = createGame({ kingdom: KINGDOM_WITHOUT_5_COST_ACTIONS });
    game.alice.setHand(['Procession', 'Necropolis', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Necropolis');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Cellar', 'Chapel']);
    await game.chooseCard('Chapel');

    expect(game.trash).toEqual(['Necropolis']);
    expect(game.alice.discard).toEqual(['Chapel']);
    expect(game.alice.actions).toBe(4);
  });

  it('cannot trash an Island that moved itself to the Island mat, but still gains an Action costing $1 more', async () => {
    const game = createGame({ kingdom: [...KINGDOM_WITHOUT_5_COST_ACTIONS.slice(0, 8), 'Island', 'Market'] });
    game.alice.setHand(['Procession', 'Island', 'Estate', 'Duchy', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Island');
    await game.chooseCard('Estate');
    // The second play only puts a card from hand onto the mat
    await game.chooseCard('Duchy');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain an Action card costing exactly $5');
    await game.chooseCard('Market');

    expect(game.alice.log).toContain('Alice has lost track of Island');
    expect(game.trash).toEqual([]);
    expect(game.alice.islandMat).toEqual(['Island', 'Estate', 'Duchy']);
    expect(game.alice.discard).toEqual(['Market']);
    expect(game.alice.inPlay).toEqual(['Procession']);
  });

  it('plays a Mining Village that trashes itself on the first play: no +$2 the second time, and still gains a $5 Action', async () => {
    const game = createGame({ kingdom: [...KINGDOM_WITHOUT_5_COST_ACTIONS.slice(0, 8), 'Mining Village', 'Market'] });
    game.alice.setHand(['Procession', 'Mining Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Mining Village');
    await game.chooseOption('Yes');
    // Second play: it is already in the trash, so it can't be trashed again for +$2
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('Yes');
    }
    await game.chooseCard('Market');

    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.discard).toEqual(['Market']);
  });

  it('trashes a Band of Misfits that played a Duration from the Supply twice; the Duration still resolves next turn', async () => {
    const game = createGame({ kingdom: ['Procession', 'Band Of Misfits', 'Fishing Village', 'Artisan'] });
    game.alice.setHand(['Procession', 'Band Of Misfits', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([...COPPERS, ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Band Of Misfits');
    await game.chooseCard('Fishing Village', CardLocation.PILE);
    await game.chooseCard('Fishing Village', CardLocation.PILE);
    await game.chooseCard('Artisan');

    expect(game.trash).toEqual(['Band Of Misfits']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.coins).toBe(2);

    await game.endTurn();
    // Procession played no Duration itself, so it is discarded
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Procession', 'Artisan']));
    await game.endTurn();

    // Both Fishing Village plays give +1 Action and +$1 at the start of Alice's next turn
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(3);
    expect(game.alice.coins).toBe(2);
  });

  it('plays Throne Room twice on two Fishing Villages, then trashes it; the Fishing Villages stay in play until they finish', async () => {
    const game = createGame({
      kingdom: [...KINGDOM_WITHOUT_5_COST_ACTIONS.slice(0, 7), 'Throne Room', 'Fishing Village', 'Market'],
    });
    game.alice.setHand(['Procession', 'Throne Room', 'Fishing Village', 'Fishing Village', 'Copper']);
    game.alice.setDeck([...COPPERS, ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Throne Room');
    await game.chooseCard('Fishing Village');
    await game.chooseCard('Fishing Village');
    await game.chooseCard('Market');

    expect(game.trash).toEqual(['Throne Room']);
    expect(game.alice.actions).toBe(8);
    expect(game.alice.coins).toBe(4);

    await game.endTurn();
    expect(game.alice.inPlay).toEqual(['Fishing Village', 'Fishing Village']);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Procession', 'Market']));
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(5);
    expect(game.alice.coins).toBe(4);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('can play Coronet (an Action-Treasure costing $0) twice, then gains an Action costing exactly $1', async () => {
    const game = createGame({ kingdom: ['Procession', 'Poor House'] });
    game.alice.setHand(['Procession', 'Coronet', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    const choice = game.expectDecision('chooseCard', 'Alice');
    expect(choice.cardChoices.map((cardChoice) => cardChoice.card.name)).toEqual(['Coronet']);
    await game.chooseCard('Coronet');
    // Each Coronet play may play a Treasure twice (there is no other Action in hand); play none
    await game.chooseNone();
    await game.chooseNone();

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain an Action card costing exactly $1');
    expect(gain.cardChoices.map((cardChoice) => cardChoice.card.name)).toEqual(['Poor House']);
    await game.chooseCard('Poor House');

    expect(game.trash).toEqual(['Coronet']);
    expect(game.alice.discard).toEqual(['Poor House']);
  });

  it('can play Mill (Action-Victory) twice and upgrade it to an Action costing exactly $5', async () => {
    const game = createGame({ kingdom: [...KINGDOM_WITHOUT_5_COST_ACTIONS.slice(0, 8), 'Mill', 'Market'] });
    game.alice.setHand(['Procession', 'Mill', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Mill');
    // Each Mill play draws a card and may discard 2 cards for +$2: only the first one does
    await game.chooseCards(['Estate', 'Estate']);
    await game.chooseCards([]);

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Market']);
    await game.chooseCard('Market');

    expect(game.trash).toEqual(['Mill']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(game.alice.discard).toEqual(['Estate', 'Estate', 'Market']);
  });

  it("plays Bridge twice and trashes it; both plays' reductions last the turn, so the gained Action costs $3 now", async () => {
    const game = createGame({ kingdom: [...KINGDOM_WITHOUT_5_COST_ACTIONS.slice(0, 8), 'Bridge', 'Market'] });
    game.alice.setHand(['Procession', 'Bridge', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Bridge');

    // Bridge ($4) costs $2 now, so the gain must cost exactly $3: Market ($5)
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain an Action card costing exactly $3');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Market']);
    await game.chooseCard('Market');

    expect(game.trash).toEqual(['Bridge']);
    expect(game.alice.discard).toEqual(['Market']);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.coins).toBe(2);
  });

  it('floors the played card at $0 before adding $1: with Bridge and Highway in play, Necropolis ($1) upgrades to an Action costing $1 now', async () => {
    const game = createGame({ kingdom: ['Procession', 'Highway', 'Bridge', 'Poor House', 'Cellar', 'Workshop'] });
    game.alice.setHand(['Village', 'Highway', 'Bridge', 'Procession', 'Necropolis']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playAction('Procession');
    await game.chooseCard('Necropolis');

    // Village and Workshop ($3) cost $1 now; Poor House ($1) and Cellar ($2) cost $0
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain an Action card costing exactly $1');
    expect(gain.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Village', 'Workshop']);
    await game.chooseCard('Workshop');

    expect(game.trash).toEqual(['Necropolis']);
    expect(game.alice.discard).toEqual(['Workshop']);
  });

  it("upgrades King's Court ($7) to a Peddler, which costs $8 outside the Buy phase", async () => {
    const game = createGame({ kingdom: ['Procession', "King's Court", 'Peddler'] });
    game.alice.setHand(['Procession', "King's Court", 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Procession');
    // Each King's Court play has no Action in hand to play
    await game.chooseCard("King's Court");

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.prompt).toBe('Gain an Action card costing exactly $8');
    expect(gain.cardChoices.map((choice) => choice.card.name)).toEqual(['Peddler']);
    await game.chooseCard('Peddler');

    expect(game.trash).toEqual(["King's Court"]);
    expect(game.alice.discard).toEqual(['Peddler']);
  });
});
