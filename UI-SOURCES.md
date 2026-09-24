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
