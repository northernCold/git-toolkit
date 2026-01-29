/**
 * CloudFront 缓存清除配置
 * @module config
 *
 * 在此文件中直接修改配置
 * secretAccessKey 通过命令行输入，不保存在代码中
 */

export default {
  /** CloudFront 分配 ID（Distribution ID） */
  distributionId: 'E1234567890ABC',

  /** AWS 区域（CloudFront API 通常使用 us-east-1） */
  region: 'us-east-1',

  /** AWS Access Key ID */
  accessKeyId: 'AKIARJSCAIBH5WV7O7AK',

  /** 默认清除路径（可通过命令行 -p 参数覆盖） */
  paths: ['/*'],
};
