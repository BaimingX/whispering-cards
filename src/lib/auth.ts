import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { prisma } from './db';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from "@auth/core/adapters";

const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE_NAME = 'whispering-cards-auth';

// 创建一个包装函数，用于将驼峰命名转换为蛇形命名
function camelToSnake(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    // 将驼峰转换为蛇形: camelCase -> camel_case
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    result[snakeKey] = obj[key];
  });
  
  return result;
}

// 将蛇形命名转换为驼峰命名
function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    // 将蛇形转换为驼峰: snake_case -> snakeCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  });
  
  return result;
}

// 自定义Prisma适配器，兼容snake_case数据库字段
export function CustomPrismaAdapter(p: PrismaClient): Adapter {
  return {
    createUser: (data) => {
      // 将驼峰命名转换为蛇形命名
      const snakeCaseData: any = {
        name: data.name,
        email: data.email,
        image: data.image,
      };
      
      // 特别处理驼峰字段到蛇形字段的映射
      if (data.emailVerified !== undefined) {
        snakeCaseData.email_verified = data.emailVerified;
      }
      
      console.log("创建用户数据:", snakeCaseData);
      
      return p.user.create({ 
        data: snakeCaseData 
      }) as unknown as Promise<AdapterUser>;
    },
    getUser: (id) => {
      return p.user.findUnique({ where: { id } })
        .then(user => {
          if (!user) return null;
          
          // 将蛇形字段转为驼峰
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: (user as any).email_verified,
            image: user.image
          } as AdapterUser;
        });
    },
    getUserByEmail: (email) => {
      // 使用原始SQL查询以确保正确获取用户
      return p.$queryRaw`
        SELECT * FROM users WHERE email = ${email} LIMIT 1
      `.then((result: unknown) => {
        const users = result as any[];
        if (!users || users.length === 0) return null;
        
        const user = users[0];
        // 转换蛇形命名字段为驼峰命名
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.email_verified,
          image: user.image
        } as AdapterUser;
      });
    },
    async getUserByAccount(provider_providerAccountId) {
      const { provider, providerAccountId } = provider_providerAccountId;
      
      console.log("查找账号:", provider, providerAccountId);
      
      try {
        // 使用蛇形字段名进行原始查询
        const account = await p.$queryRaw`
          SELECT a.*, u.* FROM accounts a
          JOIN users u ON a.user_id = u.id
          WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
          LIMIT 1
        `;
        
        const accounts = account as any[];
        if (!accounts || !accounts.length) {
          console.log("未找到关联账号");
          return null;
        }
        
        console.log("找到账号关联的用户:", accounts[0]);
        
        // 从查询结果构建用户对象
        const user = {
          id: accounts[0].user_id, // 确保使用正确的用户ID
          name: accounts[0].name,
          email: accounts[0].email,
          emailVerified: accounts[0].email_verified,
          image: accounts[0].image
        };
        
        return user as AdapterUser;
      } catch (error) {
        console.error("查找账号时出错:", error);
        return null;
      }
    },
    updateUser: ({ id, ...data }) => {
      // 处理驼峰转蛇形
      const snakeCaseData: any = {};
      
      if (data.name !== undefined) snakeCaseData.name = data.name;
      if (data.email !== undefined) snakeCaseData.email = data.email;
      if (data.image !== undefined) snakeCaseData.image = data.image;
      if (data.emailVerified !== undefined) snakeCaseData.email_verified = data.emailVerified;
      
      return p.user.update({
        where: { id },
        data: snakeCaseData
      }) as unknown as Promise<AdapterUser>;
    },
    deleteUser: (id) => {
      return p.user.delete({ where: { id } }) as unknown as Promise<AdapterUser>;
    },
    linkAccount: async (data) => {
      // 记录操作日志
      console.log("链接账号数据:", data);
      
      try {
        // 手动插入数据到accounts表
        const result = await prisma.$executeRaw`
          INSERT INTO accounts (
            id, type, provider, provider_account_id, user_id,
            refresh_token, access_token, expires_at, token_type,
            scope, id_token, session_state
          ) VALUES (
            ${data.id || uuidv4()},
            ${data.type},
            ${data.provider},
            ${data.providerAccountId},
            ${data.userId},
            ${data.refresh_token},
            ${data.access_token},
            ${data.expires_at},
            ${data.token_type},
            ${data.scope},
            ${data.id_token},
            ${data.session_state}
          )
        `;
        
        console.log("账号链接结果:", result);
        
        // 返回账号数据
        return {
          ...data,
          // 确保返回与AdapterAccount兼容的对象
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          type: data.type,
          userId: data.userId
        } as AdapterAccount;
      } catch (error) {
        console.error("链接账号错误:", error);
        // 如果出错但账号可能已存在，尝试查找并返回
        if (error instanceof Error && error.message.includes('duplicate key')) {
          const existingAccount = await p.$queryRaw`
            SELECT * FROM accounts 
            WHERE provider = ${data.provider} 
            AND provider_account_id = ${data.providerAccountId}
            LIMIT 1
          `;
          
          const accounts = existingAccount as any[];
          if (accounts && accounts.length > 0) {
            return {
              id: accounts[0].id,
              userId: accounts[0].user_id,
              type: accounts[0].type,
              provider: accounts[0].provider,
              providerAccountId: accounts[0].provider_account_id,
            } as AdapterAccount;
          }
        }
        throw error;
      }
    },
    unlinkAccount: (provider_providerAccountId) => {
      const { provider, providerAccountId } = provider_providerAccountId;
      
      return p.$executeRaw`
        DELETE FROM accounts 
        WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
      `.then(() => undefined) as Promise<void>;
    },
    async getSessionAndUser(sessionToken) {
      const result = await p.$queryRaw`
        SELECT s.*, u.* FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken}
        LIMIT 1
      `;

      const results = result as any[];
      if (!results || !results.length) return null;
      
      const sessionData = results[0];
      
      // 将蛇形字段转为驼峰以便nextauth使用
      const user = {
        id: sessionData.id,
        name: sessionData.name,
        email: sessionData.email,
        emailVerified: sessionData.email_verified,
        image: sessionData.image
      };
      
      const session = {
        id: sessionData.id,
        sessionToken: sessionData.session_token,
        userId: sessionData.user_id,
        expires: sessionData.expires
      };
      
      return { 
        user: user as AdapterUser, 
        session: session as AdapterSession 
      };
    },
    createSession: (data) => {
      // 将驼峰字段转换为蛇形字段
      const sessionId = uuidv4(); // 生成新的ID
      
      console.log("创建会话:", data);
      
      return p.$executeRaw`
        INSERT INTO sessions (id, session_token, user_id, expires)
        VALUES (${sessionId}, ${data.sessionToken}, ${data.userId}, ${data.expires})
      `.then(() => {
        return {
          id: sessionId,
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: data.expires
        } as AdapterSession;
      });
    },
    updateSession: (data) => {
      const updateFields = [];
      const params: any[] = [data.sessionToken]; // 第一个参数是sessionToken，用于WHERE条件
      
      if (data.expires) {
        updateFields.push("expires = $" + (params.length + 1));
        params.push(data.expires);
      }
      
      if (updateFields.length === 0) return Promise.resolve(data as AdapterSession);
      
      const query = `
        UPDATE sessions 
        SET ${updateFields.join(", ")} 
        WHERE session_token = $1
        RETURNING *
      `;
      
      return p.$queryRawUnsafe(query, ...params).then((result: any) => {
        const sessions = result as any[];
        if (!sessions || !sessions.length) return data as AdapterSession;
        
        return {
          id: sessions[0].id,
          sessionToken: sessions[0].session_token,
          userId: sessions[0].user_id,
          expires: sessions[0].expires
        } as AdapterSession;
      });
    },
    deleteSession: (sessionToken) => {
      return p.$executeRaw`
        DELETE FROM sessions WHERE session_token = ${sessionToken}
      `.then(() => undefined) as Promise<void>;
    },
    async createVerificationToken(data) {
      await p.verificationToken.create({
        data,
      });
      
      // 返回不带id字段的数据
      return { ...data };
    },
    async useVerificationToken(identifier_token) {
      try {
        const result = await p.$queryRaw`
          DELETE FROM verification_tokens 
          WHERE identifier = ${identifier_token.identifier} AND token = ${identifier_token.token}
          RETURNING identifier, token, expires
        `;
        
        const tokens = result as any[];
        if (!tokens || !tokens.length) return null;
        
        return {
          identifier: tokens[0].identifier,
          token: tokens[0].token,
          expires: tokens[0].expires
        };
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2025")
          return null;
        throw error;
      }
    },
    async getAccount(providerAccountId, provider) {
      const result = await p.$queryRaw`
        SELECT * FROM accounts
        WHERE provider_account_id = ${providerAccountId} AND provider = ${provider}
        LIMIT 1
      `;
      
      const accounts = result as any[];
      if (!accounts || !accounts.length) return null;
      
      // 转换成适配器期望的字段格式
      return {
        id: accounts[0].id,
        userId: accounts[0].user_id,
        type: accounts[0].type,
        provider: accounts[0].provider,
        providerAccountId: accounts[0].provider_account_id,
        refresh_token: accounts[0].refresh_token,
        access_token: accounts[0].access_token,
        expires_at: accounts[0].expires_at,
        token_type: accounts[0].token_type,
        scope: accounts[0].scope,
        id_token: accounts[0].id_token,
        session_state: accounts[0].session_state
      } as AdapterAccount;
    },
  };
}

