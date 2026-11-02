#!/usr/bin/env python3
"""Export WortWeg Lifetime V1/V2/V3 verbs into fully paginated A4 4-column PDFs.

Myanmar meanings are sourced ONLY from the embedded WortWeg word bank.
Untranslated dictionary-only entries are visually marked, never invented.
"""
import html
import json
import re
import sys
from pathlib import Path
from collections import OrderedDict
from weasyprint import HTML

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/"exports"
OUT.mkdir(exist_ok=True)

lex=json.loads((ROOT/"assets/german-verbs-lifetime.json").read_text(encoding="utf-8"))
dict_rows=lex["rows"]
# Original app also adds 17 manually curated principal-part entries.
manual=[
("sein","war","gewesen","sein"),
("ad absurdum führen","führte ad absurdum","ad absurdum geführt","haben"),
("zugrunde legen","legte zugrunde","zugrunde gelegt","haben"),
("abschätzen","schätzte ab","abgeschätzt","haben"),
("extrapolieren","extrapolierte","extrapoliert","haben"),
("generalisieren","generalisierte","generalisiert","haben"),
("attribuieren","attribuierte","attribuiert","haben"),
("dekonstruieren","dekonstruierte","dekonstruiert","haben"),
("dissimulieren","dissimulierte","dissimuliert","haben"),
("fragmentieren","fragmentierte","fragmentiert","haben"),
("kanonisieren","kanonisierte","kanonisiert","haben"),
("kontextualisieren","kontextualisierte","kontextualisiert","haben"),
("rekontextualisieren","rekontextualisierte","rekontextualisiert","haben"),
("vergegenwärtigen","vergegenwärtigte","vergegenwärtigt","haben"),
("verobjektivieren","verobjektivierte","verobjektiviert","haben"),
("verschränken","verschränkte","verschränkt","haben"),
("zuspitzen","spitzte zu","zugespitzt","haben")
]
forms=OrderedDict()
for row in manual+dict_rows:
    v1,v2,v3,aux=row
    forms[v1.casefold()]=(v1,v2,v3,aux)
assert len(forms)==8000, f"Expected 8000 app verbs, got {len(forms)}"
# Preserve the site's own Myanmar glosses and level info; no machine-invented translations.
page=(ROOT/"index.html").read_text(encoding="utf-8")
match=re.search(r'<script\s+type="application/json"\s+id="data">([\s\S]*?)</script>',page)
assert match, "Embedded word bank JSON was not found."
data=json.loads(match.group(1))
bank=data["bank"]+data.get("curated",[])
vocabulary={}
for item in bank:
    if item.get("type") not in {"verb","modal verb","verb phrase"}: continue
    word=str(item.get("de","")).strip()
    gloss=str(item.get("mm") or item.get("my") or "").strip()
    english=str(item.get("en") or "").strip()
    if not word: continue
    key=word.casefold()
    if gloss and key not in vocabulary: vocabulary[key]=(gloss,english)
    # Some user-facing reflexive/preposition entries share a base verb.
    normalized=key.removeprefix("sich ").removesuffix(" von")
    if gloss and normalized not in vocabulary:vocabulary[normalized]=(gloss,english)

all_rows=sorted(forms.values(), key=lambda r:r[0].casefold())
def valid_gloss(s):
    return bool(s and re.search(r"[\u1000-\u109f]",s))
# Extra curated forms which may be in app's 360-word selection but not the dictionary.
enriched=[]
for v1,v2,v3,aux in all_rows:
    gloss,eng=vocabulary.get(v1.casefold(),("",""))
    enriched.append((v1,v2,v3,aux,gloss if valid_gloss(gloss) else "",eng))
matched=sum(bool(row[4]) for row in enriched)
print(f"Dictionary entries: {len(all_rows)}; Myanmar glosses matched: {matched}",flush=True)

def esc(s):return html.escape(str(s),quote=True)
def rows_html(rows):
    parts=[]
    for i,(v1,v2,v3,aux,my,en) in enumerate(rows,1):
        translation=f'<span class="mm">{esc(my)}</span>' if my else '<span class="missing">—</span>'
        parts.append('<div class="entry"><div class="lemma"><b>'+esc(v1)+'</b><i class="aux">'+esc(aux)+'</i></div>'
          +'<div class="form"><span class="tag">V2</span> '+esc(v2)+'</div>'
          +'<div class="form"><span class="tag">V3</span> '+esc(v3)+'</div>'
          +'<div class="meaning"><span class="tag">MY</span> '+translation+'</div></div>')
    return '\n'.join(parts)
