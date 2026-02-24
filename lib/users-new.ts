import { db } from './db';
import { users, type User, type NewUser } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// 根據郵箱獲取用戶
export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  } catch (error) {
    console.error(`獲取用戶 ${email} 失敗:`, error);
    throw new Error('無法獲取用戶信息');
  }
}

// 根據ID獲取用戶
export async function getUserById(id: number): Promise<User | undefined> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  } catch (error) {
    console.error(`獲取用戶 ${id} 失敗:`, error);
    throw new Error('無法獲取用戶信息');
  }
}

// 創建新用戶
export async function createUser(userData: {
  email: string;
  username: string;
  password: string;
  role?: 'admin' | 'user';
}): Promise<User> {
  try {
    // 檢查郵箱是否已存在
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('郵箱已被使用');
    }

    // 檢查用戶名是否已存在
    const existingUsername = await db.select().from(users).where(eq(users.username, userData.username));
    if (existingUsername.length > 0) {
      throw new Error('用戶名已被使用');
    }

    // 加密密碼
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const newUserData: NewUser = {
      email: userData.email,
      username: userData.username,
      passwordHash,
      role: userData.role || 'user',
    };

    const [newUser] = await db.insert(users).values(newUserData).returning();
    return newUser;
  } catch (error) {
    console.error('創建用戶失敗:', error);
    if (error instanceof Error && error.message.includes('已被')) {
      throw error;
    }
    throw new Error('無法創建新用戶');
  }
}

// 更新用戶信息
export async function updateUser(
  id: number, 
  updates: Partial<{ email: string; username: string; password: string; role: 'admin' | 'user' }>
): Promise<User | undefined> {
  try {
    const updateData: Partial<NewUser> = {};
    
    if (updates.email) {
      updateData.email = updates.email;
    }
    if (updates.username) {
      updateData.username = updates.username;
    }
    if (updates.password) {
      updateData.passwordHash = await bcrypt.hash(updates.password, 10);
    }
    if (updates.role) {
      updateData.role = updates.role;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  } catch (error) {
    console.error(`更新用戶 ${id} 失敗:`, error);
    throw new Error('無法更新用戶信息');
  }
}

// 刪除用戶
export async function deleteUser(id: number): Promise<boolean> {
  try {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  } catch (error) {
    console.error(`刪除用戶 ${id} 失敗:`, error);
    throw new Error('無法刪除用戶');
  }
}

// 驗證用戶密碼
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// 獲取所有用戶（管理員功能）
export async function getAllUsers(): Promise<User[]> {
  try {
    const allUsers = await db.select().from(users);
    return allUsers;
  } catch (error) {
    console.error('獲取用戶列表失敗:', error);
    throw new Error('無法獲取用戶列表');
  }
}