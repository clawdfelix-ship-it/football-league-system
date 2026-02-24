import { db } from './db';
import { players, type Player, type NewPlayer } from './schema';
import { eq, sql } from 'drizzle-orm';

// 球員位置選項
export const POSITIONS = [
  '守門員',
  '後衛',
  '中場',
  '前鋒',
  '左後衛',
  '右後衛',
  '中後衛',
  '防守中場',
  '進攻中場',
  '左邊鋒',
  '右邊鋒',
  '中鋒'
] as const;

// 球隊列表
export const TEAMS = [
  '曼城',
  '利物浦',
  '阿森納',
  '切爾西',
  '曼聯',
  '熱刺',
  '萊斯特城',
  '埃弗頓',
  '西漢姆',
  '阿斯頓維拉'
] as const;

// 球員狀態
export const PLAYER_STATUS = {
  active: '活躍',
  injured: '受傷',
  suspended: '停賽',
  inactive: '非活躍'
} as const;

// 獲取所有球員
export async function getPlayers(): Promise<Player[]> {
  try {
    const allPlayers = await db.select().from(players);
    return allPlayers;
  } catch (error) {
    console.error('獲取球員列表失敗:', error);
    throw new Error('無法獲取球員列表');
  }
}

// 根據ID獲取球員
export async function getPlayerById(id: number): Promise<Player | undefined> {
  try {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  } catch (error) {
    console.error(`獲取球員 ${id} 失敗:`, error);
    throw new Error('無法獲取球員信息');
  }
}

// 根據球隊獲取球員
export async function getPlayersByTeam(team: string): Promise<Player[]> {
  try {
    const teamPlayers = await db.select().from(players).where(eq(players.team, team));
    return teamPlayers;
  } catch (error) {
    console.error(`獲取球隊 ${team} 球員失敗:`, error);
    throw new Error('無法獲取球隊球員列表');
  }
}

// 根據狀態獲取球員
export async function getPlayersByStatus(status: string): Promise<Player[]> {
  try {
    const statusPlayers = await db.select().from(players).where(eq(players.status, status));
    return statusPlayers;
  } catch (error) {
    console.error(`獲取狀態 ${status} 球員失敗:`, error);
    throw new Error('無法獲取指定狀態的球員列表');
  }
}

// 添加新球員
export async function addPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> {
  try {
    const newPlayerData: NewPlayer = {
      name: playerData.name,
      jerseyNumber: playerData.jerseyNumber,
      position: playerData.position,
      team: playerData.team,
      age: playerData.age,
      nationality: playerData.nationality,
      height: playerData.height,
      weight: playerData.weight,
      joinedDate: playerData.joinedDate,
      status: playerData.status,
      photoUrl: playerData.photoUrl,
      phoneNumber: playerData.phoneNumber,
      email: playerData.email,
      emergencyContact: playerData.emergencyContact,
      notes: playerData.notes,
    };

    const [newPlayer] = await db.insert(players).values(newPlayerData).returning();
    return newPlayer;
  } catch (error) {
    console.error('添加球員失敗:', error);
    throw new Error('無法添加新球員');
  }
}

// 更新球員信息
export async function updatePlayer(id: number, updates: Partial<Omit<Player, 'id'>>): Promise<Player | undefined> {
  try {
    const [updatedPlayer] = await db
      .update(players)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(players.id, id))
      .returning();
    return updatedPlayer;
  } catch (error) {
    console.error(`更新球員 ${id} 失敗:`, error);
    throw new Error('無法更新球員信息');
  }
}

// 刪除球員
export async function deletePlayer(id: number): Promise<boolean> {
  try {
    const result = await db.delete(players).where(eq(players.id, id));
    return result.rowCount > 0;
  } catch (error) {
    console.error(`刪除球員 ${id} 失敗:`, error);
    throw new Error('無法刪除球員');
  }
}