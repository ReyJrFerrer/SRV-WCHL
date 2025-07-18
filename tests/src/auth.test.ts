import { describe, beforeEach, afterEach, it, expect, inject } from "vitest";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PocketIc, type Actor } from "@dfinity/pic";
import { Principal } from "@dfinity/principal";

// Define the auth canister interface types based on the Motoko code
interface Profile {
  id: Principal;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: bigint;
  updatedAt: bigint;
  isVerified: boolean;
  profilePicture: [] | [ProfileImage];
  biography: [] | [string];
  lastLogin: [] | [bigint];
  loginCount: bigint;
  isActive: boolean;
  suspendedUntil: [] | [bigint];
}

interface ProfileImage {
  imageUrl: string;
  thumbnailUrl: string;
}

type UserRole = { Client: null } | { ServiceProvider: null } | { Admin: null };

interface RoleChangeRecord {
  id: string;
  userId: Principal;
  previousRole: UserRole;
  newRole: UserRole;
  changedAt: bigint;
  reason: [] | [string];
  approvedBy: [] | [Principal];
}

interface ProfileStatistics {
  totalProfiles: bigint;
  activeProfiles: bigint;
  verifiedProfiles: bigint;
  suspendedProfiles: bigint;
  clientCount: bigint;
  serviceProviderCount: bigint;
  adminCount: bigint;
  recentRegistrations: bigint;
}

type Result<T> = { ok: T } | { err: string };

// Auth canister service interface
interface AuthService {
  createProfile: (
    name: string,
    phone: string,
    role: UserRole,
  ) => Promise<Result<Profile>>;
  getProfile: (userId: Principal) => Promise<Result<Profile>>;
  getMyProfile: () => Promise<Result<Profile>>;
  updateProfile: (
    name: [] | [string],
    email: [] | [string],
    phone: [] | [string],
  ) => Promise<Result<Profile>>;
  verifyUser: (userId: Principal) => Promise<Result<boolean>>;
  getAllServiceProviders: () => Promise<Profile[]>;
  switchRole: (
    newRole: UserRole,
    reason: [] | [string],
  ) => Promise<Result<Profile>>;
  getRoleHistory: (userId: Principal) => Promise<Result<RoleChangeRecord[]>>;
  suspendUser: (
    userId: Principal,
    durationHours: bigint,
    reason: string,
  ) => Promise<Result<boolean>>;
  reactivateUser: (userId: Principal) => Promise<Result<boolean>>;
  revokeVerification: (
    userId: Principal,
    reason: string,
  ) => Promise<Result<boolean>>;
  getProfileStatistics: () => Promise<ProfileStatistics>;
  isAccountInGoodStanding: (userId: Principal) => Promise<Result<boolean>>;
  setCanisterReferences: (
    reputation: [] | [Principal],
  ) => Promise<Result<string>>;
}

