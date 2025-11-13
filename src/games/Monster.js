// monster.js - 怪物 AI 模块
class Monster {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'monster');
        this.sprite.setCollideWorldBounds(true);
        this.type = type;
        this.speed = 50;
        this.detectionRange = 100;
        this.attackRange = 30;
        this.state = 'idle'; // idle, chase, attack
    }

    update(player) {
        let distance = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );

        if (distance < this.attackRange) {
            this.state = 'attack';
            this.attackPlayer(player);
        } else if (distance < this.detectionRange) {
            this.state = 'chase';
            this.chasePlayer(player);
        } else {
            this.state = 'idle';
            this.sprite.setVelocity(0);
        }
    }

    chasePlayer(player) {
        let angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        this.scene.physics.velocityFromRotation(angle, this.speed, this.sprite.body.velocity);
    }

    attackPlayer(player) {
        this.sprite.setVelocity(0);
        // 简单的攻击逻辑，例如减少玩家生命值
        console.log(`Monster attacking player!`);
        // 这里可以添加伤害计算和动画
    }
}
