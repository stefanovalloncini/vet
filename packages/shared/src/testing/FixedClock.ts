import type { Clock } from "../domain/ports/Clock.js";

export class FixedClock implements Clock {
  constructor(private value: Date) {}

  now(): Date {
    return new Date(this.value);
  }

  set(value: Date): void {
    this.value = value;
  }
}
