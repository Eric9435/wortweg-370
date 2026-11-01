#!/usr/bin/env python3
"""Illustrated bilingual WortWeg A1 complete comic.
A4 portrait, three-column × three-row story panels, 642/642 exact source entries.
No online services, no paid or copyrighted graphics; all comic art is original vector art.
"""
import json, math, re, argparse
from collections import Counter
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

SOURCE="scripts/a1-comic-source.js"
OUTPUT="WortWeg_A1_Complete_Bilingual_Comic_642_Words.pdf"
SUMMARY="WortWeg_A1_Comic_Coverage_642.json"
W,H=A4
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
BLACK="#14293d"; WHITE="#ffffff"; YELLOW="#fff238"; RED="#e8343d"; BLUE="#2079a4"
COLS=3; ROWS=3; GAP=6.6; M=20.5
PW=(W-2*M-2*GAP)/3
PH=231.6
GRID_TOP=H-71.5
ALIAS={"cafe":"cafe","city":"city","home":"home","kitchen":"kitchen","station":"station","classroom":"classroom","market":"market","park":"park","weather":"weather","clinic":"clinic","office":"office","music":"music","travel":"station","party":"party"}
PALETTES=[
("#bfeaf4","#72bed0","#58b88e"),("#f8d8b6","#99dbe7","#80cbaa"),
("#ccdaff","#8bcce7","#66b6b1"),("#ffd3c4","#a7d4db","#6cb5b6"),
("#e0e5ff","#a4dadd","#60bf99"),("#fbe0a5","#9cd8ee","#68c4a0")]
CHAPTER_EN={
"hello":"Hello, Hamburg!","home":"The New Apartment","family":"My Family","morning":"A Good Morning",
"breakfast":"Breakfast and Kitchen","transport":"By Bus and Train","city":"Finding Our Way Through the City",
"course":"In German Class","shopping":"At the Market","cafe":"At the Cafe",
"nature":"In the Green Park","weather":"Sunshine and Rain","health":"At the Doctor",
"work":"Work and Computers","fun":"Free Time and Music","travel":"A Little Journey",
"friends":"New Friends","review":"Our First Month"}
# Each pair matches the two speakers of one original WortWeg A1 story beat, in order.
DIALOGUE_EN={
"hello":[("Hello! My name is Mia.","Hello, Mia! I'm Leo."),("Where are you from?","I'm from Myanmar."),
("And you? Where do you live?","I live in Hamburg."),("Nice to see you!","Yes! We're learning German together."),
("What was your name again?","Leo! See you later, Mia!")],
"home":[("This is my new apartment.","Oh, it's very nice!"),("Where is your room?","Here. The window is big."),
("The table is beside the window.","And the lamp is new."),("Is the kitchen small?","Yes, but it's bright."),
("I feel at home here.","I'm glad!")],
"family":[("Is that your family?","Yes. That's my mother."),("And here is my father.","Do you have siblings?"),
("Yes, one brother.","My sister lives in Berlin."),("Do you visit your family often?","Yes, on the weekend!")],
"morning":[("Good morning! It's seven o'clock.","Are you awake already?"),("Yes, I get up early.","I need a coffee."),
("I leave at eight o'clock.","Me too. See you later!"),("We have plenty of time today.","Then let's make a plan.")],
"breakfast":[("What would you like to eat?","Bread and an egg, please."),
("I'm making breakfast today.","Great! I'll make tea."),("Is the coffee hot?","Yes. Be careful!"),
("We're eating together.","This tastes good!")],
"transport":[("When does the bus arrive?","In five minutes."),("Do you have a ticket?","Yes, here it is."),
("Does the train go to Hamburg?","Yes, we get on here."),("There's the bus stop!","Quick, we have to go!")],
"city":[("Excuse me, where is the post office?","Go straight ahead here."),("Then left and right.","Is it far?"),
("I can see the building.","Yes, it's over there!"),("We're going the right way.","Thanks for your help!")],
"course":[("Good morning! Do you have the book?","Yes, we have the book."),
("Please read the text.","What does this word mean?"),("I understand the question.","Very good! Once more, please."),
("We're speaking German now.","Yes, a little every day.")],
"shopping":[("I need apples and bread.","Let's go to the supermarket."),
("How much does that cost?","Three euros, please."),("I'm paying with money.","Thanks! Here's the bag."),
("Did we buy everything?","Yes, we're going home.")],
"cafe":[("Would you like a coffee?","Yes, please. And a piece of cake."),
("Excuse me, the menu, please!","What would you like to order?"),
("The bill, please.","We'll pay together."),("This cafe is really nice.","Yes, until next time!")],
"nature":[("Look at the flowers!","Yes, the park is beautiful."),("There's a little dog.","And there's a bird flying."),
("The trees are green.","I like sitting in the park."),("Come on, let's keep walking.","Gladly!")],
"weather":[("What's the weather like today?","It's raining a little."),
("I need my jacket.","And I'll take the umbrella."),("Now the sun is shining!","The weather is crazy."),
("Shall we go out anyway?","Yes, gladly!")],
"health":[("I don't feel well.","What's wrong?"),("My head hurts.","Let's go to the doctor."),
("Please drink plenty of water.","Thank you, doctor."),("Are you feeling better?","Yes, thanks for your help.")],
"work":[("I'm working at the office today.","What do you do there?"),
("I'm writing an email.","And I'm learning on the computer."),("Can you help me?","Yes, of course."),
("The work is finished now.","Then we have free time!")],
"fun":[("Do you like playing the piano?","Yes, I play every evening."),
("What music do you listen to?","I like classical music."),("Would you like to go to the cinema?","Yes, this evening."),
("Free time is important.","Yes, and music is fun!")],
"travel":[("Where shall we go on Saturday?","To Berlin!"),
("Have you booked the hotel?","Yes, everything is ready."),("We need the train tickets.","Here they are!"),
("I'm looking forward to the trip.","Me too!")],
"friends":[("Leo, are you coming to my party?","Yes, I'd love to!"),
("When does the celebration start?","At six on Friday."),("My friends are coming too.","I'll bring a present."),
("Thanks for the invitation!","See you Friday!")],
"review":[("We've learned a lot!","Yes, many new words."),
("Living, studying, working …","And finding friends!"),("What shall we do tomorrow?","We'll keep learning German."),
("That was a lovely month.","See you soon!")],
}
def color(h):return HexColor(h)
def rect(c,x,y,w,h,fill,stroke=None,width=1,r=0):
 c.setFillColor(color(fill));c.setStrokeColor(color(stroke or fill));c.setLineWidth(width)
 if r:c.roundRect(x,y,w,h,r,stroke=bool(stroke),fill=1)
 else:c.rect(x,y,w,h,stroke=bool(stroke),fill=1)
