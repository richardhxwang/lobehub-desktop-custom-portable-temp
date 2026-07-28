import fs from 'node:fs';
import path from 'node:path';

const appRoot = path.resolve(process.argv[2] || 'build/app');
const assets = path.join(appRoot, 'dist/renderer/assets');
const htmlPath = path.join(appRoot, 'dist/renderer/apps/desktop/index.html');

if (!fs.existsSync(assets) || !fs.existsSync(htmlPath)) {
  throw new Error(`Unexpected app.asar layout: ${appRoot}`);
}

const providerGrid = fs.readdirSync(assets).find((name) => /^ProviderGrid-.*\.js$/.test(name));
if (!providerGrid) throw new Error('ProviderGrid bundle not found.');

const providerGridPath = path.join(assets, providerGrid);
let providerCode = fs.readFileSync(providerGridPath, 'utf8');
const specialCase = ':e===`lobehub`?(0,G.jsx)(V,{}):';
if (!providerCode.includes(specialCase)) {
  throw new Error('LobeHub provider special-case anchor not found; refusing to patch an unknown build.');
}
providerCode = providerCode.replace(specialCase, ':');
fs.writeFileSync(providerGridPath, providerCode);

const aiInfra = fs.readdirSync(assets).find((name) => /^aiInfra-.*\.js$/.test(name));
if (!aiInfra) throw new Error('aiInfra bundle not found.');

const core = `export const MIGRATION_KEY='lobehub.custom.provider-default-disabled.v1';
const T=new Set(['upgrade your plan','unlock more capacity and advance','upgrade now','upgrade to pro','view plans','choose a plan','buy credits','purchase credits','top up','升级套餐','升级您的套餐','解锁更多容量','立即升级','升级到专业版','查看套餐','选择套餐','购买积分','充值','升級方案','升級您的方案','立即升級','查看方案','購買點數'].map(x=>x.toLocaleLowerCase()));
const R=/(?:^|\\/)(?:pricing|plans?|billing|subscription)(?:\\/|$|[?#])|(?:top[-_ ]?up|purchase[-_ ]?credits?|buy[-_ ]?credits?)/i,A='data-lobehub-custom-hidden',n=v=>String(v||'').replace(/\\s+/g,' ').trim().toLocaleLowerCase();
export const matchesPaidPromotionText=v=>{const t=n(v);if(!t)return false;for(const p of T)if(t===p||(p.length>=12&&t.includes(p)))return true;return false};
export async function migrateLobeHubProviderOnce({storage,getProviders,setProviderEnabled}){if(storage.getItem(MIGRATION_KEY)==='done')return{changed:false,reason:'already-migrated'};const list=await getProviders(),p=Array.isArray(list)?list.find(x=>x?.id==='lobehub'):undefined;if(!p)return{changed:false,reason:'provider-not-found'};if(p.enabled)await setProviderEnabled('lobehub',false);storage.setItem(MIGRATION_KEY,'done');return{changed:Boolean(p.enabled),reason:p.enabled?'disabled':'already-disabled'}}
const hide=e=>{if(!(e instanceof Element)||e.hasAttribute(A))return 0;e.setAttribute(A,'1');e.setAttribute('aria-hidden','true');e.style.setProperty('display','none','important');return 1};
const click=e=>e.closest('a,button,[role="button"],[role="menuitem"]')||e.parentElement||e;
export function scanAndHidePaidUi(root=document.documentElement){let c=0;if(!root)return c;const icons=[];if(root instanceof Element&&root.matches('.nav-upgrade-icon'))icons.push(root);if(root.querySelectorAll)icons.push(...root.querySelectorAll('.nav-upgrade-icon'));for(const i of icons)c+=hide(click(i));const ds=[];if(root instanceof Element&&root.matches('[role="dialog"],.ant-modal'))ds.push(root);if(root.querySelectorAll)ds.push(...root.querySelectorAll('[role="dialog"],.ant-modal'));for(const d of ds)if(matchesPaidPromotionText(d.textContent))c+=hide(d.closest('.ant-modal-root')||d);const cs=[];if(root instanceof Element&&root.matches('a,button,[role="button"],[role="menuitem"]'))cs.push(root);if(root.querySelectorAll)cs.push(...root.querySelectorAll('a,button,[role="button"],[role="menuitem"]'));for(const e of cs){const h=e.getAttribute('href')||e.getAttribute('data-href')||'',l=e.getAttribute('aria-label')||e.getAttribute('title')||'';if(R.test(h)||matchesPaidPromotionText(e.textContent)||matchesPaidPromotionText(l))c+=hide(e)}return c}
export function installPaidUiHider(){if(globalThis.__LOB_CUSTOM_PAID_UI_HIDER__)return;const scan=()=>scanAndHidePaidUi(document.documentElement);document.readyState==='loading'?document.addEventListener('DOMContentLoaded',scan,{once:true}):scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});globalThis.__LOB_CUSTOM_PAID_UI_HIDER__=true}
`;

const runtime = `import{a as providerService,i as aiInfraStore}from'./${aiInfra}';import{installPaidUiHider,migrateLobeHubProviderOnce}from'./lobehub-customization-core.js';installPaidUiHider();const sleep=m=>new Promise(r=>setTimeout(r,m));async function run(){for(let a=0;a<8;a++){try{const r=await migrateLobeHubProviderOnce({storage:localStorage,getProviders:()=>providerService.getAiProviderList(),setProviderEnabled:(id,v)=>providerService.toggleProviderEnabled(id,v)});if(r.reason==='provider-not-found'){await sleep(400*(a+1));continue}if(r.changed){const s=aiInfraStore?.getState?.();await s?.refreshAiProviderList?.();await s?.refreshAiProviderRuntimeState?.()}return}catch(e){await sleep(400*(a+1))}}}void run();`;

fs.writeFileSync(path.join(assets, 'lobehub-customization-core.js'), core);
fs.writeFileSync(path.join(assets, 'lobehub-customization-runtime.js'), runtime);

let html = fs.readFileSync(htmlPath, 'utf8');
const mainScriptMatch = html.match(/<script type="module" crossorigin src="\/assets\/main-[^"]+\.js"><\/script>/);
if (!mainScriptMatch) throw new Error('Desktop main script tag not found.');
const marker = '<!-- lobehub-custom-full-v1 -->';
if (!html.includes(marker)) {
  const injection = `${mainScriptMatch[0]}\n    ${marker}\n    <style>.nav-upgrade-icon,*:has(>.nav-upgrade-icon),[data-lobehub-custom-hidden="1"]{display:none!important}</style>\n    <script type="module" src="/assets/lobehub-customization-runtime.js"></script>`;
  html = html.replace(mainScriptMatch[0], injection);
}
fs.writeFileSync(htmlPath, html);
console.log(JSON.stringify({ providerGrid, aiInfra, patched: true }, null, 2));