// IDL factory for the auth canister
const authIdlFactory = ({
  IDL,
}: {
  IDL: typeof import("@dfinity/candid").IDL;
}) => {
  const UserRole = IDL.Variant({
    Client: IDL.Null,
    ServiceProvider: IDL.Null,
    Admin: IDL.Null,
  });

  const ProfileImage = IDL.Record({
    imageUrl: IDL.Text,
    thumbnailUrl: IDL.Text,
  });

  const Profile = IDL.Record({
    id: IDL.Principal,
    name: IDL.Text,
    phone: IDL.Text,
    role: UserRole,
    createdAt: IDL.Int,
    updatedAt: IDL.Int,
    isVerified: IDL.Bool,
    profilePicture: IDL.Opt(ProfileImage),
    biography: IDL.Opt(IDL.Text),
    lastLogin: IDL.Opt(IDL.Int),
    loginCount: IDL.Nat,
    isActive: IDL.Bool,
    suspendedUntil: IDL.Opt(IDL.Int),
  });

  const Result = (T: any) => IDL.Variant({ ok: T, err: IDL.Text });

  const RoleChangeRecord = IDL.Record({
    id: IDL.Text,
    userId: IDL.Principal,
    previousRole: UserRole,
    newRole: UserRole,
    changedAt: IDL.Int,
    reason: IDL.Opt(IDL.Text),
    approvedBy: IDL.Opt(IDL.Principal),
  });

  const ProfileStatistics = IDL.Record({
    totalProfiles: IDL.Nat,
    activeProfiles: IDL.Nat,
    verifiedProfiles: IDL.Nat,
    suspendedProfiles: IDL.Nat,
    clientCount: IDL.Nat,
    serviceProviderCount: IDL.Nat,
    adminCount: IDL.Nat,
    recentRegistrations: IDL.Nat,
  });

  return IDL.Service({
    createProfile: IDL.Func(
      [IDL.Text, IDL.Text, UserRole],
      [Result(Profile)],
      [],
    ),
    getProfile: IDL.Func([IDL.Principal], [Result(Profile)], ["query"]),
    getMyProfile: IDL.Func([], [Result(Profile)], ["query"]),
    updateProfile: IDL.Func(
      [IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
      [Result(Profile)],
      [],
    ),
    verifyUser: IDL.Func([IDL.Principal], [Result(IDL.Bool)], []),
    getAllServiceProviders: IDL.Func([], [IDL.Vec(Profile)], ["query"]),
    switchRole: IDL.Func([UserRole, IDL.Opt(IDL.Text)], [Result(Profile)], []),
    getRoleHistory: IDL.Func(
      [IDL.Principal],
      [Result(IDL.Vec(RoleChangeRecord))],
      ["query"],
    ),
    suspendUser: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Text],
      [Result(IDL.Bool)],
      [],
    ),
    reactivateUser: IDL.Func([IDL.Principal], [Result(IDL.Bool)], []),
    revokeVerification: IDL.Func(
      [IDL.Principal, IDL.Text],
      [Result(IDL.Bool)],
      [],
    ),
    getProfileStatistics: IDL.Func([], [ProfileStatistics], ["query"]),
    isAccountInGoodStanding: IDL.Func(
      [IDL.Principal],
      [Result(IDL.Bool)],
      ["query"],
    ),
    setCanisterReferences: IDL.Func(
      [IDL.Opt(IDL.Principal)],
      [Result(IDL.Text)],
      [],
    ),
  });
};

// Define the path to the auth canister's WASM file
const AUTH_WASM_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".dfx",
  "local",
  "canisters",
  "auth",
  "auth.wasm",
);

