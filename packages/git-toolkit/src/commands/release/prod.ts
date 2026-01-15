/**
 * release prod 命令 - 正式发版打标
 * @module commands/release/prod
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  isWorkingTreeClean,
  getCurrentBranch,
  isOnReleaseBranch,
  extractVersionFromBranch,
  createTag,
  pushTag,
  checkoutReleaseBranch,
} from '../../utils/git.js';
import { config } from '../../utils/config.js';

/**
 * 执行 release prod 命令
 * @param inputVersion - 可选的版本号，如果提供则自动切换到对应的发布分支
 */
export async function prodCommand(inputVersion?: string): Promise<void> {
  p.intro(pc.bgGreen(pc.black(' 正式发版打标 ')));

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
    let currentBranch: string;
    let version: string;
    if (inputVersion) {
      s.start(`切换到发布分支 p/${inputVersion}...`);
      currentBranch = await checkoutReleaseBranch(inputVersion);
      version = inputVersion;
      s.stop(`已切换到发布分支 ${currentBranch}, 版本: ${version} ✓`);
    } else {
      // 检查当前分支
      s.start('检查当前分支...');
      currentBranch = await getCurrentBranch();
      const isRelease = await isOnReleaseBranch();

      if (!isRelease) {
        s.stop('分支检查失败');
        p.cancel(pc.red(`当前分支 ${currentBranch} 不是发布分支 (p/xxx)，请先切换到发布分支`));
        process.exit(1);
      }

      version = extractVersionFromBranch(currentBranch);
      s.stop(`当前发布分支: ${currentBranch}, 版本: ${version} ✓`);
    }

    // 3. 确认发版
    const confirmed = await p.confirm({
      message: `确认要为版本 ${pc.cyan(version)} 创建正式发布 Tag 吗?`,
      initialValue: true,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('操作已取消');
      process.exit(0);
    }

    // 4. 创建 Tag
    const tagName = `v${version}`;
    const tagMessage = `Release ${tagName}`;
    
    s.start(`创建 Tag ${tagName}...`);
    await createTag(tagName, tagMessage);
    s.stop(`Tag ${tagName} 创建成功 ✓`);

    // 5. 推送 Tag
    s.start(`推送 Tag ${tagName} 到远程...`);
    await pushTag(tagName);
    s.stop(`Tag ${tagName} 已推送到远程 ✓`);

    p.outro(pc.green(`✓ 正式发版 ${tagName} 完成！`));

    // 6. 提示 Jenkins 操作
    if (config.jenkinsUrl) {
      p.note(
        `请访问 Jenkins 构建 Tag ${pc.cyan(tagName)} 部署生产环境:\n${pc.cyan(config.jenkinsUrl)}\n\n部署成功后执行: ${pc.cyan('gtk release finish')}`,
        'Jenkins 构建 (生产)'
      );
    } else {
      p.note(
        `请在 CI/CD 系统中构建 Tag ${pc.cyan(tagName)} 部署生产环境\n\n部署成功后执行: ${pc.cyan('gtk release finish')}`,
        '下一步'
      );
    }

  } catch (error) {
    s.stop('操作失败');
    p.cancel(pc.red(`错误: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

