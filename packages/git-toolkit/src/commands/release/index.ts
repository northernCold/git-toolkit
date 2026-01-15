/**
 * release 子命令组
 * @module commands/release
 */

import { Command } from 'commander';
import { startCommand } from './start.js';
import { preCommand } from './pre.js';
import { prodCommand } from './prod.js';
import { finishCommand } from './finish.js';

/**
 * 注册 release 子命令组
 * @param program - Commander 程序实例
 */
export function registerReleaseCommand(program: Command): void {
  const release = program
    .command('release')
    .description('发版工作流自动化');

  release
    .command('start <version>')
    .description('初始化发版分支并合并功能')
    .action(startCommand);

  release
    .command('pre [version]')
    .description('部署到预生产环境')
    .action(preCommand);

  release
    .command('prod [version]')
    .description('正式发版打标')
    .action(prodCommand);

  release
    .command('finish [version]')
    .description('完成发版并清理')
    .action(finishCommand);
}

