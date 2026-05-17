import { TextBasedGameRunner } from './TextBasedGameRunner';

const textBasedGameRunner: TextBasedGameRunner = new TextBasedGameRunner();
textBasedGameRunner.runGame().catch((err: unknown) => {
  console.log(err);
});