def line(c,x1,y1,x2,y2,col=BLACK,th=1):
 c.setStrokeColor(color(col));c.setLineWidth(th);c.line(x1,y1,x2,y2)
def text(c,x,y,s,size=10,font="Reg",fill=BLACK):
 c.setFont(font,size);c.setFillColor(color(fill));c.drawString(x,y,str(s))
def centered(c,x,y,s,size=10,font="Bold",fill=BLACK):
 c.setFont(font,size);c.setFillColor(color(fill));c.drawCentredString(x,y,str(s))
def wrap(s,font,size,max_width):
 # Split by spaces, preserving whole German terms and avoiding truncation.
 out=[];current=""
 for word in str(s).split():
  attempt=(current+" "+word).strip()
  if current and pdfmetrics.stringWidth(attempt,font,size)>max_width:
   out.append(current);current=word
  else:current=attempt
 if current:out.append(current)
 return out or [""]
def fitted_lines(s,width,font="Reg",size=8,min_size=5.8,max_lines=3):
 while size>=min_size:
  lines=wrap(s,font,size,width)
  if len(lines)<=max_lines and all(pdfmetrics.stringWidth(x,font,size)<=width+.1 for x in lines):return lines,size
  size-=.25
 return wrap(s,font,min_size,width),min_size
def draw_cloud(c,x,y,s=1):
 c.setFillColor(color("#fffefa"))
 for dx,dy,r in [(0,0,9),(10,3,12),(-10,-2,8),(22,-2,7)]:
  c.circle(x+dx*s,y+dy*s,r*s,stroke=0,fill=1)
def draw_tree(c,x,y,s=1):
 rect(c,x-3*s,y,6*s,30*s,"#765647")
 for dx,dy,r in [(-10,24,15),(9,34,17),(19,23,13),(-12,39,13)]:
  c.setFillColor(color("#2b8b70"));c.setStrokeColor(color("#184a43"));c.setLineWidth(1.2)
  c.circle(x+dx*s,y+dy*s,r*s,stroke=1,fill=1)
