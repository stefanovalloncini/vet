import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
  type FieldValue,
  type Firestore,
} from "firebase/firestore";
import type {
  Role,
  RoleInput,
  RoleRepository,
  SerializerStampDeps,
} from "@vet/shared";
import {
  buildOptimisticEntity,
  buildRoleCreateDoc,
  buildRoleSeedDoc,
  buildRoleUpdatePatch,
  parseRole,
  roleNameKey,
} from "@vet/shared";

const stampDeps: SerializerStampDeps<Timestamp, FieldValue> = {
  fromDate: (d) => Timestamp.fromDate(d),
  serverTimestamp: (): FieldValue => serverTimestamp(),
};

export class FirestoreRoleRepository implements RoleRepository {
  constructor(private readonly db: Firestore) {}

  async getById(id: string): Promise<Role | null> {
    const snap = await getDoc(doc(this.db, "roles", id));
    if (!snap.exists()) return null;
    return parseRole(id, snap.data());
  }

  async list(): Promise<Role[]> {
    const snap = await getDocs(collection(this.db, "roles"));
    return snap.docs.map((d) => parseRole(d.id, d.data()));
  }

  async create(id: string, input: RoleInput, actor: string): Promise<Role> {
    const batch = writeBatch(this.db);
    batch.set(doc(this.db, "roleNames", roleNameKey(input.name)), {
      roleId: id,
    });
    batch.set(
      doc(this.db, "roles", id),
      buildRoleCreateDoc({ input, actor }, stampDeps)
    );
    await batch.commit();
    return buildOptimisticEntity({
      id,
      buildDoc: (deps) => buildRoleCreateDoc({ input, actor }, deps),
      parse: parseRole,
      now: new Date(),
    });
  }

  async update(id: string, input: RoleInput, actor: string): Promise<void> {
    const patch = buildRoleUpdatePatch({ input, actor }, stampDeps);
    await setDoc(doc(this.db, "roles", id), { ...patch }, { merge: true });
  }

  async delete(id: string): Promise<void> {
    const snap = await getDoc(doc(this.db, "roles", id));
    if (!snap.exists()) return;
    const name = parseRole(id, snap.data()).name;
    const batch = writeBatch(this.db);
    batch.delete(doc(this.db, "roles", id));
    batch.delete(doc(this.db, "roleNames", roleNameKey(name)));
    await batch.commit();
  }

  async seed(role: Role): Promise<void> {
    const batch = writeBatch(this.db);
    batch.set(doc(this.db, "roleNames", roleNameKey(role.name)), {
      roleId: role.id,
    });
    batch.set(
      doc(this.db, "roles", role.id),
      buildRoleSeedDoc({ role }, stampDeps)
    );
    await batch.commit();
  }

  async bumpCapsVer(): Promise<number> {
    throw new Error("RoleRepository.bumpCapsVer is server-only");
  }
}
