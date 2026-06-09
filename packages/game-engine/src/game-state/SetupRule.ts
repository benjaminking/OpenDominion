import { SharedGameState } from './SharedGameState';

export abstract class SetupRule {
  public abstract applySetupRules(sharedGameState: SharedGameState): void;
}