def draw_person(c,x,y,s=1,shirt="#ed7184",hair="#3a2b3b",skin="#f3c09d",wave=False):
 c.saveState();c.translate(x,y);c.scale(s,s)
 # Feet, trousers, torso, arms and a friendly comic face
 line(c,-10,23,-15,1,"#31506b",5)
 line(c,9,23,15,1,"#31506b",5)
 rect(c,-22,24,44,37,shirt,BLACK,1.5,r=8)
 line(c,-23,54,-32,32,skin,6.5)
 line(c,23,54,35 if wave else 31,76 if wave else 34,skin,6.5)
 c.setFillColor(color(skin));c.setStrokeColor(color(BLACK));c.setLineWidth(1.4)
 c.circle(0,82,23,stroke=1,fill=1)
 c.setFillColor(color(hair));p=c.beginPath();p.moveTo(-23,87);p.curveTo(-28,124,18,117,23,90);p.curveTo(16,100,-5,105,-23,87);c.drawPath(p,fill=1,stroke=0)
 c.setFillColor(color(BLACK));c.circle(-8,82,1.9,fill=1,stroke=0);c.circle(9,82,1.9,fill=1,stroke=0)
 c.setStrokeColor(color("#874d49"));c.setLineWidth(1.3);c.arc(-7,65,10,78,190,155)
 c.restoreState()
def draw_scene(c,x,y,w,h,location,beat_i,palette):
 # Original, vector-drawn comic background: never used for actual source text.
 c.saveState();p=PALETTES[palette%len(PALETTES)]
 rect(c,x,y,w,h,p[1]);rect(c,x,y,w,h*.38,p[2])
 draw_cloud(c,x+w*.26,y+h*.82,.45);draw_cloud(c,x+w*.72,y+h*.91,.33)
 z=ALIAS.get(location,"city")
 if z in ("city","station","market","cafe"):
  for a,hei,co in [(.08,.42,"#b6d4e7"),(.32,.56,"#99bad3"),(.76,.47,"#e8c29d")]:
   X=x+w*a;hh=h*hei
   rect(c,X,y+h*.26,w*.28,hh,co,BLACK,.8)
   for i in range(2):
    for j in range(2):
     rect(c,X+9+i*20,y+h*.29+j*17,10,10,"#fff0b8",BLACK,.5)
 if z in ("home","kitchen","classroom","office","clinic","music","party"):
  rect(c,x,y,w,h,"#fce7cb");rect(c,x,y,w,h*.24,"#c9957b")
  rect(c,x+w*.06,y+h*.5,w*.34,h*.38,"#c3eafa",BLACK,1.6)
  line(c,x+w*.23,y+h*.5,x+w*.23,y+h*.88,BLACK,1)
  if z=="classroom":
   rect(c,x+w*.39,y+h*.57,w*.50,h*.30,"#387e69",BLACK,2.6,r=3)
   line(c,x+w*.46,y+h*.75,x+w*.78,y+h*.75,"#fefce2",2)
  if z=="kitchen":
   rect(c,x+w*.71,y+h*.29,w*.23,h*.22,"#85aeb5",BLACK,1)
   rect(c,x+w*.73,y+h*.52,w*.18,4,"#476d7f")
  if z=="office":
   rect(c,x+w*.60,y+h*.41,w*.32,h*.24,"#293d5b",BLACK,2)
   line(c,x+w*.64,y+h*.51,x+w*.88,y+h*.51,"#97ecdc",2)
  if z=="clinic":
   rect(c,x+w*.71,y+h*.59,w*.20,h*.23,WHITE,BLACK,1.2,r=3)
   rect(c,x+w*.79,y+h*.62,4,h*.17,"#e85e6b")
   rect(c,x+w*.74,y+h*.69,w*.14,4,"#e85e6b")
  if z=="music":
   rect(c,x+w*.62,y+h*.37,w*.30,h*.16,"#182b43",BLACK,2)
   for i in range(7):rect(c,x+w*.625+i*w*.041,y+h*.38,w*.033,h*.09,WHITE,BLACK,.4)
  if z=="party":
   for i in range(5):
    X=x+13+i*w*.20
    c.setFillColor(color(["#e66c83","#f4d37b","#61c9b8"][i%3]));c.circle(X,y+h*.76,7,fill=1,stroke=0)
 if z in ("park","weather"):
  draw_tree(c,x+25,y+h*.24,.52);draw_tree(c,x+w*.88,y+h*.20,.46)
  if z=="weather":
   for i in range(8):line(c,x+13+i*17,y+h*.66,x+7+i*17,y+h*.58,"#2873a7",1.2)
 if z=="station":
  rect(c,x+w*.11,y+h*.27,w*.70,h*.22,"#f5cb62",BLACK,1.5,r=6)
  for i in range(3):rect(c,x+w*(.18+.20*i),y+h*.37,w*.13,h*.08,"#b8e5eb",BLACK,.8)
 if z=="market":
  rect(c,x+w*.07,y+h*.31,w*.30,h*.20,"#f7edd7",BLACK,1.2)
  rect(c,x+w*.05,y+h*.50,w*.34,8,"#e55f5b",BLACK,1)
 if z=="cafe":
  rect(c,x+w*.61,y+h*.34,w*.27,8,"#f0ce96",BLACK,1)
  rect(c,x+w*.73,y+h*.22,5,h*.14,"#946b52")
 draw_person(c,x+w*.35,y+h*.075,.53 if h<153 else .62,shirt=["#e65c7d","#f6a846","#67b7a6"][beat_i%3],wave=beat_i%3==0)
 draw_person(c,x+w*.72,y+h*.07,.51 if h<153 else .6,shirt=["#38a4bd","#8a8dd5","#b68dca"][beat_i%3],hair="#342c38",wave=beat_i%4==1)
 c.restoreState()
