import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Catacombs', () => {
  it('when trashed by your own Altar, gains a cheaper card before Altar gains its card', async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Altar'] });
    game.alice.setHand(['Altar', 'Catacombs', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Altar');
    await game.chooseCard('Catacombs');

    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.prompt).toBe('Gain a card costing less than $5');
    expect(game.pending.noneAllowed).toBe(false);
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Silver');
    expect(offered).not.toContain('Duchy');
    expect(offered).not.toContain('Catacombs');
    await game.chooseCard('Silver', CardLocation.PILE);

    expect(game.pending.prompt).toBe('Gain a card costing up to $5');
    await game.chooseCard('Duchy', CardLocation.PILE);

    expect(game.trash).toEqual(['Catacombs']);
    expect(game.alice.discard).toEqual(['Silver', 'Duchy']);
  });

  it("when trashed by another player's Knight, lets its owner gain a cheaper card", async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Catacombs', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Martin');

    game.expectDecision('chooseCard', 'Bob');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).not.toContain('Duchy');
    await game.chooseCard('Silver', CardLocation.PILE);

    expect(game.trash).toEqual(['Catacombs']);
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Silver', 'Copper']));
    expect(game.bob.discard).toHaveLength(2);
    expect(game.currentPlayerName).toBe('Alice');
  });
});

