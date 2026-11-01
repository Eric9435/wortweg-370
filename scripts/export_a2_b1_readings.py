#!/usr/bin/env python3
"""Print the original WortWeg A2 and B1 German reading chapters, without translations."""
from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph, Spacer
)
from pypdf import PdfReader

SOURCE={"A2":("a2-reading-chapters.js",14),
        "B1":("b1-reading-chapters.js",16)}
OUT={"A2":"WortWeg_A2_Reading_German_Only.pdf",
     "B1":"WortWeg_B1_Reading_German_Only.pdf",
     "A2-B1":"WortWeg_A2_B1_Reading_German_Only_Combined.pdf"}
PAGE_W,PAGE_H=A4
INK=colors.HexColor("#183047")
MUTED=colors.HexColor("#66798A")
RULE=colors.HexColor("#CBD7E1")
BLUE=colors.HexColor("#167198")


def load_chapters(root:Path,level:str):
    source,count=SOURCE[level]
    text=(root/source).read_text(encoding="utf-8")
    match=re.search(r"Object\.freeze\((\[.*\])\);",text,re.DOTALL)
    if not match:
        raise ValueError(f"{source}: cannot extract original chapter data")
    chapters=json.loads(match.group(1))
    if len(chapters)!=count:
        raise ValueError(f"{source}: expected {count}, found {len(chapters)}")
    titles=set()
    for i,chapter in enumerate(chapters,1):
        title=chapter.get("title","").strip()
        german=chapter.get("de","").strip()
        if not title.startswith(f"{i:02d} · ") or len(german)<300:
            raise ValueError(f"{source}: missing or short German chapter {i}")
        if title in titles: raise ValueError(f"{source}: duplicate title {title}")
        titles.add(title)
        if german==chapter.get("translation",""):
            raise ValueError("English translation incorrectly used as German text")
    return chapters


def set_fonts():
    base=Path("/usr/share/fonts/truetype/dejavu")
    if not base.exists(): raise RuntimeError("Install fonts-dejavu-core")
    for name,file in [
        ("WW-Sans","DejaVuSans.ttf"),
        ("WW-Sans-Bold","DejaVuSans-Bold.ttf"),
        ("WW-Serif","DejaVuSerif.ttf")]:
        pdfmetrics.registerFont(TTFont(name,str(base/file)))


def add_footer(canv,doc):
    canv.saveState()
    canv.setStrokeColor(RULE)
    canv.setLineWidth(.45)
    canv.line(46,PAGE_H-40,PAGE_W-46,PAGE_H-40)
    canv.setFont("WW-Sans",8)
    canv.setFillColor(MUTED)
    canv.drawString(48,PAGE_H-32,"WORTWEG 370  ·  LESETEXTE")
    canv.line(46,43,PAGE_W-46,43)
    canv.drawString(48,29,"Nur Deutsch")
    canv.drawRightString(PAGE_W-48,29,f"Seite {doc.page}")
    canv.restoreState()


def make_pdf(path:Path,levels:list[str],chapters:dict):
    doc=BaseDocTemplate(str(path),pagesize=A4,
      leftMargin=48,rightMargin=48,topMargin=61,bottomMargin=56,
      title="WortWeg "+"/".join(levels)+" Lesetexte",
      author="WortWeg 370",subject="Deutsche Original-Lesetexte ohne Übersetzung",
      pageCompression=1,invariant=1)
    frame=Frame(48,57,PAGE_W-96,PAGE_H-120,
      leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
    doc.addPageTemplates(PageTemplate(id="reading",frames=[frame],onPage=add_footer))

    big=ParagraphStyle("level",fontName="WW-Sans-Bold",fontSize=21,leading=28,
         spaceBefore=1,spaceAfter=8,textColor=INK)
    sub=ParagraphStyle("count",fontName="WW-Sans",fontSize=9.5,leading=15,
         spaceAfter=18,textColor=MUTED)
    heading=ParagraphStyle("chapter",fontName="WW-Sans-Bold",fontSize=12.5,
         leading=18,spaceBefore=14,spaceAfter=9,keepWithNext=True,textColor=BLUE)
    body=ParagraphStyle("prose",fontName="WW-Serif",fontSize=10.8,leading=17.5,
         alignment=TA_LEFT,spaceAfter=13,textColor=INK,allowWidows=0,allowOrphans=0)
    story=[]
    for i,level in enumerate(levels):
        if i: story.append(PageBreak())
        story.append(Paragraph(f"{level} · Lesetexte",big))
        story.append(Paragraph(f"{len(chapters[level])} Kapitel · Deutsche Originaltexte",sub))
        for chapter in chapters[level]:
            title=Paragraph(html.escape(chapter["title"]),heading)
            # The source has one German paragraph per chapter: preserve exact words.
            text=Paragraph(html.escape(chapter["de"]),body)
            story.append(KeepTogether([title,text]))
    doc.build(story)
    return len(PdfReader(str(path)).pages)


def validate_pdf(path:Path,levels:list[str],chapters:dict):
    reader=PdfReader(str(path))
    assert reader.pages
    all_text="\n".join(page.extract_text() for page in reader.pages)
    compact=lambda s:" ".join(s.split())
    all_flat=compact(all_text)
    for page in reader.pages:
        assert abs(float(page.mediabox.width)-PAGE_W)<.5
        assert abs(float(page.mediabox.height)-PAGE_H)<.5
    for level in levels:
        for chapter in chapters[level]:
            assert chapter["title"] in all_text,("Missing heading",chapter["title"])
            de=compact(chapter["de"])
            assert de[:70] in all_flat,("Missing original German text",chapter["title"])
    assert not any("\u1000"<=c<="\u109f" for c in all_text)
    assert not any("English translation" in page.extract_text()
                   for page in reader.pages)
    return len(reader.pages)


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--root",default=".")
    ap.add_argument("--output-dir",default=".")
    args=ap.parse_args()
    root=Path(args.root)
    out=Path(args.output_dir);out.mkdir(parents=True,exist_ok=True)
    set_fonts()
    chapters={level:load_chapters(root,level) for level in SOURCE}
    stats={"source":"WortWeg original A2/B1 reading chapter scripts",
           "languages":["de"],"original_chapters":{"A2":14,"B1":16},
           "documents":{}}
    for key,levels in [("A2",["A2"]),("B1",["B1"]),("A2-B1",["A2","B1"])]:
        filename=OUT[key]
        pages=make_pdf(out/filename,levels,chapters)
        assert pages==validate_pdf(out/filename,levels,chapters)
        stats["documents"][key]={"file":filename,"pages":pages,
            "chapters":sum(map(lambda x:len(chapters[x]),levels))}
    (out/"WortWeg_A2_B1_German_Reading_Export_Summary.json").write_text(
        json.dumps(stats,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(stats,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()
