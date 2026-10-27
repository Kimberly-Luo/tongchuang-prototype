# UI 复用记录

本轮 UI 改版通过用户指定的 GitHub 连接器检索现有实现。最终继续使用现有 uni-app + TDesign 技术栈，没有为外观改版引入第二套组件框架。

## 采用

- `TDesignOteam/tdesign-uniapp-starter`：项目最初工程模板，提交 `4613916f64b54b58a6134c0e1e830511550fe517`，MIT。
- `Tencent/tdesign-miniprogram`：`@tdesign/uniapp` 的上游组件库；检索时仓库约 1.7k stars，MIT。
- `TDesignOteam/tdesign-uniapp-starter-apply`：活动报名类手机模板，MIT。参考并改造以下固定文件：
  - `src/components/custom-tab-bar.vue`，SHA `14890816f293909cc9d7056b302996395d5c334a`：复用 TDesign 固定底部导航与占位模式，改为本地单页视图状态。
  - `src/components/tag-filter.vue`，SHA `2b31976576ad175b11a83e995f2f98e2816ece5b`：复用可点选标签网格模式，改为单选、语义按钮和同窗排版。
  - `src/components/activity-filter-popup.vue`，SHA `7ccb930feda810f49c9098c6fbbb4b2873127a29`：复用 TDesign 底部弹层结构，改为老师资料和试课报价详情。

上游模板许可副本见 `licenses/tdesign-starter-apply-MIT.txt`。代码中的对应组件保留了来源注释。

## 调研后未引入

- `Tencent/weui`：微信官方设计团队的移动 Web 样式库，MIT。仅用于核对微信环境的表单、列表与底部操作习惯。
- `ant-design/ant-design-mobile`：MIT。适合 React Mobile，但本项目是 uni-app，不为此次改版增加 React 依赖。
- `wot-ui/wot-ui`：uni-app 组件库候选。功能与现有 TDesign 重叠，替换会增加迁移成本。
- `Tencent/tdesign-miniprogram-starter-retail`：零售业务模板，与家教匹配的信息结构不符。

## 本地改造

新增 `ChoiceGroup.vue`、`RequestForm.vue`、`AppTabs.vue`，并重排原有推荐、试课、学生工作台和资料弹层。业务逻辑仍来自 `src/domain.mjs`；匹配、通勤、费用和状态规则未因 UI 改版改变。本轮不使用生成图片：老师照片不是核心必需信息，用姓氏字标能避免把生成头像误认成真实学生。

## v0.4 学生入驻复用检查

- 2026-09-24 再次检查 `Tencent/tdesign-miniprogram` 与 `TDesignOteam/tdesign-uniapp-starter`，继续复用现有表单、按钮、标签和分步信息结构，没有引入第二套 UI 框架。
- 保持项目当前锁定的 `@tdesign/uniapp` 0.8.1，避免为一个表单升级整套组件。GitHub 发布页显示后续版本已有 Form 与 Upload 更新，真实接入文件上传时再单独升级和真机验证。
- 学生在校材料上传本轮使用明确标记的模拟人工核验。这样既符合当前“非真实交易 Prototype”边界，也避免演示版请求相册或文件权限。

## v0.5 H5 视觉与动效重构

- 视觉方向：现代校园刊物 × 海派建筑几何。使用纸白底、墨蓝正文、单一钴蓝强调色、方形交互控件、编号排版与候选人档案式卡片；未使用生成头像或装饰图片。
- 保留 `@tdesign/uniapp` 0.8.1 作为按钮、图标、标签、弹层与固定导航的交互底座，通过项目设计令牌重塑外观，没有混入第二套组件库。
- 引入 `gsap` 3.15.0 核心包。Vue 生命周期与清理模式参考 GreenSock 官方 `gsap-skills/examples/vue/app.vue`，固定提交 `aed9cfd3277740755f6bfc1155c7aa645403b760`；采用 `gsap.context()`、作用域选择器和卸载回收。
- GSAP 上游仓库：`greensock/GSAP`，检索时固定 HEAD `13e2b790546426a1a2e0e9b409f3f8dc6d6611f2`。包声明为 Standard “No Charge” License，许可入口见 `licenses/GSAP-LICENSE-NOTE.md`。
- 动效只用于首屏进入、页面切换、表单阶段切换和触控反馈；`prefers-reduced-motion: reduce` 时关闭动效。


## 2026-10-26 平台流程初版

- 按用户要求先实现新流程，视觉风格后续讨论。继续使用现有 uni-app、Vue、TDesign，未引入第二套框架。
- GitHub 连接器检索了 `TDesignOteam/tdesign-uniapp-starter-apply` 的 `tag-filter.vue`，本轮检索未返回文件；直接复用本地已有、已记录许可来源的 ChoiceGroup，详见本文件早期条目。
- WeeklyPeriods 使用同样的语义选择按钮，增加星期×粗时段网格；保留原 MIT 许可证。新 UI 只做可用的手机布局。
- 新规则集中于 `src/platform.mjs`，旧试课组件和引擎保留但不在新版首页使用。

## 2026-10-27 三种移动 UI 方向预览

- 保留 Vue + uni-app + `@tdesign/uniapp` 0.8.1（MIT）。直接复用本项目 ChoiceGroup、WeeklyPeriods 和 TDesign 图标；没有增加依赖或改变 V2 引擎。
- 使用 GitHub 连接器读取 Tencent 官方 `tdesign-miniprogram` 的 [uni-app Cell 实现](https://github.com/Tencent/tdesign-miniprogram/blob/develop/packages/uniapp-components/cell/cell.vue)，文件 SHA `8e6030ceb37694f3343433ffe9a8d900e98d30ce`，MIT。核对图标、标题、说明、右箭头及按压反馈的移动行结构；没有拷入另一套 Cell 或替换已用组件。现有许可文件保持原位。
- `design-taste-frontend` 指导审视、方向差异与视觉验收；`prompt-engineering-patterns`（wshobson/agents，MIT，文件 SHA `869548fa7b265c81dd54b3407fd06e61c1fc8ea6`）用于组织明确的目标、约束、输出和验证。完整执行提示词见 UI-REDESIGN-PROMPT.md。
- 新增 `design-preview.css`：三套色彩、字体、形状与布局令牌，全部限定于显式预览类；新增静态比较页 `src/static/design-lab/index.html`。选中勾号独立定位，避免影响文字居中。
- 本地素材 `src/static/design-lab/assets/campus-light.png`：内置 image_gen 原创校园书桌概念图，无人物、校徽或可识别的大学建筑；不是实拍复旦校园。生成提示词摘要见 DESIGN-BRIEF-2026-10-27.md。用固定尺寸容器预留加载空间。系统中文字体、图标来自已有本地依赖，没有新增远程字体或人物照片。
- 三套预览的业务字段及数据一致；主题使用独立模拟存储键，每次直接打开预览从同一组样例开始。当前 V4 演示资料不被预览覆盖。默认地址仍为原 V2 界面；只有 `?design=a/b/c` 进入方向稿。
