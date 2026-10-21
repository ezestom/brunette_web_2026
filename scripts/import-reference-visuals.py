from lxml import html,etree
from pathlib import Path
import re,json,shutil
src=Path('bernice-frontend/public');dest=Path('brunette-astro');components=dest/'src/components/reference'
d=html.fromstring((src/'index.html').read_text(encoding='utf8'))
def cls(name,root=d):return root.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," '+name+' ")]')
def serial(e):
 s=html.tostring(e,encoding='unicode')
 for a,b in [('viewbox=','viewBox='),('startoffset=','startOffset='),('<textpath','<textPath'),('</textpath','</textPath')]:s=s.replace(a,b)
 return s
for e in list(d.xpath('//link|//script')):e.getparent().remove(e)
hero=cls('Hero_Section')[0];img=cls('Hero_Back_Img',hero)[0][0];img.attrib.pop('srcset',None);img.set('src','__HEROIMAGE__');img.set('fetchpriority','high');img.set('alt','Tortas y preparaciones del mostrador')
cls('Hero_Heading',hero)[0].text='__HEROTITLE__'
a=cls('Hero_Float_Inner',hero)[0];a.text='Se me antoja';a.set('data-content','Se me antoja')
intro=cls('Title_Text_Section')[0];cls('SectionTitle',intro)[0].text='__INTROTITLE__';cls('Title_Text_Content',intro)[0][0].text='__INTROTEXT__'
feature=cls('Collection_Display_Section')[0];cards=cls('Collection_Display',feature)[0];cards.clear();cards.set('class','Collection_Display');cards.text='__FEATURED__'
for item in cls('Marquee_Content',feature):
 for child in item:child.text='Favoritos'
arches=cls('Arches_Display_Section')[0];cls('SectionTitle',arches)[0].text='La vida es más dulce con un antojo'
cta=cls('Collections_CTA_Section')[0];cls('SectionTitle',cta)[0].text='__STORYTITLE__';cta.xpath('.//textPath|.//textpath')[0].text='__STORYTITLE__';image=cls('Window_Image_Container',cta)[0][0];image.set('src','__STORYIMAGE__');image.attrib.pop('srcset',None);image.set('alt','Preparaciones del mostrador');cls('Collections_CTA_Text',cta)[0].clear();cls('Collections_CTA_Text',cta) if False else None
# clear() removes class; restore it
text=cta[-1];text.set('class','Collections_CTA_Text Cool_Anim Fade');text.text='__STORYTEXT__'
cls('Collections_CTA_Button',cta)[0][0].set('href','/catalogo?categoria=tortas');cls('Collections_CTA_Button',cta)[0][0][0].text='Pedir'
parts=[serial(hero),serial(intro),serial(feature),serial(arches),'__BROWSER__','__SERVICES__',serial(cta)]
s='\n'.join(parts)
replacements={'__HEROIMAGE__':'{home.heroImage}','__HEROTITLE__':'{home.heroTitle}','__INTROTITLE__':'{home.introTitle}','__INTROTEXT__':'{home.introText}','__STORYTITLE__':'{home.storyTitle}','__STORYIMAGE__':'{home.storyImage}','__STORYTEXT__':'{home.storyText}','__FEATURED__':'{products.filter(p=>p.featured).slice(0,3).map(product=><div class="Collection_Display_Item"><ReferenceProduct product={product} currency={settings.currency}/></div>)}','__BROWSER__':'<ReferenceBrowser content={content}/>','__SERVICES__':'<ReferenceServices content={content}/>'}
for a,b in replacements.items():s=s.replace(a,b)
s=s.replace('src="{home.heroImage}"','src={home.heroImage}').replace('src="{home.storyImage}"','src={home.storyImage}')
(components/'ReferenceHome.astro').write_text('''---
import ReferenceProduct from './ReferenceProduct.astro';
import ReferenceBrowser from './ReferenceBrowser.astro';
import ReferenceServices from './ReferenceServices.astro';
import type {Content} from '../../lib/types';
interface Props {content:Content}
const {content}=Astro.props;const {home,products,settings}=content;
---
'''+s,encoding='utf8')
# Retain the exact transition paths from the recovered DOM.
(components/'ReferenceCurtains.astro').write_text('\n'.join(serial(e) for e in d.xpath('//body/svg')),encoding='utf8')
# Keep original image composition for the moving arches, not a rewritten approximation.
# All referenced assets are local. Copy dependency closure of original CSS and templates.
styles=sorted(p.name for p in (src/'assets').glob('*.css') if p.name not in ['custom-dd31907b.css','p-58e59772.css'])
styles=[n for n in styles if n not in ['style-c950c7a6.css']]
styles=['style-c950c7a6.css']+styles
(dest/'src/styles/reference-imports.css').write_text('\n'.join('@import url("/assets/'+n+'");' for n in styles)+'\n',encoding='utf8')
refs=set(re.findall(r'/assets/([a-zA-Z0-9_.-]+)',s+serial(d)))
refs.update(styles);refs.update(['gsap.min-fce7bc2a.js','ScrollTrigger.min-02dea619.js','lenis.min-2302d1bd.js'])
queue=list(refs)
while queue:
 name=queue.pop();p=src/'assets'/name
 if not p.exists():continue
 if p.suffix in ['.css','.svg','.js']:
  for child in re.findall(r'/assets/([a-zA-Z0-9_.-]+)',p.read_text(encoding='utf8')):
   if child not in refs:refs.add(child);queue.append(child)
for name in refs:
 p=src/'assets'/name
 if p.exists() and not (dest/'public/assets'/name).exists():shutil.copy2(p,dest/'public/assets'/name)
# Secondary images and hover ingredient positions stay editable through gallery/allergens.
media={}
for form in cls('Product_Item'):
 link=cls('Product_Item_Image',form)
 if not link:continue
 slug=link[0].get('href','').split('/')[-1];second=cls('Product_Item_Second_Image',form)
 if second:media[slug]=second[0].xpath('.//img/@src')[0]
(dest/'content/reference-media.json').write_text(json.dumps(media,indent=2)+'\n',encoding='utf8')
print('Imported exact section DOM, transition paths, CSS, and',len(refs),'referenced local assets.')
