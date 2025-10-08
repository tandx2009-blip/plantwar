// 子弹类
class Bullet {
    constructor(scene, x, y, target, towerConfig) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.target = target;
        this.config = towerConfig;
        this.active = true;
        
        // 创建视觉元素
        this.createVisuals();
    }
    
    createVisuals() {
        this.graphics = this.scene.add.circle(this.x, this.y, 5, this.config.color);
        
        // 添加光晕效果
        this.glow = this.scene.add.circle(this.x, this.y, 8, this.config.color, 0.3);
    }
    
    update(delta) {
        if (!this.active) return;
        
        // 检查目标是否存在且存活
        if (!this.target || this.target.hp <= 0) {
            // 目标已死亡，子弹消失
            this.destroy();
            return;
        }
        
        // 实时追踪目标：每帧重新计算朝向目标的方向
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        const velocityX = Math.cos(angle) * this.config.bulletSpeed;
        const velocityY = Math.sin(angle) * this.config.bulletSpeed;
        
        // 移动子弹
        this.x += velocityX * (delta / 1000);
        this.y += velocityY * (delta / 1000);
        
        this.graphics.setPosition(this.x, this.y);
        this.glow.setPosition(this.x, this.y);
        
        // 检查是否超出屏幕
        if (this.x < 0 || this.x > 1000 || this.y < 0 || this.y > 600) {
            this.destroy();
            return;
        }
        
        // 检查是否命中目标
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        if (distance < 20) {
            this.hit();
        }
    }
    
    hit() {
        // 造成伤害
        this.target.takeDamage(this.config.damage);
        
        // 检查特殊效果
        if (this.config.slowEffect) {
            // 冰冻效果
            this.target.applySlow(this.config.slowEffect, 2000);
        }
        
        if (this.config.splash) {
            // 溅射伤害
            this.applySplashDamage();
        }
        
        // 创建命中特效
        this.createHitEffect();
        
        this.destroy();
    }
    
    applySplashDamage() {
        const splashRange = this.config.splash;
        const splashDamage = this.config.damage * 0.5;
        
        this.scene.enemies.forEach(enemy => {
            if (enemy === this.target) return;
            
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < splashRange) {
                enemy.takeDamage(splashDamage);
            }
        });
        
        // 显示爆炸圈
        const explosion = this.scene.add.circle(this.x, this.y, splashRange, this.config.color, 0.3);
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
    }
    
    createHitEffect() {
        const particles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.scene.add.circle(this.x, this.y, 3, this.config.color);
            particles.push(particle);
            
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * 30,
                y: this.y + Math.sin(angle) * 30,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    destroy() {
        this.active = false;
        this.graphics.destroy();
        this.glow.destroy();
    }
}

