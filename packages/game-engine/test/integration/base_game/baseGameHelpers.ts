import { CardLocation } from '@dominion/common';

import { GameHarness, PendingDecision, TestPlayer } from '../gameHarness';

export const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

/** Names of the cards offered by a decision. */
export const offered = (decision: PendingDecision): string[] => decision.cardChoices.map((choice) => choice.card.name);

/** The cards a player has in the reveal/look-at zone (cards taken off the deck that haven't gone anywhere yet). */
export const limbo = (player: TestPlayer): string[] =>
  player.cards(CardLocation.REVEAL_LIMBO).map((card) => card.getName());

/** The final score of a player once the game has ended. */
export const finalScore = (game: GameHarness, playerName: string): number => {
  const result = game.gameResult?.playerResults.find((playerResult) => playerResult.playerName === playerName);
  if (result === undefined) {
    throw new Error(`No final result for ${playerName}`);
  }
  return result.scoreReport.total;
};

/** Reveals Moat for the pending Attack. */
export const revealMoat = async (game: GameHarness, playerName: string): Promise<void> => {
  game.expectDecision('chooseFromMultipleEvents', playerName);
  await game.chooseEffect('Moat');
};

/** Resolves start-of-turn prompts from one card (e.g. several Duration effects) until a normal decision is pending. */
export const resolveStartOfTurnEffects = async (game: GameHarness, cardName: string): Promise<void> => {
  while (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect(cardName);
  }
};
