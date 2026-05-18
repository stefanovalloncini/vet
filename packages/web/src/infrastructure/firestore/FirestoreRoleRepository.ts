import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { Capability, Role, RoleInput, RoleRepository } from "@vet/shared";

export class FirestoreRoleRepository implements RoleRepository {
  constructor(private readonly db: Firestore) {}

  async getById(id: string): Promise<Role | null> {
    const snap = await getDoc(doc(this.db, "roles", id));
    if (!snap.exists()) return null;
    return this.fromSnap(id, snap.data());
  }

  async list(): Promise<Role[]> {
    const snap = await getDocs(collection(this.db, "roles"));
    return snap.docs.map((d) => this.fromSnap(d.id, d.data()));
  }

  async create(id: string, input: RoleInput, actor: string): Promise<void> {
    await setDoc(doc(this.db, "roles", id), {
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      capabilities: [...input.capabilities],
      locked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: actor,
      updatedBy: actor,
      schemaVersion: 1,
    });
  }

  async update(id: string, input: RoleInput, actor: string): Promise<void> {
    await setDoc(
      doc(this.db, "roles", id),
      {
        name: input.name,
        ...(input.description !== undefined ? { description: input.description } : {}),
        capabilities: [...input.capabilities],
        updatedAt: serverTimestamp(),
        updatedBy: actor,
      },
      { merge: true }
    );
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, "roles", id));
  }

  async seed(role: Role): Promise<void> {
    await setDoc(doc(this.db, "roles", role.id), {
      name: role.name,
      ...(role.description !== undefined ? { description: role.description } : {}),
      capabilities: role.capabilities,
      locked: role.locked,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      createdBy: role.createdBy,
      updatedBy: role.updatedBy,
      schemaVersion: 1,
    });
  }

  private fromSnap(id: string, data: Record<string, unknown>): Role {
    return {
      id,
      name: data.name as string,
      ...(data.description ? { description: data.description as string } : {}),
      capabilities: (data.capabilities as Capability[]) ?? [],
      locked: (data.locked as boolean) ?? false,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      createdBy: (data.createdBy as string) ?? "",
      updatedBy: (data.updatedBy as string) ?? "",
      schemaVersion: 1,
    };
  }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}
