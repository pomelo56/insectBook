# insectBook 项目记忆

## 项目概况
- 微信小程序：昆虫图鉴（拍照识别昆虫 + 收集成就系统）
- 技术栈：微信小程序原生框架 + 云开发（云函数/云数据库）+ 豆包视觉API（火山方舟）
- 核心页面：首页(index)、拍照识别(camera)、昆虫详情(insect-detail)、管理员后台
- 23个云函数、2个数据库集合(insects/user_insects)

## 协作规则 (.workbuddy/COLLAB-RULES.md)
- 12条规则，核心铁律：用户没拍板不开干
- 交付形态路由：文档→PM/架构师；代码→工程师；测试→QA；全流程→顺序调度
- 赋权边界：主理人定方向+调度+质量关卡；成员在自己专业领域独立决策
- 分析类输出用widget，代码类用文件
- 信息流：所有跨角色信息经主理人中转，禁止直连
- 不采纳：学科教研员(无此角色)、监听模式(我们是任务调度而非群聊)

## 团队角色分析
- 4角色(PM/架构师/工程师/QA)覆盖6能力域中4个：需求✓、架构✓、代码✓、测试✓
- 2个缺口用skills/knowledge补充，不加新角色：wx-miniprogram skill + cloud-devops skill + design-system skill + insect-data-schema knowledge + wx-arch-ADR knowledge
- 原因：general-purpose agent无专用SOP和关卡，加人反拖慢

## GUI负责人
- GUI由工程师寇豆码负责（微信小程序GUI=WXML+WXSS=前端代码）
- 三层分工：PM定义交互流→架构师定义组件拆分→工程师落地实现
- 不需独立设计师：WeChat Design规范强约束、WXML/WXSS即GUI、组件化后样式自然拆分
- 视觉质量保证：L3层补充design-system skill（颜色/间距/字体/动效token）

## 重构执行进度
- Phase 0 全部完成✓：L5(清理)+L1(5skills+2knowledge)+L2(ARCHITECTURE.md)+L3(CONVENTIONS.md)+L4(jest+wxMock)
- 回滚机制：Git baseline commit `6e532e8`，`git checkout 6e532e8` 随时回退
- 已删除：9补丁MD+6补丁SH+2冗余docs
- 创建的skills：loop-engineering/wx-miniprogram/service-split/cloud-devops/design-system
- 创建的knowledge：insect-data-schema/wx-architecture-decisions
- Phase 1 Loop 1-1 完成✓：从index.js(948→794行)抽离insectService(173行)+45单元测试(全部通过)
- 下一步：Phase 1 Loop 1-2 — 抽离cacheService(统一缓存)或levelService(等级计算)