describe('Catacombs: interactions', () => {
  it('when Lurker trashes it from the Supply, you gain a cheaper card', async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Lurker'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const catacombs = game.pileSize('Catacombs');

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption('Trash an Action card from the Supply');
    await game.chooseCard('Catacombs', CardLocation.PILE);

    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.prompt).toBe('Gain a card costing less than $5');
    await game.chooseCard('Silver', CardLocation.PILE);

    expect(game.trash).toEqual(['Catacombs']);
    expect(game.pileSize('Catacombs')).toBe(catacombs - 1);
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('when trashed with Highway in play, gains a card costing less than its reduced cost of $4', async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Highway', 'Junk Dealer', 'Smithy'] });
    game.alice.setHand(['Highway', 'Junk Dealer', 'Catacombs', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Junk Dealer');
    await game.chooseCard('Catacombs');

    expect(game.pending.prompt).toBe('Gain a card costing less than $4');
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    // Smithy costs $3 and Silver $2 this turn; Duchy costs $4
    expect(offered).toContain('Smithy');
    expect(offered).toContain('Silver');
    expect(offered).not.toContain('Duchy');
    expect(offered).not.toContain('Catacombs');
    await game.chooseCard('Smithy', CardLocation.PILE);

    expect(game.alice.discard).toEqual(['Smithy']);
  });

  it('discarding the 3 cards lets a discarded Tunnel be revealed to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Tunnel'] });
    game.alice.setHand(['Catacombs', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', 'Estate', 'Estate', 'Silver', 'Silver', 'Silver', ...COPPERS]);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Catacombs');
    await game.chooseOption('Discard them and +3 Cards');

    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(game.pending.optionalEffects.map((effect) => effect.effectName)).toEqual(['Tunnel']);
    await game.chooseEffect('Tunnel');

    expect(game.pileSize('Gold')).toBe(golds - 1);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Tunnel', 'Estate', 'Estate', 'Gold']));
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Silver', 'Silver']);
  });

  it('only looks at the top 3 cards: other players do not see them when they are put into hand', async () => {
    const game = createGame({ kingdom: ['Catacombs'] });
    game.alice.setHand(['Catacombs', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Province', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Catacombs');
    await game.chooseOption('Put them into your hand');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold', 'Province', 'Silver']);
    // "Look at the top 3 cards of your deck" (Dark Ages rulebook): they are not revealed
    expect(game.bob.log.filter((line) => /Gold|Province|Silver/.test(line))).toEqual([]);
  });

  it('when Death Cart trashes it from hand, gains a cheaper card and Death Cart gives +$5', async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Death Cart'] });
    game.alice.setHand(['Death Cart', 'Catacombs', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Death Cart');
    await game.chooseCard('Catacombs', CardLocation.HAND);
    expect(game.pending.prompt).toBe('Gain a card costing less than $5');
    await game.chooseCard('Death Cart', CardLocation.PILE);
    // Gaining the Death Cart gains 2 Ruins
    expect(game.alice.coins).toBe(5);
    expect(game.trash).toEqual(['Catacombs']);
    expect(game.alice.cards(CardLocation.DISCARD).filter((card) => card.getPileName() === 'Ruins')).toHaveLength(2);
    expect(game.alice.discard).toContain('Death Cart');
  });

  it("when trashed by another player's Knight, uses that player's Highway: gains a card costing less than $4", async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Knights', 'Highway'] });
    game.alice.setHand(['Highway', 'Sir Martin', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Catacombs', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Sir Martin');

    game.expectDecision('chooseCard', 'Bob');
    expect(game.pending.prompt).toBe('Gain a card costing less than $4');
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    // Smithy costs $3 and Silver $2 during Alice's turn; Duchy costs $4
    expect(offered).toContain('Smithy');
    expect(offered).toContain('Silver');
    expect(offered).not.toContain('Duchy');
    await game.chooseCard('Smithy', CardLocation.PILE);

    expect(game.trash).toEqual(['Catacombs']);
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Smithy', 'Copper']));
  });

  it('when trashed, cannot gain a card with a Potion in its cost, but can gain a Potion', async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Junk Dealer', 'Familiar', 'Apothecary'] });
    game.alice.setHand(['Junk Dealer', 'Catacombs', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Catacombs');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).not.toContain('Familiar');
    expect(offered).not.toContain('Apothecary');
    expect(offered).toContain('Potion');
  });

  it('when trashed with Quarry in play (Coronet plays Altar in the Buy phase), costs $3 and gains a cheaper Action, not a Silver', async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Altar', 'Quarry', 'Smithy'] });
    game.alice.setHand(['Quarry', 'Coronet', 'Altar', 'Catacombs', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Quarry');
    await game.playTreasure('Coronet');
    await game.chooseCard('Altar');
    await game.chooseCard('Catacombs');

    expect(game.pending.prompt).toBe('Gain a card costing less than $3');
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    // Quarry: Smithy costs $2 and Village $1; Silver still costs $3
    expect(offered).toContain('Smithy');
    expect(offered).toContain('Village');
    expect(offered).not.toContain('Silver');
    await game.chooseCard('Smithy', CardLocation.PILE);
    // Then Altar gains its card
    expect(game.pending.prompt).toBe('Gain a card costing up to $5');
  });

  it('when trashed while costing $0 (five Highways), gains nothing, since no card costs less than $0', async () => {
    const game = createGame({ kingdom: ['Catacombs', 'Highway', 'Junk Dealer'] });
    game.alice.setHand(['Highway', 'Highway', 'Highway', 'Highway', 'Highway', 'Junk Dealer', 'Catacombs']);
    game.alice.setDeck(COPPERS);

    await game.start();
    for (let i = 0; i < 5; i++) {
      await game.playAction('Highway');
    }
    expect(game.costOf('Catacombs').coins).toBe(0);
    await game.playAction('Junk Dealer');
    await game.chooseCard('Catacombs');

    expect(game.trash).toEqual(['Catacombs']);
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual([]);
  });

  it('with an empty deck and discard pile looks at nothing; choosing to discard them and draw does nothing', async () => {
    const game = createGame({ kingdom: ['Catacombs'] });
    game.alice.setHand(['Catacombs', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Catacombs');
    game.expectDecision('chooseOneOption', 'Alice');
    await game.chooseOption('Discard them and +3 Cards');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper']);
    expect(game.alice.discard).toEqual([]);
  });

  it('with 1 card in the deck and 1 in the discard pile, shuffles to look at both and can put them into hand', async () => {
    const game = createGame({ kingdom: ['Catacombs'] });
    game.alice.setHand(['Catacombs', 'Copper']);
    game.alice.setDeck(['Gold']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Catacombs');
    await game.chooseOption('Put them into your hand');

    expect(game.alice.hand).toEqual(['Copper', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });
});
