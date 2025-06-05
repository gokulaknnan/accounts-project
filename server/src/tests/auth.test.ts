
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/auth';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'test123' // In real app, this would be properly hashed
};

const validLoginInput: LoginInput = {
  username: 'testuser',
  password: 'test123'
};

const invalidUsernameInput: LoginInput = {
  username: 'nonexistent',
  password: 'test123'
};

const invalidPasswordInput: LoginInput = {
  username: 'testuser',
  password: 'wrongpassword'
};

describe('login', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();
  });

  afterEach(resetDB);

  it('should login successfully with valid credentials', async () => {
    const result = await login(validLoginInput);

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user!.username).toEqual('testuser');
    expect(result.user!.email).toEqual('test@example.com');
    expect(result.user!.id).toBeDefined();
    expect(result.user!.created_at).toBeInstanceOf(Date);
    expect(result.user!.updated_at).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
    
    // Ensure password_hash is not included in response
    expect((result.user as any).password_hash).toBeUndefined();
  });

  it('should fail login with invalid username', async () => {
    const result = await login(invalidUsernameInput);

    expect(result.success).toBe(false);
    expect(result.user).toBeUndefined();
    expect(result.message).toEqual('Invalid username or password');
  });

  it('should fail login with invalid password', async () => {
    const result = await login(invalidPasswordInput);

    expect(result.success).toBe(false);
    expect(result.user).toBeUndefined();
    expect(result.message).toEqual('Invalid username or password');
  });

  it('should handle empty credentials', async () => {
    const emptyInput: LoginInput = {
      username: '',
      password: ''
    };

    const result = await login(emptyInput);

    expect(result.success).toBe(false);
    expect(result.user).toBeUndefined();
    expect(result.message).toEqual('Invalid username or password');
  });

  it('should not return password hash in successful response', async () => {
    const result = await login(validLoginInput);

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    
    // Check that password_hash is not present in any form
    const userKeys = Object.keys(result.user!);
    expect(userKeys).not.toContain('password_hash');
    expect(userKeys).toContain('id');
    expect(userKeys).toContain('username');
    expect(userKeys).toContain('email');
    expect(userKeys).toContain('created_at');
    expect(userKeys).toContain('updated_at');
  });
});
