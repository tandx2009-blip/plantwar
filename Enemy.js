// 敌人类
class Enemy {
    constructor(scene, x, y, type, path, speedBonus = 0, hpBonus = 0) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.path = path;
        this.config = GameConfig.ENEMIES[type];
        
        this.hp = this.config.hp + hpBonus;
        this.maxHp = this.config.hp + hpBonus;
        this.speed = this.config.speed + speedBonus;
        this.baseSpeed = this.config.speed + speedBonus;
        this.reward = this.config.reward;
        this.slowEffect = 1; // 减速效果
        this.slowUntil = 0;
        
        // 小偷僵尸特殊属性
        this.isThief = (type === 'THIEF');
        this.hasStolen = false;
        
        // 机器人僵尸特殊属性
        this.isRobot = (type === 'ROBOT');
        this.lastLaserTime = 0;
        this.laserCooldown = 2500; // 2.5秒
        
        // 创建视觉元素
        this.createVisuals();
    }
    
    createVisuals() {
        // 根据类型设置大小
        const isGiant = this.type === 'GIANT';
        const isRobot = this.type === 'ROBOT';
        const isThief = this.type === 'THIEF';
        
        let bodyRadius = 15;
        let hpBarWidth = 40;
        let hpBarOffset = 25;
        
        if (isGiant) {
            bodyRadius = 25;
            hpBarWidth = 60;
            hpBarOffset = 35;
        } else if (isRobot) {
            bodyRadius = 22;
            hpBarWidth = 70;
            hpBarOffset = 32;
        } else if (isThief) {
            bodyRadius = 12;
            hpBarWidth = 35;
            hpBarOffset = 22;
        }
        
        // 敌人身体
        this.body = this.scene.add.circle(this.x, this.y, bodyRadius, this.config.color);
        
        // 血条背景
        this.hpBarBg = this.scene.add.graphics();
        this.hpBarBg.fillStyle(0x000000, 0.5);
        this.hpBarBg.fillRect(this.x - hpBarWidth/2, this.y - hpBarOffset, hpBarWidth, 6);
        
        // 血条
        this.hpBar = this.scene.add.graphics();
        this.hpBarWidth = hpBarWidth;
        this.hpBarOffset = hpBarOffset;
        this.updateHpBar();
        
        // 类型标识
        let emoji = '🧟';
        let fontSize = '20px';
        if (this.type === 'FAST') emoji = '🏃';
        if (this.type === 'TANK') emoji = '🛡️';
        if (this.type === 'GIANT') {
            emoji = '👹';
            fontSize = '32px';
        }
        if (this.type === 'ROBOT') {
            emoji = '🤖';
            fontSize = '28px';
        }
        if (this.type === 'THIEF') {
            emoji = '🥷';
            fontSize = '24px';
        }
        
        this.icon = this.scene.add.text(this.x, this.y, emoji, {
            fontSize: fontSize
        }).setOrigin(0.5);
    }
    
    updateHpBar() {
        this.hpBar.clear();
        const hpPercent = this.hp / this.maxHp;
        
        // 根据血量改变颜色
        let color = 0x00ff00;
        if (hpPercent < 0.3) color = 0xff0000;
        else if (hpPercent < 0.6) color = 0xffaa00;
        
        const barWidth = this.hpBarWidth || 40;
        const barOffset = this.hpBarOffset || 25;
        
        this.hpBar.fillStyle(color, 1);
        this.hpBar.fillRect(this.x - barWidth/2, this.y - barOffset, barWidth * hpPercent, 6);
    }
    
    update(time, delta) {
        // 检查减速效果
        if (time > this.slowUntil) {
            this.speed = this.baseSpeed;
        }
        
        // 小偷僵尸的特殊行为
        if (this.isThief && !this.hasStolen) {
            this.checkForTowerToSteal();
        }
        
        // 机器人僵尸的激光攻击
        if (this.isRobot) {
            this.updateLaserAttack(time);
        }
        
        // 向右移动
        this.x += this.speed * (delta / 1000);
        
        // 更新视觉元素位置
        this.body.setPosition(this.x, this.y);
        this.icon.setPosition(this.x, this.y);
        
        const barWidth = this.hpBarWidth || 40;
        const barOffset = this.hpBarOffset || 25;
        
        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x000000, 0.5);
        this.hpBarBg.fillRect(this.x - barWidth/2, this.y - barOffset, barWidth, 6);
        
        this.updateHpBar();
    }
    
    checkForTowerToSteal() {
        // 检查附近是否有防御塔
        const towers = this.scene.towers;
        
        for (let tower of towers) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, tower.x, tower.y);
            
            // 如果距离很近，偷走这个塔
            if (distance < 50) {
                this.stealTower(tower);
                break;
            }
        }
    }
    
    stealTower(tower) {
        this.hasStolen = true;
        
        // 显示偷窃效果
        this.scene.showMessage('💰 防御塔被偷！', tower.x, tower.y, '#ff0000', 28);
        
        // 从场景中移除塔
        const towerIndex = this.scene.towers.indexOf(tower);
        if (towerIndex > -1) {
            this.scene.towers.splice(towerIndex, 1);
        }
        
        // 清除网格占用
        for (let row = 0; row < this.scene.grid.length; row++) {
            for (let col = 0; col < this.scene.grid[row].length; col++) {
                const cell = this.scene.grid[row][col];
                if (cell.tower === tower) {
                    cell.hasTower = false;
                    cell.tower = null;
                    break;
                }
            }
        }
        
        // 销毁塔
        tower.destroy();
        
        // 小偷消失（血量设为0，会在下一帧被移除，但不给奖励）
        this.hp = 0;
        this.reward = 0; // 小偷成功逃走不给奖励
        
        // 显示小偷逃跑动画
        this.scene.tweens.add({
            targets: [this.body, this.icon],
            alpha: 0,
            scale: 0.5,
            duration: 300
        });
    }
    
    updateLaserAttack(time) {
        // 检查冷却时间
        if (time - this.lastLaserTime < this.laserCooldown) {
            return;
        }
        
        // 查找最近的防御塔
        const towers = this.scene.towers;
        let nearestTower = null;
        let minDistance = 300; // 激光射程
        
        for (let tower of towers) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, tower.x, tower.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestTower = tower;
            }
        }
        
        // 如果找到目标，发射激光
        if (nearestTower) {
            this.fireLaser(nearestTower);
            this.lastLaserTime = time;
        }
    }
    
    fireLaser(target) {
        // 创建激光视觉效果
        const laser = this.scene.add.graphics();
        laser.lineStyle(3, 0xff0000, 1);
        laser.lineBetween(this.x, this.y, target.x, target.y);
        
        // 激光闪烁效果
        this.scene.tweens.add({
            targets: laser,
            alpha: 0,
            duration: 200,
            onComplete: () => laser.destroy()
        });
        
        // 发射声效提示（视觉）
        const laserGlow = this.scene.add.circle(this.x, this.y, 30, 0xff0000, 0.5);
        this.scene.tweens.add({
            targets: laserGlow,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => laserGlow.destroy()
        });
        
        // 摧毁防御塔
        this.destroyTower(target);
    }
    
    destroyTower(tower) {
        // 显示摧毁效果
        this.scene.showMessage('⚡ 激光摧毁！', tower.x, tower.y, '#ff0000', 28);
        
        // 爆炸特效
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const particle = this.scene.add.circle(tower.x, tower.y, 5, 0xff6600);
            
            this.scene.tweens.add({
                targets: particle,
                x: tower.x + Math.cos(angle) * 50,
                y: tower.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
        
        // 从场景中移除塔
        const towerIndex = this.scene.towers.indexOf(tower);
        if (towerIndex > -1) {
            this.scene.towers.splice(towerIndex, 1);
        }
        
        // 清除网格占用
        for (let row = 0; row < this.scene.grid.length; row++) {
            for (let col = 0; col < this.scene.grid[row].length; col++) {
                const cell = this.scene.grid[row][col];
                if (cell.tower === tower) {
                    cell.hasTower = false;
                    cell.tower = null;
                    break;
                }
            }
        }
        
        // 销毁塔
        tower.destroy();
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        
        // 受伤闪烁
        this.scene.tweens.add({
            targets: this.body,
            alpha: 0.3,
            duration: 100,
            yoyo: true
        });
        
        if (this.hp <= 0) {
            this.hp = 0;
        }
    }
    
    applySlow(slowPercent, duration) {
        // 机器人僵尸免疫减速
        if (this.isRobot) {
            // 显示免疫提示
            this.scene.showMessage('免疫！', this.x, this.y - 30, '#00ccff', 18);
            return;
        }
        
        this.speed = this.baseSpeed * (1 - slowPercent);
        this.slowUntil = this.scene.time.now + duration;
        
        // 显示冰冻效果
        if (!this.freezeEffect) {
            this.freezeEffect = this.scene.add.circle(this.x, this.y, 18);
            this.freezeEffect.setStrokeStyle(2, 0x00ccff, 0.6);
        }
        
        this.scene.time.delayedCall(duration, () => {
            if (this.freezeEffect) {
                this.freezeEffect.destroy();
                this.freezeEffect = null;
            }
        });
    }
    
    destroy() {
        this.body.destroy();
        this.hpBar.destroy();
        this.hpBarBg.destroy();
        this.icon.destroy();
        if (this.freezeEffect) {
            this.freezeEffect.destroy();
        }
    }
}

