/**
 * Git 命令封装工具函数
 * @module utils/git
 */

import { execa } from 'execa';

/** 排除的分支前缀/名称 */
const EXCLUDED_BRANCHES = ['master', 'main', 'pre', 'HEAD'];
const EXCLUDED_PREFIXES = ['p/', 'origin/p/', 'origin/master', 'origin/main', 'origin/pre', 'origin/HEAD'];

/**
 * 执行 Git 命令
 * @param args - Git 命令参数
 * @returns 命令输出
 */
export async function execGit(args: string[]): Promise<string> {
  const { stdout } = await execa('git', args);
  return stdout.trim();
}

/**
 * 检查工作区是否干净（无未提交的改动）
 * @returns 是否干净
 */
export async function isWorkingTreeClean(): Promise<boolean> {
  const status = await execGit(['status', '--porcelain']);
  return status === '';
}

/**
 * 获取当前分支名
 * @returns 当前分支名
 */
export async function getCurrentBranch(): Promise<string> {
  return execGit(['rev-parse', '--abbrev-ref', 'HEAD']);
}

/**
 * 检查当前是否在发布分支 (p/xxx)
 * @returns 是否在发布分支
 */
export async function isOnReleaseBranch(): Promise<boolean> {
  const branch = await getCurrentBranch();
  return branch.startsWith('p/');
}

/**
 * 从发布分支名中提取版本号
 * @param branch - 分支名 (如 p/1.0.0)
 * @returns 版本号
 */
export function extractVersionFromBranch(branch: string): string {
  return branch.replace(/^p\//, '');
}

/**
 * 获取可合并的功能分支列表
 * @returns 功能分支名称数组
 */
export async function getFeatureBranches(): Promise<string[]> {
  // 获取所有分支（本地和远程）
  const output = await execGit(['branch', '-a']);
  const branches = output
    .split('\n')
    .map(b => b.trim().replace(/^\*\s*/, '')) // 移除当前分支标记
    .filter(b => b !== '');

  // 过滤掉非功能分支
  return branches.filter(branch => {
    // 排除特定分支名
    if (EXCLUDED_BRANCHES.includes(branch)) return false;
    
    // 排除特定前缀
    for (const prefix of EXCLUDED_PREFIXES) {
      if (branch.startsWith(prefix)) return false;
    }
    
    // 排除远程跟踪引用
    if (branch.includes('->')) return false;
    
    return true;
  });
}

/**
 * 拉取远程最新信息
 */
export async function fetchOrigin(): Promise<void> {
  await execGit(['fetch', 'origin']);
}

/**
 * 切换到指定分支
 * @param branch - 目标分支名
 */
export async function checkout(branch: string): Promise<void> {
  await execGit(['checkout', branch]);
}

/**
 * 创建并切换到新分支
 * @param branch - 新分支名
 */
export async function checkoutNewBranch(branch: string): Promise<void> {
  await execGit(['checkout', '-b', branch]);
}

/**
 * 拉取当前分支的远程更新
 * @param branch - 分支名
 */
export async function pull(branch: string): Promise<void> {
  await execGit(['pull', 'origin', branch]);
}

/**
 * 合并指定分支
 * @param branch - 要合并的分支名
 */
export async function mergeBranch(branch: string): Promise<void> {
  await execGit(['merge', branch]);
}

/**
 * 使用 --no-ff 策略合并分支（保留合并节点）
 * @param branch - 要合并的分支名
 * @param message - 合并提交信息
 */
export async function mergeNoFastForward(branch: string, message?: string): Promise<void> {
  const args = ['merge', '--no-ff', branch];
  if (message) {
    args.push('-m', message);
  }
  await execGit(args);
}

/**
 * 推送分支到远程
 * @param branch - 分支名
 */
export async function push(branch: string): Promise<void> {
  await execGit(['push', 'origin', branch]);
}

/**
 * 创建带注释的 Tag
 * @param tag - Tag 名称
 * @param message - Tag 说明
 */
export async function createTag(tag: string, message: string): Promise<void> {
  await execGit(['tag', '-a', tag, '-m', message]);
}

/**
 * 推送 Tag 到远程
 * @param tag - Tag 名称
 */
export async function pushTag(tag: string): Promise<void> {
  await execGit(['push', 'origin', tag]);
}

/**
 * 删除本地分支
 * @param branch - 分支名
 */
export async function deleteLocalBranch(branch: string): Promise<void> {
  await execGit(['branch', '-d', branch]);
}

/**
 * 删除远程分支
 * @param branch - 分支名
 */
export async function deleteRemoteBranch(branch: string): Promise<void> {
  await execGit(['push', 'origin', '--delete', branch]);
}

/**
 * 检查分支是否存在
 * @param branch - 分支名
 * @returns 是否存在
 */
export async function branchExists(branch: string): Promise<boolean> {
  try {
    await execGit(['rev-parse', '--verify', branch]);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查是否有合并冲突
 * @returns 是否有冲突
 */
export async function hasConflicts(): Promise<boolean> {
  const status = await execGit(['status', '--porcelain']);
  return status.includes('UU') || status.includes('AA') || status.includes('DD');
}

/**
 * 切换到发布分支（支持从远程拉取）
 * @param version - 版本号
 * @returns 分支名
 */
export async function checkoutReleaseBranch(version: string): Promise<string> {
  const branch = `p/${version}`;
  const localExists = await branchExists(branch);
  const remoteExists = await branchExists(`origin/${branch}`);

  if (!localExists && !remoteExists) {
    throw new Error(`发布分支 ${branch} 不存在`);
  }

  if (localExists) {
    await checkout(branch);
  } else {
    // 本地不存在但远程存在，基于远程创建本地分支
    await execGit(['checkout', '-b', branch, `origin/${branch}`]);
  }

  return branch;
}

