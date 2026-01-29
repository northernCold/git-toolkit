# S3 Deploy

将本地目录上传到 AWS S3 的部署工具，专为 Jenkins 等 CI/CD 环境设计。

## 特性

- 支持递归上传整个目录
- 自动识别文件 MIME 类型
- 大文件自动分片上传（>5MB）
- 配置集中管理
- 详细的上传进度日志

## 安装

```bash
pnpm install
```

## 配置

修改 `src/config.js` 文件：

```javascript
export default {
  bucket: 'my-bucket',           // S3 存储桶名称
  region: 'ap-northeast-1',      // AWS 区域
  prefix: '',                    // 上传路径前缀（可为空）
  localDir: './dist',            // 本地待上传目录路径
  accessKeyId: '',               // AWS Access Key ID
};
```

## 使用

```bash
# 执行上传
pnpm start -- -s <your-secret-access-key>

# 或
node src/index.js --secret <your-secret-access-key>
```

## Jenkins Pipeline

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy to S3') {
            steps {
                withCredentials([string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET')]) {
                    dir('packages/s3-deploy') {
                        sh 'pnpm install'
                        sh "pnpm start -- -s ${AWS_SECRET}"
                    }
                }
            }
        }
    }
}
```

## 输出示例

```
==================================================
S3 Deploy - 开始部署
==================================================
本地目录: ./dist
目标位置: s3://my-bucket/static/v1.0.0
AWS 区域: ap-northeast-1
--------------------------------------------------
找到 15 个文件待上传
[1/15] 上传成功: static/v1.0.0/index.html
[2/15] 上传成功: static/v1.0.0/css/style.css
[3/15] 上传成功: static/v1.0.0/js/main.js
...
--------------------------------------------------
上传完成！耗时: 3.25s
成功: 15 个文件
==================================================
```

## 退出码

- `0` - 所有文件上传成功
- `1` - 存在上传失败的文件

## License

MIT
