class Weapon {
    constructor(scene, type) {
        this.scene = scene;
        this.type = type;
        this.bullets = [];
        this.fireRate = 500;
        this.lastFired = 0;
        this.damage = 10;
        this.bulletSpeed = 300;
        this.maxBullets = 10;
        
        this.setWeaponStats(type);
        
        // 创建子弹组用于物理检测
        this.bulletGroup = scene.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });
    }

    setWeaponStats(type) {
        switch (type) {
            case 'pistol':
                this.fireRate = 500;
                this.damage = 10;
                this.bulletSpeed = 300;
                this.maxBullets = 10;
                break;
            case 'shotgun':
                this.fireRate = 800;
                this.damage = 8;
                this.bulletSpeed = 250;
                this.maxBullets = 20;
                break;
            case 'rifle':
                this.fireRate = 150;
                this.damage = 15;
                this.bulletSpeed = 400;
                this.maxBullets = 30;
                break;
        }
    }

    fire(x, y, rotation) {
        const currentTime = this.scene.time.now;
        
        // 检查发射冷却
        if (currentTime - this.lastFired < this.fireRate) {
            return false;
        }
        
        // 清理已销毁的子弹
        this.cleanupBullets();
        
        // 检查子弹数量限制
        if (this.bullets.length >= this.maxBullets) {
            return false;
        }
        
        this.lastFired = currentTime;
        
        // 创建子弹
        const bullet = new Bullet(this.scene, x, y, rotation, this.bulletSpeed, this.damage);
        this.bullets.push(bullet);
        
        // 播放射击音效
        this.playFireSound();
        
        // 射击特效
        this.createMuzzleFlash(x, y, rotation);
        console.log("发射")
        return true;
    }

    createMuzzleFlash(x, y, rotation) {
        // 枪口闪光效果
        const flashX = x + Math.cos(rotation) * 20;
        const flashY = y + Math.sin(rotation) * 20;
        
        const flash = this.scene.add.circle(flashX, flashY, 6, 0xffff00);
        flash.setDepth(55);
        
        this.scene.tweens.add({
            targets: flash,
            scale: 0.5,
            alpha: 0,
            duration: 100,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    cleanupBullets() {
        this.bullets = this.bullets.filter(bullet => {
            return bullet.sprite && bullet.sprite.active;
        });
    }

    update() {
        this.cleanupBullets();
        
        this.bullets.forEach(bullet => {
            if (bullet.sprite && bullet.sprite.active) {
                bullet.update();
                
                // 检查子弹生命周期
                const currentTime = this.scene.time.now;
                if (currentTime - bullet.spawnTime > bullet.lifetime) {
                    bullet.destroy();
                }
            }
        });
    }

    playFireSound() {
        try {
            console.log('射击音效播放');
        } catch (error) {
            console.log('音效播放失败:', error);
        }
    }

    destroy() {
        this.bullets.forEach(bullet => {
            if (bullet.destroy) {
                bullet.destroy();
            }
        });
        this.bullets = [];
        
        if (this.bulletGroup) {
            this.bulletGroup.clear(true, true);
        }
    }
}
