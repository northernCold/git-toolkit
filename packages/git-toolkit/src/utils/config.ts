/**
 * 配置管理模块
 * @module utils/config
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 加载 .env 文件
 * @param envPath - .env 文件路径
 */
async function loadEnvFile(envPath: string): Promise<void> {
  if (!existsSync(envPath)) {
    return;
  }

  const content = await readFile(envPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();

    // 只在环境变量未设置时才设置
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/**
 * 初始化配置（加载 .env 文件）
 */
export async function initConfig(): Promise<void> {
  // 尝试从包目录加载 .env
  const packageEnvPath = resolve(__dirname, '../../.env');
  await loadEnvFile(packageEnvPath);

  // 尝试从当前工作目录加载 .env（优先级更高）
  const cwdEnvPath = resolve(process.cwd(), '.env');
  await loadEnvFile(cwdEnvPath);
}

/**
 * 获取配置项
 */
export const config = {
  /**
   * 获取 Jenkins URL
   * @returns Jenkins URL，如果未配置则返回空字符串
   */
  get jenkinsUrl(): string {
    return process.env.JENKINS_URL || '';
  },
};

