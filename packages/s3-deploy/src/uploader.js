/**
 * S3 上传模块
 * @module uploader
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { lookup } from 'mime-types';
import { createReadStream, statSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, relative, posix } from 'node:path';

/** 大文件阈值（5MB），超过此大小使用分片上传 */
const MULTIPART_THRESHOLD = 5 * 1024 * 1024;

/**
 * 创建 S3 客户端
 * @param {Object} config - 配置对象
 * @returns {S3Client} S3 客户端实例
 */
function createS3Client(config) {
  const options = { region: config.region };

  // AWS 凭证
  if (config.accessKeyId && config.secretAccessKey) {
    options.credentials = {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    };
  }

  return new S3Client(options);
}

/**
 * 获取文件的 MIME 类型
 * @param {string} filePath - 文件路径
 * @returns {string} MIME 类型字符串
 */
function getContentType(filePath) {
  return lookup(filePath) || 'application/octet-stream';
}

/**
 * 递归获取目录下所有文件路径
 * @param {string} dir - 目录路径
 * @returns {Promise<string[]>} 文件路径数组
 */
async function getAllFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 构建上传参数
 * @param {Object} config - 配置对象
 * @param {string} key - S3 对象键
 * @param {string} filePath - 本地文件路径
 * @returns {Object} 上传参数
 */
function buildUploadParams(config, key, filePath) {
  return {
    Bucket: config.bucket,
    Key: key,
    Body: createReadStream(filePath),
    ContentType: getContentType(filePath),
  };
}

/**
 * 上传单个文件到 S3
 * @param {S3Client} client - S3 客户端
 * @param {Object} config - 配置对象
 * @param {string} key - S3 对象键
 * @param {string} filePath - 本地文件路径
 */
async function uploadFile(client, config, key, filePath) {
  const fileSize = statSync(filePath).size;

  if (fileSize > MULTIPART_THRESHOLD) {
    // 大文件使用分片上传
    const upload = new Upload({
      client,
      params: buildUploadParams(config, key, filePath),
    });

    await upload.done();
  } else {
    // 小文件使用普通上传
    const command = new PutObjectCommand(buildUploadParams(config, key, filePath));
    await client.send(command);
  }
}

/**
 * @typedef {Object} UploadResult
 * @property {number} uploaded - 成功上传的文件数
 * @property {number} failed - 上传失败的文件数
 */

/**
 * 上传整个目录到 S3
 * @param {Object} config - S3 部署配置
 * @returns {Promise<UploadResult>} 上传结果统计
 */
export async function uploadDirectory(config) {
  const { localDir, prefix } = config;
  const client = createS3Client(config);

  // 验证本地目录是否存在
  try {
    const dirStat = await stat(localDir);
    if (!dirStat.isDirectory()) {
      throw new Error(`${localDir} 不是一个目录`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`本地目录不存在: ${localDir}`);
    }
    throw error;
  }

  const files = await getAllFiles(localDir);
  console.log(`找到 ${files.length} 个文件待上传`);

  let uploaded = 0;
  let failed = 0;

  for (const filePath of files) {
    const relativePath = relative(localDir, filePath);
    const s3Key = prefix
      ? posix.join(prefix, relativePath.split('\\').join('/'))
      : relativePath.split('\\').join('/');

    try {
      await uploadFile(client, config, s3Key, filePath);
      uploaded++;
      console.log(`[${uploaded}/${files.length}] 上传成功: ${s3Key}`);
    } catch (error) {
      failed++;
      console.error(`[${uploaded + failed}/${files.length}] 上传失败: ${s3Key}`, error.message);
    }
  }

  return { uploaded, failed };
}
