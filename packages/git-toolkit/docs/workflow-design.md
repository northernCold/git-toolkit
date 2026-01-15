# Git 工作流自动化详细设计

本文档详细描述了 `git-toolkit` 脚本在每个阶段执行的具体 Git 命令及其逻辑。

## 1. 预生产准备 (`release start <version>`)

此阶段的目标是根据 `master` 创建一个干净的发布分支，并将所有功能分支汇总。

### 详细步骤：
1. **环境检查**:
   - `git status --porcelain`: 确保当前工作区没有未提交的改动。
2. **同步主轴**:
   - `git fetch origin`: 拉取远程最新信息。
   - `git checkout master`: 切换到主分支。
   - `git pull origin master`: 确保 `master` 是最新的。
3. **创建发布分支**:
   - `git checkout -b p/<version>`: 从当前 `master` 创建新分支。
4. **功能合并 (交互式)**:
   - 获取候选分支列表：`git branch -a`。
   - 过滤掉 `master`, `pre`, `p/*` 等特殊分支。
   - 循环执行：`git merge <feature-branch>`。
5. **同步远程**:
   - `git push origin p/<version>`: 将汇总后的发布分支推送到服务器。

## 2. 预生产部署 (`release pre`)

将选定的发布分支同步到 `pre` 环境分支。

### 详细步骤：
1. **获取当前版本**:
   - 检查当前是否在 `p/` 开头的分支上。
2. **更新 pre 分支**:
   - `git checkout pre`.
   - `git pull origin pre`.
3. **合并发布内容**:
   - `git merge p/<version>`.
4. **推送**:
   - `git push origin pre`.
5. **后续操作**:
   - 提醒用户登录 Jenkins 构建 `pre` 分支任务。

## 3. 正式发版打标 (`release prod`)

当预生产环境验收通过后，在发布分支上建立永久的 Release 标记。

### 详细步骤：
1. **校验状态**:
   - 确保当前分支为 `p/<version>` 且已推送到远程。
2. **打 Tag**:
   - `git tag -a v<version> -m "Release v<version>"`: 创建带有说明的注释标签。
3. **推送 Tag**:
   - `git push origin v<version>`.
4. **后续操作**:
   - 提醒用户登录 Jenkins 构建对应的 Tag 任务（生产环境部署）。

## 4. 流程终结与清理 (`release finish`)

发布成功后，将代码合回 `master` 并清理临时分支。

### 详细步骤：
1. **更新 master**:
   - `git checkout master`.
   - `git pull origin master`.
2. **保留历史合并**:
   - `git merge --no-ff p/<version>`: **关键步骤**。强制创建合并节点，以便在 Git 历史中清晰地看到此次发版的范围。
3. **推送主轴**:
   - `git push origin master`.
4. **清理工作 (交互式)**:
   - 确认后执行：
     - `git branch -d p/<version>`: 删除本地发布分支。
     - `git push origin --delete p/<version>`: 删除远程发布分支。
     - 循环删除已合并的功能分支：`git branch -d <feature-branch>`。

## 5. 优化点说明

- **--no-ff 策略**: 
  - 默认的 `fast-forward` 合并会丢失“这组提交是作为一个整体发布的”这一信息。使用 `--no-ff` 可以生成一个 Merge 节点，注释中通常包含版本号，这对追溯生产事故非常有价值。
- **分支自动过滤**: 
  - 在选择功能分支时，脚本会自动排除非功能类的常驻分支。
- **原子性操作**: 
  - 如果某一合并步骤失败，脚本会引导用户解决，而不是直接崩溃。

