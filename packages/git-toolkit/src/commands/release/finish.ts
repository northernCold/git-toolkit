/**
 * release finish 命令 - 完成发版并清理
 * @module commands/release/finish
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
  mergeNoFastForward,
  push,
  deleteLocalBranch,
  deleteRemoteBranch,
  getFeatureBranches,
  hasConflicts,
  checkoutReleaseBranch,
} from '../../utils/git.js';

/**
 * 执行 release finish 命令
 * @param inputVersion - 可选的版本号，如果提供则自动切换到对应的发布分支
 */
export async function finishCommand(inputVersion?: string): Promise<void> {
  p.intro(pc.bgMagenta(pc.black(' 完成发版并清理 ')));

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

    // 2. 如果提供了版本号，切换到对应的发布分支
    let releaseBranch: string;
    let version: string;
    if (inputVersion) {
      s.start(`切换到发布分支 p/${inputVersion}...`);
      releaseBranch = await checkoutReleaseBranch(inputVersion);
      version = inputVersion;
      s.stop(`已切换到发布分支 ${releaseBranch} ✓`);
    } else {
      // 检查当前分支
      s.start('检查当前分支...');
      const currentBranch = await getCurrentBranch();
      const isRelease = await isOnReleaseBranch();

      if (!isRelease) {
        s.stop('分支检查失败');
        p.cancel(pc.red(`当前分支 ${currentBranch} 不是发布分支 (p/xxx)，请先切换到发布分支`));
        process.exit(1);
      }

      version = extractVersionFromBranch(currentBranch);
      releaseBranch = currentBranch;
      s.stop(`当前发布分支: ${releaseBranch} ✓`);
    }

    // 3. 切换到 master
    s.start('切换到 master 分支...');
    await checkout('master');
    s.stop('已切换到 master 分支 ✓');

    // 4. 拉取最新 master
    s.start('拉取 master 分支最新代码...');
    await pull('master');
    s.stop('master 分支已更新 ✓');

    // 5. 使用 --no-ff 合并发布分支（保留合并节点）
    s.start(`合并发布分支 ${releaseBranch} (--no-ff)...`);
    try {
      await mergeNoFastForward(releaseBranch, `Merge release ${version}`);
      
      if (await hasConflicts()) {
        s.stop('合并时发生冲突');
        p.note(
          `请手动解决冲突后执行:\n  git add .\n  git commit\n  git push origin master`,
          pc.yellow('合并冲突')
        );
        process.exit(1);
      }
      
      s.stop(`${releaseBranch} 合并成功 (--no-ff) ✓`);
    } catch (error) {
      s.stop('合并失败');
      throw error;
    }

    // 6. 推送 master
    s.start('推送 master 分支到远程...');
    await push('master');
    s.stop('master 分支已推送到远程 ✓');

    p.note(
      `发布分支 ${releaseBranch} 已成功合并到 master`,
      pc.green('合并完成')
    );

    // 7. 清理分支（交互式）
    const cleanupRelease = await p.confirm({
      message: `是否删除发布分支 ${pc.yellow(releaseBranch)}?`,
      initialValue: true,
    });

    if (p.isCancel(cleanupRelease)) {
      p.cancel('操作已取消');
      process.exit(0);
    }

    if (cleanupRelease) {
      s.start(`删除本地分支 ${releaseBranch}...`);
      try {
        await deleteLocalBranch(releaseBranch);
        s.stop(`本地分支 ${releaseBranch} 已删除 ✓`);
      } catch {
        s.stop(`本地分支 ${releaseBranch} 删除失败（可能已删除）`);
      }

      s.start(`删除远程分支 ${releaseBranch}...`);
      try {
        await deleteRemoteBranch(releaseBranch);
        s.stop(`远程分支 ${releaseBranch} 已删除 ✓`);
      } catch {
        s.stop(`远程分支 ${releaseBranch} 删除失败（可能已删除）`);
      }
    }

    // 8. 询问是否清理功能分支
    const featureBranches = await getFeatureBranches();
    const localFeatures = featureBranches.filter(b => !b.startsWith('remotes/') && !b.startsWith('origin/'));

    if (localFeatures.length > 0) {
      const cleanupFeatures = await p.multiselect<{ value: string; label: string }[], string>({
        message: '选择要删除的已合并功能分支:',
        options: localFeatures.map(branch => ({
          value: branch,
          label: branch,
        })),
        required: false,
      });

      if (!p.isCancel(cleanupFeatures)) {
        const branches = cleanupFeatures as string[];
        for (const branch of branches) {
          s.start(`删除分支 ${branch}...`);
          try {
            await deleteLocalBranch(branch);
            s.stop(`${branch} 已删除 ✓`);
          } catch {
            s.stop(`${branch} 删除失败`);
          }
        }
      }
    }

    p.outro(pc.green(`✓ 发版 v${version} 流程已完成！`));

  } catch (error) {
    s.stop('操作失败');
    p.cancel(pc.red(`错误: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

