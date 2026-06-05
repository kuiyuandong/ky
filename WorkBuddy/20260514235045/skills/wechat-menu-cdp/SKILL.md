---
name: wechat-menu-cdp
description: >
  通过 Edge CDP 远程调试协议 + Playwright 自动操作微信公众号后台菜单。
  适用于：创建/修改/删除公众号自定义菜单、读取当前菜单配置。
  触发场景：用户需要批量修改公众号菜单、自动化菜单管理、通过AI助手远程操作公众号后台时使用此skill。
location: user
agent_created: true
---

# 微信公众号菜单自动化（Edge CDP 方案）

## 概述

微信公众号未认证订阅号 **无 API 菜单权限**（`/cgi-bin/menu/create` 返回 48001），本方案通过 **Edge 浏览器 CDP 远程调试协议** 绕过 API 限制，直接操作浏览器中已登录的公众号后台页面。

## 核心原理

```
用户 Edge（已登录公众号后台）
    ↓ 以调试模式启动（--remote-debugging-port=9222）
    ↓
Playwright connectOverCDP() 连接
    ↓
page.evaluate() 操作页面 _json 变量
    ↓
注入菜单 JSON → 原生 JS 点击保存按钮
```

## 前置条件

1. 用户 Edge 已安装并登录公众号后台
2. Node.js + playwright-core 可用（managed workspace 已预装）

## 使用流程

### 第1步：启动 Edge 调试模式

在 PowerShell 中执行：

```powershell
Stop-Process -Name msedge -Force
Start-Process "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
    -ArgumentList "--remote-debugging-port=9222"
```

⚠️ **必须先关闭所有 Edge 窗口**，否则调试端口不会生效。

### 第2步：确认用户打开公众号后台

用户需在 Edge 中手动打开并保持：
`https://mp.weixin.qq.com/advanced/selfmenu?action=index&t=advanced/menu-setting`

### 第3步：运行自动化脚本

```bash
NODE_PATH="C:\Users\Administrator\.workbuddy\binaries\node\workspace\node_modules" \
"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.12.0\node.exe" \
create_menu.js
```

## 脚本模板

```javascript
// create_menu.js — 公众号菜单自动创建模板
const { chromium } = require('playwright');

// ★ 在这里定义你的菜单结构
const NEW_MENU = {
  name: "菜单名称",
  button_list: [
    {
      type: 0, name: "父菜单A", act_mode: 0, act_list: [],
      sub_button_list: [
        { type: 1, name: "子菜单A1", act_mode: 0,
          act_list: [{ type: "click", value: "KEY_A1", key: "KEY_A1", option: "SENT_MESSAGE" }] },
        // ...更多子菜单
      ]
    },
    // ...更多父菜单
  ]
};

(async () => {
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const page = browser.contexts()[0]?.pages()?.find(p => p.url().includes('mp.weixin'));
    if (!page) throw new Error('未找到公众号后台页面');

    // 注入菜单数据到 _json 变量
    const result = await page.evaluate((m) => {
      if (typeof _json === 'undefined') return 'ERR:no_json';
      const v = _json.menu_entity?.version || 0;
      _json.menu_entity = { ...m, version: v };
      return _json.menu_entity.button_list.map(b => b.name).join('|');
    }, NEW_MENU);
    if (result.startsWith('ERR')) throw new Error(result);

    console.log('✓ 菜单已注入：' + result);

    // 点击保存按钮（原生JS）
    const clickInfo = await page.evaluate(() => {
      const all = document.querySelectorAll(
        'button,a[class*="btn"],.weui-btn,[role="button"]'
      );
      for (const el of all) {
        const t = (el.textContent || '').trim();
        if (t.includes('保存并发布') || t === '保存') { el.click(); return t; }
      }
      return null;
    });
    if (clickInfo) console.log('✓ 已点击保存：' + clickInfo);

    // 等待保存完成
    await page.waitForTimeout(8000);

    // 验证结果
    const verify = await page.evaluate(() => {
      const b = _json.menu_entity?.button_list || [];
      return b.map(x => x.name + '(' + (x.sub_button_list||[]).length + ')').join('|');
    });
    console.log('验证结果：' + verify);

    await browser.close();
  } catch(e) {
    console.error('❌ ' + e.message);
    if (browser) try { await browser.close(); } catch(e2) {}
    process.exit(1);
  }
})();
```

## 菜单数据结构说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | number | 0=父菜单，1=子菜单 |
| `name` | string | 菜单名称（最多16个字符） |
| `act_mode` | number | 0=发送消息(click)，1=跳转URL(url)，2=跳转小程序(miniprogram) |
| `act_list` | array | 动作列表（通常只有1个元素） |
| `sub_button_list` | array | 子菜单数组（仅父菜单有） |

