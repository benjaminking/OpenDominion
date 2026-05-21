import { describe, expect, it, vi } from 'vitest';

import { CardCollection } from '../src/card/CardCollection';
import { ChangeListener } from '../src/ChangeListener';

describe('ChangeListener', () => {
  describe('trigger', () => {
    it('should call the action with the provided CardCollection', () => {
      const action = vi.fn();
      const listener = new ChangeListener(action);
      const collection = CardCollection.emptyCollection();

      listener.trigger(collection);

      expect(action).toHaveBeenCalledWith(collection);
    });

    it('should call the action exactly once per trigger call', () => {
      const action = vi.fn();
      const listener = new ChangeListener(action);
      const collection = CardCollection.emptyCollection();

      listener.trigger(collection);

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should call the action on each trigger call', () => {
      const action = vi.fn();
      const listener = new ChangeListener(action);
      const collection = CardCollection.emptyCollection();

      listener.trigger(collection);
      listener.trigger(collection);
      listener.trigger(collection);

      expect(action).toHaveBeenCalledTimes(3);
    });

    it('should pass the same collection reference that was provided', () => {
      let receivedCollection: CardCollection | null = null;
      const action = (c: CardCollection) => {
        receivedCollection = c;
      };
      const listener = new ChangeListener(action);
      const collection = CardCollection.emptyCollection();

      listener.trigger(collection);

      expect(receivedCollection).toBe(collection);
    });

    it('should pass different collections on different trigger calls', () => {
      const received: CardCollection[] = [];
      const action = (c: CardCollection) => received.push(c);
      const listener = new ChangeListener(action);

      const collection1 = CardCollection.emptyCollection();
      const collection2 = CardCollection.emptyCollection();

      listener.trigger(collection1);
      listener.trigger(collection2);

      expect(received[0]).toBe(collection1);
      expect(received[1]).toBe(collection2);
    });

    it('should not call the action before trigger is invoked', () => {
      const action = vi.fn();
      new ChangeListener(action);

      expect(action).not.toHaveBeenCalled();
    });
  });
});
