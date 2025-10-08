// 游戏主场景
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // 初始化游戏状态
        this.gold = GameConfig.GAME.START_GOLD;
        this.lives = GameConfig.GAME.START_LIVES;
        this.wave = 0;
        this.selectedTowerType = null;
        this.isPaused = false;
        this.waveInProgress = false; // 波次进行中标志
        this.allEnemiesSpawned = false; // 所有敌人已生成标志
        
        // 防御塔冷却时间跟踪
        this.towerCooldowns = {
            SHOOTER: 0,
            CANNON: 0,
            FREEZER: 0
        };
        
        // 游戏对象组
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        
        // 启用全局拖拽事件（对于没有自定义drag处理的对象）
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            // 只有没有自定义drag事件的对象才使用默认处理
            if (!gameObject.hasCustomDrag) {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });
        
        // 创建背景
        this.createBackground();
        
        // 创建网格
        this.createGrid();
        
        // 创建路径
        this.createPath();
        
        // 创建UI
        this.createUI();
        
        // 显示准备提示
        this.showMessage('准备战斗！', 500, 300, '#00ff00', 36);
        
        // 开始第一波
        this.time.delayedCall(3000, () => this.startWave());
    }

    createBackground() {
        // 绘制草地背景
        const graphics = this.add.graphics();
        graphics.fillStyle(0x4a7c2c, 1);
        graphics.fillRect(0, 0, 1000, 600);
        
        // 添加标题
        this.add.text(500, 30, '🌻 植物保卫战', {
            fontSize: '32px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    createGrid() {
        const { COLS, ROWS, CELL_SIZE, START_X, START_Y } = GameConfig.GRID;
        this.grid = [];
        
        for (let row = 0; row < ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < COLS; col++) {
                const x = START_X + col * CELL_SIZE;
                const y = START_Y + row * CELL_SIZE;
                
                // 绘制网格单元
                const cell = this.add.graphics();
                cell.lineStyle(1, 0x000000, 0.2);
                cell.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
                cell.fillStyle(0x5a8c3c, 0.5);
                cell.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                
                // 创建可交互区域
                const zone = this.add.zone(x + CELL_SIZE/2, y + CELL_SIZE/2, CELL_SIZE, CELL_SIZE);
                zone.setInteractive();
                zone.on('pointerdown', () => this.onGridClick(row, col, x, y));
                
                this.grid[row][col] = {
                    hasTower: false,
                    tower: null,
                    graphics: cell,
                    zone: zone
                };
            }
        }
    }

    createPath() {
        // 敌人行走的路径（每一行的中间）
        this.paths = [];
        const { ROWS, CELL_SIZE, START_X, START_Y } = GameConfig.GRID;
        
        // 终点线位置（屏幕最右侧）
        this.endLineX = 980;
        
        for (let row = 0; row < ROWS; row++) {
            const y = START_Y + row * CELL_SIZE + CELL_SIZE / 2;
            this.paths.push({
                y: y,
                startX: 0,
                endX: this.endLineX
            });
        }
        
        // 绘制终点线
        const endLine = this.add.graphics();
        endLine.lineStyle(4, 0xff0000, 0.8);
        endLine.lineBetween(this.endLineX, 60, this.endLineX, 460);
        
        // 添加终点标识
        this.add.text(this.endLineX, 40, '🏁 终点', {
            fontSize: '20px',
            fontFamily: 'Microsoft YaHei',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    createUI() {
        // 金币显示
        this.goldText = this.add.text(20, 20, `💰 金币: ${this.gold}`, {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // 生命值显示
        this.livesText = this.add.text(20, 50, `❤️ 生命: ${this.lives}`, {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // 波次显示
        this.waveText = this.add.text(20, 80, `🌊 波次: ${this.wave}`, {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#00ccff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // 防御塔选择菜单
        this.createTowerMenu();
        
        // 铲子工具
        this.createShovel();
    }

    createTowerMenu() {
        const menuY = 500;
        const towers = Object.entries(GameConfig.TOWERS);
        
        this.add.text(50, 470, '选择防御塔:', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff'
        });
        
        // 存储卡片和冷却文本引用
        this.towerCards = {};
        this.cooldownTexts = {};
        
        towers.forEach(([key, config], index) => {
            const x = 50 + index * 150;
            const y = menuY;
            
            // 卡片背景
            const card = this.add.graphics();
            card.fillStyle(0x333333, 0.9);
            card.fillRoundedRect(x, y, 130, 80, 10);
            card.lineStyle(2, config.color, 1);
            card.strokeRoundedRect(x, y, 130, 80, 10);
            
            this.towerCards[key] = { card, x, y, config };
            
            // 防御塔图标
            const icon = this.add.circle(x + 35, y + 30, 20, config.color);
            
            // 名称和价格
            this.add.text(x + 65, y + 15, config.name, {
                fontSize: '16px',
                fontFamily: 'Microsoft YaHei',
                color: '#ffffff'
            });
            
            this.add.text(x + 65, y + 40, `💰 ${config.cost}`, {
                fontSize: '14px',
                fontFamily: 'Microsoft YaHei',
                color: '#ffcc00'
            });
            
            // 冷却时间文本（初始隐藏）
            const cooldownText = this.add.text(x + 65, y + 58, '', {
                fontSize: '12px',
                fontFamily: 'Microsoft YaHei',
                color: '#ff6600'
            });
            this.cooldownTexts[key] = cooldownText;
            
            // 添加交互
            const zone = this.add.zone(x + 65, y + 40, 130, 80).setInteractive();
            zone.on('pointerdown', () => this.selectTower(key, card));
            zone.on('pointerover', () => {
                card.clear();
                card.fillStyle(0x555555, 0.9);
                card.fillRoundedRect(x, y, 130, 80, 10);
                card.lineStyle(2, config.color, 1);
                card.strokeRoundedRect(x, y, 130, 80, 10);
            });
            zone.on('pointerout', () => {
                if (this.selectedTowerType !== key) {
                    card.clear();
                    card.fillStyle(0x333333, 0.9);
                    card.fillRoundedRect(x, y, 130, 80, 10);
                    card.lineStyle(2, config.color, 1);
                    card.strokeRoundedRect(x, y, 130, 80, 10);
                }
            });
        });
    }

    createShovel() {
        const shovelX = 920;
        const shovelY = 520;
        
        // 铲子背景卡片
        const shovelCard = this.add.graphics();
        shovelCard.fillStyle(0x8b4513, 0.9);
        shovelCard.fillRoundedRect(shovelX - 35, shovelY - 35, 70, 70, 10);
        shovelCard.lineStyle(2, 0xffaa00, 1);
        shovelCard.strokeRoundedRect(shovelX - 35, shovelY - 35, 70, 70, 10);
        
        // 铲子图标
        this.shovel = this.add.text(shovelX, shovelY, '🪓', {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        this.shovel.setInteractive({ draggable: true, useHandCursor: true });
        this.shovel.hasCustomDrag = true; // 标记为自定义拖拽
        
        // 保存原始位置
        this.shovelHomeX = shovelX;
        this.shovelHomeY = shovelY;
        this.shovelDragging = false;
        
        // 拖拽开始
        this.shovel.on('dragstart', (pointer) => {
            this.shovelDragging = true;
            this.shovel.setScale(1.2);
            this.selectedTowerType = null; // 取消选择防御塔
            
            // 高亮所有可移除的防御塔
            this.towers.forEach(tower => {
                if (tower.rangeCircle) {
                    tower.rangeCircle.setVisible(true);
                    tower.rangeCircle.setStrokeStyle(2, 0xff0000, 0.5);
                }
            });
        });
        
        // 拖拽中
        this.shovel.on('drag', (pointer, dragX, dragY) => {
            this.shovel.setPosition(dragX, dragY);
            
            // 检查是否悬停在防御塔上
            let hoveringTower = null;
            this.towers.forEach(tower => {
                const distance = Phaser.Math.Distance.Between(dragX, dragY, tower.x, tower.y);
                if (distance < 40) {
                    hoveringTower = tower;
                }
            });
            
            // 高亮悬停的防御塔
            this.towers.forEach(tower => {
                if (tower === hoveringTower && tower.rangeCircle) {
                    tower.rangeCircle.setStrokeStyle(3, 0xff0000, 0.8);
                } else if (tower.rangeCircle) {
                    tower.rangeCircle.setStrokeStyle(2, 0xff0000, 0.5);
                }
            });
        });
        
        // 拖拽结束
        this.shovel.on('dragend', (pointer) => {
            this.shovelDragging = false;
            
            // 检查是否在防御塔上松手
            let removedTower = null;
            const shovelX = this.shovel.x;
            const shovelY = this.shovel.y;
            
            for (let i = this.towers.length - 1; i >= 0; i--) {
                const tower = this.towers[i];
                const distance = Phaser.Math.Distance.Between(shovelX, shovelY, tower.x, tower.y);
                
                if (distance < 40) {
                    removedTower = tower;
                    
                    // 找到网格位置并清除
                    for (let row = 0; row < this.grid.length; row++) {
                        for (let col = 0; col < this.grid[row].length; col++) {
                            const cell = this.grid[row][col];
                            if (cell.tower === tower) {
                                cell.hasTower = false;
                                cell.tower = null;
                                break;
                            }
                        }
                    }
                    
                    // 移除防御塔
                    tower.destroy();
                    this.towers.splice(i, 1);
                    
                    // 播放移除效果
                    this.showMessage('铲除！', tower.x, tower.y, '#ff6600', 24);
                    break;
                }
            }
            
            // 铲子回到原位
            this.tweens.add({
                targets: this.shovel,
                x: this.shovelHomeX,
                y: this.shovelHomeY,
                scale: 1,
                duration: 200,
                ease: 'Back.out'
            });
            
            // 隐藏所有防御塔的射程圈
            this.towers.forEach(tower => {
                if (tower.rangeCircle) {
                    tower.rangeCircle.setVisible(false);
                    tower.rangeCircle.setStrokeStyle(2, tower.config.color, 0.3);
                }
            });
        });
        
        // 添加提示文字
        this.add.text(shovelX, shovelY + 45, '铲除', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffaa00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }

    updateCooldownDisplay() {
        const currentTime = this.time.now;
        
        Object.keys(this.towerCooldowns).forEach(key => {
            const cooldownRemaining = this.towerCooldowns[key] - currentTime;
            const cooldownText = this.cooldownTexts[key];
            
            if (cooldownRemaining > 0) {
                const secondsLeft = Math.ceil(cooldownRemaining / 1000);
                cooldownText.setText(`⏱️ ${secondsLeft}秒`);
                cooldownText.setVisible(true);
                
                // 冷却中显示暗色
                const cardData = this.towerCards[key];
                if (cardData && this.selectedTowerType !== key) {
                    cardData.card.clear();
                    cardData.card.fillStyle(0x222222, 0.9);
                    cardData.card.fillRoundedRect(cardData.x, cardData.y, 130, 80, 10);
                    cardData.card.lineStyle(2, cardData.config.color, 0.5);
                    cardData.card.strokeRoundedRect(cardData.x, cardData.y, 130, 80, 10);
                }
            } else {
                cooldownText.setVisible(false);
                
                // 冷却完成恢复正常
                const cardData = this.towerCards[key];
                if (cardData && this.selectedTowerType !== key) {
                    cardData.card.clear();
                    cardData.card.fillStyle(0x333333, 0.9);
                    cardData.card.fillRoundedRect(cardData.x, cardData.y, 130, 80, 10);
                    cardData.card.lineStyle(2, cardData.config.color, 1);
                    cardData.card.strokeRoundedRect(cardData.x, cardData.y, 130, 80, 10);
                }
            }
        });
    }

    selectTower(towerType, card) {
        this.selectedTowerType = towerType;
        console.log('选择了防御塔:', GameConfig.TOWERS[towerType].name);
    }

    onGridClick(row, col, x, y) {
        const cell = this.grid[row][col];
        
        // 如果已有塔，不能放置
        if (cell.hasTower) {
            return;
        }
        
        // 如果没有选择塔类型
        if (!this.selectedTowerType) {
            return;
        }
        
        const towerConfig = GameConfig.TOWERS[this.selectedTowerType];
        const currentTime = this.time.now;
        
        // 检查冷却时间
        const cooldownRemaining = this.towerCooldowns[this.selectedTowerType] - currentTime;
        if (cooldownRemaining > 0) {
            const secondsLeft = Math.ceil(cooldownRemaining / 1000);
            this.showMessage(`冷却中 ${secondsLeft}秒`, x + 40, y + 40, '#ffaa00');
            return;
        }
        
        // 检查金币是否足够
        if (this.gold < towerConfig.cost) {
            this.showMessage('金币不足！', x + 40, y + 40, '#ff0000');
            return;
        }
        
        // 扣除金币
        this.gold -= towerConfig.cost;
        this.updateGoldDisplay();
        
        // 设置冷却时间
        this.towerCooldowns[this.selectedTowerType] = currentTime + towerConfig.cooldown;
        
        // 创建防御塔
        const tower = new Tower(this, x + GameConfig.GRID.CELL_SIZE/2, 
                               y + GameConfig.GRID.CELL_SIZE/2, 
                               this.selectedTowerType);
        this.towers.push(tower);
        cell.hasTower = true;
        cell.tower = tower;
        
        this.showMessage(`-${towerConfig.cost}`, x + 40, y + 40, '#ffcc00');
    }

    startWave() {
        this.wave++;
        this.updateWaveDisplay();
        this.waveInProgress = true;
        this.allEnemiesSpawned = false;
        
        // 根据波次生成敌人（每波增加4个）
        const enemyCount = 5 + (this.wave - 1) * 4;
        const enemyTypes = ['BASIC', 'FAST', 'TANK'];
        
        // 从第3波开始，每波加入1个巨人僵尸
        const hasGiant = this.wave >= 3;
        // 从第9波开始，每波加入1个机器人僵尸
        const hasRobot = this.wave >= 9;
        // 从第9波开始，每波加入2个小偷僵尸
        const hasThief = this.wave >= 9;
        const thiefCount = hasThief ? 2 : 0;
        
        // 第5波后所有僵尸速度+10，第8波后再+10（总共+20）
        let speedBonus = 0;
        if (this.wave > 8) {
            speedBonus = 20;
        } else if (this.wave > 5) {
            speedBonus = 10;
        }
        
        // 第2波后每波血量+100，第5波后每波再+40
        let hpBonus = 0;
        if (this.wave > 2) {
            hpBonus = (this.wave - 2) * 100;
        }
        if (this.wave > 5) {
            hpBonus += (this.wave - 5) * 40;
        }
        
        // 第3波显示血量提升警告
        if (this.wave === 3) {
            this.showMessage('💪 僵尸变强！血量提升！', 500, 280, '#ff6600', 28);
        }
        
        // 第6波显示速度和血量双重提升警告
        if (this.wave === 6) {
            this.showMessage('⚡ 僵尸速度提升！', 500, 250, '#ffaa00', 28);
            this.showMessage('💪 僵尸血量再次提升！', 500, 290, '#ff6600', 26);
        }
        
        // 第9波显示速度再次提升警告
        if (this.wave === 9) {
            this.showMessage('⚡⚡ 僵尸狂暴！速度大幅提升！', 500, 160, '#ff0000', 30);
            this.showMessage('🤖 机器人僵尸入侵！', 500, 200, '#00ccff', 28);
            this.showMessage('💰 小偷僵尸出没！', 500, 240, '#ffff00', 28);
        }
        
        for (let i = 0; i < enemyCount; i++) {
            const isLastEnemy = !hasGiant && !hasRobot && thiefCount === 0 && (i === enemyCount - 1);
            this.time.delayedCall(i * 1000, () => {
                // 随机选择敌人类型和路径
                const type = Phaser.Utils.Array.GetRandom(enemyTypes);
                const path = Phaser.Utils.Array.GetRandom(this.paths);
                const enemy = new Enemy(this, 0, path.y, type, path, speedBonus, hpBonus);
                this.enemies.push(enemy);
                
                // 标记最后一个敌人已生成
                if (isLastEnemy) {
                    this.allEnemiesSpawned = true;
                }
            });
        }
        
        // 在普通僵尸之后生成巨人僵尸
        if (hasGiant) {
            this.time.delayedCall((enemyCount + 2) * 1000, () => {
                const path = Phaser.Utils.Array.GetRandom(this.paths);
                const giant = new Enemy(this, 0, path.y, 'GIANT', path, speedBonus, hpBonus);
                this.enemies.push(giant);
                
                // 如果没有机器人，这是最后一个敌人
                if (!hasRobot) {
                    this.allEnemiesSpawned = true;
                }
                
                // 显示巨人出现提示
                this.showMessage('⚠️ 巨人僵尸来袭！', 500, 200, '#ff0000', 28);
            });
        }
        
        // 在巨人僵尸之后生成机器人僵尸
        if (hasRobot) {
            const robotDelay = hasGiant ? (enemyCount + 4) : (enemyCount + 2);
            this.time.delayedCall(robotDelay * 1000, () => {
                const path = Phaser.Utils.Array.GetRandom(this.paths);
                const robot = new Enemy(this, 0, path.y, 'ROBOT', path, speedBonus, hpBonus);
                this.enemies.push(robot);
                
                // 如果没有小偷，这是最后一个敌人
                if (thiefCount === 0) {
                    this.allEnemiesSpawned = true;
                }
                
                // 显示机器人出现提示
                this.showMessage('🤖 机器人僵尸来袭！', 500, 220, '#00ccff', 28);
            });
        }
        
        // 生成小偷僵尸
        if (hasThief) {
            for (let i = 0; i < thiefCount; i++) {
                const baseDelay = hasRobot ? (enemyCount + 6) : hasGiant ? (enemyCount + 4) : (enemyCount + 2);
                const thiefDelay = baseDelay + i * 2;
                const isLastThief = i === thiefCount - 1;
                
                this.time.delayedCall(thiefDelay * 1000, () => {
                    const path = Phaser.Utils.Array.GetRandom(this.paths);
                    const thief = new Enemy(this, 0, path.y, 'THIEF', path, speedBonus, hpBonus);
                    this.enemies.push(thief);
                    
                    // 最后一个小偷是最后一个敌人
                    if (isLastThief) {
                        this.allEnemiesSpawned = true;
                    }
                    
                    // 显示小偷出现提示
                    this.showMessage('💰 小偷僵尸出没！', 500, 240, '#ffff00', 26);
                });
            }
        }
    }

    checkWaveEnd() {
        // 实时检查：所有敌人已生成且场上没有敌人了
        if (this.waveInProgress && this.allEnemiesSpawned && this.enemies.length === 0 && this.lives > 0) {
            this.waveInProgress = false;
            this.showMessage(`第 ${this.wave} 波完成！`, 500, 300, '#00ff00', 32);
            
            // 短暂延迟后开始下一波（给玩家一点准备时间）
            this.time.delayedCall(2000, () => {
                if (this.lives > 0) {
                    this.startWave();
                }
            });
        }
    }

    update(time, delta) {
        // 更新冷却时间显示
        this.updateCooldownDisplay();
        
        // 更新所有防御塔
        this.towers.forEach(tower => tower.update(time, this.enemies));
        
        // 检查波次是否结束
        this.checkWaveEnd();
        
        // 更新所有敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(time, delta);
            
            // 检查是否到达终点（最右侧）
            if (enemy.x >= this.endLineX) {
                this.lives--;
                this.updateLivesDisplay();
                this.showMessage('-1 ❤️', enemy.x - 30, enemy.y, '#ff0000', 24);
                enemy.destroy();
                this.enemies.splice(i, 1);
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
            
            // 检查是否死亡
            if (enemy.hp <= 0) {
                this.gold += enemy.reward;
                this.updateGoldDisplay();
                this.showMessage(`+${enemy.reward}`, enemy.x, enemy.y, '#ffcc00');
                enemy.destroy();
                this.enemies.splice(i, 1);
            }
        }
        
        // 更新所有子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(delta);
            
            if (!bullet.active) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateGoldDisplay() {
        this.goldText.setText(`💰 金币: ${this.gold}`);
    }

    updateLivesDisplay() {
        this.livesText.setText(`❤️ 生命: ${this.lives}`);
    }

    updateWaveDisplay() {
        this.waveText.setText(`🌊 波次: ${this.wave}`);
    }

    showMessage(text, x, y, color, size = 20) {
        const message = this.add.text(x, y, text, {
            fontSize: `${size}px`,
            fontFamily: 'Microsoft YaHei',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: message,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => message.destroy()
        });
    }

    gameOver() {
        this.isPaused = true;
        
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, 1000, 600);
        
        this.add.text(500, 250, '游戏结束！', {
            fontSize: '48px',
            fontFamily: 'Microsoft YaHei',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.add.text(500, 320, `坚持了 ${this.wave} 波`, {
            fontSize: '32px',
            fontFamily: 'Microsoft YaHei',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        const restartText = this.add.text(500, 400, '点击重新开始', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive();
        
        restartText.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}

