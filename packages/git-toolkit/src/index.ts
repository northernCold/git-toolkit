#!/usr/bin/env node
/**
 * GRM - Git Release Manager CLI
 * Git 发版工作流自动化工具
 * @module gtk
 */

import { Command } from 'commander';
import { registerReleaseCommand } from './commands/release/index.js';
import { initConfig } from './utils/config.js';

// 初始化配置
await initConfig();

const program = new Command();

program
  .name('gtk')
  .description('Git 工具集 - Git Release Manager')
  .version('1.0.0');

// 注册 release 子命令组
registerReleaseCommand(program);

program.parse();

