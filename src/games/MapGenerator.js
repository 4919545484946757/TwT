class MapGenerator {
    constructor() {
        this.tileSize = 32;
        this.roomTypes = ['start', 'normal', 'boss', 'treasure'];
    }

    generateMap(level = 1) {
        const mapConfig = {
            width: 25,
            height: 25,
            rooms: [],
            connections: []
        };

        // 生成房间布局
        this.generateRooms(mapConfig, level);
        
        // 生成走廊连接
        this.generateCorridors(mapConfig);
        
        // 添加障碍物
        this.addObstacles(mapConfig);
        
        // 添加装饰物
        this.addDecorations(mapConfig);

        return mapConfig;
    }

    generateRooms(mapConfig, level) {
        const roomCount = 5 + Math.floor(level * 1.5);
        const minRoomSize = 3;
        const maxRoomSize = 8;

        for (let i = 0; i < roomCount; i++) {
            const room = {
                id: i,
                x: Math.floor(Math.random() * (mapConfig.width - maxRoomSize - 2)) + 1,
                y: Math.floor(Math.random() * (mapConfig.height - maxRoomSize - 2)) + 1,
                width: minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize)),
                height: minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize)),
                type: this.roomTypes[Math.floor(Math.random() * (this.roomTypes.length - 1))],
                connections: []
            };

            // 第一个房间作为起始房间
            if (i === 0) {
                room.type = 'start';
            }

            // 检查房间重叠
            if (!this.isRoomOverlapping(room, mapConfig.rooms)) {
                mapConfig.rooms.push(room);
            }
        }

        // 确保至少有一个boss房间
        const bossRoom = {
            ...mapConfig.rooms[mapConfig.rooms.length - 1],
            type: 'boss'
        };
        mapConfig.rooms[mapConfig.rooms.length - 1] = bossRoom;
    }

    isRoomOverlapping(newRoom, existingRooms) {
        for (const room of existingRooms) {
            if (newRoom.x < room.x + room.width + 1 &&
                newRoom.x + newRoom.width + 1 > room.x &&
                newRoom.y < room.y + room.height + 1 &&
                newRoom.y + newRoom.height + 1 > room.y) {
                return true;
            }
        }
        return false;
    }

    generateCorridors(mapConfig) {
        // 使用最小生成树算法连接房间
        const rooms = [...mapConfig.rooms];
        
        // 计算所有房间之间的距离
        const edges = [];
        for (let i = 0; i < rooms.length; i++) {
            for (let j = i + 1; j < rooms.length; j++) {
                const distance = this.calculateRoomDistance(rooms[i], rooms[j]);
                edges.push({ from: i, to: j, distance });
            }
        }

        // 按距离排序
        edges.sort((a, b) => a.distance - b.distance);

        // 使用Kruskal算法生成最小生成树
        const parent = Array(rooms.length).fill().map((_, i) => i);
        
        const find = (x) => {
            if (parent[x] !== x) {
                parent[x] = find(parent[x]);
            }
            return parent[x];
        };

        const union = (x, y) => {
            parent[find(x)] = find(y);
        };

        for (const edge of edges) {
            if (find(edge.from) !== find(edge.to)) {
                union(edge.from, edge.to);
                this.createCorridor(rooms[edge.from], rooms[edge.to], mapConfig);
            }
        }
    }

    calculateRoomDistance(room1, room2) {
        const center1 = {
            x: room1.x + room1.width / 2,
            y: room1.y + room1.height / 2
        };
        const center2 = {
            x: room2.x + room2.width / 2,
            y: room2.y + room2.height / 2
        };
        
        return Math.sqrt(
            Math.pow(center1.x - center2.x, 2) + 
            Math.pow(center1.y - center2.y, 2)
        );
    }

    createCorridor(room1, room2, mapConfig) {
        const start = {
            x: Math.floor(room1.x + room1.width / 2),
            y: Math.floor(room1.y + room1.height / 2)
        };
        const end = {
            x: Math.floor(room2.x + room2.width / 2),
            y: Math.floor(room2.y + room2.height / 2)
        };

        // 创建L型走廊
        mapConfig.connections.push({
            points: [
                { x: start.x, y: start.y },
                { x: end.x, y: start.y },
                { x: end.x, y: end.y }
            ]
        });

        room1.connections.push(room2.id);
        room2.connections.push(room1.id);
    }

    addObstacles(mapConfig) {
        mapConfig.obstacles = [];
        
        // 在每个房间内随机添加障碍物
        mapConfig.rooms.forEach(room => {
            const obstacleCount = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < obstacleCount; i++) {
                const obstacle = {
                    x: room.x + 1 + Math.floor(Math.random() * (room.width - 2)),
                    y: room.y + 1 + Math.floor(Math.random() * (room.height - 2)),
                    type: Math.random() > 0.5 ? 'rock' : 'barrel'
                };
                
                mapConfig.obstacles.push(obstacle);
            }
        });
    }

    addDecorations(mapConfig) {
        mapConfig.decorations = [];
        
        // 添加随机装饰物
        mapConfig.rooms.forEach(room => {
            const decorationCount = Math.floor(Math.random() * 2);
            
            for (let i = 0; i < decorationCount; i++) {
                const decoration = {
                    x: room.x + Math.floor(Math.random() * room.width),
                    y: room.y + Math.floor(Math.random() * room.height),
                    type: ['torch', 'skull', 'bones'][Math.floor(Math.random() * 3)]
                };
                
                mapConfig.decorations.push(decoration);
            }
        });
    }

    getTileData(mapConfig) {
        // 创建空的瓦片地图数据
        const data = Array(mapConfig.height).fill().map(() => 
            Array(mapConfig.width).fill(0)
        );

        // 填充房间地面 (1表示地面)
        mapConfig.rooms.forEach(room => {
            for (let y = room.y; y < room.y + room.height; y++) {
                for (let x = room.x; x < room.x + room.width; x++) {
                    if (y >= 0 && y < mapConfig.height && x >= 0 && x < mapConfig.width) {
                        data[y][x] = 1; // 地面瓦片
                    }
                }
            }
        });

        // 填充走廊地面
        mapConfig.connections.forEach(connection => {
            const points = connection.points;
            for (let i = 0; i < points.length - 1; i++) {
                const start = points[i];
                const end = points[i + 1];
                
                // 水平走廊
                if (start.y === end.y) {
                    const minX = Math.min(start.x, end.x);
                    const maxX = Math.max(start.x, end.x);
                    for (let x = minX; x <= maxX; x++) {
                        if (start.y >= 0 && start.y < mapConfig.height && 
                            x >= 0 && x < mapConfig.width) {
                            data[start.y][x] = 1;
                            // 走廊宽度为3
                            if (start.y - 1 >= 0) data[start.y - 1][x] = 1;
                            if (start.y + 1 < mapConfig.height) data[start.y + 1][x] = 1;
                        }
                    }
                }
                // 垂直走廊
                else if (start.x === end.x) {
                    const minY = Math.min(start.y, end.y);
                    const maxY = Math.max(start.y, end.y);
                    for (let y = minY; y <= maxY; y++) {
                        if (y >= 0 && y < mapConfig.height && 
                            start.x >= 0 && start.x < mapConfig.width) {
                            data[y][start.x] = 1;
                            // 走廊宽度为3
                            if (start.x - 1 >= 0) data[y][start.x - 1] = 1;
                            if (start.x + 1 < mapConfig.width) data[y][start.x + 1] = 1;
                        }
                    }
                }
            }
        });

        // 添加墙壁 (2表示墙壁)
        for (let y = 0; y < mapConfig.height; y++) {
            for (let x = 0; x < mapConfig.width; x++) {
                if (data[y][x] === 1) { // 如果是地面
                    // 检查周围的8个方向
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy;
                            const nx = x + dx;
                            if (ny >= 0 && ny < mapConfig.height && 
                                nx >= 0 && nx < mapConfig.width && 
                                data[ny][nx] === 0) {
                                data[ny][nx] = 2; // 墙壁
                            }
                        }
                    }
                }
            }
        }

        return data;
    }

    // 新增方法：获取地图的碰撞数据
    getCollisionData(mapConfig) {
        const tileData = this.getTileData(mapConfig);
        const collisionData = [];
        
        for (let y = 0; y < mapConfig.height; y++) {
            collisionData[y] = [];
            for (let x = 0; x < mapConfig.width; x++) {
                // 0表示可通行，1表示碰撞
                collisionData[y][x] = tileData[y][x] === 0 ? 1 : 0;
            }
        }

        return collisionData;
    }

    // 新增方法：获取玩家起始位置
    getPlayerStartPosition(mapConfig) {
        const startRoom = mapConfig.rooms.find(room => room.type === 'start');
        if (startRoom) {
            return {
                x: (startRoom.x + startRoom.width / 2) * this.tileSize,
                y: (startRoom.y + startRoom.height / 2) * this.tileSize
            };
        }
        return { x: 100, y: 100 }; // 默认位置
    }
}
