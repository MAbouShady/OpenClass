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

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async create(input: CreateUserInput): Promise<UserWithCredentials> {
    const user: UserWithCredentials = { id: `user-${this.nextId++}`, bio: null, ...input };
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
