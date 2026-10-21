from lxml import html
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
d=html.fromstring((root.parent/'bernice-frontend/public/index.html').read_text(encoding='utf8'))
imgs=d.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," Arches_Display_Inner ")]//*[contains(concat(" ",normalize-space(@class)," ")," Window_Image ")]//img/@src')
gallery=imgs[:len(imgs)//2]
(root/'content/reference-gallery.json').write_text(json.dumps(gallery,indent=2)+'\n',encoding='utf8')
labels={}
for form in d.xpath('//form[contains(concat(" ",normalize-space(@class)," ")," Product_Item ")]'):
 links=form.xpath('.//a/@href');ingredients=form.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," Product_Item_Ingredient ")]/span/text()')
 if links and ingredients:labels[links[0].split('/')[-1]]=ingredients
(root/'content/reference-ingredients.json').write_text(json.dumps(labels,indent=2)+'\n',encoding='utf8')
p=root/'src/components/reference/ReferenceHome.astro';s=p.read_text(encoding='utf8')
if 'import ReferenceArches' not in s:s=s.replace('import ReferenceProduct',"import ReferenceArches from './ReferenceArches.astro';\nimport ReferenceProduct",1)
s=re.sub(r'<section class="Section Arches_Display_Section[\s\S]*?</section>','<ReferenceArches content={content}/>',s);p.write_text(s,encoding='utf8')
p=root/'src/lib/types.ts';s=p.read_text(encoding='utf8')
if '  gallery?: string[];' not in s:s=s.replace('  heroTitle: string;','  gallery?: string[];\n  heroTitle: string;')
p.write_text(s,encoding='utf8')
p=root/'src/lib/validation.ts';s=p.read_text(encoding='utf8').replace('home:z.object({heroTitle:','home:z.object({gallery:z.array(image).max(24).default([]),heroTitle:');p.write_text(s,encoding='utf8')
p=root/'src/layouts/Layout.astro';s=p.read_text(encoding='utf8').replace("'footer-10838091.css'];","'footer-10838091.css','product-page-83feeef0.css','collection-page-645db36f.css','other-collection-856f783b.css','timeline-8d4983f7.css'];");p.write_text(s,encoding='utf8')
p=root/'src/components/admin/ContentEditors.tsx';s=p.read_text(encoding='utf8').replace('<div className="editor-section"><h3>Avisos</h3>', '''<div className="editor-section"><h3>Galería de arcos en movimiento</h3><p className="admin-help">Estas fotos recorren la portada de forma continua. Reemplazá las imágenes de ejemplo por fotos del local, productos o equipo. Se repiten automáticamente para que no haya cortes. Si no cargás fotos, se usan las de los productos.</p>{(h.gallery||[]).map((src,i)=><ImageField key={i} label={'Imagen del carrusel '+(i+1)} help="Una foto vertical o cuadrada, sin textos. Se recorta dentro de un arco." value={src} onChange={v=>set('gallery',v?(h.gallery||[]).map((item,j)=>i===j?v:item):(h.gallery||[]).filter((_,j)=>i!==j))}/>)}{(h.gallery||[]).length<24&&<button type="button" className="admin-button secondary" onClick={()=>set('gallery',[...(h.gallery||[]),''])}>+ Agregar imagen al carrusel</button>}</div><div className="editor-section"><h3>Avisos</h3>''');p.write_text(s,encoding='utf8')
print('Galería editable:',len(gallery),'imágenes; etiquetas:',len(labels),'productos.')
