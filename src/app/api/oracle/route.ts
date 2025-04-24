import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma, supabase } from '@/lib/db';
import { getUser, authOptions } from '@/lib/auth';
import { OracleResponse } from '@/core/types';
import { OpenAI } from 'openai';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

export async function POST(req: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 获取用户
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 解析请求体
    const { topic, offeredCardIds, old_god_id } = await req.json();
    
    if (!topic || !old_god_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    // 获取古神信息
    const { data: old_god, error } = await supabase
      .from('old_gods')
      .select('*')
      .eq('id', old_god_id)
      .single(); // 🚀 只取一条记录

    if (error) {
      console.error('获取旧神失败:', error.message);
      throw new Error('获取旧神失败');
    }
    
    if (!old_god) {
      return NextResponse.json({ error: '古神不存在' }, { status: 404 });
    }
    
    // 计算基础掷骰结果 (1-20)
    const baseRoll = Math.floor(Math.random() * 20) + 1;
    
    // 获取所有祭品卡牌的加成
    let totalMod = 0;
    let offeredCards: any[] = [];
    
    if (offeredCardIds && offeredCardIds.length > 0) {
      // 验证用户拥有这些卡牌
      offeredCards = await prisma.cardInstance.findMany({
        where: {
          id: { in: offeredCardIds },
          user_id: user.id
        },
        include: { card: true }
      });
      
      // 计算总加成
      totalMod = offeredCards.reduce((sum, instance) => sum + (instance.card?.mod || 0), 0);
    }
    
    // 最终掷骰结果
    const finalRoll = Math.min(20, baseRoll + totalMod);
    
    // 准备提示词
    const systemPrompt = `
你是古老的神秘存在"${old_god.name}" (${old_god.alias || ""})，具有以下特性：${old_god.personality}。

${old_god.style_prompt}

基于用户的问题和掷骰结果，提供一个神秘的预言和简短的建议。
回答格式为JSON，包含两个字段：
1. "omen": 神秘且有隐喻的预兆 (50-80字)
2. "advice": 实用但模糊的建议 (30-50字)

掷骰结果: ${finalRoll} (范围1-20，低=不详，高=祥瑞)
用户问题: ${topic}
`;

    // 调用OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });
    
    // 解析返回内容
    const responseContent = JSON.parse(completion.choices[0].message.content || "{}");
    
    // 构建响应对象
    const response: OracleResponse = {
      roll: finalRoll,
      content: {
        omen: responseContent.omen || "神明沉默不语...",
        advice: responseContent.advice || "迷雾中的指引无法辨明..."
      }
    };
    
    // 如果有祭品卡牌，删除它们
    if (offeredCards.length > 0) {
      await prisma.cardInstance.deleteMany({
        where: {
          id: { in: offeredCardIds },
          user_id: user.id
        }
      });
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('占卜出错:', error);
    return NextResponse.json({ error: '占卜失败' }, { status: 500 });
  }
} 