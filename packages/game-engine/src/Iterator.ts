export class ArrayIterator<T> implements Iterator<T> {
  private currentIndex = 0;

  constructor(private readonly cardArray: T[]) {}

  next(): IteratorResult<T> {
    if (this.currentIndex < this.cardArray.length) {
      return {
        done: false,
        value: this.cardArray[this.currentIndex++],
      };
    }
    return {
      done: true,
      value: undefined,
    };
  }
}
