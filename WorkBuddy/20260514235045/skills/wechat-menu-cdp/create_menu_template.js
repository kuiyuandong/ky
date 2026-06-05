// create_menu_v4.js
// 极简版：注入数据 → 点击保存 → 验证。不做截图。

const { chromium } = require('playwright');

const NEW_MENU = {
  name: "金玉满屋97",
  button_list: [
    { type:0,name:"景点导游",act_mode:0,act_list:[], sub_button_list:[
      {type:1,name:"鸭绿江断桥",act_mode:0,act_list:[{type:"click",value:"GUIDE_DUANQIAO",key:"GUIDE_DUANQIAO",option:"SENT_MESSAGE"}]},
      {type:1,name:"鸭绿江沿线5站",act_mode:0,act_list:[{type:"click",value:"GUIDE_YANXIAN",key:"GUIDE_YANXIAN",option:"SENT_MESSAGE"}]},
      {type:1,name:"鞍钢博物馆",act_mode:0,act_list:[{type:"click",value:"GUIDE_ANGANG",key:"GUIDE_ANGANG",option:"SENT_MESSAGE"}]},
      {type:1,name:"更多景点",act_mode:0,act_list:[{type:"click",value:"GUIDE_MORE",key:"GUIDE_MORE",option:"SENT_MESSAGE"}]}
    ]},
    { type:0,name:"备考资料",act_mode:0,act_list:[], sub_button_list:[
      {type:1,name:"每日一练",act_mode:0,act_list:[{type:"click",value:"EXAM_DAILY",key:"EXAM_DAILY",option:"SENT_MESSAGE"}]},
      {type:1,name:"音频导览",act_mode:1,act_list:[{type:"url",value:"https://www.ximalaya.com",option:"VISIT_URL"}]},
      {type:1,name:"考试资讯",act_mode:1,act_list:[{type:"url",value:"https://ln.bm.sxfwjw.cn/",option:"VISIT_URL"}]},
      {type:1,name:"知识付费",act_mode:0,act_list:[{type:"click",value:"PAY_CONTENT",key:"PAY_CONTENT",option:"SENT_MESSAGE"}]}
    ]},
    { type:0,name:"关于我们",act_mode:0,act_list:[], sub_button_list:[
      {type:1,name:"关于金玉",act_mode:0,act_list:[{type:"click",value:"ABOUT_ME",key:"ABOUT_ME",option:"SENT_MESSAGE"}]},
      {type:1,name:"合作咨询",act_mode:1,act_list:[{type:"url",value:"https://work.weixin.qq.com",option:"VISIT_URL"}]},
      {type:1,name:"入群交流",act_mode:1,act_list:[{type:"url",value:"https://work.weixin.qq.com",option:"VISIT_URL"}]}
    ]}
  ]
};

(async () => {
  let browser;
  try {
    console.log('[1] 连接 Edge...');
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const page = browser.contexts()[0]?.pages()?.find(p => p.url().includes('mp.weixin'));
    if (!page) throw new Error('未找到公众号后台页面');

    // 注入菜单数据
    const injectResult = await page.evaluate((m) => {
      if (typeof _json === 'undefined') return 'ERR:no_json';
      const v = _json.menu_entity?.version || 0;
      _json.menu_entity = { ...m, version: v };
      return _json.menu_entity.button_list.map(b => b.name + '(' + b.sub_button_list?.length + ')').join('|');
    }, NEW_MENU);
    if (injectResult.startsWith('ERR')) throw new Error(injectResult);
    console.log('[2] ✓ 菜单已注入：' + injectResult);

    // 点击保存按钮
    const clickInfo = await page.evaluate(() => {
      const all = document.querySelectorAll('button,a[class*="btn"],.weui-btn,[role="button"]');
      for (const el of all) {
        const t=(el.textContent||'').trim();
        if(t.includes('保存并发布')||t==='保存'){el.click();return t;}
      }
      return null;
    });
    if (clickInfo) {
      console.log('[3] ✓ 已点击：' + clickInfo);
    } else {
      console.log('[3] ⚠ 未找到保存按钮，请手动点击页面上的「保存并发布」');
    }

    // 等待
    console.log('[4] 等待8秒让保存完成...');
    await page.waitForTimeout(8000);

    // 验证
    const result = await page.evaluate(() => {
      if(typeof _json==='undefined')return 'ERR';
      const b=_json.menu_entity?.button_list||[];
      return JSON.stringify({
        name:_json.menu_entity?.name,
        ver:_json.menu_entity?.version,
        count:b.length,
        menus:b.map(x=>({n:x.name,s:x.sub_button_list?.map(y=>y.name)||[]}))
      });
    });

    console.log('\n===== 结果 =====');
    console.log(result);
    const r=JSON.parse(result);
    if(r.count>=3)console.log('\n✅ 成功！请在微信中查看菜单更新');else console.log('\n⚠ 数量不足，请手动检查');

    await browser.close();
    process.exit(0);
  } catch(e) {
    console.error('\n❌ '+e.message);
    if(browser)try{await browser.close();}catch(e2){}
    process.exit(1);
  }
})();
