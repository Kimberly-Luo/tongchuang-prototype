# 同窗 · 家长需求平台流程初版

2026-10-26 按项目发起人新方案重做：主要提供平台，兼顾少量盈利。家长发布需求，复旦学生主动选择并取得家长联系方式。

2026-10-27 用户选定 C「同窗来信」，默认界面更新为纸白、朱红、中文书刊排版。首访默认浅色，可在页面底部切换深色，偏好保存于本机。完整设计、截图位置与验收边界见 [UI-C-IMPLEMENTATION.md](UI-C-IMPLEMENTATION.md)。产品规则和本机资料沿用 V2。

## 当前流程

- 首屏“我是学生 / 我是家长”。
- 学生仅以 `@m.fudan.edu.cn` 邮箱模拟注册，再填科目、粗时段、报价和性别；本机已注册直接看需求。
- 家长直接填写科目、预算、星期时段、性别要求、联系方式和留言。
- 家长科目必须为学生授课科目的子集；双方至少一个共同粗时段，价格有交集，且满足性别要求。
- 列表只显示家长粗要求。学生选择并进入详情后显示联系方式、留言和收费提示预留区。
- 学生选择后保留 12 小时。双方都联系好才完成；任一方没联系好，或到期未双方确认，退回匹配池。
- 成功后家长需求消失于匹配池，学生停止接单；下次接单需重新注册并选择时间。

具体约定、合理默认与替代旧 V1 的部分见 [PLATFORM-FLOW-V2.md](PLATFORM-FLOW-V2.md)。

## 体验边界

本机模拟：邮箱没有真实邮件，内置人物与联系方式虚构，不付款、不支持两部手机互通。不要输入真实证件或联系方式。相同浏览器切换学生/家长身份可验证完整闭环。旧版资料保留在原存储键中，新版另存 `tongchuang-platform-v4`。

## 运行与验证

```powershell
npm install
npm run dev:h5
npm test
npm run build:h5
npm run build:mp-weixin
```

网页构建目录 `dist/build/h5/`；小程序构建目录 `dist/build/mp-weixin/`，需 AppID 和微信开发者工具才能做微信真机预览。GitHub Pages 构建成功不等于微信小程序正式发布。

`tests/platform.test.cjs` 验证新流程；`tests/domain.test.cjs` 验证保留的旧引擎，不代表旧流程仍在新版 UI 中运行。

## 复用来源

- 工程：TDesignOteam/tdesign-uniapp-starter，固定来源提交 `4613916f64b54b58a6134c0e1e830511550fe517`，MIT。
- 组件：`@tdesign/uniapp` 0.8.1，Vue + uni-app。
- 选择控件：现有 `ChoiceGroup.vue`（源于 TDesignOteam/tdesign-uniapp-starter-apply 的 MIT tag-filter 模式）；粗时段控件采用同样的语义按钮。
- 本轮没有新依赖，也没有生成老师头像。许可证保留在 `licenses/`，历史复用与改动见 [UI-SOURCES.md](UI-SOURCES.md)。

临时产品名“同窗”与复旦大学无官方隶属或背书关系。
