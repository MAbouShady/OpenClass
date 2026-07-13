import type { User, UserWithCredentials } from "@/modules/auth/domain/user";
import type {
  CreateUserInput,
  UpdateProfileInput,
  UserRepository,
} from "@/modules/auth/domain/user-repository";

export class FakeUserRepository implements UserRepository {
  private users: UserWithCredentials[];
  private nextId = 1;

  constructor(seed: UserWithCredentials[] = []) {
    this.users = seed;
  }

  async findByEmail(email: string): Promise<UserWithCredentials | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findByPhone(phone: string): Promise<UserWithCredentials | null> {
    return (this.users as (UserWithCredentials & { phone?: string })[]).find((u) => u.phone === phone) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async create(input: CreateUserInput): Promise<UserWithCredentials> {
    const email = input.email ?? null;
    const user: UserWithCredentials = {
      id: `user-${this.nextId++}`,
      bio: null,
      photoUrl: null,
      coverUrl: null,
      accentColor: null,
      paymentDetails: null,
      ...input,
      email,
    };
    this.users.push(user);
    return user;
  }

  async findOrCreateByPhone(phone: string, name: string): Promise<User> {
    const existing = (this.users as (UserWithCredentials & { phone?: string })[]).find((u) => u.phone === phone);
    if (existing) return existing;
    const email = `phone-${phone.replace(/\D/g, "")}@no-email.internal`;
    const user: UserWithCredentials = {
      id: `user-${this.nextId++}`,
      name,
      phone,
      email,
      passwordHash: null,
      role: "STUDENT",
      locale: "ar",
      bio: null,
      photoUrl: null,
      coverUrl: null,
      accentColor: null,
      paymentDetails: null,
    } as UserWithCredentials & { phone: string };
    this.users.push(user);
    return user;
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<User> {
    const index = this.users.findIndex((user) => user.id === id);
    const existing = this.users[index];
    if (index === -1 || !existing) throw new Error("not found");
    const updated = { ...existing, ...input };
    this.users[index] = updated;
    return updated;
  }
}
