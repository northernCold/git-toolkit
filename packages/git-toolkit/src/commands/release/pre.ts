/**
 * release pre 命令 - 部署到预生产环境
 * @module commands/release/pre
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  isWorkingTreeClean,
  getCurrentBranch,
  isOnReleaseBranch,
  extractVersionFromBranch,
  checkout,
  pull,
  mergeBranch,
  push,
  branchExists,
  hasConflicts,
} from '../../utils/git.js';
import { config } from '../../utils/config.js';

/**
 * 执行 release pre 命令
 */
export async function preCommand(): Promise<void> {
  p.intro(pc.bgYellow(pc.black(' 部署到预生产环境 ')));

  const s = p.spinner();

  try {
    // 1. 检查工作区
    s.start('检查工作区状态...');
    const isClean = await isWorkingTreeClean();
    if (!isClean) {
      s.stop('工作区检查失败');
      p.cancel(pc.red('工作区有未提交的改动，请先提交或暂存'));
      process.exit(1);
    }
    s.stop('工作区干净 ✓');

    // 2. 检查当前分支
    s.start('检查当前分支...');
    const currentBranch = await getCurrentBranch();
    const isRelease = await isOnReleaseBranch();
    
    if (!isRelease) {
      s.stop('分支检查失败');
      p.cancel(pc.red(`当前分支 ${currentBranch} 不是发布分支 (p/xxx)，请先切换到发布分支`));
      process.exit(1);
    }
    
    const version = extractVersionFromBranch(currentBranch);
    s.stop(`当前发布分支: ${currentBranch} ✓`);

    // 3. 检查 pre 分支是否存在
    const preExists = await branchExists('pre') || await branchExists('origin/pre');
    
    // 4. 切换到 pre 分支
    s.start('切换到 pre 分支...');
    if (preExists) {
      await checkout('pre');
      s.stop('已切换到 pre 分支 ✓');
      
      // 5. 拉取最新
      s.start('拉取 pre 分支最新代码...');
      await pull('pre');
      s.stop('pre 分支已更新 ✓');
    } else {
      // 如果 pre 分支不存在，基于发布分支创建
      p.note('pre 分支不存在，将基于发布分支创建', '提示');
      await checkout('-b pre');
      s.stop('已创建并切换到 pre 分支 ✓');
    }

    // 6. 合并发布分支
    s.start(`合并发布分支 ${currentBranch}...`);
    try {
      await mergeBranch(currentBranch);
      
      if (await hasConflicts()) {
        s.stop('合并时发生冲突');
        p.note(
          `请手动解决冲突后执行:\n  git add .\n  git commit\n  git push origin pre`,
          pc.yellow('合并冲突')
        );
        process.exit(1);
      }
      
      s.stop(`${currentBranch} 合并成功 ✓`);
    } catch (error) {
      s.stop('合并失败');
      throw error;
    }

    // 7. 推送 pre 分支
    s.start('推送 pre 分支到远程...');
    await push('pre');
    s.stop('pre 分支已推送到远程 ✓');

    // 8. 切回发布分支
    s.start(`切回发布分支 ${currentBranch}...`);
    await checkout(currentBranch);
    s.stop(`已切回 ${currentBranch} ✓`);

    p.outro(pc.green('✓ 预生产环境部署准备完成！'));

    // 9. 提示 Jenkins 操作
    if (config.jenkinsUrl) {
      p.note(
        `请访问 Jenkins 构建 pre 分支:\n${pc.cyan(config.jenkinsUrl)}\n\n验收通过后执行: ${pc.cyan('gtk release prod')}`,
        'Jenkins 构建'
      );
    } else {
      p.note(
        `请在 CI/CD 系统中构建 pre 分支\n\n验收通过后执行: ${pc.cyan('gtk release prod')}`,
        '下一步'
      );
    }

  } catch (error) {
    s.stop('操作失败');
    p.cancel(pc.red(`错误: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

