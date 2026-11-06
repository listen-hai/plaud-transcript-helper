# Plaud 转录编辑助手

[English](README.md) · 中文

[![一键安装](https://img.shields.io/badge/%E4%B8%80%E9%94%AE%E5%AE%89%E8%A3%85-Tampermonkey-1e4f99?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://github.com/listen-hai/plaud-transcript-helper/releases/latest/download/plaud-transcript-helper.user.js)

> 一键安装需要先装好 [Tampermonkey](https://www.tampermonkey.net/) 并打开“允许用户脚本”（见下方[安装](#安装)）。点按钮后，在 Tampermonkey 页面点“安装”。

版本：1.0.0（正式版），11/5/2026。界面支持中文和英文：默认跟随浏览器语言，面板右上角按钮可切换，选择会被记住。

脚本文件：`plaud-transcript-helper.user.js`。

## 安装

1. **安装 Tampermonkey**：在 [Chrome 应用商店](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 添加 Tampermonkey。
2. **允许用户脚本**（新版 Chrome 必须）：打开 `chrome://extensions`，点 Tampermonkey 的“详情”，打开“允许用户脚本”。旧版 Chrome 则打开 `chrome://extensions` 右上角的“开发者模式”。
3. **安装脚本**：打开 [最新版脚本](https://github.com/listen-hai/plaud-transcript-helper/releases/latest/download/plaud-transcript-helper.user.js)，Tampermonkey 会弹出安装页，点“安装”（已装 0.2.x 会显示“更新”，本机修改记录保留）。
4. **确认生效**：打开 [web.plaud.ai](https://web.plaud.ai) 的录音页面并刷新。右下角出现“转录编辑助手”，每段出现“编辑此段”。面板右上角按钮可切换中文 / English。

手动安装：Tampermonkey → “添加新脚本”，用 `plaud-transcript-helper.user.js` 的全部内容替换默认模板，保存。（手动安装不会自动更新。）

更新：Tampermonkey 会自动检查最新 Release；也可在“实用工具 → 检查用户脚本更新”手动检查。

## 使用

1. 少量修改：点击“编辑此段”，改完后点击编辑框外部提交。Ctrl/⌘ + Enter 也会触发点击外部；普通 Enter 保留为换行。
2. 批量修改：打开助手 → 扫描整篇 → 填写查找和替换 → 预览。逐段检查修改后的文本，勾选需要提交的段落。
3. 点击“提交勾选修改”。脚本逐段定位、核对原文，再操作 Plaud 原生编辑框。操作时不要滚动转录或切换录音。
4. 完成后刷新 Plaud，再点击“刷新后核对上批结果”，检查修改是否在刷新后仍保留。

首次在真实 Plaud 上使用时，先提交并刷新核对 1 处明确的纠错，再处理整批。

## 更新记录

- 1.0.0：中英文界面；发布到 GitHub，支持 Tampermonkey 自动更新。功能与 0.2.3 相同。
- 0.2.3：排除虚拟列表中移到屏幕外的失效缓存段落。
- 0.2.2：修复点击外部提交的事件兼容问题。

## 整句／整段改写

单段可直接在“逐段编辑已读取内容”里改写完整文本。每条对应 Plaud 的原始段落和时间戳；一个段落可以包含多个句子。

批量修改可用“批量导入整句／整段改写”，粘贴下面这种 JSON 清单：

```json
[
  {
    "time": "00:00:34",
    "speaker": "Speaker 1",
    "before": "Let's meet on the third floor at ten.",
    "after": "Let's meet on the third floor at two."
  },
  {
    "time": "00:01:01",
    "speaker": "Speaker 1",
    "before": "Please send the report to the cell team.",
    "after": "Please send the report to the sales team."
  }
]
```

以上只是格式示例，不是确认后的真实转录修改。`before` 必须是该段当前完整原文，而不是单个词。时间戳、说话人、完整原文必须同时唯一匹配，否则整份清单不会载入。导入只生成预览，默认不勾选；每条的 `after` 还可以在预览中继续编辑。

这种方式保留段落顺序、时间戳和说话人，允许逐段修复被误识别的整句。它不合并或删除原始段落。清单可由上下文审校后生成；脚本本身不猜测含义。

## 操作范围

- “扫描整篇”会滚动读取页面已渲染的段落，检查已收集序号是否连续。这个完整性检查依据页面，不代表获取了服务器的段落总数。
- 查找是区分大小写的普通文字匹配；不会把输入当正则表达式。
- 默认没有勾选任何修改。预览文本可逐段编辑。
- 时间、说话人、段落序号共同定位，提交前还会核对原文；有冲突就停止。
- “停止操作”会停止后续段落，正在提交的一段可能已经生效。批量提交不是一个可整体撤销的事务。
- “预览恢复上批原文”只恢复仍与上批新文本完全相同的段落；有后续修改的段落不会直接覆盖。
- 同一个页面切换到另一条录音后，应刷新再用。

## 内容与本机记录

脚本不做自动语义改写，也不能听录音。人名、技术缩写和含糊句子的判断仍需上下文。

脚本不下载转录，不调用额外的服务，不读取账号令牌，也不使用 Plaud 的未公开接口。提交通过当前页面的原生编辑流程完成。没有外部依赖或远程脚本。

扫描结果暂存在当前页面内存中。提交前的原文、新文和状态保存在 Tampermonkey 的本机存储中，供刷新核对或恢复；关闭页面后这些修改记录仍保留。“清除本机修改记录”只清除助手的记录，不改 Plaud 内容。

脚本仅匹配 `https://web.plaud.ai/file/*`。

## 验证边界

真实 Plaud 验证（11/5/2026）：

- 完整读取 631 个连续段落。
- 整句编辑、点击外部提交和连续批量保存成功。
- 刷新后，最后一批 128/128 段与提交内容一致。
- 将刷新后完整列表与修订计划比较，合计 140/140 段修订一致；其余段落无额外变化，631 段的时间戳、说话人和顺序均保持一致。
- 这些结果验证脚本的保存流程；不代表已通过录音验证转录内容。

`plaud-helper-test.html` 是独立测试页面，只含 60 个模拟段落，模拟滚动时部分渲染和点击外部保存。它不包含真实转录，也不能证明 Plaud 服务器保存成功。

本地浏览器验证结果：

- 从顶部到底部收集 60 个连续段落。
- 12 处替换串行提交，刷新后 12/12 核对一致。
- 未勾选任何段落时，提交次数为 0。
- 上批 12 处修改的恢复预览和恢复提交成功。
- 整句清单成功匹配；完整新句提交后刷新仍保留。
- 预览后模拟其他操作改变原文，提交被阻止，提交次数为 0。
- 脚本通过 JavaScript 语法检查。

官方脚本格式参考：https://www.tampermonkey.net/documentation.php
