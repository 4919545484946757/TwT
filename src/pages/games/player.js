// Player.js - 修复版本
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // 创建玩家纹理
        this.createPlayerTexture();
        
        // 创建玩家精灵
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.sprite.setDisplaySize(24, 24);
        this.sprite.setCircle(12);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(100);
        
        // 玩家属性
        this.speed = 200;
        this.health = 500;
        this.maxHealth = 100;
        this.isAlive = true;
        
        // 初始化武器
        this.weapon = new Weapon(scene, 'pistol');
        
        // 输入控制
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys('W,S,A,D');
        this.mouse = scene.input.activePointer;
        
        console.log('玩家创建完成，位置:', x, y);
    }

    createPlayerTexture() {
        // 创建玩家图形纹理
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x0088ff, 1); // 蓝色
        graphics.fillCircle(12, 12, 12);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeCircle(12, 12, 12);
        graphics.generateTexture('player', 24, 24);
        graphics.destroy();
    }

    update() {
        this.handleMovement();
        this.handleRotation();
        this.handleShooting();
        
        if (this.weapon) {
            this.weapon.update();
        }
    }

    handleMovement() {
        let velocityX = 0;
        let velocityY = 0;

        // 键盘移动控制
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            velocityX = -this.speed;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            velocityX = this.speed;
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            velocityY = -this.speed;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            velocityY = this.speed;
        }

        // 对角线移动速度修正
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }

        this.sprite.setVelocity(velocityX, velocityY);
    }

    handleRotation() {
        // 鼠标朝向
        const pointer = this.mouse;
        const camera = this.scene.cameras.main;
        const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
        
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            worldPoint.x, worldPoint.y
        );
        
        this.sprite.rotation = angle;
    }

    handleShooting() {
        if (this.weapon && this.mouse.isDown) {
            this.weapon.fire(
                this.sprite.x,
                this.sprite.y,
                this.sprite.rotation
            );
            this.weapon.fire(
                this.sprite.x+1,
                this.sprite.y+1,
                this.sprite.rotation
            );
        }
    }

    takeDamage(amount) {
        if (!this.isAlive) return;
        
        this.health -= amount;
        
        // 受伤闪烁效果
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            if (this.sprite && this.sprite.active) {
                this.sprite.setTint(0x0088ff); // 恢复蓝色
            }
        });
        
        // 更新UI
        if (this.scene.updateHealthUI) {
            this.scene.updateHealthUI();
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isAlive = false;
        console.log('玩家死亡');
        
        // 游戏结束逻辑
        if (this.scene.gameOver) {
            this.scene.gameOver();
        }
    }

    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }
}
