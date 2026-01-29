# CloudFront Invalidate

清除 AWS CloudFront CDN 缓存的工具，专为 Jenkins 等 CI/CD 环境设计。

## 特性

- 支持指定路径清除缓存
- 支持通配符路径（如 `/css/*`）
- 可选等待清除完成
- 配置集中管理
- 详细的执行日志

## 安装

```bash
pnpm install
```

## 配置

修改 `src/config.js` 文件：

```javascript
export default {
  distributionId: 'E1234567890ABC',  // CloudFront 分配 ID
  region: 'us-east-1',               // AWS 区域
  accessKeyId: 'AKIA...',            // AWS Access Key ID
  paths: ['/*'],                     // 默认清除路径
};
```

### 获取 Distribution ID

1. 登录 AWS 控制台 → CloudFront
2. 在 Distributions 列表中查看 **ID** 列
3. 格式类似：`E1234567890ABC`

或使用 AWS CLI：

```bash
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName]" --output table
```

### IAM 权限要求

确保你的 IAM 用户具有 CloudFront 缓存清除权限：

```json
{
  "Effect": "Allow",
  "Action": "cloudfront:CreateInvalidation",
  "Resource": "arn:aws:cloudfront::账户ID:distribution/*"
}
```

## 使用

```bash
# 使用配置文件中的路径
pnpm start -- -s <your-secret-access-key>

# 指定清除路径（覆盖配置）
pnpm start -- -s <secret> -p /index.html -p /css/*

# 等待清除完成
pnpm start -- -s <secret> -p /* --wait

# 或直接运行
node src/index.js --secret <secret> --paths /index.html /js/*
```

### 命令行参数

| 参数 | 说明 | 必填 |
|------|------|------|
| `-s, --secret <key>` | AWS Secret Access Key | 是 |
| `-p, --paths <paths...>` | 要清除的路径（可多个） | 否 |
| `-w, --wait` | 等待缓存清除完成 | 否 |

### 路径格式示例

- `/index.html` - 清除单个文件
- `/css/*` - 清除 css 目录下所有文件
- `/images/logo.*` - 清除匹配的文件
- `/*` - 清除所有缓存（全量清除）

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
                // S3 部署步骤...
            }
        }

        stage('Invalidate CDN Cache') {
            steps {
                withCredentials([string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET')]) {
                    dir('packages/cloudfront-invalidate') {
                        sh 'pnpm install'
                        sh "pnpm start -- -s ${AWS_SECRET} -p /index.html -p /css/* -p /js/*"
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
CloudFront Invalidate - 开始清除缓存
==================================================
Distribution ID: E1234567890ABC
清除路径: /index.html, /css/*
--------------------------------------------------
Invalidation 已创建: I1234567890ABC
状态: InProgress
--------------------------------------------------
缓存清除请求完成！耗时: 1.25s
==================================================
```

使用 `--wait` 参数时：

```
==================================================
CloudFront Invalidate - 开始清除缓存
==================================================
Distribution ID: E1234567890ABC
清除路径: /*
--------------------------------------------------
Invalidation 已创建: I1234567890ABC
状态: InProgress
--------------------------------------------------
等待缓存清除完成...
状态: InProgress，等待中...
状态: InProgress，等待中...
最终状态: Completed
--------------------------------------------------
缓存清除请求完成！耗时: 45.32s
==================================================
```

## 退出码

- `0` - 缓存清除请求成功
- `1` - 执行失败

## 注意事项

1. CloudFront 每月前 1000 次 invalidation 路径免费，超出后按量收费
2. 使用 `/*` 全量清除算作 1 个路径
3. 缓存清除通常需要几分钟完成传播到所有边缘节点

## License

MIT
