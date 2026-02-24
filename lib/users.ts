import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export type AppUser = {
  id: string;
  email: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
};

const defaultPasswordHash =
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

const users: AppUser[] = [
  {
    id: '1',
    email: 'admin@football.com',
    username: 'admin',
    password: defaultPasswordHash,
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@football.com',
    username: 'user',
    password: defaultPasswordHash,
    role: 'user',
  },
];

export function getUserByEmail(email: string) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserPublic(u: AppUser) {
  const { password, ...rest } = u;
  return rest;
}

export async function createUser(input: {
  email: string;
  username: string;
  password: string;
}) {
  const exists = getUserByEmail(input.email);
  if (exists) {
    throw new Error('Email 已被使用');
  }
  const id = uuidv4();
  const hash = await bcrypt.hash(input.password, 10);
  const user: AppUser = {
    id,
    email: input.email,
    username: input.username,
    password: hash,
    role: 'user',
  };
  users.push(user);
  return user;
}