// NextAuth 配置
export const authOptions: NextAuthOptions = {
  debug: true, // 开启调试模式
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-client-secret",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // 当用户首次登录时，account 会包含 providerAccountId
      if (account && user) {
        token.id = user.id;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // 当使用JWT策略时，回调接收token而不是user
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async signIn({ user, account, profile, email }) {
      try {
        console.log("登录开始，用户信息:", user);
        console.log("账号信息:", account);
        
        if (!account || !user) {
          console.error("缺少账号或用户信息");
          return false;
        }
        
        // 先查询是否有该邮箱的用户
        let existingUser = null;
        if (user.email) {
          const users = await prisma.$queryRaw`
            SELECT * FROM users WHERE email = ${user.email} LIMIT 1
          ` as any[];
          
          if (users && users.length > 0) {
            existingUser = users[0];
            console.log("找到现有用户:", existingUser);
          }
        }
        
        // 查询是否已存在该账号
        const accounts = await prisma.$queryRaw`
          SELECT * FROM accounts 
          WHERE provider = ${account.provider} 
          AND provider_account_id = ${account.providerAccountId}
          LIMIT 1
        ` as any[];
        
        const existingAccount = accounts && accounts.length > 0 ? accounts[0] : null;
        console.log("现有账号:", existingAccount);
        
        // 如果账号不存在，创建新账号并链接
        if (!existingAccount) {
          if (existingUser) {
            // 用户存在但账号不存在，创建账号并关联
            console.log("用户存在，创建并关联账号");
            await prisma.$executeRaw`
              INSERT INTO accounts (
                id, type, provider, provider_account_id, user_id,
                refresh_token, access_token, expires_at, token_type,
                scope, id_token, session_state
              ) VALUES (
                ${uuidv4()},
                ${account.type},
                ${account.provider},
                ${account.providerAccountId},
                ${existingUser.id},
                ${account.refresh_token},
                ${account.access_token},
                ${account.expires_at},
                ${account.token_type},
                ${account.scope},
                ${account.id_token},
                ${account.session_state}
              )
            `;
          } else {
            // 用户和账号都不存在，需要先创建用户
            console.log("创建新用户和账号");
            const userId = user.id || uuidv4();
            
            // 创建用户
            const createdUser = await prisma.$executeRaw`
              INSERT INTO users (
                id, name, email, email_verified, image, created_at, shared_today
              ) VALUES (
                ${userId},
                ${user.name},
                ${user.email},
                ${(user as any).emailVerified || null},
                ${user.image},
                ${new Date()},
                ${false}
              )
            `;
            
            console.log("用户创建结果:", createdUser);
            
            // 创建并关联账号
            await prisma.$executeRaw`
              INSERT INTO accounts (
                id, type, provider, provider_account_id, user_id,
                refresh_token, access_token, expires_at, token_type,
                scope, id_token, session_state
              ) VALUES (
                ${uuidv4()},
                ${account.type},
                ${account.provider},
                ${account.providerAccountId},
                ${userId},
                ${account.refresh_token},
                ${account.access_token},
                ${account.expires_at},
                ${account.token_type},
                ${account.scope},
                ${account.id_token},
                ${account.session_state}
              )
            `;
          }
        } else if (existingUser && existingAccount.user_id !== existingUser.id) {
          // 账号存在但与不同用户关联，这是OAuthAccountNotLinked的情况
          console.error("账号已与其他用户关联，无法登录");
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("登录处理错误:", error);
        return false;
      }
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  secret: process.env.NEXTAUTH_SECRET || "your-super-secret-key-for-whispering-cards-project",
};

// 从NextAuth获取用户信息
export async function getUser(req: NextRequest) {
  try {
    // 尝试从会话获取用户
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return {
        id: session.user.id,
        isNew: false
      };
    }

    // 会话中无用户，尝试从cookie获取
    const cookie = req.cookies.get(COOKIE_NAME);
    
    if (cookie?.value) {
      try {
        const decoded = jwt.verify(cookie.value, JWT_SECRET) as { id: string };
        
        // 验证用户是否存在于数据库
        const user = await prisma.user.findUnique({
          where: { id: decoded.id }
        });
        
        if (user) {
          return {
            id: decoded.id,
            isNew: false
          };
        }
      } catch (error) {
        console.error('JWT验证失败:', error);
      }
    }
    
    // 没有有效的会话或cookie，创建新的匿名用户
    const userId = uuidv4();
    return {
      id: userId,
      isNew: true
    };
  } catch (error) {
    console.error('获取用户错误:', error);
    // 发生错误时返回匿名用户
    const userId = uuidv4();
    return {
      id: userId,
      isNew: true
    };
  }
}

// 设置用户ID cookie
export function setUserIdCookie(response: NextResponse, userId: string) {
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30天
    path: '/'
  });
  
  return response;
} 