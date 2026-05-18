import type { Clock } from "../domain/ports/Clock";

export class FixedClock implements Clock {
  constructor(private value: Date) {}

  now(): Date {
    return this.value;
  }

  set(value: Date): void {
    this.value = value;
  }
}
