import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import type {
  Role,
  RoleInput,
  RoleRepository,
  SerializerStampDeps,
} from "@vet/shared";
import {
  buildRoleCreateDoc,
  buildRoleSeedDoc,
  buildRoleUpdatePatch,
  parseRole,
  roleNameKey,
} from "@vet/shared";

const stampDeps: SerializerStampDeps<Timestamp, FieldValue> = {
  fromDate: (d) => Timestamp.fromDate(d),
  serverTimestamp: () => FieldValue.serverTimestamp(),
};

export class FirestoreRoleRepository implements RoleRepository {
  constructor(private readonly db: Firestore) {}

  async getById(id: string): Promise<Role | null> {
    const snap = await this.db.collection("roles").doc(id).get();
    if (!snap.exists) return null;
    return parseRole(id, snap.data());
  }

  async list(): Promise<Role[]> {
    const snap = await this.db.collection("roles").get();
    return snap.docs.map((d) => parseRole(d.id, d.data()));
  }

  async create(id: string, input: RoleInput, actor: string): Promise<Role> {
    const batch = this.db.batch();
    batch.set(this.db.collection("roleNames").doc(roleNameKey(input.name)), {
      roleId: id,
    });
    batch.set(
      this.db.collection("roles").doc(id),
      buildRoleCreateDoc({ input, actor }, stampDeps)
    );
    await batch.commit();
    const snap = await this.db.collection("roles").doc(id).get();
    return parseRole(id, snap.data());
  }

  async update(id: string, input: RoleInput, actor: string): Promise<void> {
    await this.db
      .collection("roles")
      .doc(id)
      .set(buildRoleUpdatePatch({ input, actor }, stampDeps), { merge: true });
  }

  async delete(id: string): Promise<void> {
    const snap = await this.db.collection("roles").doc(id).get();
    if (!snap.exists) return;
    const name = parseRole(id, snap.data()).name;
    const batch = this.db.batch();
    batch.delete(this.db.collection("roles").doc(id));
    batch.delete(this.db.collection("roleNames").doc(roleNameKey(name)));
    await batch.commit();
  }

  async seed(role: Role): Promise<void> {
    const batch = this.db.batch();
    batch.set(this.db.collection("roleNames").doc(roleNameKey(role.name)), {
      roleId: role.id,
    });
    batch.set(
      this.db.collection("roles").doc(role.id),
      buildRoleSeedDoc({ role }, stampDeps)
    );
    await batch.commit();
  }
}