### action 类型对照表

| type 值 | 含义 | 必填字段 |
|---------|------|---------|
| `"click"` | 发送消息 | `key`, `value`, `option:"SENT_MESSAGE"` |
| `"url"` | 跳转链接 | `value`(URL), `option:"VISIT_URL"` |
| `"miniprogram"` | 跳转小程序 | `value`(appid), `option:"VISIT_MINIPROGRAM"` |

## ⚠️ 关键踩坑备忘

### 0. 未认证订阅号 API 权限（2026-06-05 实测确认）

**7个官方菜单接口中，只有1个可用！**

| 接口 | 状态 | 说明 |
|------|------|------|
| `/cgi-bin/menu/create` | ❌ 48001 | 创建菜单 |
| `/cgi-bin/get_current_selfmenu_info` | ✅ **唯一可用** | 查询当前菜单状态 |
| `/cgi-bin/menu/get` | ❌ 48001 | 获取API菜单配置 |
| `/cgi-bin/menu/delete` | ❌ 48001 | 删除菜单 |
| `/cgi-bin/menu/addconditional` | ❌ 48001 | 个性化菜单创建 |
| `/cgi-bin/menu/trymatch` | ❌ 48001 | 个性化匹配测试 |
| `/cgi-bin/menu/delconditional` | ❌ 48001 | 个性化菜单删除 |

**结论：未认证订阅号的写操作全部被拦截，CDP 浏览器自动化是唯一可行方案。**
**但 `get_current_selfmenu_info` 可用于二次验证 CDP 操作是否生效。**

### 1. IPv6 问题
Node.js 的 HTTP 客户端默认走 IPv6，连接 `localhost:9222` 会失败。
**解决**：始终使用 `http://127.0.0.1:9222`（不是 `localhost`）。

### 2. 截图导致进程崩溃
Playwright 的 `page.screenshot()` 在 Windows + Edge CDP 环境下会导致 **Node.js 进程级崩溃**（非 JS 异常，try-catch 无法捕获）。
**解决**：生产脚本中**完全不要调用 screenshot()**，改用其他方式确认状态。

### 3. `_` 未定义
微信OA页面在某些上下文中 lodash 的 `_` 变量不可用。
**解决**：不要在 `page.evaluate()` 中引用 `_`。

### 4. 页面刷新后 _json 会重置
如果页面被刷新或导航离开菜单设置页，`_json` 中的修改会丢失。
**解决**：注入后立即点击保存，不要做多余操作。

## 扩展用法

### 读取当前菜单
```javascript
const currentMenu = await page.evaluate(() => ({
  name: _json.menu_entity?.name,
  buttons: _json.menu_entity?.button_list?.map(b => ({
    name: b.name, subs: b.sub_button_list?.map(s => s.name)
  }))
}));
```

### 清空所有菜单
```javascript
await page.evaluate(() => {
  _json.menu_entity.button_list = [];
});
```

### 导航到菜单设置页
```javascript
await page.goto(
  'https://mp.weixin.qq.com/advanced/selfmenu?action=index&t=advanced/menu-setting',
  { timeout: 15000 }
);
await page.waitForTimeout(4000); // 等待 _json 加载
```

### API 二次验证（推荐在 CDP 保存后调用）

```python
# 用 get_current_selfmenu_info 验证菜单是否真的生效
import urllib.request, json

def verify_menu_status(appid, secret):
    # 获取 token
    url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}"
    with urllib.request.urlopen(url) as r:
        token = json.loads(r.read())["access_token"]

    # 查询当前菜单状态
    url2 = f"https://api.weixin.qq.com/cgi-bin/get_current_selfmenu_info?access_token={token}"
    with urllib.request.urlopen(url2) as r:
        result = json.loads(r.read())
        print(f"is_menu_open: {result.get('is_menu_open')}")
        return result
```

## 运行环境要求

| 依赖 | 路径 |
|------|------|
| Node.js | `C:\Users\Administrator\.workbuddy\binaries\node\versions\22.12.0\node.exe` |
| playwright-core | `C:\Users\Administrator\.workbuddy\binaries\node\workspace\node_modules` |
| Edge 浏览器 | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |

## 相关文件

| 文件 | 用途 |
|------|------|
| `create_menu_v4.js` | 最终成功版本（极简无截图） |
| `verify_menu.js` | 验证/读取当前菜单 |
| `menu_setup_guide.html` | 手动操作图文指南（备用方案） |
