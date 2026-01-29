#!/usr/bin/env node
/**
 * CloudFront Invalidate - 入口脚本
 * @module index
 *
 * 清除 AWS CloudFront CDN 缓存，支持 Jenkins 自动化执行
 */

import { program } from 'commander';
import config from './config.js';
import { createInvalidation, waitForCompletion } from './invalidator.js';

program
  .name('cloudfront-invalidate')
  .description('清除 AWS CloudFront CDN 缓存')
  .requiredOption('-s, --secret <key>', 'AWS Secret Access Key')
  .option('-p, --paths <paths...>', '要清除的路径（可多个），如：-p /index.html -p /css/*')
  .option('-w, --wait', '等待缓存清除完成')
  .parse();

const opts = program.opts();

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(50));
  console.log('CloudFront Invalidate - 开始清除缓存');
  console.log('='.repeat(50));

  const fullConfig = {
    ...config,
    secretAccessKey: opts.secret,
  };

  // 使用命令行参数或配置文件中的路径
  const paths = opts.paths || config.paths;

  console.log(`Distribution ID: ${fullConfig.distributionId}`);
  console.log(`清除路径: ${paths.join(', ')}`);
  console.log('-'.repeat(50));

  const startTime = Date.now();

  try {
    const result = await createInvalidation(fullConfig, paths);

    console.log(`Invalidation 已创建: ${result.invalidationId}`);
    console.log(`状态: ${result.status}`);

    if (opts.wait) {
      console.log('-'.repeat(50));
      console.log('等待缓存清除完成...');
      const finalStatus = await waitForCompletion(fullConfig, result.invalidationId);
      console.log(`最终状态: ${finalStatus.status}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('-'.repeat(50));
    console.log(`缓存清除请求完成！耗时: ${duration}s`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('-'.repeat(50));
    console.error(`错误: ${error.message}`);
    console.log('='.repeat(50));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('执行失败:', error.message);
  process.exit(1);
});
