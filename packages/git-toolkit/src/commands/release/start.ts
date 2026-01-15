/**
 * release start 命令 - 初始化发版分支并合并功能
 * @module commands/release/start
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  isWorkingTreeClean,
  fetchOrigin,
  checkout,
  pull,
  checkoutNewBranch,
  getFeatureBranches,
  mergeBranch,
  push,
  hasConflicts,
} from '../../utils/git.js';

/**
 * 执行 release start 命令
 * @param version - 发布版本号
 */
export async function startCommand(version: string): Promise<void> {
  const releaseBranch = `p/${version}`;
  
  p.intro(pc.bgCyan(pc.black(` 开始发版 ${version} `)));

  const s = p.spinner();

  try {
    // 1. 环境检查
    s.start('检查工作区状态...');
    const isClean = await isWorkingTreeClean();
    if (!isClean) {
      s.stop('工作区检查失败');
      p.cancel(pc.red('工作区有未提交的改动，请先提交或暂存'));
      process.exit(1);
    }
    s.stop('工作区干净 ✓');

    // 2. 同步远程
    s.start('拉取远程最新信息...');
    await fetchOrigin();
    s.stop('远程同步完成 ✓');

    // 3. 更新 master
    s.start('更新 master 分支...');
    await checkout('master');
    await pull('master');
    s.stop('master 分支已更新 ✓');

    // 4. 创建发布分支
    s.start(`创建发布分支 ${releaseBranch}...`);
    await checkoutNewBranch(releaseBranch);
    s.stop(`发布分支 ${releaseBranch} 已创建 ✓`);

    // 5. 获取功能分支列表
    const featureBranches = await getFeatureBranches();
    
    if (featureBranches.length === 0) {
      p.note('没有找到可合并的功能分支', '提示');
    } else {
      // 6. 交互式选择要合并的功能分支
      const selectedBranches = await p.multiselect<{ value: string; label: string }[], string>({
        message: '选择要合并的功能分支:',
        options: featureBranches.map(branch => ({
          value: branch,
          label: branch,
        })),
        required: false,
      });

      if (p.isCancel(selectedBranches)) {
        p.cancel('操作已取消');
        process.exit(0);
      }

      // 7. 依次合并功能分支
      const branches = selectedBranches as string[];
      if (branches.length > 0) {
        for (const branch of branches) {
          s.start(`合并分支 ${branch}...`);
          try {
            await mergeBranch(branch);
            
            // 检查是否有冲突
            if (await hasConflicts()) {
              s.stop(`合并 ${branch} 时发生冲突`);
              p.note(
                `请手动解决冲突后执行:\n  git add .\n  git commit\n然后重新运行此命令`,
                pc.yellow('合并冲突')
              );
              process.exit(1);
            }
            
            s.stop(`${branch} 合并成功 ✓`);
          } catch (error) {
            s.stop(`合并 ${branch} 失败`);
            p.note(
              `请手动解决后重新运行此命令`,
              pc.red('合并失败')
            );
            throw error;
          }
        }
      }
    }

    // 8. 推送发布分支
    s.start(`推送 ${releaseBranch} 到远程...`);
    await push(releaseBranch);
    s.stop(`${releaseBranch} 已推送到远程 ✓`);

    p.outro(pc.green(`✓ 发版分支 ${releaseBranch} 准备完成！`));
    
    p.note(
      `下一步: 执行 ${pc.cyan('gtk release pre')} 部署到预生产环境`,
      '提示'
    );

  } catch (error) {
    s.stop('操作失败');
    p.cancel(pc.red(`错误: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

