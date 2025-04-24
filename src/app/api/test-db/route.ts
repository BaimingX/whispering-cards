import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 尝试获取用户数量，检查数据库连接
    const usersCount = await prisma.user.count();
    
    return NextResponse.json({ 
      success: true, 
      message: "数据库连接成功",
      usersCount
    });
  } catch (error) {
    console.error("数据库连接错误:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "数据库连接失败", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 