def make_html(rows,subtitle,note):
    css=r"""
    @page { size:A4 portrait; margin:11mm 6.8mm 11mm 6.8mm;
      @top-left {content:"WORTWEG 370  /  V1 · V2 · V3"; font: 600 7pt 'DejaVu Sans';color:#46606b;}
      @top-right {content:"GERMAN → MYANMAR  /  4-COLUMN A4"; font: 600 6.8pt 'DejaVu Sans';color:#46606b;}
      @bottom-left {content:"WortWeg data · Wiktionary-derived forms (CC BY-SA 4.0) · See repository attribution";font: 5.7pt 'DejaVu Sans';color:#637582;}
      @bottom-right {content:"Page " counter(page) " / " counter(pages);font: 6.6pt 'DejaVu Sans';color:#31485a;} }
    *{box-sizing:border-box}
    body{font-family:'DejaVu Sans','Noto Sans Myanmar',sans-serif;color:#152a38;font-size:7.7pt;line-height:1.32;margin:0}
    .cover{padding:2mm 0 3mm;border-bottom:.7mm solid #0d837b;margin-bottom:2mm}
    h1{font-size:17pt;letter-spacing:-.5pt;margin:0 0 2mm;font-weight:800}
    .subtitle{color:#257c78;font-size:8.5pt;font-weight:700;margin:0 0 1.5mm}
    .note{font-size:7pt;line-height:1.5;color:#596b76;margin:0}
    .data{column-count:4;column-gap:2.8mm;column-fill:auto}
    .entry{break-inside:avoid;page-break-inside:avoid;padding:1.45mm 1.1mm 1.5mm;margin:0 0 1.1mm;border:1px solid #dce5e8;border-radius:1mm;background:#fff;min-width:0;overflow-wrap:anywhere}
    .lemma{display:flex;gap:1mm;align-items:baseline;justify-content:space-between;word-break:break-word}
    .lemma b{font-weight:800;font-size:8pt}
    .aux{font-size:5.7pt;font-weight:600;font-style:normal;color:#4a717b}
    .form{font-size:6.9pt;margin-top:.55mm}
    .tag{font-size:5.6pt;letter-spacing:.02em;font-weight:800;color:#217e7d;margin-right:.5mm}
    .meaning{border-top:0.3px solid #e1ebef;margin-top:1mm;padding-top:.9mm;font-size:7.25pt}
    .mm{font-family:'Noto Sans Myanmar','Padauk',sans-serif;font-size:7.8pt;line-height:1.6;color:#153b48;word-break:break-word}
    .missing{color:#b9c3ca}
    """
    return f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>{css}</style></head><body>
    <section class="cover"><h1>WortWeg 370 · Lifetime German Verbs</h1>
    <p class="subtitle">{esc(subtitle)}</p><p class="note">{esc(note)}</p></section>
    <main class="data">{rows_html(rows)}</main></body></html>"""

full_note=(f"{len(all_rows):,} unique German verbs. Myanmar meanings available for {matched:,} "
           "matching WortWeg word-bank entries. — means source meaning not available; not a translation error. "
           "V2/V3 may have variants; verify unfamiliar forms in a dictionary.")
study=[r for r in enriched if r[4]]
study_note=(f"{len(study):,} verbs with a Myanmar meaning recorded in WortWeg. "
            "Only the app's own known translations are included; ambiguous or rare verb meanings need expert review.")
outputs=[
  ("WortWeg_Lifetime_Verbs_8000_V1_V2_V3_A4_4Columns.pdf",enriched,f"ALL {len(enriched):,} VERBS · V1 / V2 / V3 / AUX / MYANMAR WHEN AVAILABLE",full_note),
  ("WortWeg_Verbs_with_Myanmar_Meaning_A4_4Columns.pdf",study,
   f"{len(study):,} WORTWEG VERBS WITH MYANMAR GLOSSES",study_note),
]
for filename,rows,subtitle,note in outputs:
    document=HTML(string=make_html(rows,subtitle,note),base_url=str(ROOT))
    path=OUT/filename
    document.write_pdf(str(path))
    print("OUTPUT",path,len(rows),path.stat().st_size,flush=True)
