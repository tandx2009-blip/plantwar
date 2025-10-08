// 防御塔类
class Tower {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = GameConfig.TOWERS[type];
        
        this.lastFireTime = 0;
        this.target = null;
        
        // 创建视觉元素
        this.createVisuals();
    }
    
    createVisuals() {
        // 底座
        this.base = this.scene.add.circle(this.x, this.y, 25, 0x8b4513);
        
        // 塔身
        this.body = this.scene.add.circle(this.x, this.y, 20, this.config.color);
        
        // 炮管方向指示
        this.barrel = this.scene.add.graphics();
        this.updateBarrel(0);
        
        // 射程圈（鼠标悬停时显示）
        this.rangeCircle = this.scene.add.circle(this.x, this.y, this.config.range);
        this.rangeCircle.setStrokeStyle(2, this.config.color, 0.3);
        this.rangeCircle.setVisible(false);
        
        // 添加交互
        this.body.setInteractive();
        this.body.on('pointerover', () => {
            this.rangeCircle.setVisible(true);
        });
        this.body.on('pointerout', () => {
            this.rangeCircle.setVisible(false);
        });
    }
    
    updateBarrel(angle) {
        this.barrel.clear();
        this.barrel.lineStyle(4, this.config.color);
        const endX = this.x + Math.cos(angle) * 15;
        const endY = this.y + Math.sin(angle) * 15;
        this.barrel.lineBetween(this.x, this.y, endX, endY);
    }
    
    update(time, enemies) {
        // 查找射程内的敌人
        this.target = this.findTarget(enemies);
        
        if (this.target) {
            // 更新炮管朝向
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.updateBarrel(angle);
            
            // 检查是否可以开火
            if (time - this.lastFireTime >= this.config.fireRate) {
                this.fire();
                this.lastFireTime = time;
            }
        }
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = this.config.range;
        
        enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            
            // 选择最近的敌人
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }
    
    fire() {
        if (!this.target) return;
        
        // 创建子弹
        const bullet = new Bullet(
            this.scene,
            this.x,
            this.y,
            this.target,
            this.config
        );
        
        this.scene.bullets.push(bullet);
        
        // 开火动画
        this.scene.tweens.add({
            targets: this.body,
            scale: 1.2,
            duration: 100,
            yoyo: true
        });
    }
    
    destroy() {
        this.base.destroy();
        this.body.destroy();
        this.barrel.destroy();
        this.rangeCircle.destroy();
    }
}


