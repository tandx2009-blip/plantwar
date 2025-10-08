// 游戏配置
const GameConfig = {
    // 网格配置
    GRID: {
        COLS: 9,
        ROWS: 5,
        CELL_SIZE: 80,
        START_X: 100,
        START_Y: 80
    },
    
    // 防御塔配置
    TOWERS: {
        SHOOTER: {
            name: '射手',
            cost: 100,
            damage: 20,
            range: 200,
            fireRate: 1000, // 毫秒
            color: 0x00ff00,
            bulletSpeed: 300,
            cooldown: 3000 // 建造冷却时间（毫秒）
        },
        CANNON: {
            name: '炮手',
            cost: 200,
            damage: 50,
            range: 150,
            fireRate: 2000,
            color: 0xff6600,
            bulletSpeed: 200,
            splash: 60, // 溅射范围
            cooldown: 8000 // 建造冷却时间（毫秒）
        },
        FREEZER: {
            name: '冰冻塔',
            cost: 150,
            damage: 20,
            range: 180,
            fireRate: 1500,
            color: 0x00ccff,
            bulletSpeed: 250,
            slowEffect: 0.5, // 减速50%
            cooldown: 5000 // 建造冷却时间（毫秒）
        }
    },
    
    // 敌人配置
    ENEMIES: {
        BASIC: {
            name: '普通僵尸',
            hp: 100,
            speed: 50,
            reward: 50,
            color: 0xff0000
        },
        FAST: {
            name: '快速僵尸',
            hp: 60,
            speed: 100,
            reward: 75,
            color: 0xff00ff
        },
        TANK: {
            name: '坦克僵尸',
            hp: 300,
            speed: 30,
            reward: 150,
            color: 0x880000
        },
        GIANT: {
            name: '巨人僵尸',
            hp: 1000,
            speed: 25,
            reward: 300,
            color: 0x660000
        },
        ROBOT: {
            name: '机器人僵尸',
            hp: 1200,
            speed: 70,
            reward: 500,
            color: 0x00ccff
        },
        THIEF: {
            name: '小偷僵尸',
            hp: 150,
            speed: 90,
            reward: 100,
            color: 0xffff00
        }
    },
    
    // 游戏设置
    GAME: {
        START_GOLD: 500,
        START_LIVES: 10,
        WAVE_DELAY: 8000 // 波次间隔（毫秒）
    }
};

