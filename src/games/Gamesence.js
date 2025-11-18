// GameScene.js - 使用瓦片集和装饰集版本
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentLevel = 1;
        this.totalLevels = 3;
        this.enemies = [];
        this.enemiesKilled = 0;
        this.totalEnemies = 0;
        this.mapGenerator = new MapGenerator();
        this.mapConfig = null;
        this.tileSize = 32; // 瓦片尺寸
    }

    preload() {
        console.log('预加载资源...');
        
        // 预加载本地背景图片
        this.load.image('background', '../../assets/background.png');
        
        // 预加载地图瓦片集
        this.load.image('tileset', '../../assets/terrain.png'); // 瓦片集图片
        this.load.image('decorations', '../../assets/decorations.png'); // 装饰集图片
        
        // 预加载墙壁纹理（备用）
        this.load.image('wall', '../../assets/wall.png');
        
        console.log('资源预加载完成');
    }

    create() {
        console.log('开始创建场景...');
        
        // 使用MapGenerator生成地图配置
        this.mapConfig = this.mapGenerator.generateMap(this.currentLevel);
        console.log('地图配置生成完成:', this.mapConfig);
        
        console.log(`地图房间数量: ${this.mapConfig.rooms ? this.mapConfig.rooms.length : 0}`);
        if (this.mapConfig.rooms) {
            this.mapConfig.rooms.forEach((room, index) => {
                console.log(`房间 ${index}: (${room.x}, ${room.y}) 尺寸: ${room.width}x${room.height} 类型: ${room.type}`);
            });
        }
        
        // 创建背景
        this.createBackground();
        
        // 使用瓦片集和装饰集创建地图
        this.createMapWithTileset();
        
        // 使用MapGenerator获取玩家起始位置
        const playerStart = this.mapGenerator.getPlayerStartPosition(this.mapConfig);
        this.player = new Player(this, playerStart.x, playerStart.y);
        
        // 创建UI
        this.createUI();
        
        // 生成敌人
        this.spawnEnemies();
        
        // 物理碰撞
        this.physics.add.collider(this.player.sprite, this.walls);
        
        console.log('场景创建完成');
    }

    createMapWithTileset() {
        // 创建墙壁组
        this.walls = this.physics.add.staticGroup();
        
        // 获取瓦片数据
        const tileData = this.mapGenerator.getTileData(this.mapConfig);
        
        // 创建地面层
        this.createGroundLayer(tileData);
        
        // 创建墙壁层
        this.createWallLayer(tileData);
        
        // 创建装饰层
        this.createDecorationLayer();
        
        // 创建障碍物
        this.createObstacles();
    }

    createGroundLayer(tileData) {
        // 创建地面瓦片
        for (let y = 0; y < this.mapConfig.height; y++) {
            for (let x = 0; x < this.mapConfig.width; x++) {
                const tileValue = tileData[y][x];
                const worldX = x * this.tileSize;
                const worldY = y * this.tileSize;
                
                if (tileValue === 1) { // 地面
                    // 使用瓦片集中的地面瓦片
                    const groundTile = this.add.image(worldX, worldY, 'tileset');
                    groundTile.setOrigin(0, 0);
                    groundTile.setDisplaySize(this.tileSize, this.tileSize);
                    
                    // 根据房间类型设置不同的地面样式
                    const room = this.getRoomAtPosition(x, y);
                    if (room) {
                        this.styleGroundTile(groundTile, room.type);
                    }
                }
            }
        }
    }

    createWallLayer(tileData) {
        // 创建墙壁瓦片和碰撞体
        for (let y = 0; y < this.mapConfig.height; y++) {
            for (let x = 0; x < this.mapConfig.width; x++) {
                const tileValue = tileData[y][x];
                const worldX = x * this.tileSize + this.tileSize / 2;
                const worldY = y * this.tileSize + this.tileSize / 2;
                
                if (tileValue === 2) { // 墙壁
                    // 创建墙壁精灵
                    const wallSprite = this.add.image(worldX, worldY, 'tileset');
                    wallSprite.setDisplaySize(this.tileSize, this.tileSize);
                    this.styleWallTile(wallSprite, x, y, tileData);
                    
                    // 创建碰撞体
                    const wall = this.walls.create(worldX, worldY, 'wall')
                        .setDisplaySize(this.tileSize, this.tileSize)
                        .refreshBody();
                    wall.setVisible(false); // 隐藏碰撞体，只显示瓦片
                }
            }
        }
    }

    createDecorationLayer() {
        // 使用装饰集创建装饰物
        if (this.mapConfig.decorations) {
            this.mapConfig.decorations.forEach(decoration => {
                const worldX = decoration.x * this.tileSize + this.tileSize / 2;
                const worldY = decoration.y * this.tileSize + this.tileSize / 2;
                
                this.createDecoration(decoration.type, worldX, worldY);
            });
            console.log(`创建了 ${this.mapConfig.decorations.length} 个装饰物`);
        }
    }

    createObstacles() {
        // 使用装饰集创建障碍物
        if (this.mapConfig.obstacles) {
            this.mapConfig.obstacles.forEach(obstacle => {
                const worldX = obstacle.x * this.tileSize + this.tileSize / 2;
                const worldY = obstacle.y * this.tileSize + this.tileSize / 2;
                
                this.createObstacle(obstacle.type, worldX, worldY);
            });
            console.log(`创建了 ${this.mapConfig.obstacles.length} 个障碍物`);
        }
    }

    getRoomAtPosition(x, y) {
        // 查找包含指定坐标的房间
        return this.mapConfig.rooms.find(room => 
            x >= room.x && x < room.x + room.width &&
            y >= room.y && y < room.y + room.height
        );
    }

    styleGroundTile(tile, roomType) {
        // 根据房间类型设置地面样式
        switch (roomType) {
            case 'start':
                tile.setTint(0x88ff88); // 绿色调
                break;
            case 'boss':
                tile.setTint(0xff8888); // 红色调
                break;
            case 'treasure':
                tile.setTint(0xffff88); // 金黄色调
                break;
            case 'normal':
            default:
                tile.setTint(0x8888ff); // 蓝色调
                break;
        }
        tile.setAlpha(0.8);
    }

    styleWallTile(wall, x, y, tileData) {
        // 根据周围瓦片设置墙壁样式
        const neighbors = this.getWallNeighbors(x, y, tileData);
        
        // 根据邻居数量设置不同的颜色/样式
        if (neighbors.count >= 5) {
            wall.setTint(0x333333); // 内部墙壁
        } else if (neighbors.count >= 3) {
            wall.setTint(0x555555); // 边缘墙壁
        } else {
            wall.setTint(0x777777); // 角落墙壁
        }
        
        // 添加随机变化
        const variation = Math.random();
        if (variation < 0.3) {
            wall.setTint(wall.tintTopLeft + 0x111111);
        } else if (variation < 0.6) {
            wall.setTint(wall.tintTopLeft - 0x111111);
        }
    }

    getWallNeighbors(x, y, tileData) {
        // 计算周围墙壁数量
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.mapConfig.width && 
                    ny >= 0 && ny < this.mapConfig.height && 
                    tileData[ny][nx] === 2) {
                    count++;
                }
            }
        }
        return { count };
    }

    createDecoration(type, x, y) {
        let decoration;
        
        switch (type) {
            case 'torch':
                decoration = this.add.image(x, y, 'decorations');
                decoration.setTint(0xff6600);
                decoration.setDisplaySize(this.tileSize * 0.6, this.tileSize * 0.8);
                // 添加火焰动画效果
                this.add.tween({
                    targets: decoration,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
                break;
                
            case 'skull':
                decoration = this.add.image(x, y, 'decorations');
                decoration.setTint(0xffffff);
                decoration.setDisplaySize(this.tileSize * 0.5, this.tileSize * 0.5);
                break;
                
            case 'bones':
                decoration = this.add.image(x, y, 'decorations');
                decoration.setTint(0xdddddd);
                decoration.setDisplaySize(this.tileSize * 0.7, this.tileSize * 0.3);
                decoration.rotation = Math.random() * Math.PI; // 随机旋转
                break;
                
            default:
                decoration = this.add.image(x, y, 'decorations');
                decoration.setTint(0x666666);
                decoration.setDisplaySize(this.tileSize * 0.4, this.tileSize * 0.4);
        }
        
        decoration.setDepth(10); // 确保装饰物在地面之上
    }

    createObstacle(type, x, y) {
        let obstacle;
        
        switch (type) {
            case 'rock':
                obstacle = this.add.image(x, y, 'decorations');
                obstacle.setTint(0x888888);
                obstacle.setDisplaySize(this.tileSize * 0.8, this.tileSize * 0.8);
                break;
                
            case 'barrel':
                obstacle = this.add.image(x, y, 'decorations');
                obstacle.setTint(0x8B4513);
                obstacle.setDisplaySize(this.tileSize * 0.7, this.tileSize * 0.9);
                break;
                
            default:
                obstacle = this.add.image(x, y, 'decorations');
                obstacle.setTint(0x666666);
                obstacle.setDisplaySize(this.tileSize * 0.6, this.tileSize * 0.6);
        }
        
        // 创建碰撞体
        const wall = this.walls.create(x, y, 'wall')
            .setDisplaySize(this.tileSize * 0.8, this.tileSize * 0.8)
            .refreshBody();
        wall.setVisible(false);
        
        obstacle.setDepth(5);
    }

    // 保留原有的背景创建方法
    createBackground() {
        try {
            this.background = this.add.sprite(400, 300, 'background');
            this.background.setDisplaySize(800, 600);
            this.background.setDepth(0);
            console.log('使用本地背景图片');
        } catch (error) {
            console.log('本地背景图片加载失败，使用默认背景');
            this.background = this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
            this.background.setDepth(0);
        }
        this.createBackgroundGrid();
    }

    createBackgroundGrid() {
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x2a2a3a, 0.3);
        gridGraphics.setDepth(1);
        
        for (let y = 0; y < 600; y += 40) {
            gridGraphics.lineBetween(0, y, 800, y);
        }
        
        for (let x = 0; x < 800; x += 40) {
            gridGraphics.lineBetween(x, 0, x, 600);
        }
        
        this.gridGraphics = gridGraphics;
    }

    // 保留原有的UI和其他方法
    createUI() {
        const uiBackground = this.add.rectangle(100, 30, 200, 100, 0x000000, 0.6);
        uiBackground.setDepth(199);
        uiBackground.setStrokeStyle(1, 0xffffff, 0.3);
        
        this.healthText = this.add.text(20, 20, `生命值: ${this.player.health}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.healthText.setDepth(200);
        
        this.levelText = this.add.text(20, 45, `关卡: ${this.currentLevel}`, {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.levelText.setDepth(200);
        
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
