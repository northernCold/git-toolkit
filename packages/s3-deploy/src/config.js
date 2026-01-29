/**
 * S3 部署配置
 * @module config
 *
 * 在此文件中直接修改配置
 * secretAccessKey 通过命令行输入，不保存在代码中
 */

export default {
  /** S3 存储桶名称 */
  bucket: 'popjoy-biz-bucket-public-dev',

  /** AWS 区域 */
  region: 'ap-east-1',

  /** 上传路径前缀（可为空） */
  prefix: '/front/test/',

  /** 本地待上传目录路径 */
  localDir: './dist/build/h5',

  /** AWS Access Key ID */
  accessKeyId: '',
};
