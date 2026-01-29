#!/usr/bin/env node
/**
 * S3 Deploy - 入口脚本
 * @module index
 *
 * 将本地目录上传到 AWS S3，支持 Jenkins 自动化执行
 */

import { program } from 'commander';
import config from './config.js';
import { uploadDirectory } from './uploader.js';

program
  .name('s3-deploy')
  .description('将本地目录上传到 AWS S3')
  .requiredOption('-s, --secret <key>', 'AWS Secret Access Key')
  .parse();

const opts = program.opts();

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(50));
  console.log('S3 Deploy - 开始部署');
  console.log('='.repeat(50));

  const fullConfig = {
    ...config,
    secretAccessKey: opts.secret,
  };

  console.log(`本地目录: ${fullConfig.localDir}`);
  console.log(`目标位置: s3://${fullConfig.bucket}/${fullConfig.prefix || '(根目录)'}`);
  console.log(`AWS 区域: ${fullConfig.region}`);
  console.log('-'.repeat(50));

  const startTime = Date.now();
  const result = await uploadDirectory(fullConfig);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('-'.repeat(50));
  console.log(`上传完成！耗时: ${duration}s`);
  console.log(`成功: ${result.uploaded} 个文件`);

  if (result.failed > 0) {
    console.log(`失败: ${result.failed} 个文件`);
    console.log('='.repeat(50));
    process.exit(1);
  }

  console.log('='.repeat(50));
}

main().catch((error) => {
  console.error('部署失败:', error.message);
  process.exit(1);
});
