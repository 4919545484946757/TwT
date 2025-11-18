// Enemy.js - 完整修复版本
class Enemy {
    constructor(scene, x, y, type = 'zombie') {
        this.scene = scene;
        this.type = type;
        this.health = 100;
        this.speed = 80;
        this.damage = 20;
        this.attackRange = 100;
        this.attackCooldown = 1000;
        this.lastAttack = 0;
        this.isAlive = true;
        
        // 敌人子弹相关属性
        this.canShoot = this.type === 'skeleton' || this.type === 'boss';
        this.bullets = [];
        this.bulletSpeed = 150;
        this.shootCooldown = 2000;
        this.lastShot = 0;
        
        // 根据类型设置属性
        this.setEnemyStats(type);
        
        // 创建敌人纹理
        this.createEnemyTexture();
        
        // 创建敌人精灵
        this.sprite = scene.physics.add.sprite(x, y, `enemy_${type}`);
        this.sprite.setDisplaySize(this.getEnemySize(), this.getEnemySize());
        this.sprite.setCircle(this.getEnemySize() / 2);
        this.sprite.setDepth(40);
        
        console.log(`生成 ${type} 敌人 at (${x}, ${y}) - 可以射击: ${this.canShoot}`);
        
        // 设置碰撞检测
        this.setupCollisions();
    }

    createEnemyTexture() {
        const graphics = this.scene.add.graphics();
        const size = this.getEnemySize();
        const color = this.getEnemyColor(this.type);
        
        graphics.fillStyle(color, 1);
        graphics.fillCircle(size/2, size/2, size/2);
        
        // 添加特征
        if (this.type === 'skeleton') {
            graphics.fillStyle(0x000000, 1);
            // 眼睛
            graphics.fillCircle(size/2 - 4, size/2 - 4, 2);
            graphics.fillCircle(size/2 + 4, size/2 - 4, 2);
            // 嘴巴
            graphics.fillRect(size/2 - 3, size/2 + 2, 6, 1);
        } else if (this.type === 'boss') {
            graphics.lineStyle(3, 0xffff00, 1);
            graphics.strokeCircle(size/2, size/2, size/2);
        }
        
        graphics.generateTexture(`enemy_${this.type}`, size, size);
        graphics.destroy();
    }

    getEnemySize() {
        switch (this.type) {
            case 'zombie': return 28;
            case 'skeleton': return 24;
            case 'boss': return 48;
            default: return 24;
        }
    }

    getEnemyColor(type) {
        const colors = {
            'zombie': 0x00ff00,    // 绿色
            'skeleton': 0xffffff,  // 白色
            'boss': 0xff0000       // 红色
        };
        return colors[type] || 0x888888;
    }

    setEnemyStats(type) {
        switch (type) {
            case 'zombie':
                this.health = 100;
                this.speed = 80;
                this.damage = 20;
                this.attackRange = 100;
                this.attackCooldown = 1500;
                this.canShoot = false;
                break;
            case 'skeleton':
                this.health = 60;
                this.speed = 120;
                this.damage = 15;
                this.attackRange = 200;
                this.attackCooldown = 1000;
                this.canShoot = true;
                this.bulletSpeed = 200;
                this.shootCooldown = 1500;
                break;
            case 'boss':
                this.health = 300;
                this.speed = 50;
                this.damage = 40;
                this.attackRange = 150;
                this.attackCooldown = 2000;
                this.canShoot = true;
                this.bulletSpeed = 180;
                this.shootCooldown = 1000;
                break;
        }
    }

    setupCollisions() {
        // 延迟设置碰撞检测
        this.scene.time.delayedCall(100, () => {
            this.setupPlayerBulletCollisions();
        });
    }

    setupPlayerBulletCollisions() {
        if (this.scene.player && this.scene.player.weapon) {
            // 为每个玩家子弹设置碰撞
            this.scene.player.weapon.bullets.forEach(bullet => {
                if (bullet.sprite && bullet.sprite.active && !bullet.hasHit) {
                    this.scene.physics.add.overlap(
                        this.sprite,
                        bullet.sprite,
                        () => this.hitByPlayerBullet(bullet),
                        null,
                        this
                    );
                }
            });
        }
    }

    update() {
        if (!this.isAlive || !this.sprite.active) return;
        
        const player = this.scene.player;
        if (!player || !player.sprite || !player.sprite.active) return;
        
        // 计算与玩家的距离
        const distance = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        
        if (distance <= this.attackRange) {
            // 在攻击范围内
            this.sprite.setVelocity(0, 0);
            
            if (this.canShoot) {
                this.shootAtPlayer();
            } else {
                this.attackPlayer();
            }
        } else {
            // 追逐玩家
            this.chasePlayer();
        }
        
        // 更新敌人子弹
        this.updateBullets();
        
        // 更新碰撞检测
        this.updateCollisions();
    }

