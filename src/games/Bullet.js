// Bullet.js - 修复版本
class Bullet {
    constructor(scene, x, y, rotation, speed = 300, damage = 10, isEnemyBullet = false) {
        this.scene = scene;
        this.speed = speed;
        this.damage = damage;
        this.hasHit = false;
        this.spawnTime = scene.time.now;
        this.lifetime = 2000;
        this.isEnemyBullet = isEnemyBullet;
        
        // 创建子弹精灵 - 使用图形而不是null
        this.sprite = scene.physics.add.sprite(x, y, null);
        
        // 创建子弹图形
        const graphics = scene.add.graphics();
        if (isEnemyBullet) {
            // 敌人子弹 - 红色
            graphics.fillStyle(0xff0000, 1);
            graphics.fillCircle(0, 0, 4);
            graphics.generateTexture('enemyBullet', 8, 8);
        } else {
            // 玩家子弹 - 黄色
            graphics.fillStyle(0xffff00, 1);
            graphics.fillCircle(0, 0, 4);
            graphics.generateTexture('playerBullet', 8, 8);
        }
        graphics.destroy();
        
        // 设置子弹纹理
        this.sprite.setTexture(isEnemyBullet ? 'enemyBullet' : 'playerBullet');
        this.sprite.setDisplaySize(8, 8);
        this.sprite.setDepth(50);
        
        // 设置子弹方向和速度
        const velocityX = Math.cos(rotation) * this.speed;
        const velocityY = Math.sin(rotation) * this.speed;
        this.sprite.setVelocity(velocityX, velocityY);
        
        // 子弹与墙壁碰撞
        scene.physics.add.collider(this.sprite, scene.walls, this.hitWall, null, this);
        
        // 添加子弹尾迹效果
        this.addTrailEffect();
    }

    addTrailEffect() {
        const trailColor = this.isEnemyBullet ? 0xff4444 : 0xffaa00;
        const trail = this.scene.add.circle(
            this.sprite.x, 
            this.sprite.y, 
            2, 
            trailColor,
            0.7
        );
        trail.setDepth(49);
        
        this.scene.tweens.add({
            targets: trail,
            scale: 0,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                trail.destroy();
            }
        });
    }

    update() {
        if (!this.sprite.active) return;
        
        // 检查子弹生命周期
        const currentTime = this.scene.time.now;
        if (currentTime - this.spawnTime > this.lifetime) {
            this.destroy();
            return;
        }
        
        // 持续添加尾迹效果
        if (currentTime % 50 < 10) {
            this.addTrailEffect();
        }
    }

    hitWall() {
        if (this.hasHit) return;
        this.hasHit = true;
        this.createHitEffect();
        this.destroy();
    }

    createHitEffect() {
        const hitColor = this.isEnemyBullet ? 0xff4444 : 0xff6600;
        const hitEffect = this.scene.add.circle(
            this.sprite.x, 
            this.sprite.y, 
            6, 
            hitColor
        );
        hitEffect.setDepth(51);
        
        this.scene.tweens.add({
            targets: hitEffect,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                hitEffect.destroy();
            }
        });
    }

    destroy() {
        if (this.sprite && this.sprite.active) {
            this.sprite.destroy();
        }
    }
}
