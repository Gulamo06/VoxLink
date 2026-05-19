import { User, Message, Group } from '../types.js';

/**
 * Simple in-memory store for development.
 * Replace with a real database (Supabase, PostgreSQL, etc.) for production.
 */
class Store {
  private users: Map<string, User> = new Map();
  private usersByUsername: Map<string, string> = new Map();
  private contacts: Map<string, Set<string>> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private groups: Map<string, Group> = new Map();
  private refreshTokens: Set<string> = new Set();

  // ─── Users ───
  createUser(user: User): void {
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username.toLowerCase(), user.id);
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByUsername(username: string): User | undefined {
    const id = this.usersByUsername.get(username.toLowerCase());
    if (!id) return undefined;
    return this.users.get(id);
  }

  updateUserStatus(id: string, status: User['status']): void {
    const user = this.users.get(id);
    if (user) user.status = status;
  }

  // ─── Contacts ───
  addContact(userId: string, contactId: string): void {
    if (!this.contacts.has(userId)) {
      this.contacts.set(userId, new Set());
    }
    this.contacts.get(userId)!.add(contactId);
  }

  getContacts(userId: string): User[] {
    const contactIds = this.contacts.get(userId);
    if (!contactIds) return [];
    return [...contactIds]
      .map((id) => this.users.get(id))
      .filter((u): u is User => u !== undefined);
  }

  removeContact(userId: string, contactId: string): boolean {
    return this.contacts.get(userId)?.delete(contactId) ?? false;
  }

  // ─── Messages ───
  addMessage(message: Message): void {
    if (!this.messages.has(message.chatId)) {
      this.messages.set(message.chatId, []);
    }
    this.messages.get(message.chatId)!.push(message);
  }

  getMessages(chatId: string): Message[] {
    return this.messages.get(chatId) ?? [];
  }

  // ─── Groups ───
  createGroup(group: Group): void {
    this.groups.set(group.id, group);
  }

  getGroup(id: string): Group | undefined {
    return this.groups.get(id);
  }

  getGroupsForUser(userId: string): Group[] {
    return [...this.groups.values()].filter((g) => g.memberIds.includes(userId));
  }

  addGroupMember(groupId: string, userId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;
    if (!group.memberIds.includes(userId)) {
      group.memberIds.push(userId);
    }
    return true;
  }

  // ─── Refresh Tokens ───
  storeRefreshToken(token: string): void {
    this.refreshTokens.add(token);
  }

  isValidRefreshToken(token: string): boolean {
    return this.refreshTokens.has(token);
  }

  revokeRefreshToken(token: string): void {
    this.refreshTokens.delete(token);
  }
}

export const store = new Store();