    shootAtPlayer() {
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastShot >= this.shootCooldown) {
            this.lastShot = currentTime;
            
            const player = this.scene.player;
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x, this.sprite.y,
                player.sprite.x, player.sprite.y
            );
            
            // 创建敌人子弹
            this.createEnemyBullet(angle);
            
            // 显示射击效果
            this.showShootEffect();
            
            console.log(`${this.type} 发射子弹`);
        }
    }

    createEnemyBullet(angle) {
        // 使用 Bullet 类创建敌人子弹
        const bullet = new Bullet(this.scene, this.sprite.x, this.sprite.y, angle, 
                                this.bulletSpeed, this.damage, true);
        this.bullets.push(bullet);
        
        // 设置子弹与玩家碰撞
        this.scene.physics.add.overlap(bullet.sprite, this.scene.player.sprite, 
            () => this.enemyBulletHitPlayer(bullet), null, this);
    }

    updateBullets() {
        const currentTime = this.scene.time.now;
        
        // 清理已销毁的子弹
        this.bullets = this.bullets.filter(bullet => {
            if (!bullet.sprite || !bullet.sprite.active) return false;
            
            // 检查子弹生命周期
            if (currentTime - bullet.spawnTime > bullet.lifetime) {
                bullet.destroy();
                return false;
            }
            
            return true;
        });
    }

    enemyBulletHitPlayer(bullet) {
        if (bullet.hasHit) return;
        
        bullet.hasHit = true;
        
        // 对玩家造成伤害
        if (this.scene.player && this.scene.player.takeDamage) {
            this.scene.player.takeDamage(bullet.damage);
        }
        
        bullet.destroy();
    }

    showShootEffect() {
        const effect = this.scene.add.circle(this.sprite.x, this.sprite.y, 6, 0xff4444);
        effect.setDepth(41);
        
        this.scene.tweens.add({
            targets: effect,
            scale: 0.5,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    updateCollisions() {
        // 为新增的玩家子弹设置碰撞
        if (this.scene.player && this.scene.player.weapon) {
            this.scene.player.weapon.bullets.forEach(bullet => {
                if (bullet.sprite && bullet.sprite.active && !bullet.hasHit && !bullet.collisionSet) {
                    this.scene.physics.add.overlap(
                        this.sprite,
                        bullet.sprite,
                        () => this.hitByPlayerBullet(bullet),
                        null,
                        this
                    );
                    bullet.collisionSet = true;
                }
            });
        }
    }

    hitByPlayerBullet(bullet) {
        if (!this.isAlive || bullet.hasHit) return;
        
        this.takeDamage(bullet.damage);
        bullet.hasHit = true;
        bullet.destroy();
    }

    chasePlayer() {
        const player = this.scene.player;
        if (!player || !player.sprite) return;
        
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        
        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;
        this.sprite.setVelocity(velocityX, velocityY);
    }

    attackPlayer() {
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastAttack >= this.attackCooldown) {
            this.lastAttack = currentTime;
            
            if (this.scene.player && this.scene.player.takeDamage) {
                this.scene.player.takeDamage(this.damage);
            }
            
            this.showAttackEffect();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        
        this.showDamageText(amount);
        
        // 受伤闪烁效果
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite && this.sprite.active) {
                this.sprite.clearTint();
            }
        });
        
        if (this.health <= 0) {
            this.die();
        }
    }

    showDamageText(amount) {
        const text = this.scene.add.text(
            this.sprite.x, 
            this.sprite.y - 20, 
            `-${amount}`,
            { 
                fontSize: '16px', 
                fill: '#ff0000',
                fontFamily: 'Arial'
            }
        );
        text.setDepth(100);
        text.setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }

    showAttackEffect() {
        const effect = this.scene.add.circle(this.sprite.x, this.sprite.y, 8, 0xff0000);
        effect.setDepth(45);
        
        this.scene.tweens.add({
            targets: effect,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    die() {
        this.isAlive = false;
        
        // 清理所有子弹
        this.bullets.forEach(bullet => {
            if (bullet.sprite && bullet.sprite.active) {
                bullet.sprite.destroy();
            }
        });
        this.bullets = [];
        
        // 死亡特效
        const deathEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 16, 0xffff00);
        deathEffect.setDepth(45);
        
        this.scene.tweens.add({
            targets: deathEffect,
            scale: 2,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                deathEffect.destroy();
            }
        });
        
        // 通知场景敌人死亡
        if (this.scene.onEnemyDied) {
            this.scene.onEnemyDied(this);
        }
        
        // 销毁精灵
        this.sprite.destroy();
    }

    destroy() {
        // 清理子弹
        this.bullets.forEach(bullet => {
            if (bullet.sprite && bullet.sprite.active) {
                bullet.sprite.destroy();
            }
        });
        
        if (this.sprite && this.sprite.active) {
            this.sprite.destroy();
        }
    }
}
