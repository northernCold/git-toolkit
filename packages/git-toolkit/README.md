# Git Toolkit

用于自动化 Git 发版工作流的 CLI 工具。

## 快速开始

```bash
# 安装
pnpm install && pnpm build
npm link --global

# 使用
gtk release start V1.2.0   # 开始发版
gtk release pre            # 部署预生产
gtk release prod           # 正式打标
gtk release finish         # 完成发版
```

## 文档

- [overview.md](./docs/overview.md) - 流程概述
- [guide.md](./docs/guide.md) - 使用指南
- [design.md](./docs/design.md) - 设计文档