describe("Auth Canister", () => {
  let pic: PocketIc;
  let authCanisterId: Principal;
  let authActor: Actor<AuthService>;
  let testPrincipal: Principal;
  let adminPrincipal: Principal;

  beforeEach(async () => {
    // Create a new PocketIC instance
    pic = await PocketIc.create(inject("PIC_URL"));

    // Create test principals
    testPrincipal = Principal.fromText("rdmx6-jaaaa-aaaah-qcaiq-cai");
    adminPrincipal = Principal.fromText("rrkah-fqaaa-aaaah-qcaiq-cai");

    // Setup the auth canister
    const authFixture = await pic.setupCanister<AuthService>({
      idlFactory: authIdlFactory,
      wasm: AUTH_WASM_PATH,
    });

    authActor = authFixture.actor;
    authCanisterId = authFixture.canisterId;
  });

  afterEach(async () => {
    await pic.tearDown();
  });

  describe("Profile Creation", () => {
    it("should create a new client profile successfully", async () => {
      // Setup
      const name = "John Doe";
      const phone = "+1234567890";
      const role: UserRole = { Client: null };

      // Execute
      const result = await authActor.createProfile(name, phone, role);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        const profile = result.ok;
        expect(profile.name).toBe(name);
        expect(profile.phone).toBe(phone);
        expect(profile.role).toEqual(role);
        expect(profile.isVerified).toBe(false);
        expect(profile.isActive).toBe(true);
        expect(profile.loginCount).toBe(BigInt(1));
      }
    });

    it("should create a new service provider profile successfully", async () => {
      // Setup
      const name = "Jane Smith";
      const phone = "+1987654321";
      const role: UserRole = { ServiceProvider: null };

      // Execute
      const result = await authActor.createProfile(name, phone, role);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        const profile = result.ok;
        expect(profile.name).toBe(name);
        expect(profile.phone).toBe(phone);
        expect(profile.role).toEqual(role);
        expect(profile.isVerified).toBe(false);
        expect(profile.isActive).toBe(true);
      }
    });

    it("should reject profile creation with invalid name length", async () => {
      // Setup
      const shortName = "J"; // Too short
      const phone = "+1234567890";
      const role: UserRole = { Client: null };

      // Execute
      const result = await authActor.createProfile(shortName, phone, role);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toContain("Invalid name length");
      }
    });

    it("should reject profile creation with invalid phone format", async () => {
      // Setup
      const name = "John Doe";
      const invalidPhone = "123"; // Too short
      const role: UserRole = { Client: null };

      // Execute
      const result = await authActor.createProfile(name, invalidPhone, role);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toContain("Invalid phone format");
      }
    });

    it("should reject duplicate phone numbers", async () => {
      // Setup
      const name1 = "John Doe";
      const name2 = "Jane Smith";
      const phone = "+1234567890";
      const role: UserRole = { Client: null };

      // Execute
      await authActor.createProfile(name1, phone, role);
      const result = await authActor.createProfile(name2, phone, role);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toContain("Phone number is already registered");
      }
    });

    it("should reject anonymous principal", async () => {
      // Setup
      const name = "Anonymous User";
      const phone = "+1234567890";
      const role: UserRole = { Client: null };

      // Set actor to use anonymous principal
      pic.setAuthorizedPrincipal(authCanisterId, Principal.anonymous());

      // Execute
      const result = await authActor.createProfile(name, phone, role);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toBe("Anonymous principal not allowed");
      }
    });
  });

  describe("Profile Retrieval", () => {
    beforeEach(async () => {
      // Create a test profile
      await authActor.createProfile("Test User", "+1234567890", {
        Client: null,
      });
    });

    it("should get profile by principal", async () => {
      // Setup
      const userId = authCanisterId; // Use the canister's principal for testing

      // Execute
      const result = await authActor.getProfile(userId);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        const profile = result.ok;
        expect(profile.name).toBe("Test User");
        expect(profile.phone).toBe("+1234567890");
      }
    });

    it("should get caller's own profile", async () => {
      // Execute
      const result = await authActor.getMyProfile();

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        const profile = result.ok;
        expect(profile.name).toBe("Test User");
      }
    });

    it("should return error for non-existent profile", async () => {
      // Setup
      const nonExistentUser = Principal.fromText("aaaaa-aa");

      // Execute
      const result = await authActor.getProfile(nonExistentUser);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toBe("Profile not found");
      }
    });
  });

  describe("Profile Updates", () => {
    beforeEach(async () => {
      // Create a test profile
      await authActor.createProfile("Test User", "+1234567890", {
        Client: null,
      });
    });

    it("should update profile name successfully", async () => {
      // Setup
      const newName = "Updated Name";

      // Execute
      const result = await authActor.updateProfile([newName], [], []);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        const profile = result.ok;
        expect(profile.name).toBe(newName);
        expect(profile.phone).toBe("+1234567890"); // Should remain unchanged
      }
    });

    it("should update profile phone successfully", async () => {
      // Setup
      const newPhone = "+1987654321";

      // Execute
      const result = await authActor.updateProfile([], [], [newPhone]);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        const profile = result.ok;
        expect(profile.phone).toBe(newPhone);
        expect(profile.name).toBe("Test User"); // Should remain unchanged
      }
    });

    it("should reject invalid name update", async () => {
      // Setup
      const invalidName = "A"; // Too short

      // Execute
      const result = await authActor.updateProfile([invalidName], [], []);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toContain("Invalid name length");
      }
    });

    it("should reject duplicate phone update", async () => {
      // Setup - Create another profile first
      pic.setAuthorizedPrincipal(authCanisterId, testPrincipal);
      await authActor.createProfile("Another User", "+1111111111", {
        Client: null,
      });

      // Switch back to original user
      pic.setAuthorizedPrincipal(authCanisterId, authCanisterId);

      // Try to update to the other user's phone
      const result = await authActor.updateProfile([], [], ["+1111111111"]);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toContain("Phone number is already registered");
      }
    });
  });

  describe("User Verification", () => {
    beforeEach(async () => {
      // Create a test profile
      await authActor.createProfile("Test User", "+1234567890", {
        Client: null,
      });
    });

    it("should verify user successfully", async () => {
      // Setup
      const userId = authCanisterId;

      // Execute
      const result = await authActor.verifyUser(userId);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok).toBe(true);
      }

      // Verify the profile is updated
      const profileResult = await authActor.getProfile(userId);
      if ("ok" in profileResult) {
        expect(profileResult.ok.isVerified).toBe(true);
      }
    });

    it("should reject verification of already verified user", async () => {
      // Setup
      const userId = authCanisterId;
      await authActor.verifyUser(userId); // Verify first time

      // Execute
      const result = await authActor.verifyUser(userId);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toBe("User is already verified");
      }
    });

    it("should reject verification of non-existent user", async () => {
      // Setup
      const nonExistentUser = Principal.fromText("aaaaa-aa");

      // Execute
      const result = await authActor.verifyUser(nonExistentUser);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toBe("Profile not found");
      }
    });
  });

  describe("Service Provider Discovery", () => {
    beforeEach(async () => {
      // Create test profiles with different roles
      await authActor.createProfile("Client User", "+1234567890", {
        Client: null,
      });

      pic.setAuthorizedPrincipal(authCanisterId, testPrincipal);
      await authActor.createProfile("Provider User", "+1987654321", {
        ServiceProvider: null,
      });
    });

    it("should get all service providers", async () => {
      // Execute
      const providers = await authActor.getAllServiceProviders();

      // Assert
      expect(providers).toHaveLength(1);
      expect(providers[0].name).toBe("Provider User");
      expect(providers[0].role).toEqual({ ServiceProvider: null });
    });
  });

  describe("Role Switching", () => {
    beforeEach(async () => {
      // Create a client profile
      await authActor.createProfile("Test User", "+1234567890", {
        Client: null,
      });
    });

    it("should switch from client to service provider", async () => {
      // Setup
      const newRole: UserRole = { ServiceProvider: null };
      const reason = "Starting my business";

      // Execute
      const result = await authActor.switchRole(newRole, [reason]);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        const profile = result.ok;
        expect(profile.role).toEqual(newRole);
      }
    });

    it("should switch from service provider to client", async () => {
      // Setup - First switch to service provider
      await authActor.switchRole({ ServiceProvider: null }, [
        "Starting business",
      ]);

      const newRole: UserRole = { Client: null };
      const reason = "Stopping business";

      // Execute
      const result = await authActor.switchRole(newRole, [reason]);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        const profile = result.ok;
        expect(profile.role).toEqual(newRole);
      }
    });

    it("should track role change history", async () => {
      // Setup
      const newRole: UserRole = { ServiceProvider: null };
      await authActor.switchRole(newRole, ["Starting business"]);

      // Execute
      const historyResult = await authActor.getRoleHistory(authCanisterId);

      // Assert
      expect(historyResult).toHaveProperty("ok");
      if ("ok" in historyResult) {
        const history = historyResult.ok;
        expect(history).toHaveLength(1);
        expect(history[0].previousRole).toEqual({ Client: null });
        expect(history[0].newRole).toEqual({ ServiceProvider: null });
        expect(history[0].reason).toEqual(["Starting business"]);
      }
    });

    it("should reject invalid role transitions", async () => {
      // Setup - Try to switch to admin without being admin
      const invalidRole: UserRole = { Admin: null };

      // Execute
      const result = await authActor.switchRole(invalidRole, []);

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toContain("Invalid role transition");
      }
    });
  });

  describe("Admin Functions", () => {
    beforeEach(async () => {
      // Create admin and regular user profiles
      await authActor.createProfile("Admin User", "+1111111111", {
        Admin: null,
      });

      pic.setAuthorizedPrincipal(authCanisterId, testPrincipal);
      await authActor.createProfile("Regular User", "+1234567890", {
        Client: null,
      });
    });

    it("should suspend user as admin", async () => {
      // Setup - Switch to admin
      pic.setAuthorizedPrincipal(authCanisterId, authCanisterId);

      const durationHours = BigInt(24);
      const reason = "Policy violation";

      // Execute
      const result = await authActor.suspendUser(
        testPrincipal,
        durationHours,
        reason,
      );

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok).toBe(true);
      }

      // Verify user is suspended
      const standingResult =
        await authActor.isAccountInGoodStanding(testPrincipal);
      if ("ok" in standingResult) {
        expect(standingResult.ok).toBe(false);
      }
    });

    it("should reactivate suspended user as admin", async () => {
      // Setup - Suspend user first
      pic.setAuthorizedPrincipal(authCanisterId, authCanisterId);
      await authActor.suspendUser(testPrincipal, BigInt(24), "Test suspension");

      // Execute
      const result = await authActor.reactivateUser(testPrincipal);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok).toBe(true);
      }

      // Verify user is reactivated
      const standingResult =
        await authActor.isAccountInGoodStanding(testPrincipal);
      if ("ok" in standingResult) {
        expect(standingResult.ok).toBe(true);
      }
    });

    it("should revoke verification as admin", async () => {
      // Setup - Verify user first
      pic.setAuthorizedPrincipal(authCanisterId, testPrincipal);
      await authActor.verifyUser(testPrincipal);

      // Switch to admin
      pic.setAuthorizedPrincipal(authCanisterId, authCanisterId);

      const reason = "Fraudulent documents";

      // Execute
      const result = await authActor.revokeVerification(testPrincipal, reason);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok).toBe(true);
      }

      // Verify user is no longer verified
      const profileResult = await authActor.getProfile(testPrincipal);
      if ("ok" in profileResult) {
        expect(profileResult.ok.isVerified).toBe(false);
      }
    });

    it("should reject admin actions from non-admin user", async () => {
      // Setup - Use regular user
      pic.setAuthorizedPrincipal(authCanisterId, testPrincipal);

      // Execute
      const result = await authActor.suspendUser(
        authCanisterId,
        BigInt(24),
        "Test",
      );

      // Assert
      expect(result).toHaveProperty("err");
      if ("err" in result) {
        expect(result.err).toBe("Only admins can suspend users");
      }
    });
  });

  describe("Profile Statistics", () => {
    beforeEach(async () => {
      // Create multiple profiles for testing statistics
      await authActor.createProfile("Client 1", "+1111111111", {
        Client: null,
      });

      pic.setAuthorizedPrincipal(authCanisterId, testPrincipal);
      await authActor.createProfile("Provider 1", "+1222222222", {
        ServiceProvider: null,
      });

      pic.setAuthorizedPrincipal(authCanisterId, adminPrincipal);
      await authActor.createProfile("Admin 1", "+1333333333", { Admin: null });
    });

    it("should get comprehensive profile statistics", async () => {
      // Execute
      const stats = await authActor.getProfileStatistics();

      // Assert
      expect(stats.totalProfiles).toBeGreaterThanOrEqual(BigInt(3));
      expect(stats.clientCount).toBeGreaterThanOrEqual(BigInt(1));
      expect(stats.serviceProviderCount).toBeGreaterThanOrEqual(BigInt(1));
      expect(stats.adminCount).toBeGreaterThanOrEqual(BigInt(1));
      expect(stats.activeProfiles).toBeGreaterThanOrEqual(BigInt(3));
    });
  });

  describe("Account Status", () => {
    beforeEach(async () => {
      // Create a test profile
      await authActor.createProfile("Test User", "+1234567890", {
        Client: null,
      });
    });

    it("should confirm account is in good standing", async () => {
      // Execute
      const result = await authActor.isAccountInGoodStanding(authCanisterId);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok).toBe(true);
      }
    });

    it("should detect suspended account as not in good standing", async () => {
      // Setup - Create admin and suspend user
      pic.setAuthorizedPrincipal(authCanisterId, adminPrincipal);
      await authActor.createProfile("Admin", "+1999999999", { Admin: null });
      await authActor.suspendUser(
        authCanisterId,
        BigInt(24),
        "Test suspension",
      );

      // Execute
      const result = await authActor.isAccountInGoodStanding(authCanisterId);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok).toBe(false);
      }
    });
  });

  describe("Canister References", () => {
    it("should set canister references successfully", async () => {
      // Setup
      const reputationCanister = Principal.fromText(
        "rdmx6-jaaaa-aaaah-qcaiq-cai",
      );

      // Execute
      const result = await authActor.setCanisterReferences([
        reputationCanister,
      ]);

      // Assert
      expect(result).toHaveProperty("ok");
      if ("ok" in result) {
        expect(result.ok).toBe("Canister references set successfully");
      }
    });
  });
});
