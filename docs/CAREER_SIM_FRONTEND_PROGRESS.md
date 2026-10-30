# Career Simulation：可独立开发的前端部分

本次基于 main 和现有硬编码 demo；不包含 A 的接口契约、真实 AI、Email gate、token 或 History 接入。

## 已实现

- Simulation 阶段场景条：默认折叠、展开/收起、导航栏下方吸顶。
- 导航高度随尺寸变化更新，展开的长内容内部可滚动。
- 离开 Simulation 时移除场景条，重试或切换场景时重建。
- 空 JD、空回复、sessionStorage 写入失败提示；编辑输入后清除提示。
- 阶段加载状态及重复触发保护。
- 回复按纯文本显示。

## 组件边界

`static/js/career-sim/ui.js` 仅处理展示。题干采用内部展示模型，由未来主流程映射后传入，不作为后端字段契约：

```js
const bar = CareerSimUI.scenarioBar({
  title: "Scenario title",
  summary: "Short task summary",
  details: [{ label: "Your goal", text: "Task details" }]
});
container.before(bar);
```

错误展示同样由调用方传入内部展示类型；暂未实现 HTTP 状态或后端错误结构的映射：

```js
CareerSimUI.showError(host, "NETWORK", {
  actionLabel: "Try again",
  onAction: retry,
  focus: true
});
CareerSimUI.clearError(host);
```

展示类型：EMPTY_JD / EMPTY_MESSAGE / STORAGE / CONTENT_BLOCKED /
SESSION_EXPIRED / RATE_LIMITED / UNAVAILABLE / NETWORK / UNKNOWN。
会话重新登记与重试的实际行为由未来 API 集成层传入，不由组件猜测。

## 本次验证

- Hugo v0.168.0 构建通过（现有 languageCode 弃用警告仍在）。
- 浏览器：空 JD、有效 JD 跳转、空回复提示、编辑后恢复。
- 展开/折叠、长对话吸顶、进入自评/复盘后移除、切换场景后标题更新。
- 390px 宽度无横向溢出；滚动时题干 top 83px、导航 bottom 约 82.4px。
- `<b>` 测试输入按文字显示。

尚待联调验证：真实 API 错误、会话失效重新登记、限流等待策略、失败重试防重复、存储禁用场景。
