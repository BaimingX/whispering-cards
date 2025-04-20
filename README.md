# 低语卡牌 (Whispering Cards)

一个基于Next.js的互动卡牌游戏应用，包含抽卡、占卜和微型剧本三大功能。

## 项目概述

低语卡牌是一个融合了抽卡游戏与克苏鲁元素的Web应用。主要功能包括：

1. **每日抽卡**：用户每天可以抽取一张卡牌，可通过分享获得额外抽卡机会。
2. **与古神对话**：用户可以掷骰子并献祭卡牌，向古神提问并获得回应。
3. **微型剧本**：用户可以体验短小精悍的互动剧本，不同的选择会导致不同的结局。

## 技术栈

- **前端**：Next.js 14 (App Router)，React，Tailwind CSS
- **后端**：Next.js API Routes (Serverless)
- **数据库**：Prisma + Supabase (PostgreSQL)
- **AI**：OpenAI API (GPT-4 & DALL-E)
- **状态管理**：Zustand，React Query
- **认证**：自定义匿名Cookie认证

## 项目结构

```
whispering-cards/
├─ app/                      # Next.js (App Router)
│  ├─ layout.tsx
│  ├─ page.tsx               # 首页：入口三按钮
│  ├─ daily/                 # ① 每日抽卡
│  │   └─ page.tsx
│  ├─ oracle/                # ② 与古神对话
│  │   └─ page.tsx
│  ├─ scenario/              # ③ 微剧本
│  │   └─ [id]/page.tsx
│  └─ api/
│      ├─ draw/route.ts      # GET  抽卡
│      ├─ share/route.ts     # POST 分享回调
│      └─ oracle/route.ts    # POST 古神判定
├─ components/               # 纯 UI 组件
│  ├─ CardFlip.tsx
│  ├─ RollMeter.tsx
│  └─ ... 
├─ core/                     # 与平台无关的业务逻辑
│  ├─ engine/
│  │   ├─ rng.ts             # 权重随机
│  │   ├─ oracle.ts          # d20 + 献祭算法
│  │   └─ schema.ts          # Zod/JSON schema
│  ├─ types.ts
│  └─ hooks/
│      └─ useDraw.ts
├─ lib/
│  ├─ db.ts                  # Prisma + Supabase URL / Key
│  └─ auth.ts                # 匿名 cookie & userId
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
└─ public/                   # 静态资源
```

## 本地开发

### 前提条件

- Node.js 16+
- PostgreSQL (本地或Supabase)

### 设置步骤

1. 安装依赖：

```bash
npm install
```

2. 设置环境变量，创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

然后编辑 `.env.local` 文件并填入相应的值。

3. 设置数据库：

```bash
npx prisma db push
npx ts-node prisma/seed.ts
```

4. 启动开发服务器：

```bash
npm run dev
```

服务将在 http://localhost:3000 运行。

## 部署

该项目设计为在Vercel上一键部署：

1. Fork该项目到你的GitHub账户
2. 在Vercel上导入项目
3. 设置环境变量
4. 部署

## 示例API

抽卡API使用示例：

```typescript
// 抽取一张卡
const response = await fetch('/api/draw');
const data = await response.json();
// => { card: { id, name, lore, mod, rarity } }
```

占卜API使用示例：

```typescript
// 向古神提问
const response = await fetch('/api/oracle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: '今日的工作运势',
    offeredCardIds: ['card-id-1', 'card-id-2']
  })
});
const data = await response.json();
// => {
//   roll: { base, bonus, final, type },
//   offeredCards: [{ id, name, mod }],
//   oracle: { title, omen, advice }
// }
```

## 许可证

MIT
