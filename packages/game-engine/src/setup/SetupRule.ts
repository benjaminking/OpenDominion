import { SharedGameState } from '../game-state/SharedGameState';
import { GameInitializer } from './GameInitializer';

export enum SetupRuleType {
  GAME_INITIALIZATION = 'game-initialization',
  GAME_STATE = 'game-state'
}

export interface GameStateSetupRule {
  setupRuleType: SetupRuleType.GAME_STATE;
  applySetupRule(sharedGameState: SharedGameState): void;
}

export interface GameInitializationSetupRule {
  setupRuleType: SetupRuleType.GAME_INITIALIZATION;
  applySetupRule(gameInitializer: GameInitializer): void;
}

export type SetupRule = GameStateSetupRule | GameInitializationSetupRule;