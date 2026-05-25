import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { Capability, Role, RoleInput, RoleRepository } from "@vet/shared";
import { toDate } from "./timestamps";

function nameKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

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
    const batch = writeBatch(this.db);
    batch.set(doc(this.db, "roleNames", nameKey(input.name)), { roleId: id });
    batch.set(doc(this.db, "roles", id), {
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
    await batch.commit();
  }

  async update(id: string, input: RoleInput, actor: string): Promise<void> {
    await setDoc(
      doc(this.db, "roles", id),
      {
        ...(input.description !== undefined ? { description: input.description } : {}),
        capabilities: [...input.capabilities],
        updatedAt: serverTimestamp(),
        updatedBy: actor,
      },
      { merge: true }
    );
  }

  async delete(id: string): Promise<void> {
    const snap = await getDoc(doc(this.db, "roles", id));
    if (!snap.exists()) return;
    const name = snap.data()["name"] as string | undefined;
    const batch = writeBatch(this.db);
    batch.delete(doc(this.db, "roles", id));
    if (name) batch.delete(doc(this.db, "roleNames", nameKey(name)));
    await batch.commit();
  }

  async seed(role: Role): Promise<void> {
    const batch = writeBatch(this.db);
    batch.set(doc(this.db, "roleNames", nameKey(role.name)), { roleId: role.id });
    batch.set(doc(this.db, "roles", role.id), {
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
    await batch.commit();
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
