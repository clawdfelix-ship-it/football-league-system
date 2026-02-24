// 球員資料模型
export type Player = {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
  team: string;
  age: number;
  nationality: string;
  height: number; // cm
  weight: number; // kg
  joinedDate: Date;
  status: 'active' | 'injured' | 'suspended' | 'inactive';
  photoUrl?: string;
  phoneNumber?: string;
  email?: string;
  emergencyContact?: string;
  notes?: string;
};

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

// 球隊列表（可以根據實際情況擴展）
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

// 模擬球員資料
export const mockPlayers: Player[] = [
  {
    id: 1,
    name: '張三',
    jerseyNumber: 10,
    position: '中場',
    team: '曼城',
    age: 25,
    nationality: '中國',
    height: 175,
    weight: 70,
    joinedDate: new Date('2024-01-15'),
    status: 'active',
    phoneNumber: '138-0000-0001',
    email: 'zhangsan@example.com'
  },
  {
    id: 2,
    name: '李四',
    jerseyNumber: 7,
    position: '前鋒',
    team: '利物浦',
    age: 23,
    nationality: '中國',
    height: 180,
    weight: 75,
    joinedDate: new Date('2024-02-01'),
    status: 'active',
    phoneNumber: '138-0000-0002',
    email: 'lisi@example.com'
  },
  {
    id: 3,
    name: '王五',
    jerseyNumber: 1,
    position: '守門員',
    team: '阿森納',
    age: 28,
    nationality: '中國',
    height: 185,
    weight: 80,
    joinedDate: new Date('2023-12-01'),
    status: 'injured',
    phoneNumber: '138-0000-0003',
    email: 'wangwu@example.com',
    notes: '膝蓋受傷，預計休息2週'
  }
];

// 球員相關的函數
export function getPlayers(): Player[] {
  return mockPlayers;
}

export function getPlayerById(id: number): Player | undefined {
  return mockPlayers.find(player => player.id === id);
}

export function getPlayersByTeam(team: string): Player[] {
  return mockPlayers.filter(player => player.team === team);
}

export function getPlayersByStatus(status: Player['status']): Player[] {
  return mockPlayers.filter(player => player.status === status);
}

export function addPlayer(playerData: Omit<Player, 'id'>): Player {
  const newPlayer: Player = {
    ...playerData,
    id: Math.max(...mockPlayers.map(p => p.id)) + 1
  };
  mockPlayers.push(newPlayer);
  return newPlayer;
}

export function updatePlayer(id: number, updates: Partial<Player>): Player | undefined {
  const index = mockPlayers.findIndex(player => player.id === id);
  if (index === -1) return undefined;
  
  mockPlayers[index] = { ...mockPlayers[index], ...updates };
  return mockPlayers[index];
}

export function deletePlayer(id: number): boolean {
  const index = mockPlayers.findIndex(player => player.id === id);
  if (index === -1) return false;
  
  mockPlayers.splice(index, 1);
  return true;
}