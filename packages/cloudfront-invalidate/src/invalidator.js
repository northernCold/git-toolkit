/**
 * CloudFront 缓存清除核心逻辑
 * @module invalidator
 */

import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetInvalidationCommand,
} from '@aws-sdk/client-cloudfront';

/**
 * 创建 CloudFront 客户端
 * @param {Object} config - 配置对象
 * @returns {CloudFrontClient} CloudFront 客户端实例
 */
function createClient(config) {
  return new CloudFrontClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * 创建缓存清除请求
 * @param {Object} config - 配置对象
 * @param {string} config.distributionId - CloudFront 分配 ID
 * @param {string} config.region - AWS 区域
 * @param {string} config.accessKeyId - AWS Access Key ID
 * @param {string} config.secretAccessKey - AWS Secret Access Key
 * @param {string[]} paths - 要清除的路径列表
 * @returns {Promise<Object>} 清除结果
 */
export async function createInvalidation(config, paths) {
  const client = createClient(config);

  const callerReference = `invalidation-${Date.now()}`;

  const command = new CreateInvalidationCommand({
    DistributionId: config.distributionId,
    InvalidationBatch: {
      CallerReference: callerReference,
      Paths: {
        Quantity: paths.length,
        Items: paths,
      },
    },
  });

  const response = await client.send(command);

  return {
    invalidationId: response.Invalidation.Id,
    status: response.Invalidation.Status,
    createTime: response.Invalidation.CreateTime,
    paths: paths,
  };
}

/**
 * 查询缓存清除状态
 * @param {Object} config - 配置对象
 * @param {string} invalidationId - Invalidation ID
 * @returns {Promise<Object>} 状态信息
 */
export async function getInvalidationStatus(config, invalidationId) {
  const client = createClient(config);

  const command = new GetInvalidationCommand({
    DistributionId: config.distributionId,
    Id: invalidationId,
  });

  const response = await client.send(command);

  return {
    invalidationId: response.Invalidation.Id,
    status: response.Invalidation.Status,
    createTime: response.Invalidation.CreateTime,
  };
}

/**
 * 等待缓存清除完成
 * @param {Object} config - 配置对象
 * @param {string} invalidationId - Invalidation ID
 * @param {number} [timeout=300000] - 超时时间（毫秒），默认 5 分钟
 * @param {number} [interval=10000] - 轮询间隔（毫秒），默认 10 秒
 * @returns {Promise<Object>} 最终状态
 */
export async function waitForCompletion(config, invalidationId, timeout = 300000, interval = 10000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await getInvalidationStatus(config, invalidationId);

    if (status.status === 'Completed') {
      return status;
    }

    console.log(`状态: ${status.status}，等待中...`);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`缓存清除超时（${timeout / 1000}秒）`);
}
