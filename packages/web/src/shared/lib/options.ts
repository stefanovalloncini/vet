export interface Option<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

/**
 * Prepend an "all" sentinel option (`value: ""`) to a list of options.
 *
 * Use for filter dropdowns where the empty value means "no filter applied".
 */
export function withAllOption<T extends string>(
  items: ReadonlyArray<Option<T>>,
  allLabel: string
): ReadonlyArray<Option<T | "">> {
  return [{ value: "" as const, label: allLabel }, ...items];
}
