// 开始菜单场景
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // 背景
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x2d5016, 0x2d5016, 0x1a3010, 0x1a3010, 1);
        bg.fillRect(0, 0, 1000, 600);
        
        // 游戏标题
        this.add.text(500, 150, '🌻 植物保卫战 🧟', {
            fontSize: '56px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // 副标题
        this.add.text(500, 220, '塔防生存挑战', {
            fontSize: '28px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 开始按钮背景
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x00ff00, 0.8);
        buttonBg.fillRoundedRect(350, 320, 300, 80, 15);
        buttonBg.lineStyle(4, 0xffff00, 1);
        buttonBg.strokeRoundedRect(350, 320, 300, 80, 15);
        
        // 开始按钮文字
        const startText = this.add.text(500, 360, '开始游戏', {
            fontSize: '42px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // 添加交互区域
        const startButton = this.add.zone(500, 360, 300, 80).setInteractive({ useHandCursor: true });
        
        // 按钮悬停效果
        startButton.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x00ff00, 1);
            buttonBg.fillRoundedRect(350, 320, 300, 80, 15);
            buttonBg.lineStyle(5, 0xffff00, 1);
            buttonBg.strokeRoundedRect(350, 320, 300, 80, 15);
            startText.setScale(1.1);
        });
        
        startButton.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x00ff00, 0.8);
            buttonBg.fillRoundedRect(350, 320, 300, 80, 15);
            buttonBg.lineStyle(4, 0xffff00, 1);
            buttonBg.strokeRoundedRect(350, 320, 300, 80, 15);
            startText.setScale(1);
        });
        
        // 点击开始游戏
        startButton.on('pointerdown', () => {
            // 按钮按下效果
            startText.setScale(0.95);
            
            // 短暂延迟后启动游戏
            this.time.delayedCall(100, () => {
                this.scene.start('GameScene');
            });
        });
        
        // 游戏说明
        const instructions = [
            '📖 游戏说明：',
            '• 阻止僵尸到达右侧终点线',
            '• 点击卡片选择防御塔，再点击网格放置',
            '• 消灭僵尸获得金币，建造更多防御塔',
            '• 小心！机器人会发射激光摧毁防御塔',
            '• 小偷会偷走你的防御塔'
        ];
        
        let yPos = 440;
        instructions.forEach((text, index) => {
            const fontSize = index === 0 ? '20px' : '16px';
            const color = index === 0 ? '#ffcc00' : '#cccccc';
            
            this.add.text(500, yPos, text, {
                fontSize: fontSize,
                fontFamily: 'Microsoft YaHei',
                color: color,
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            
            yPos += index === 0 ? 30 : 22;
        });
        
        // 装饰元素 - 防御塔图标
        this.add.circle(150, 360, 25, 0x00ff00);
        this.add.circle(850, 360, 25, 0xff6600);
        
        // 装饰元素 - 僵尸图标
        this.add.text(150, 160, '🧟', { fontSize: '40px' }).setOrigin(0.5);
        this.add.text(850, 160, '🤖', { fontSize: '40px' }).setOrigin(0.5);
        
        // 闪烁效果
        this.tweens.add({
            targets: startText,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
}

