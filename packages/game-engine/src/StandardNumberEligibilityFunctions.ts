import { NumSelectedEligibilityFunction } from './NumSelectedEligibilityFunction';

class AnyNumber extends NumSelectedEligibilityFunction {
  public constructor() {
    super((_size: number) => true);
  }
}

export const anyNumber: NumSelectedEligibilityFunction = new AnyNumber();

class UpToNChecked extends NumSelectedEligibilityFunction {
  public constructor(limit: number) {
    super((size: number) => size <= limit);
  }
}

export const upToNChecked = function (limit: number): NumSelectedEligibilityFunction {
  return new UpToNChecked(limit);
};

class ExactlyNChecked extends NumSelectedEligibilityFunction {
  public constructor(limit: number) {
    super((size: number) => size === limit);
  }
}

export const exactlyNChecked = function (limit: number): NumSelectedEligibilityFunction {
  return new ExactlyNChecked(limit);
};

class Either extends NumSelectedEligibilityFunction {
  public constructor(func1: NumSelectedEligibilityFunction, func2: NumSelectedEligibilityFunction) {
    super((size: number) => func1.isAllowed(size) || func2.isAllowed(size));
  }
}

export const either = function (
  func1: NumSelectedEligibilityFunction,
  func2: NumSelectedEligibilityFunction,
): NumSelectedEligibilityFunction {
  return new Either(func1, func2);
};
