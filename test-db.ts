// 測試數據庫連接腳本
import { initializeDatabase } from './lib/migrations';
import { getPlayers, addPlayer } from './lib/player-actions-new';
import { createUser, getUserByEmail } from './lib/users-new';

async function testDatabase() {
  console.log('開始測試數據庫功能...');
  
  try {
    // 1. 初始化數據庫
    console.log('1. 初始化數據庫...');
    await initializeDatabase();
    console.log('✅ 數據庫初始化成功');
    
    // 2. 測試用戶功能
    console.log('2. 測試用戶功能...');
    try {
      const testUser = await createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'testpassword123'
      });
      console.log('✅ 創建用戶成功:', testUser.username);
    } catch (error: any) {
      if (error.message.includes('已被')) {
        console.log('ℹ️  測試用戶已存在');
      } else {
        throw error;
      }
    }
    
    const foundUser = await getUserByEmail('test@example.com');
    console.log('✅ 查詢用戶成功:', foundUser?.username);
    
    // 3. 測試球員功能
    console.log('3. 測試球員功能...');
    const players = await getPlayers();
    console.log(`✅ 獲取球員列表成功，共 ${players.length} 名球員`);
    
    if (players.length === 0) {
      console.log('4. 添加測試球員...');
      const newPlayer = await addPlayer({
        name: '測試球員',
        jerseyNumber: 10,
        position: '前鋒',
        team: '曼城',
        age: 25,
        nationality: '中國',
        height: 180,
        weight: 75,
        joinedDate: new Date(),
        status: 'active',
        photoUrl: '',
        phoneNumber: '13800138000',
        email: 'testplayer@example.com',
        emergencyContact: '緊急聯繫人',
        notes: '測試球員備註'
      });
      console.log('✅ 添加球員成功:', newPlayer.name);
    }
    
    console.log('\n🎉 所有測試通過！數據庫功能正常。');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  testDatabase().then(() => {
    console.log('\n測試完成。');
    process.exit(0);
  }).catch((error) => {
    console.error('測試錯誤:', error);
    process.exit(1);
  });
}

export { testDatabase };