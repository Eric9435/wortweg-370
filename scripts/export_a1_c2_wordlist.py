#!/usr/bin/env python3
"""Export the entire WortWeg HTML Word Bank, preserving A1-C2 level order.
PDF pages: A4 portrait, 4 columns, original German field only.
No translation/explanation, no invented or discarded entries.
"""
import argparse
import json
import re
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas

LEVELS=("A1","A2","B1","B2","C1","C2")
W,H=A4
MARGIN=29.0
TOP=42.0
BOTTOM=30.0
GAP=12.0
COLS=4
SIZE=8.05
LINE=11.1
AFTER=1.65
CW=(W-2*MARGIN-GAP*(COLS-1))/COLS
PDF_NAME="WortWeg_A1-C2_German_Words_A4_4_Columns.pdf"

def load(index):
    html=Path(index).read_text(encoding="utf-8")
    m=re.search(r'<script\s+type="application/json"\s+id="data">([\s\S]*?)</script>',html)
    if not m:
        raise ValueError("Embedded WortWeg JSON Word Bank not found")
    records=json.loads(m.group(1))["bank"]
    groups={level:[] for level in LEVELS}
    for record in records:
        level=record.get("level")
        word=record.get("de")
        if level not in groups or not isinstance(word,str) or not word.strip():
            raise ValueError("Bad level or German word: "+str(record)[:130])
        groups[level].append(word.strip())
    return groups,len(records)

def words_to_lines(word):
    maxw=CW-4
    if pdfmetrics.stringWidth(word,"Word",SIZE)<=maxw:
        return [(word,SIZE)]
    parts=word.split(" ")
    if len(parts)==1:
        s=max(5.65,SIZE*maxw/max(pdfmetrics.stringWidth(word,"Word",SIZE),1))
        return [(word,min(SIZE,s))]
    rows=[]
    current=""
    for part in parts:
        attempt=(current+" "+part).strip()
        if current and pdfmetrics.stringWidth(attempt,"Word",SIZE)>maxw:
            rows.append(current)
            current=part
        else:
            current=attempt
    if current:
        rows.append(current)
    return [(row,min(SIZE,max(5.65,SIZE*maxw/max(pdfmetrics.stringWidth(row,"Word",SIZE),1)))) for row in rows]

def page_top(pdf,level,n):
    pdf.setFont("Word-Bold",16)
    pdf.setFillColor(colors.HexColor("#182C41"))
    pdf.drawString(MARGIN,H-29.5,level)
    pdf.setStrokeColor(colors.HexColor("#CBD8E3"))
    pdf.setLineWidth(.65)
    pdf.line(MARGIN,H-36.5,W-MARGIN,H-36.5)
    pdf.setStrokeColor(colors.HexColor("#E6EBF0"))
    pdf.setLineWidth(.4)
    for k in range(1,COLS):
        x=MARGIN+k*CW+(k-.5)*GAP
        pdf.line(x,BOTTOM+3,x,H-TOP-5)
    pdf.setFont("Word",7.1)
    pdf.setFillColor(colors.HexColor("#647889"))
    pdf.drawCentredString(W/2,16,str(n))

def export(groups,output):
    fp="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    fb="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    if not Path(fp).exists():
        raise FileNotFoundError("Install fonts-dejavu-core to export this PDF")
    pdfmetrics.registerFont(TTFont("Word",fp))
    pdfmetrics.registerFont(TTFont("Word-Bold",fb))
    pdf=Canvas(str(output),pagesize=A4,pageCompression=1,invariant=1)
    pdf.setTitle("WortWeg A1-C2 German Word List - A4 Four Columns")
    pdf.setAuthor("WortWeg 370")
    pdf.setSubject("German-only vocabulary exported directly from website bank")
    number=0
    count=0
    report={}
    for level in LEVELS:
        words=groups[level]
        if not words:
            continue
        pages=1
        number+=1
        pdf.bookmarkPage("level-"+level)
        pdf.addOutlineEntry(level,"level-"+level,level=0)
        page_top(pdf,level,number)
        column=0
        y=H-TOP-11
        for word in words:
            lines=words_to_lines(word)
            height=len(lines)*LINE+AFTER
            if y-height<BOTTOM+8:
                column+=1
                y=H-TOP-11
            if column>=COLS:
                pdf.showPage()
                number+=1
                pages+=1
                page_top(pdf,level,number)
                column=0
            x=MARGIN+column*(CW+GAP)+2
            pdf.setFillColor(colors.HexColor("#1B2C3E"))
            for content,font_size in lines:
                pdf.setFont("Word",font_size)
                pdf.drawString(x,y,content)
                y-=LINE
            y-=AFTER
            count+=1
        pdf.showPage()
        report[level]={"entries":len(words),"pages":pages}
    pdf.save()
    return {"entries":count,"pages":number,"levels":report}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--index",default="index.html")
    p.add_argument("--output",default=PDF_NAME)
    p.add_argument("--summary",default="WortWeg_A1-C2_export_summary.json")
    args=p.parse_args()
    groups,n=load(args.index)
    result=export(groups,args.output)
    if n!=result["entries"]:
        raise AssertionError("Source/export entry count mismatch")
    Path(args.summary).write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,indent=2))
if __name__=="__main__":
    main()
