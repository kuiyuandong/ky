// verify_menu.js
// 通过 CDP 连接 Edge，读取公众号后台当前菜单配置

// 尝试多种路径加载 playwright
let chromium;
try { chromium = require('playwright').chromium; } catch(e) {
  try { chromium = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright').chromium; } catch(e2) {
    try { chromium = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core').chromium; } catch(e3) {
      console.error('找不到 playwright，请先安装：npm install playwright');
      process.exit(1);
    }
  }
}

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const contexts = browser.contexts();
    if (!contexts.length) throw new Error('没有找到浏览器上下文，请确认 Edge 已以调试模式启动');
    const pages = contexts[0].pages();
    if (!pages.length) throw new Error('没有找到已打开的页面');

    // 找公众号后台页面
    let targetPage = pages.find(p => p.url().includes('mp.weixin.qq.com'));
    if (!targetPage) {
      console.log('未找到公众号后台页面，当前打开的页面：');
      pages.forEach((p, i) => console.log(`  [${i}] ${p.url().substring(0, 80)}`));
      await browser.close();
      return;
    }

    console.log('找到页面：' + targetPage.url().substring(0, 80));
    await targetPage.reload({ timeout: 15000 });
    await targetPage.waitForTimeout(3000);

    // 读取 _json 菜单数据
    const menuData = await targetPage.evaluate(() => {
      if (typeof _json === 'undefined') return null;
      return {
        name: _json.menu_entity?.name,
        version: _json.menu_entity?.version,
        buttons: _json.menu_entity?.button_list?.map(b => ({
          name: b.name,
          type: b.type,
          sub: b.sub_button_list?.map(s => ({ name: s.name, type: s.type, act: s.act_list?.[0]?.type }))
        }))
      };
    });

    if (!menuData) {
      console.log('未能读取 _json 数据，页面可能未完全加载或已退出登录');
    } else {
      console.log('\n===== 当前菜单配置 =====');
      console.log(JSON.stringify(menuData, null, 2));
      console.log('========================\n');
    }

    await browser.close();
  } catch (e) {
    console.error('连接失败：' + e.message);
    console.error('\n请确认：');
    console.error('1. Edge 已以调试模式启动（远程调试端口 9222）');
    console.error('2. 公众号后台页面仍然打开');
    console.error('\n启动命令（PowerShell）：');
    console.error('Stop-Process -Name msedge -Force; Start-Process "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" -ArgumentList "--remote-debugging-port=9222"');
  }
})();
