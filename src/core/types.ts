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
  old_god_id?: string;
  created_at: Date;
  old_god?: old_god;
}

// 用户拥有的卡牌实例
export interface CardInstance {
  id: string;
  user_id: string;
  card_id: string;
  quality: Quality;
  created_at: Date;
  card?: Card;
}

// 抽卡记录
export interface CardDraw {
  user_id: string;
  date: string;
  can_draw_again: boolean;
  created_at: Date;
}

// 剧本
export interface Scenario {
  id: string;
  name: string;
  description: string;
  steps: ScenarioStep[];
  reward_card_id?: string;
  created_at: Date;
}

// 剧本步骤
export interface ScenarioStep {
  question: string;
  choices: string[];
  successOn: number; // 正确选项的索引
}

// 古神类型
export interface old_god {
  id: string;
  name: string;
  alias?: string;
  personality: string;
  style_prompt: string;
  image_url?: string;
  created_at: Date;
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