// GameScene.js - 修复版本
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentLevel = 1;
        this.totalLevels = 3;
        this.enemies = [];
        this.enemiesKilled = 0;
        this.totalEnemies = 0;
    }

    preload() {
        console.log('预加载资源...');
        
        // 预加载本地背景图片
        // 请将 'assets/background.jpg' 替换为你的实际图片路径
        this.load.image('background', '../../assets/background.png');
        
        // 预加载墙壁纹理
        this.load.image('wall', '../../assets/wall.png'); // 如果没有，我们会创建默认纹理
        
        console.log('资源预加载完成');
    }

    create() {
        console.log('开始创建场景...');
        
        // 创建背景
        this.createBackground();
        
        // 创建地图和墙壁
        this.createMap();
        
        // 创建玩家
        this.player = new Player(this, 400, 300);
        
        // 创建UI
        this.createUI();
        
        // 生成敌人
        this.spawnEnemies();
        
        // 物理碰撞
        this.physics.add.collider(this.player.sprite, this.walls);
        
        console.log('场景创建完成');
    }

    createBackground() {
        // 尝试使用本地背景图片，如果加载失败则使用默认颜色
        try {
            // 创建背景精灵
            this.background = this.add.sprite(400, 300, 'background');
            this.background.setDisplaySize(800, 600);
            this.background.setDepth(0);
            console.log('使用本地背景图片');
        } catch (error) {
            // 如果图片加载失败，创建默认背景
            console.log('本地背景图片加载失败，使用默认背景');
            this.background = this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
            this.background.setDepth(0);
        }
        
        // 添加背景效果 - 网格线
        this.createBackgroundGrid();
    }

    createBackgroundGrid() {
        // 创建网格背景效果
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x2a2a3a, 0.3);
        gridGraphics.setDepth(1);
        
        // 绘制水平网格线
        for (let y = 0; y < 600; y += 40) {
            gridGraphics.lineBetween(0, y, 800, y);
        }
        
        // 绘制垂直网格线
        for (let x = 0; x < 800; x += 40) {
            gridGraphics.lineBetween(x, 0, x, 600);
        }
        
        // 保存网格图形引用
        this.gridGraphics = gridGraphics;
    }

    createMap() {
        // 创建墙壁纹理（如果预加载的纹理不存在）
        this.createWallTextures();
        
        // 创建墙壁组
        this.walls = this.physics.add.staticGroup();
        
        // 地图边界 - 使用纹理
        this.createMapBoundaries();
        
        // 随机障碍物 - 使用纹理
        this.createRandomObstacles();
        
        // 添加地图装饰
        this.createMapDecorations();
    }

    createWallTextures() {
        // 检查墙壁纹理是否已加载，如果没有则创建默认纹理
        if (!this.textures.exists('wall')) {
            console.log('创建默认墙壁纹理');
            const graphics = this.add.graphics();
            
            // 创建石头纹理
            graphics.fillStyle(0x666666, 1);
            graphics.fillRect(0, 0, 40, 40);
            
            // 添加石头纹理细节
            graphics.lineStyle(1, 0x555555, 0.5);
            for (let i = 5; i < 40; i += 10) {
                graphics.lineBetween(0, i, 40, i);
                graphics.lineBetween(i, 0, i, 40);
            }
            
            // 添加高光效果
            graphics.lineStyle(2, 0x888888, 0.3);
            graphics.lineBetween(2, 2, 38, 2);
            graphics.lineBetween(2, 2, 2, 38);
            
            // 添加阴影效果
            graphics.lineStyle(2, 0x444444, 0.3);
            graphics.lineBetween(38, 2, 38, 38);
            graphics.lineBetween(2, 38, 38, 38);
            
            graphics.generateTexture('wall', 40, 40);
            graphics.destroy();
        }
        
        // 创建边界墙壁纹理
        if (!this.textures.exists('boundary_wall')) {
            const graphics = this.add.graphics();
            
            // 边界墙壁纹理 - 深灰色带边框
            graphics.fillStyle(0x333333, 1);
            graphics.fillRect(0, 0, 40, 40);
            
            // 边框
            graphics.lineStyle(3, 0x222222, 1);
            graphics.strokeRect(1, 1, 38, 38);
            
            // 内部纹理
            graphics.lineStyle(1, 0x444444, 0.5);
            for (let i = 8; i < 40; i += 8) {
                graphics.lineBetween(0, i, 40, i);
                graphics.lineBetween(i, 0, i, 40);
            }
            
            graphics.generateTexture('boundary_wall', 40, 40);
            graphics.destroy();
        }
        
        // 创建障碍物纹理
        if (!this.textures.exists('obstacle')) {
            const graphics = this.add.graphics();
            
            // 障碍物纹理 - 棕色带木纹效果
            graphics.fillStyle(0x8B4513, 1);
            graphics.fillRect(0, 0, 40, 40);
            
            // 木纹效果
            graphics.lineStyle(3, 0x654321, 0.6);
            for (let i = 5; i < 40; i += 8) {
                graphics.lineBetween(0, i, 40, i);
            }
            
            // 边框
            graphics.lineStyle(2, 0x5D4037, 1);
            graphics.strokeRect(2, 2, 36, 36);
            
            graphics.generateTexture('obstacle', 40, 40);
            graphics.destroy();
        }
    }

    createMapBoundaries() {
        // 地图边界 - 使用边界墙壁纹理
        const boundaryConfig = {
            key: 'boundary_wall',
            frame: null,
            repeat: 0
        };
        
        // 上边界
        this.walls.create(400, 10, 'boundary_wall')
            .setDisplaySize(800, 20)
            .refreshBody();
        
        // 下边界
        this.walls.create(400, 590, 'boundary_wall')
            .setDisplaySize(800, 20)
            .refreshBody();
        
        // 左边界
        this.walls.create(10, 300, 'boundary_wall')
            .setDisplaySize(20, 600)
            .refreshBody();
        
        // 右边界
        this.walls.create(790, 300, 'boundary_wall')
            .setDisplaySize(20, 600)
            .refreshBody();
        
        console.log('地图边界创建完成');
    }

    createRandomObstacles() {
        // 随机障碍物配置
        const obstacleConfigs = [
            { type: 'wall', count: 8, size: 40 },
            { type: 'obstacle', count: 6, size: 40 },
            { type: 'wall', count: 4, size: 30 }
        ];
        
        let totalObstacles = 0;
        
        obstacleConfigs.forEach(config => {
            for (let i = 0; i < config.count; i++) {
                let validPosition = false;
                let attempts = 0;
                
                while (!validPosition && attempts < 50) {
                    const x = Phaser.Math.Between(50, 750);
                    const y = Phaser.Math.Between(50, 550);
                    
                    // 检查是否与玩家起始位置太近
                    const distanceToPlayer = Phaser.Math.Distance.Between(x, y, 400, 300);
                    
                    // 检查是否与其他障碍物重叠
                    let overlaps = false;
                    this.walls.getChildren().forEach(wall => {
                        const wallBounds = wall.getBounds();
                        const obstacleBounds = new Phaser.Geom.Rectangle(
                            x - config.size/2, y - config.size/2, config.size, config.size
                        );
                        if (Phaser.Geom.Rectangle.Overlaps(wallBounds, obstacleBounds)) {
                            overlaps = true;
                        }
                    });
                    
                    if (distanceToPlayer > 100 && !overlaps) {
                        validPosition = true;
                        
                        const obstacle = this.walls.create(x, y, config.type)
                            .setDisplaySize(config.size, config.size)
                            .refreshBody();
                        
                        // 为障碍物添加随机旋转
                        if (config.type === 'obstacle') {
                            obstacle.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
                        }
                        
                        totalObstacles++;
                    }
                    attempts++;
                }
            }
        });
        
        console.log(`创建了 ${totalObstacles} 个障碍物`);
    }

    createMapDecorations() {
        // 创建地图装饰物
        this.decorations = this.add.group();
        
        // 地面标记
        this.createGroundMarkers();
        
        // 环境粒子效果
        this.createEnvironmentParticles();
    }

    createGroundMarkers() {
        // 创建地面标记点
        const markerCount = 20;
        
        for (let i = 0; i < markerCount; i++) {
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 550);
            
            // 检查是否在墙壁上
            let onWall = false;
            this.walls.getChildren().forEach(wall => {
                const wallBounds = wall.getBounds();
                if (wallBounds.contains(x, y)) {
                    onWall = true;
                }
            });
            
            if (!onWall) {
                const marker = this.add.circle(x, y, 2, 0x444444, 0.3);
                marker.setDepth(5);
                this.decorations.add(marker);
            }
        }
    }

    createEnvironmentParticles() {
        // 创建环境粒子效果
        this.particles = this.add.particles(0, 0, null, {
            x: { min: 0, max: 800 },
            y: { min: 0, max: 600 },
            speed: { min: 5, max: 15 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.3, end: 0 },
            lifespan: 3000,
            frequency: 100,
            blendMode: 'ADD',
            depth: 2
        });
    }

    createUI() {
        // 创建半透明UI背景
        const uiBackground = this.add.rectangle(100, 30, 200, 100, 0x000000, 0.6);
        uiBackground.setDepth(199);
        uiBackground.setStrokeStyle(1, 0xffffff, 0.3);
        
        // 生命值显示
        this.healthText = this.add.text(20, 20, `生命值: ${this.player.health}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.healthText.setDepth(200);
        
        // 关卡信息
        this.levelText = this.add.text(20, 45, `关卡: ${this.currentLevel}`, {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.levelText.setDepth(200);
        
        // 敌人计数
        this.enemyText = this.add.text(20, 70, `敌人: ${this.enemiesKilled}/${this.totalEnemies}`, {
            fontSize: '16px',
            fill: '#ff8888',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.enemyText.setDepth(200);
    }

    spawnEnemies() {
        console.log('开始生成敌人...');
        
        this.enemies = [];
        this.enemiesKilled = 0;
        
        // 根据关卡设置敌人数量
        const enemyCount = 5;
        this.totalEnemies = enemyCount;
        
        // 确保有骷髅敌人（可以射击）
        const enemyTypes = ['zombie', 'skeleton', 'skeleton', 'zombie', 'skeleton'];
        
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            let validPosition = false;
            let attempts = 0;
            
            // 确保敌人不会生成在玩家附近或墙壁上
            while (!validPosition && attempts < 50) {
                x = Phaser.Math.Between(100, 700);
                y = Phaser.Math.Between(100, 500);
                
                const distanceToPlayer = Phaser.Math.Distance.Between(
                    x, y, this.player.sprite.x, this.player.sprite.y
                );
                
                // 检查是否在墙壁上
                let onWall = false;
                this.walls.getChildren().forEach(wall => {
                    const wallBounds = wall.getBounds();
                    if (wallBounds.contains(x, y)) {
                        onWall = true;
                    }
                });
                
                // 检查是否与其他敌人太近
                let tooCloseToOtherEnemy = false;
                for (const existingEnemy of this.enemies) {
                    const distanceToEnemy = Phaser.Math.Distance.Between(
                        x, y, existingEnemy.sprite.x, existingEnemy.sprite.y
                    );
                    if (distanceToEnemy < 80) {
                        tooCloseToOtherEnemy = true;
                        break;
                    }
                }
                
                if (distanceToPlayer > 200 && !onWall && !tooCloseToOtherEnemy) {
                    validPosition = true;
                }
                attempts++;
            }
            
            if (validPosition) {
                const type = enemyTypes[i];
                const enemy = new Enemy(this, x, y, type);
                this.enemies.push(enemy);
                
                // 敌人与墙壁碰撞
                this.physics.add.collider(enemy.sprite, this.walls);
                
                console.log(`生成 ${type} 敌人 at (${x}, ${y}) - 可以射击: ${enemy.canShoot}`);
            }
        }
        
        this.updateEnemyText();
        console.log(`生成了 ${this.enemies.length} 个敌人`);
    }

    update() {
        if (this.player) {
            this.player.update();
        }
        
        // 更新所有敌人
        this.enemies.forEach(enemy => {
            if (enemy.isAlive && enemy.sprite && enemy.sprite.active) {
                enemy.update();
            }
        });
    }

    onEnemyDied(enemy) {
        this.enemiesKilled++;
        this.updateEnemyText();
        
        console.log(`敌人被击杀，当前: ${this.enemiesKilled}/${this.totalEnemies}`);
        
        // 检查是否所有敌人都被消灭
        if (this.enemiesKilled >= this.totalEnemies) {
            console.log('所有敌人都被消灭，显示通关界面');
            this.showLevelComplete();
        }
    }

    updateEnemyText() {
        if (this.enemyText) {
            this.enemyText.setText(`敌人: ${this.enemiesKilled}/${this.totalEnemies}`);
        }
    }

    updateHealthUI() {
        if (this.healthText) {
            this.healthText.setText(`生命值: ${this.player.health}`);
        }
    }

    showLevelComplete() {
        // 创建通关窗口
        const windowWidth = 300;
        const windowHeight = 200;
        
        // 背景面板
        const panel = this.add.rectangle(400, 300, windowWidth, windowHeight, 0x000000, 0.8);
        panel.setStrokeStyle(2, 0xffffff);
        panel.setDepth(300);
        
        // 标题
        const title = this.add.text(400, 250, '关卡完成!', {
            fontSize: '24px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        });
        title.setOrigin(0.5);
        title.setDepth(301);
        
        // 信息文本
        const info = this.add.text(400, 290, `击败所有 ${this.totalEnemies} 个敌人`, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        info.setOrigin(0.5);
        info.setDepth(301);
        
        // 下一关按钮
        const nextLevelButton = this.add.rectangle(400, 340, 120, 40, 0x00aa00);
        nextLevelButton.setDepth(301);
        nextLevelButton.setInteractive();
        
        const buttonText = this.add.text(400, 340, '下一关卡', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        buttonText.setOrigin(0.5);
        buttonText.setDepth(302);
        
        // 按钮点击事件
        nextLevelButton.on('pointerdown', () => {
            this.goToNextLevel();
        });
        
        nextLevelButton.on('pointerover', () => {
            nextLevelButton.setFillStyle(0x00ff00);
        });
        
        nextLevelButton.on('pointerout', () => {
            nextLevelButton.setFillStyle(0x00aa00);
        });
    }

    goToNextLevel() {
        if (this.currentLevel < this.totalLevels) {
            this.currentLevel++;
            console.log(`进入第 ${this.currentLevel} 关`);
            this.scene.restart();
        } else {
            // 游戏通关
            this.showGameComplete();
        }
    }

    showGameComplete() {
        // 游戏通关界面
        const panel = this.add.rectangle(400, 300, 350, 250, 0x000000, 0.9);
        panel.setStrokeStyle(3, 0xffff00);
        panel.setDepth(300);
        
        const title = this.add.text(400, 250, '游戏通关!', {
            fontSize: '32px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        });
        title.setOrigin(0.5);
        title.setDepth(301);
        
        const congrats = this.add.text(400, 300, '恭喜你完成了所有关卡!', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        congrats.setOrigin(0.5);
        congrats.setDepth(301);
        
        const restartButton = this.add.rectangle(400, 350, 140, 40, 0x0088ff);
        restartButton.setDepth(301);
        restartButton.setInteractive();
        
        const restartText = this.add.text(400, 350, '重新开始游戏', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        restartText.setOrigin(0.5);
        restartText.setDepth(302);
        
        restartButton.on('pointerdown', () => {
            this.currentLevel = 1;
            this.scene.restart();
        });
    }

    gameOver() {
        // 游戏结束逻辑
        const panel = this.add.rectangle(400, 300, 300, 200, 0x000000, 0.8);
        panel.setStrokeStyle(2, 0xff0000);
        panel.setDepth(300);
        
        const title = this.add.text(400, 280, '游戏结束', {
            fontSize: '24px',
            fill: '#ff0000',
            fontFamily: 'Arial'
        });
        title.setOrigin(0.5);
        title.setDepth(301);
        
        const restartButton = this.add.rectangle(400, 330, 120, 40, 0xaa0000);
        restartButton.setDepth(301);
        restartButton.setInteractive();
        
        const restartText = this.add.text(400, 330, '重新开始', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        restartText.setOrigin(0.5);
        restartText.setDepth(302);
        
        restartButton.on('pointerdown', () => {
            this.currentLevel = 1;
            this.scene.restart();
        });
    }
}