def draw_balloon(c,x,y,w,h,de,en,speaker):
 rect(c,x+2,y-2,w,h,BLACK,r=8)
 rect(c,x,y,w,h,"#ffffff",BLACK,1.5,r=8)
 # Two-language balloon with speaker label
 text(c,x+8,y+h-11,speaker.upper(),6.25,"Bold","#1777a0")
 lines,sz=fitted_lines(de,w-15,"Bold",8.1,6.2,3)
 base=y+h-23
 for i,row in enumerate(lines[:3]):text(c,x+7,base-i*(sz+2.5),row,sz,"Bold",BLACK)
 ey=base-len(lines[:3])*(sz+2.5)-2
 line(c,x+6,ey+4,x+w-6,ey+4,"#e3e9ef",.55)
 enlines,esz=fitted_lines(en,w-14,"Reg",7.4,5.65,3)
 for i,row in enumerate(enlines[:3]):text(c,x+7,ey-7-i*(esz+2),row,esz,"Reg","#466379")
def draw_word_tag(c,x,y,w,h,term,english,ident):
 rect(c,x,y,w,h,"#fff9cf",BLACK,1.5)
 # left accent rectangle
 rect(c,x,y,4,h,YELLOW)
 maxw=w-35
 term_lines,ts=fitted_lines(term,maxw,"Bold",9.4,6.0,2)
 english_lines,es=fitted_lines(english,maxw,"Reg",7.9,6.1,2)
 tbas=y+h-14
 for j,ln in enumerate(term_lines[:2]):text(c,x+9,tbas-j*(ts+1.8),ln,ts,"Bold",BLACK)
 ebas=tbas-len(term_lines[:2])*(ts+1.8)-1
 for j,ln in enumerate(english_lines[:2]):text(c,x+9,ebas-j*(es+1.0),ln,es,"Reg","#315675")
 text(c,x+w-29,y+7,f"#{ident}",6.25,"Bold","#46768d")
