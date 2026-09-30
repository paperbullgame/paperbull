import re
p='index.html'; s=open(p,encoding='utf-8').read()
s=re.sub(r'\n<!-- LEARN-MODE:START -->.*?<!-- LEARN-MODE:END -->\n','',s,flags=re.S)
core=open('src/edu-core.js',encoding='utf-8').read().replace('if (typeof module !== \'undefined\') module.exports = EDU;','')
ui=open('src/edu-ui.js',encoding='utf-8').read()
assert '</script' not in core+ui
pol=open('src/polish.css',encoding='utf-8').read()
import base64,os
import json as _j2
FD='src/fonts/'
f64=lambda n: base64.b64encode(open(FD+n,'rb').read()).decode()
dv=open('src/design-v2.css',encoding='utf-8').read().replace('__SANS__',f64('sans.woff2')).replace('__MONO5__',f64('mono-500.woff2')).replace('__MONO7__',f64('mono-700.woff2'))
block='\n<!-- LEARN-MODE:START -->\n<style id="pbPolish">\n'+pol+'\n</style>\n<script>\n/* Learn Mode moved to its own site */\n</script>\n<style id="pbDesign">\n'+dv+'\n</style>\n<style id="pbBuck">\n'+open('src/buck-ai.css',encoding='utf-8').read()+'\n</style>\n<style id="pbVisual">\n'+open('src/visual.css',encoding='utf-8').read()+'\n</style>\n<style id="pbArena">\n'+open('src/arena.css',encoding='utf-8').read()+'\n</style>\n<style id="pbProg">\n'+open('src/progression.css',encoding='utf-8').read()+'\n</style>\n<style id="pbModes">\n'+open('src/modes.css',encoding='utf-8').read()+'\n</style>\n<style id="pbTradePlus">\n'+open('src/trading-plus.css',encoding='utf-8').read()+'\n</style>\n<style id="pbSocial">\n'+open('src/social.css',encoding='utf-8').read()+'\n</style>\n<style id="pbReal">\n'+open('src/realmode.css',encoding='utf-8').read()+'\n</style>\n<style id="pbStore">\n'+open('src/store.css',encoding='utf-8').read()+'\n</style>\n<style id="pbShopFx">\n'+open('src/shop-fx.css',encoding='utf-8').read()+'\n</style>\n<style id="pbSettings">\n'+open('src/settings.css',encoding='utf-8').read()+'\n</style>\n<style id="pbLiveBg">\n'+open('src/live-bg.css',encoding='utf-8').read()+'\n</style>\n<style id="pbExotic">\n'+open('src/exotic.css',encoding='utf-8').read()+'\n</style>\n<style id="pbArtPlus">\n'+open('src/art-plus.css',encoding='utf-8').read()+'\n</style>\n<style id="pbInv">\n'+open('src/inventory.css',encoding='utf-8').read()+'\n</style>\n<style id="pbNotify">\n'+open('src/notify.css',encoding='utf-8').read()+'\n</style>\n<style id="pbStocks">\n'+open('src/stocks-plus.css',encoding='utf-8').read()+'\n</style>\n<style id="pbNewsPlus">\n'+open('src/news-plus.css',encoding='utf-8').read()+'\n</style>\n<style id="pbOffice">\n'+open('src/office.css',encoding='utf-8').read()+'\n</style>\n<style id="pbCalm">\n'+open('src/calm.css',encoding='utf-8').read()+'\n</style>\n<style id="pbLegal">\n'+open('src/legal-game.css',encoding='utf-8').read()+'\n</style>\n<style id="pbGarden3D">\n'+open('src/garden3d.css',encoding='utf-8').read()+'\n</style>\n<style id="pbGarden">\n'+open('src/pet-garden.css',encoding='utf-8').read()+'\n</style>\n<style id="pbAbuse">\n'+open('src/abuse.css',encoding='utf-8').read()+'\n</style>\n<style id="pbReveal">\n'+open('src/reveal-fx.css',encoding='utf-8').read()+'\n</style>\n<style id="pbVerse">\n'+open('src/verse.css',encoding='utf-8').read()+'\n</style>\n<style id="pbV3">\n'+open('src/v3.css',encoding='utf-8').read()+'\n</style>\n<style id="pbMobile">\n'+open('src/mobile.css',encoding='utf-8').read()+'\n</style>\n<style id="pbPro">\n'+open('src/pro.css',encoding='utf-8').read().replace('$P','html.classic.dark:not(#_):not(#_):not(#_)').replace('$L','html.classic:not(.dark):not(#_):not(#_):not(#_)')+'\n</style>\n<style id="pbNav">\n'+open('src/nav.css',encoding='utf-8').read().replace('$N','html #nav:not(#_):not(#_):not(#_):not(#_)')+'\n</style>\n<!-- LEARN-MODE:END -->\n'
s=re.sub(r'/\* SHOP-PLUS:START \*/.*?/\* SHOP-PLUS:END \*/\n','',s,flags=re.S)
import json
m=re.search(r"const themes = (\[\s*\{\s*id: 'midnight'.*?\]);",s,flags=re.S); old=re.findall(r"id: '([^']+)', name: '([^']+)'",m.group(1))
tp=open('src/themes-plus.js',encoding='utf-8').read().replace('__OLD_THEMES__',json.dumps([list(x) for x in old]))
sp=open('src/real-data.js',encoding='utf-8').read()+'\n'+open('src/logos.js',encoding='utf-8').read()+'\n'+open('src/world.js',encoding='utf-8').read()+'\n'+open('src/shop-plus.js',encoding='utf-8').read()+'\n'+open('src/art-plus.js',encoding='utf-8').read()+'\n'+tp+'\n'+open('src/bank.js',encoding='utf-8').read()+'\n'+open('src/pets-plus.js',encoding='utf-8').read()+'\n'+open('src/exotic-art.js',encoding='utf-8').read()+'\n'+open('src/exotic.js',encoding='utf-8').read()+'\n'+open('src/pet-garden.js',encoding='utf-8').read()+'\n'+open('src/pet-shop.js',encoding='utf-8').read()+'\n'+open('src/advanced.js',encoding='utf-8').read()+'\n'+open('src/pro-polish.js',encoding='utf-8').read()+'\n'+open('src/ai-cast.js',encoding='utf-8').read()+'\n'+open('src/buck-ai.js',encoding='utf-8').read()+'\n'+open('src/visual.js',encoding='utf-8').read()+'\n'+open('src/online.js',encoding='utf-8').read()+'\n'+open('src/live.js',encoding='utf-8').read()+'\n'+open('src/reveal-fx.js',encoding='utf-8').read()+'\n'+open('src/live-bg.js',encoding='utf-8').read()+'\n'+open('src/settings.js',encoding='utf-8').read()+'\n'+open('src/shop-fx.js',encoding='utf-8').read()+'\n'+open('src/store.js',encoding='utf-8').read()+'\n'+open('src/bus.js',encoding='utf-8').read()+'\n'+open('src/arena.js',encoding='utf-8').read()+'\n'+open('src/progression.js',encoding='utf-8').read()+'\n'+open('src/modes.js',encoding='utf-8').read()+'\n'+open('src/chicken.js',encoding='utf-8').read()+'\n'+open('src/trading-plus.js',encoding='utf-8').read()+'\n'+open('src/social.js',encoding='utf-8').read()+'\n'+open('src/funds.js',encoding='utf-8').read()+'\n'+open('src/ux.js',encoding='utf-8').read()+'\n'+open('src/realmode.js',encoding='utf-8').read()+'\n'+open('src/abuse-fx.js',encoding='utf-8').read()+'\n'+open('src/abuse-icons.js',encoding='utf-8').read()+'\n'+open('src/abuse.js',encoding='utf-8').read()+'\n'+open('src/inventory.js',encoding='utf-8').read()+'\n'+open('src/notify.js',encoding='utf-8').read()+'\n'+open('src/stocks-plus.js',encoding='utf-8').read()+'\n'+open('src/economy.js',encoding='utf-8').read()+'\n'+open('src/news-plus.js',encoding='utf-8').read()+'\n'+open('src/garden3d.js',encoding='utf-8').read()+'\n'+open('src/office.js',encoding='utf-8').read()+'\n'+open('src/office3d.js',encoding='utf-8').read()+'\n'+open('src/hubs.js',encoding='utf-8').read()+'\n'+open('src/legal-game.js',encoding='utf-8').read()+'\n'+open('src/calm.js',encoding='utf-8').read()+'\n'+open('src/pics.js',encoding='utf-8').read()+'\n'+open('src/update.js',encoding='utf-8').read()+'\n'+open('src/v3.js',encoding='utf-8').read(); assert '</script' not in sp
k=s.index('\ninit();\n</script>')
s=s[:k+1]+'/* SHOP-PLUS:START */\n'+sp+'\n/* SHOP-PLUS:END */\n'+s[k+1:]
i=s.rindex('</body>'); s=s[:i]+block+s[i:]
open(p,'w',encoding='utf-8').write(s); print('ok', len(s))
# ---- brand: favicon + app icons ----
import urllib.parse as _u
GAME_CSP="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://assets.parqet.com https://financialmodelingprep.com https://coin-images.coingecko.com https://cdn.jsdelivr.net https://amnbnuabxoxhggidlhcn.supabase.co; font-src 'self' data:; connect-src 'self' https://amnbnuabxoxhggidlhcn.supabase.co wss://amnbnuabxoxhggidlhcn.supabase.co https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; media-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'"
ADMIN_CSP="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://assets.parqet.com https://financialmodelingprep.com https://coin-images.coingecko.com https://cdn.jsdelivr.net https://amnbnuabxoxhggidlhcn.supabase.co; font-src 'self' data:; connect-src https://amnbnuabxoxhggidlhcn.supabase.co wss://amnbnuabxoxhggidlhcn.supabase.co; object-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'none'"
LEGAL_CSP="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src https://amnbnuabxoxhggidlhcn.supabase.co; object-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'none'"
_logo=open('src/brand/logo.svg',encoding='utf-8').read().strip()
_fav='data:image/svg+xml,'+_u.quote(_logo)
_ati='data:image/png;base64,'+base64.b64encode(open('src/brand/icon-180.png','rb').read()).decode()
import time as _tm
_build=_tm.strftime('%Y%m%d%H%M%S')
open('version.txt','w').write(_build+'\n')
_head='<!-- BRAND:START -->\n<script>window.PB_BUILD="'+_build+'";</script>\n<meta http-equiv="Content-Security-Policy" content="%s">\n<meta name="referrer" content="strict-origin-when-cross-origin">\n'%GAME_CSP+'<link rel="icon" type="image/svg+xml" href="'+_fav+'">\n<link rel="apple-touch-icon" href="'+_ati+'">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="PAPERBULL">\n<meta name="description" content="PAPERBULL: trade stocks and crypto with fake money. Learn, compete with friends and climb the leaderboard.">\n<!-- BRAND:END -->\n'
s2=open('index.html',encoding='utf-8').read()
s2=re.sub(r'<!-- BRAND:START -->.*?<!-- BRAND:END -->\n','',s2,flags=re.S)
s2=s2.replace('<title>PAPERBULL</title>\n','<title>PAPERBULL</title>\n'+_head,1)
open('index.html','w',encoding='utf-8').write(s2); s=s2
import shutil
for _z in (192,512): shutil.copy('src/brand/icon-%d.png'%_z,'icon-%d.png'%_z)
open('manifest.webmanifest','w').write(_j2.dumps({'name':'PAPERBULL','short_name':'PAPERBULL','start_url':'./','display':'standalone','background_color':'#f4f5f9','theme_color':'#5b3fe0','icons':[{'src':'icon-192.png','sizes':'192x192','type':'image/png','purpose':'any maskable'},{'src':'icon-512.png','sizes':'512x512','type':'image/png','purpose':'any maskable'}]},indent=1))
print('brand ok')
# ---- admin panel ----
import json as _j
_items=[]
_cp={'c':150,'r':400,'e':1000,'l':2500}
for _m in re.finditer(r"\{\s*id: '([a-z0-9_]+)',\s*type: '([a-z]+)',\s*name: '([^']+)'([^}]*)\}", s):
    _i,_t,_n,_rest=_m.groups()
    if _i in [x[0] for x in _items]: continue
    _r=re.search(r"r: '([crel])'",_rest); _pr=re.search(r"price: (\d+)",_rest)
    _price=int(_pr.group(1)) if _pr else (_cp.get(_r.group(1)) if (_r and _t in ('theme','skin','avatar','title')) else None)
    _items.append([_i,_t,_n,_price,_r.group(1) if _r else None])
