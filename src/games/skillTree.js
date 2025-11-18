// skillTree.js - 属性加点树模块
class SkillTree {
    constructor() {
        this.skills = {
            health: {
                name: 'Health',
                level: 0,
                maxLevel: 5,
                cost: 100,
                effect: (player) => { player.maxHealth += 10; } // 示例效果
            },
            attack: {
                name: 'Attack',
                level: 0,
                maxLevel: 5,
                cost: 100,
                effect: (player) => { player.attackDamage += 5; } // 示例效果
            }
            // 可以添加更多技能，如防御、速度等
        };
        this.availablePoints = 0;
    }

    addPoint(skillName, player) {
        let skill = this.skills[skillName];
        if (skill && skill.level < skill.maxLevel && this.availablePoints > 0) {
            skill.level++;
            this.availablePoints--;
            skill.effect(player); // 应用效果到玩家
            return true;
        }
        return false;
    }

    gainPoints(points) {
        this.availablePoints += points;
    }

    getSkillInfo(skillName) {
        return this.skills[skillName];
    }
}
