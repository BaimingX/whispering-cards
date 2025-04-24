// 卡牌稀有度
export enum Rarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY'
}

// 卡牌实例品质
export enum Quality {
  COMMON = 'COMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY'
}

// 卡牌类型
export interface Card {
  id: string;
  name: string;
  lore: string;
  mod: number;
  rarity: Rarity;
  oldGodId?: string;
  createdAt: Date;
  oldGod?: OldGod;
}

// 用户拥有的卡牌实例
export interface CardInstance {
  id: string;
  userId: string;
  cardId: string;
  quality: Quality;
  createdAt: Date;
  card?: Card;
}

// 抽卡记录
export interface CardDraw {
  userId: string;
  date: string;
  canDrawAgain: boolean;
  createdAt: Date;
}

// 剧本
export interface Scenario {
  id: string;
  name: string;
  description: string;
  steps: ScenarioStep[];
  rewardCardId?: string;
  createdAt: Date;
}

// 剧本步骤
export interface ScenarioStep {
  question: string;
  choices: string[];
  successOn: number; // 正确选项的索引
}

// 古神类型
export interface OldGod {
  id: string;
  name: string;
  alias?: string;
  personality: string;
  stylePrompt: string;
  imageUrl?: string;
  createdAt: Date;
}

// 占卜响应类型
export interface OracleResponse {
  roll: number;
  content: {
    omen: string;
    advice: string;
  };
}

// 掷骰结果
export interface RollResult {
  base: number;
  bonus: number;
  final: number;
  type: string;
}

// 献祭的卡牌信息
export interface OfferedCard {
  id: string;
  name: string;
  mod: number;
} 