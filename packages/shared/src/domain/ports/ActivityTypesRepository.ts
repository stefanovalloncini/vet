import type { ActivityType } from "../entities/ActivityType.js";
import type { ActivityTypeInput } from "../schemas/activityType.js";

export interface ActivityTypesRepository {
  list(): Promise<ActivityType[]>;
  listActive(): Promise<ActivityType[]>;
  getById(id: string): Promise<ActivityType | null>;
  upsert(id: string, input: ActivityTypeInput): Promise<void>;
  setActive(id: string, attivo: boolean): Promise<void>;
}
