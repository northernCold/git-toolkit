# Vue-I18n 键名命名规范 (AI 提示词基准)

## 1. 核心格式与存储结构 (Structure & Storage)

### A. 逻辑结构 (Logical Path)
建议采用 **三层嵌套路径 + 语义后缀** 的结构：
**`[模块].[页面或功能].[具体含义]_[语义全称]`**

- **模块 (Module)**: 系统一级分类（如：`common`, `account`）。
- **页面或功能 (Page/Feature)**: 具体页面或功能块（如：`login`, `user_profile`）。
- **具体含义 (Meaning)**: 业务意图，采用 `snake_case`。
- **语义全称 (Type Suffix)**: 以 `_` 开头，描述 UI 元素性质（必须全称，除 `_desc` 外）。

### B. 存储格式 (Nested JSON)
必须采用 **嵌套对象 (Nested Objects)** 结构：

**正确示例:**
```json
{
  "account": {
    "login": {
      "main_title": "欢迎登录",
      "username_label": "用户名",
      "username_placeholder": "请输入用户名",
      "submit_button": "立即登录"
    }
  }
}
```

## 2. 语义后缀定义 (Type Suffixes)
后缀用于明确 Key 的 UI 用途，除 `_desc` 外必须全称：
- `_button`: 按钮文本
- `_title`: 标题（页面、弹窗、卡片等）
- `_label`: 表单标签、字段名、项名称
- `_placeholder`: 输入框提示文本
- `_message`: 反馈信息、描述性文案、通知内容
- `_error`: 错误校验、异常报错
- `_tooltip`: 悬浮提示、气泡说明
- `_option`: 下拉/单选/多选的选项
- `_desc`: 辅助说明、详细描述、副标题（唯一允许的缩写）

## 3. 命名约束 (Naming Constraints)

### A. 标题处理 (Titles)
针对 `_title` 后缀，含义段需体现容器位置：
- 页面主标题：`main_title`
- 弹窗标题：`dialog_confirm_title`, `modal_edit_title`
- 卡片/区块标题：`card_summary_title`, `section_basic_title`

### B. 动作动词 (Action Verbs)
带有 `_button` 后缀的 Key，其含义段必须以动词开头：
- `save_button`, `delete_button`, `submit_button`, `search_button`

### C. 状态表达 (Status Expressions)
用于状态展示时，使用形容词或过去分词：
- `active_label`, `pending_option`, `completed_message`

### D. 逻辑判定 (Boolean)
- `is_visible_label`, `has_permission_error`

### E. 校验错误 (Validation)
针对 `_error` 后缀，遵循 `字段名_错误类型_error`：
- `email_required_error`, `password_format_error`

## 4. 特殊文本处理 (Special Text)
- **多行文本**: Value 中使用 `\n`，Key 可增加 `_p1`, `_p2` 后缀。
- **富文本**: Key 增加 `_rich` 后缀（如 `notice_rich_message`）。
- **动态变量**: Value 使用 `{variableName}`，Key 推荐增加 `_with_xxx`（如 `welcome_with_name_title`）。

## 5. 字符集与禁止项 (Prohibitions)
- **仅限**: 小写字母 `a-z`、数字 `0-9`、下划线 `_` 和层级点号 `.`。
- **严禁**: 空格、连字符 `-`、大写字母、特殊符号。
- **结尾约束**: 严禁以 `.` 或 `_` 结尾（后缀除外）。

## 6. AI Prompt 指令建议 (AI Prompt Suggestions)

> 请严格参考 `i18n-naming-spec.md` 规范生成 Vue-I18n 的国际化内容。
> 1. **核心结构**: 采用三层深度的 **嵌套对象 (Nested JSON)**。
> 2. **逻辑路径**: `[模块].[页面或功能].[具体含义]_[语义后缀]`。
> 3. **强制后缀**: 每个叶子节点的键名必须携带语义后缀（如 `_button`, `_label`, `_error`）。
> 4. **详细约束**: 动词开头、状态表达、变量处理等请完全遵循文档规定。
