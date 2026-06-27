---
name: design-system
description: insectBook 设计系统 — 颜色 token、间距 token、字体 token、动效规范、组件样式模板
version: 1.0
---

# 设计系统 Skill

## 触发条件
- 编写/修改 WXSS 样式
- 设置颜色、间距、字体大小
- 创建新组件的样式

## 设计 Token

### 颜色系统

**主色调** — 昆虫图鉴品牌色（自然/探索感）：

| Token | 值 | 用途 |
|-------|----|------|
| `--color-primary` | `#2a9d8f` | 主按钮、选中态、重要标题 |
| `--color-primary-light` | `#4db6ac` | 悬浮态、次要强调 |
| `--color-primary-dark` | `#1a7a6d` | 按下态 |

**辅助色**：

| Token | 值 | 用途 |
|-------|----|------|
| `--color-secondary` | `#e76f51` | 发现/成功提示、勋章高亮 |
| `--color-warning` | `#f4a261` | 提醒、未完成状态 |
| `--color-info` | `#264653` | 标注、说明文字 |

**中性色**：

| Token | 值 | 用途 |
|-------|----|------|
| `--color-text-primary` | `#333333` | 主要文字 |
| `--color-text-secondary` | `#666666` | 次要文字、描述 |
| `--color-text-hint` | `#999999` | 提示文字 |
| `--color-bg` | `#ffffff` | 主背景 |
| `--color-bg-secondary` | `#f5f5f5` | 卡片背景、列表背景 |
| `--color-border` | `#e0e0e0` | 分割线、边框 |

**稀有度色**（昆虫分类标识）：

| Token | 值 | 稀有度 |
|-------|----|------|
| `--color-rarity-common` | `#78909c` | 常见 |
| `--color-rarity-uncommon` | `#4db6ac` | 不常见 |
| `--color-rarity-rare` | `#7e57c2` | 稀有 |
| `--color-rarity-legendary` | `#ffd54f` | 传说 |

### 间距系统

基于 4rpx 基数（8px 在 375 屏幕宽度下的 rpx 值）：

| Token | 值 (rpx) | 用途 |
|-------|---------|------|
| `--space-xs` | `8` | 图标与文字间距 |
| `--space-sm` | `16` | 列表项内间距 |
| `--space-md` | `24` | 卡片内间距 |
| `--space-lg` | `32` | 区块间距 |
| `--space-xl` | `48` | 页面级间距 |
| `--space-2xl` | `64` | 大区块分隔 |

### 字体系统

| Token | 值 (rpx) | 用途 |
|-------|---------|------|
| `--font-size-xs` | `24` | 标签、提示 |
| `--font-size-sm` | `28` | 次要文字 |
| `--font-size-md` | `32` | 正文 |
| `--font-size-lg` | `36` | 标题 |
| `--font-size-xl` | `40` | 大标题 |
| `--font-size-2xl` | `48` | 页面标题 |

### 动效规范

| Token | 值 | 用途 |
|-------|----|------|
| `--duration-fast` | `200ms` | 按钮、toggle |
| `--duration-normal` | `300ms` | 页面切换、列表展开 |
| `--duration-slow` | `500ms` | 大动画、loading |
| `--easing-default` | `ease` | 一般动效 |
| `--easing-in` | `ease-in` | 元素出现 |
| `--easing-out` | `ease-out` | 元素消失 |

## WXSS Token 使用方式

微信小程序不支持 CSS 变量（`var(--xxx)`），所以 Token 通过 **全局 app.wxss + 注释标注** 实现：

```css
/* app.wxss — 设计系统 Token 定义 */
/* 颜色：使用具体值，标注 Token 名 */
/* --color-primary: #2a9d8f */
/* --color-text-primary: #333333 */

/* 间距：使用具体值，标注 Token 名 */
/* --space-md: 24rpx */
```

在页面/组件 WXSS 中：
```css
.card { 
  /* --color-bg-secondary, --space-md, --font-size-md */
  background: #f5f5f5;   /* --color-bg-secondary */
  padding: 24rpx;         /* --space-md */
  font-size: 32rpx;       /* --font-size-md */
}
```

**关键**：每个样式值旁必须标注对应的 Token 名（注释格式），确保可追溯。

## 禁止事项
- ❌ 不硬编码颜色值（必须从 Token 取值 + 注释标注）
- ❌ 不随意写间距（必须从 space Token 取值）
- ❌ 不混用不同主题色（一个页面只用 primary + secondary + neutral）
- ❌ 不跳过动效（交互必须有 --duration-normal 过渡）
