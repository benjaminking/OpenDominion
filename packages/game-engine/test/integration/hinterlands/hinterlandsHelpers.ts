import { GameHarness, PendingDecision } from '../gameHarness';

export const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

/** Names of the cards offered by a decision, without duplicates. */
export const offered = (decision: PendingDecision): string[] => [
  ...new Set(decision.cardChoices.map((choice) => choice.card.name)),
];

/** The final score of a player once the game has ended. */
export const finalScore = (game: GameHarness, playerName: string): number => {
  const result = game.gameResult?.playerResults.find((playerResult) => playerResult.playerName === playerName);
  if (result === undefined) {
    throw new Error(`No final result for ${playerName}`);
  }
  return result.scoreReport.total;
};