for _i,_n,_pr in re.findall(r"id: '([a-z]+)',\s*name: '([^']+)',\s*price: (\d+),\s*cards", s)+re.findall(r"\[\s*'([a-z]+)',\s*'([^']+ Pack)',\s*(\d+),\s*\d+,", s):
    if 'pack:'+_i not in [x[0] for x in _items]: _items.append(['pack:'+_i,'pack',_n,int(_pr),None])
_assets=re.findall(r"^  \['([A-Z0-9.]+)', '([^']+)', '(stock|crypto)', ", s, flags=re.M)
_a=open('src/admin.html',encoding='utf-8').read().replace('/*__ADMIN_ABUSE__*/',open('src/admin-abuse.js',encoding='utf-8').read()).replace('/*__ADMIN_ITEMS__*/',open('src/admin-items.js',encoding='utf-8').read().replace('__SPRITES__',open('src/brand/admin-items.json',encoding='utf-8').read()).replace('__SPRITE_URL__','data:image/webp;base64,'+base64.b64encode(open('src/brand/admin-items.webp','rb').read()).decode())).replace('__EXOTIC_CSS__',open('src/exotic.css',encoding='utf-8').read()+'\n'+open('src/abuse.css',encoding='utf-8').read()).replace('__EXOTIC_JS__',open('src/exotic-art.js',encoding='utf-8').read()+'\n'+open('src/abuse-fx.js',encoding='utf-8').read()+'\n'+open('src/abuse-icons.js',encoding='utf-8').read()).replace('__ITEMS__',_j.dumps(_items)).replace('__ASSETS__',_j.dumps(_assets)).replace('__SANS__',f64('sans.woff2')).replace('__MONO5__',f64('mono-500.woff2')).replace('__FAVICON__',_fav).replace('<!--__CSP__-->','<meta http-equiv="Content-Security-Policy" content="%s" />'%ADMIN_CSP).replace('__LOGO__',_j.dumps(_logo.replace('xmlns="http://www.w3.org/2000/svg" ','').replace('pbLg','pbLgA')))
open('admin.html','w',encoding='utf-8').write(_a); print('admin ok', len(_a))
# ---- legal pages ----
import glob as _g
os.makedirs('legal', exist_ok=True)
_anon=re.search(r"const ANON =\s*'([^']+)'", s).group(1)
_pages=[('privacy','Privacy'),('terms','Terms'),('refunds','Refunds'),('cookies','Cookies'),('credits','Credits'),('contact','Contact')]
shutil.copy('src/legal/site.js','legal/site.js'); shutil.copy('src/legal/legal.css','legal/legal.css')
shutil.copy('src/fonts/OFL-JetBrainsMono.txt','legal/OFL-JetBrainsMono.txt')
for _p,_lbl in _pages:
    _b=open('src/legal/pages/%s.html'%_p,encoding='utf-8').read()
    _t=re.search(r'<!--title:(.*?)-->',_b).group(1)
    _nav=''.join('<a href="%s.html"%s>%s</a>'%(q,' aria-current="page"' if q==_p else '',l) for q,l in _pages)
    _h='''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="%s"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>%s · PAPERBULL</title><meta name="description" content="PAPERBULL %s">
<link rel="icon" type="image/svg+xml" href="%s"><link rel="stylesheet" href="legal.css"><script src="site.js"></script></head>
<body><a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="top-in"><a class="brand" href="../"><i aria-hidden="true"></i>PAPERBULL</a><nav class="lg-nav" aria-label="Legal pages">%s</nav></div></header>
<main id="main" tabindex="-1"><article class="doc">
%s
</article></main>
<footer class="lg-f">© <span id="lgYear">2026</span> PAPERBULL · <span data-l="operator"></span> · <span data-l="region"></span> · A game with virtual money. Not financial advice. · <a href="../">Back to the game</a></footer>
</body></html>
'''%(LEGAL_CSP,_t,_t,_fav,_nav,_b.replace('__ANON__',_anon))
    open('legal/%s.html'%_p,'w',encoding='utf-8').write(_h)
print('legal ok')