def draw_panel(c,x,y,e,i,wrd):
 width=PW;height=PH
 c.setStrokeColor(color("#0f2234"));c.setLineWidth(2)
 rect(c,x,y,width,height,WHITE,BLACK,1.9)
 # Top bright caption
 rect(c,x+1.1,y+height-24,width-2.2,22,YELLOW)
 narration=f"SCENE {i+1:02}   •   {e['key'].upper()}"
 text(c,x+7,y+height-17,narration,8.1,"Bold",BLACK)
 tagH=52
 sceneY=y+tagH+1; sceneH=height-tagH-25
 draw_scene(c,x+1.4,sceneY,width-2.8,sceneH,e["location"],i,i//9+len(e["title"]))
 beat=e["beats"][(i//2)%len(e["beats"])]
 eng=DIALOGUE_EN[e["key"]][(i//2)%len(e["beats"])]
 actor=(i%2)*2
 # Bubble slightly above actors, between colored header and character faces.
 balloonH=81
 draw_balloon(c,x+8,sceneY+sceneH-balloonH-7,width-16,balloonH,beat[1+actor],eng[actor//2],beat[actor])
 draw_word_tag(c,x+1.4,y+1.5,width-2.8,tagH-1,wrd["de"],wrd["en"],wrd["id"])
def load():
 raw=Path(SOURCE).read_text(encoding="utf-8")
 m=re.search(r'window\.WortWegA1ComicData=(\{.*\});\s*$',raw,re.S)
 if not m:raise RuntimeError("Missing WortWeg A1 Word Bank source data")
 doc=json.loads(m.group(1))
 assert len(doc["episodes"])==18 and doc["total"]==642
 words=[w for e in doc["episodes"] for w in e["words"]]
 assert len(words)==642 and len(set(w["id"] for w in words))==642
 for e in doc["episodes"]:
  assert e["key"] in CHAPTER_EN and e["key"] in DIALOGUE_EN
  assert len(DIALOGUE_EN[e["key"]])==len(e["beats"]),e["key"]
  for w in e["words"]:assert isinstance(w["de"],str) and w["de"].strip() and w["en"].strip(),w
 return doc
def banner(c,title,subtitle,chapter,page,total_chapters=18):
 rect(c,0,H-64,W,64,BLACK)
 text(c,M,H-26,f"WORTWEG COMICS   |   EPISODE {chapter:02}/{total_chapters}",11,"Bold",YELLOW)
 text(c,M,H-48,title.upper(),15,"Bold",WHITE)
 c.setFont("Reg",7.5);c.setFillColor(color("#a9d6e1"));c.drawRightString(W-M,H-45,subtitle)
 rect(c,M,18,W-2*M,1.2,BLACK)
 text(c,M,9,"A1 GERMAN + ENGLISH   •   ORIGINAL COMIC SERIES",6.9,"Bold","#465f75")
 c.setFont("Bold",7.0);c.setFillColor(color(BLACK));c.drawRightString(W-M,9,f"{page:03}")
def cover(c):
 rect(c,0,0,W,H,"#fffdf6")
 rect(c,0,H-205,W,205,"#f7e343")
 c.setLineWidth(5);c.setStrokeColor(color(BLACK))
 c.line(21,H-207,W-21,H-207)
 centered(c,W/2,H-67,"WORTWEG",49,"Bold",RED)
 centered(c,W/2,H-117,"COMIC ADVENTURES",30,"Bold",BLACK)
 centered(c,W/2,H-149,"A1 · THE COMPLETE GERMAN WORD BANK",13,"Bold","#164b62")
 centered(c,W/2,H-177,"BILINGUAL EDITION  ·  DEUTSCH + ENGLISH",10,"Bold",BLACK)
 samples=[
 {"key":"hello","title":"Hallo, Hamburg!","location":"city","beats":[["Mia","Hallo! Ich heiße Mia.","Leo","Hallo, Mia! Ich bin Leo."]]},
 {"key":"home","title":"Die neue Wohnung","location":"home","beats":[["Mia","Das ist meine neue Wohnung.","Leo","Oh, sie ist sehr schön!"]]},
 {"key":"breakfast","title":"Frühstück und Küche","location":"kitchen","beats":[["Leo","Was möchtest du essen?","Mia","Brot und ein Ei, bitte."]]},
 {"key":"course","title":"Im Deutschkurs","location":"classroom","beats":[["Lehrer","Guten Morgen! Habt ihr das Buch?","Mia","Ja, wir haben das Buch."]]},
 {"key":"transport","title":"Mit Bus und Bahn","location":"station","beats":[["Mia","Wann kommt der Bus?","Leo","In fünf Minuten."]]},
 {"key":"nature","title":"Im grünen Park","location":"park","beats":[["Mia","Sieh mal, die Blumen!","Leo","Ja, der Park ist schön."]]}
 ]
 sample_words=[("Hallo","hello",1),("die Wohnung","apartment",2),("der Kaffee","coffee",3),("lernen","to learn",4),("der Bus","bus",5),("der Park","park",6)]
 sy=H-228
 for k,e in enumerate(samples):
  x=M+(k%3)*(PW+GAP);y=sy-((k//3)+1)*PH+3
  wrd={"id":sample_words[k][2],"de":sample_words[k][0],"en":sample_words[k][1]}
  draw_panel(c,x,y,e,k,wrd)
 # Footer stripe and note, accessible not obscured.
 rect(c,0,9,W,49,"#163d5b")
 centered(c,W/2,32,"642 WORDS   •   18 EPISODES   •   9 PANELS PER PAGE",10,"Bold",WHITE)
 centered(c,W/2,17,"Every original A1 entry appears with an English meaning.",7.5,"Reg","#d0e5ee")
 c.showPage()
def contents(c,doc,page):
 rect(c,0,0,W,H,"#fffefa")
 rect(c,0,H-111,W,111,BLACK)
 text(c,M,H-48,"YOUR COMIC STORYBOOK",28,"Bold",YELLOW)
 text(c,M,H-74,"18 illustrated episodes · 642 source entries",12,"Reg",WHITE)
 text(c,M,H-94,"Open any chapter from the PDF bookmarks.",9,"Reg","#bfd6e6")
 x0=M; y=H-149
 for n,e in enumerate(doc["episodes"]):
  col=n//9;row=n%9
  x=x0+col*(W/2-10)
  yy=y-row*62
  rect(c,x,yy-45,W/2-26,53,"#edf7f9" if row%2==0 else "#fff3c9",BLACK,.9,r=7)
  text(c,x+9,yy-10,f"{n+1:02}",12,"Bold",RED)
  lines,sz=fitted_lines(e["title"],W/2-75,"Bold",11,8,2)
  for i,t in enumerate(lines):text(c,x+40,yy-10-i*12,t,sz,"Bold",BLACK)
  text(c,x+40,yy-32,f"{len(e['words'])} original A1 words",8,"Reg","#406983")
 text(c,M,41,"How to read: the speech balloon shows German, followed by English.",8,"Reg","#3d5d73")
 text(c,M,27,"The yellow vocabulary box displays the EXACT WortWeg word and its meaning.",8,"Reg","#3d5d73")
 c.showPage()
def run(output,summary):
 assert Path(FONT).exists() and Path(BOLD).exists(),"DejaVu Sans fonts are required"
 pdfmetrics.registerFont(TTFont("Reg",FONT))
 pdfmetrics.registerFont(TTFont("Bold",BOLD))
 doc=load()
 c=canvas.Canvas(output,pagesize=A4,pageCompression=1,invariant=1)
 c.setTitle("WortWeg A1 Complete Comic | All 642 German Words with English")
 c.setAuthor("WortWeg 370")
 c.setSubject("Original bilingual German-English illustrated comic | 642 source A1 entries")
 cover(c);contents(c,doc,2)
 book=[];page=2;rows=[];ids=[]
 for n,e in enumerate(doc["episodes"],start=1):
  start=page+1
  c.bookmarkPage("episode-"+str(n))
  c.addOutlineEntry(f"{n:02} {e['title']} / {CHAPTER_EN[e['key']]}","episode-"+str(n),0)
  for offset in range(0,len(e["words"]),9):
   block=e["words"][offset:offset+9]
   page+=1
   banner(c,e["title"],CHAPTER_EN[e["key"]],n,page)
   for k,wrd in enumerate(block):
    col=k%3;row=k//3
    x=M+col*(PW+GAP)
    y=GRID_TOP-(row+1)*PH-row*GAP
    draw_panel(c,x,y,e,offset+k,wrd)
    ids.append(wrd["id"])
    rows.append({"id":wrd["id"],"de":wrd["de"],"en":wrd["en"],"chapter":n,"page":page})
   c.showPage()
  book.append({"number":n,"de":e["title"],"en":CHAPTER_EN[e["key"]],"count":len(e["words"]),"pages":[start,page]})
 assert len(ids)==len(set(ids))==642
 assert sum(e["count"] for e in book)==642
 c.save()
 out={"total_source_entries":642,"unique_source_ids":642,"chapters":18,"comic_pages":page-2,"pdf_pages":page,"language":["German","English"],"page_size":"A4 portrait","layout":"3 columns × 3 rows","chapters_detail":book,"source_records":rows}
 Path(summary).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({k:v for k,v in out.items() if k!="source_records" and k!="chapters_detail"},ensure_ascii=False,indent=2))
def main():
 ap=argparse.ArgumentParser();ap.add_argument("--output",default=OUTPUT);ap.add_argument("--summary",default=SUMMARY)
 args=ap.parse_args();run(args.output,args.summary)
if __name__=="__main__":main()
