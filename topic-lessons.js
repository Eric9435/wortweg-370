/* WortWeg 370 · Topic vocabulary lessons
   Topic 1: 41 existing curated items. Other topics: honest suggestions from
   the local CEFR Word Bank plus explicitly labelled starter expressions.
   Only words with real bank/curated IDs enter the existing quiz progress. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),dataNode=$('data'),root=document.querySelector('main');
 if(!dataNode||!root||!window.WortWeg?.navigate||!window.WortWeg?.getProgress)return;
 let data;
 try{data=JSON.parse(dataNode.textContent)}catch{return;}
 const topics=data.topics||[],bank=data.bank||[],curated=data.curated||[];
 if(!topics.length||!bank.length)return;
 const byId=new Map(topics.map(t=>[t.id,t]));
 const levels=['A1','A2','B1','B2','C1','C2'],rank=new Map(levels.map((name,i)=>[name,i]));
 const stop=new Set(['with','from','your','und','der','die','das','ein','eine','den','dem','des','bei','beim','sich','über','the','and','for','of','in','on','to','by','or','all','complete','types','getting','human','personal','other']);
 const hint={
  2:'name age birthday first surname',3:'country nationality citizen',4:'language speak german',5:'hello morning greeting introduce',6:'meet friend introduce name',
  7:'family mother father child',8:'family mother father cousin',9:'partner love marriage relationship',10:'mother child pregnancy',11:'born child mother',12:'child small',
  14:'young teenager age',15:'adult mature',16:'old elderly age',18:'beautiful tall small old',19:'friendly honest character',
  20:'happy sad angry emotion',21:'body arm leg hand',22:'eye mouth nose',23:'hair head',24:'hand foot leg',25:'walk move run',
  26:'see hear taste smell touch',27:'health healthy doctor',28:'ill sick cough',29:'pain hurt accident',30:'doctor practice appointment',
  34:'tooth dental',35:'eye glasses',37:'sport walk move fitness',38:'food fruit vegetable',39:'wash shower soap',
  40:'bathroom toilet wash',41:'morning breakfast wake',42:'clothing shirt dress shoe',43:'evening dinner sleep',44:'sleep bed',
  46:'clothing shirt jacket shoe',48:'watch bag glasses',49:'ring gold jewelry',50:'color red blue green',51:'round square long',
  52:'size big small measure',53:'number count',54:'number much many',55:'time clock hour',56:'monday friday sunday',
  57:'january december month',58:'date day month',59:'date day month week',60:'summer winter spring autumn',
  63:'home house room',64:'house apartment rent',65:'apartment flat room',66:'room bathroom kitchen bedroom',
  67:'living room sofa',68:'bed sleep room',69:'kitchen cook food',70:'dinner table meal',71:'bathroom toilet wash',
  73:'garden green plant',74:'car parking',75:'room house storage',76:'chair table bed desk',77:'washing machine fridge',
  78:'oven fridge kitchen',79:'household cup plate bottle',80:'clean wash floor',81:'wash clothing',
  82:'shirt clothing',83:'repair house door',84:'move rent apartment',85:'rent apartment room',
  86:'rent landlord tenant',87:'water electricity heat energy',88:'waste rubbish recycle',89:'electric power energy',
  90:'hot heating warm',91:'water pipe supply',92:'food bread vegetable',93:'drink water coffee tea',
  94:'breakfast bread morning',95:'lunch meal midday',96:'dinner evening meal',97:'food small meal',98:'fruit apple banana',
  99:'vegetable carrot potato',100:'meat chicken beef',101:'fish seafood',102:'milk cheese yogurt',
  103:'bread baker cake',104:'rice pasta noodle',105:'salt pepper spice',106:'sweet sugar dessert',
  107:'cook kitchen meal',108:'cook boil fry bake',109:'spoon knife fork kitchen',110:'plate glass cup',
  111:'eat drink meal',112:'restaurant waiter menu',113:'coffee café tea',114:'burger pizza snack',
  115:'order food meal',116:'supermarket shopping food',117:'food shopping grocery',118:'buy shopping',
  119:'shop market mall',120:'clothing shop',121:'shoe shop',122:'computer phone electronic',
  123:'furniture chair bed shop',124:'market buy sell',125:'price cheap expensive discount',
  126:'pay price money',127:'cash money euro',128:'bank account card',129:'cash bank machine',
  130:'bank account',131:'bank card pay',132:'online bank account',133:'money euro dollar',
  134:'income salary wage',135:'spend pay price',136:'money save spend',137:'save money',138:'bank credit loan',
  139:'insurance insured',140:'tax pay',141:'school child teacher',142:'school teacher class',
  143:'school classroom teacher',144:'subject mathematics language',145:'pen paper book',
  146:'exam test pass',147:'university student study',148:'university student library',
  149:'lecture university',150:'seminar study',151:'laboratory experiment',152:'library book read',
  153:'learn study',154:'homework learn',155:'research analyze study',156:'degree university graduate',
  157:'education qualify certificate',158:'work job',159:'profession engineer doctor',160:'work office job',
  161:'office desk computer',162:'production factory work',163:'build building worker',164:'engineer engineering',
  165:'electric power engineer',166:'machine mechanic',167:'computer information technology',168:'job apply work',
  169:'job advertisement vacancy',170:'application apply',171:'resume curriculum life',172:'interview job question',
  173:'work contract',174:'work hour shift',175:'salary income',176:'colleague work',
  177:'discuss meeting office',178:'communication business',179:'phone call',180:'email message',
  181:'computer screen',182:'internet web',183:'phone mobile',184:'social online media',185:'technology technical',
  186:'document paper file',187:'form fill',188:'sign signature',189:'post letter',190:'letter parcel package',
  191:'office authority government',192:'register registration address',193:'residence permit document',
  194:'passport identity document',195:'passport travel entry',196:'police law',197:'law rule legal',
  198:'danger urgent safety',199:'fire safety',200:'hospital doctor accident',
  201:'safe security',202:'road traffic safe',203:'city town',204:'village small town',
  205:'neighbour house',206:'street road',207:'building house',208:'park public place',
  209:'direction left right street',210:'position location',211:'map direction',212:'transport bus train',
  213:'walk foot',214:'bicycle bike',215:'bus ticket',216:'train railway',217:'train underground station',
  218:'tram train',219:'taxi car',220:'car drive',221:'bike motorcycle',222:'car drive driver',
  223:'road traffic car',224:'petrol fuel car',225:'car parking park',
  226:'train station',227:'airport flight',228:'fly airport plane',229:'flight fly',
  230:'ticket book booking',231:'bag suitcase luggage',232:'passport control',233:'border passport tax',
  234:'travel trip',235:'holiday vacation',236:'hotel room',237:'hostel room',
  238:'tent forest holiday',239:'travel tourism',240:'travel museum sight',
  241:'beach sand sea',242:'mountain hill',243:'countryside village land',244:'nature forest tree',
  245:'forest tree',246:'river lake water',247:'sea ocean water',248:'green nature',
  249:'flower garden',250:'tree forest',251:'animal pet',252:'dog cat pet',253:'farm cow milk',
  254:'forest animal',255:'bird fly',256:'insect small',257:'environment nature',
  258:'climate weather',259:'pollution emission air',260:'free time leisure',
  261:'hobby free time',262:'sport football',263:'gym fitness sport',
  264:'football sport ball',265:'swim water',266:'run walk',267:'bicycle ride',
  268:'music song',269:'music instrument',270:'music play',
  271:'sing song',272:'sing music choir',273:'concert music',274:'cinema film',
  275:'film television tv',276:'book read',277:'art picture',278:'photo picture',
  279:'game play',280:'party celebrate',281:'birthday party',282:'marry marriage',
  283:'holiday party',284:'christmas december',285:'new year january',286:'easter spring',
  287:'holiday day',288:'friend',289:'friend relationship',290:'neighbour friend',
  291:'guest visit',292:'talk conversation',293:'opinion think',294:'agree disagree',
  295:'please request help',296:'allow permit',297:'thank sorry',298:'problem complaint',
  299:'plan future',300:'appointment date',301:'invite invitation',302:'work eat sleep',
  303:'morning evening day',304:'habit daily',305:'household clean work',
  306:'responsibility duty',307:'relationship partner',308:'love friend',309:'relationship date',
  310:'conflict problem',311:'child parent family',312:'community group',313:'society social',
  314:'culture cultural',315:'religion church',316:'country nation',317:'country geography map',
  318:'news message',319:'politics government',320:'economy business',321:'science research',
  322:'number math calculation',323:'measurement size unit',324:'material metal wood',
  325:'tool instrument repair',326:'machine engine',327:'repair maintain',
  328:'energy power',329:'electric electronic',330:'communication message',
  331:'online internet service',332:'password account',333:'online shop order',
  334:'parcel deliver send',335:'customer service help',336:'lost find',
  337:'accident injury',338:'storm flood weather',339:'doctor accident help',
  340:'die dead',341:'death funeral',342:'memory remember past',
  343:'goal dream future',344:'success fail',345:'decide decision',346:'problem solution',
  347:'past present future',348:'life event',349:'alone independent',350:'day life everyday',
  351:'emergency phone contact',352:'security safe person',353:'house security door',
  354:'password security data',355:'fraud steal identity',356:'consumer rights',
  357:'contract subscribe',358:'bill pay invoice',359:'debt reminder pay',
  360:'finance money planning',361:'retire pension old',362:'unemployed job',
  363:'job agency support',364:'sick work',365:'holiday work leave',
  366:'employee right work',367:'career learn develop',368:'network job friend',
  369:'business company start',370:'self employed business'
 };
 const starterRows=String.raw`
 5|Hallo=hello|Guten Tag=good day|Guten Morgen=good morning
 6|jemanden treffen=to meet someone|sich vorstellen=to introduce oneself|die Bekanntschaft=acquaintance
 8|der Onkel=uncle|die Tante=aunt|der Cousin=cousin
 10|schwanger=pregnant|die Hebamme=midwife|ein Kind erwarten=to be expecting a baby
 11|geboren werden=to be born|das Neugeborene=newborn|der Geburtstag=birthday
 12|die Windel=diaper|das Baby=baby|die Babynahrung=baby food
 15|erwachsen=adult|der Erwachsene=adult person|volljährig=of legal age
 18|hübsch=pretty|groß=tall or large|klein=small
 20|glücklich=happy|traurig=sad|wütend=angry
 22|die Nase=nose|der Mund=mouth|das Auge=eye
 23|das Haar=hair|die Frisur=hairstyle|sich kämmen=to comb one's hair
 34|der Zahn=tooth|die Zahnbürste=toothbrush|Zähne putzen=to brush teeth
 42|sich anziehen=to get dressed|das Hemd=shirt|die Hose=trousers
 48|die Handtasche=handbag|der Gürtel=belt|die Sonnenbrille=sunglasses
 49|der Ring=ring|die Halskette=necklace|das Armband=bracelet
 50|rot=red|blau=blue|grün=green
 51|rund=round|quadratisch=square-shaped|dreieckig=triangular
 54|viel=much or many|wenig=little or few|genug=enough
 68|das Bett=bed|der Kleiderschrank=wardrobe|das Kissen=pillow
 74|die Garage=garage|das Garagentor=garage door|das Auto=car
 75|der Keller=basement|der Dachboden=attic|die Treppe=stairs
 76|der Tisch=table|der Stuhl=chair|das Sofa=sofa
 77|der Kühlschrank=refrigerator|die Waschmaschine=washing machine|der Staubsauger=vacuum cleaner
 81|die Wäsche=laundry|waschen=to wash|das Waschmittel=laundry detergent
 82|bügeln=to iron|das Bügeleisen=iron|das Bügelbrett=ironing board
 97|der Snack=snack|der Keks=biscuit|die Nüsse=nuts
 105|das Salz=salt|der Pfeffer=pepper|die Kräuter=herbs
 106|die Schokolade=chocolate|die Süßigkeit=sweet or candy|der Nachtisch=dessert
 110|der Teller=plate|die Gabel=fork|das Messer=knife
 122|das Elektrogeschäft=electronics store|der Laptop=laptop|das Ladegerät=charger
 123|das Möbelgeschäft=furniture store|das Regal=shelf|die Kommode=chest of drawers
 129|der Geldautomat=ATM|Geld abheben=to withdraw money|die PIN=PIN
 136|das Budget=budget|die Ausgaben=expenses|die Einnahmen=income
 138|der Kredit=loan or credit|das Darlehen=loan|die Zinsen=interest
 141|der Kindergarten=kindergarten|die Erzieherin=female childcare educator|das Kind=child
 143|das Klassenzimmer=classroom|die Tafel=board|der Schreibtisch=desk
 148|der Campus=campus|das Studentenwohnheim=student dormitory|die Mensa=university cafeteria
 156|der Abschluss=degree or graduation|das Zeugnis=certificate|die Abschlussfeier=graduation ceremony
 162|die Fabrik=factory|die Produktion=production|der Arbeiter=worker
 163|die Baustelle=construction site|der Bauarbeiter=construction worker|der Bauhelm=hard hat
 177|die Besprechung=meeting|die Tagesordnung=agenda|das Protokoll=minutes or record
 183|das Smartphone=smartphone|die App=app|der Bildschirm=screen
 195|das Visum=visa|das Studentenvisum=student visa|das Konsulat=consulate
 198|der Notfall=emergency|die Gefahr=danger|Hilfe rufen=to call for help
 200|der Rettungswagen=ambulance|der Sanitäter=paramedic|die Notaufnahme=emergency department
 205|die Nachbarschaft=neighbourhood|der Nachbar=male neighbour|die Nachbarin=female neighbour
 207|das Gebäude=building|der Eingang=entrance|der Aufzug=lift or elevator
 211|die Karte=map|der Stadtplan=city map|der Weg=way or route
 212|das Verkehrsmittel=mode of transport|die Verbindung=connection|der Fahrplan=timetable
 217|die U-Bahn=subway or metro|die Haltestelle=stop|die U-Bahnstation=metro station
 221|das Motorrad=motorcycle|der Helm=helmet|der Fahrer=driver
 222|Auto fahren=to drive a car|der Führerschein=driving licence|das Lenkrad=steering wheel
 225|parken=to park|der Parkplatz=parking space|das Parkhaus=parking garage
 228|das Flugzeug=airplane|der Flügel=wing|der Sitzplatz=seat
 233|der Zoll=customs|die Zollkontrolle=customs inspection|der Zollbeamte=customs officer
 238|das Zelt=tent|der Campingplatz=campsite|campen=to camp
 239|der Tourismus=tourism|der Tourist=male tourist|der Reiseführer=travel guide
 240|die Sehenswürdigkeit=tourist attraction|die Stadtführung=city tour|besichtigen=to visit or view sights
 248|die Pflanze=plant|das Blatt=leaf|die Wurzel=root
 249|die Blume=flower|die Rose=rose|der Blumenstrauß=bouquet
 250|der Baum=tree|der Ast=branch|das Blatt=leaf
 251|das Tier=animal|das Haustier=pet|der Zoo=zoo
 252|der Hund=dog|die Katze=cat|das Haustier=pet
 253|die Kuh=cow|das Schwein=pig|das Schaf=sheep
 254|der Fuchs=fox|der Wolf=wolf|der Bär=bear
 255|der Vogel=bird|die Taube=pigeon|der Adler=eagle
 256|die Biene=bee|der Schmetterling=butterfly|die Ameise=ant
 263|das Fitnessstudio=gym|das Training=training|die Hantel=dumbbell
 264|der Fußball=football|das Tor=goal|der Spieler=player
 267|Rad fahren=to cycle|der Fahrradhelm=bicycle helmet|der Radweg=cycle path
 269|das Musikinstrument=musical instrument|die Geige=violin|die Gitarre=guitar
 270|das Klavier=piano|die Taste=key|Klavier spielen=to play piano
 272|der Chor=choir|die Chorprobe=choir rehearsal|der Dirigent=conductor
 274|das Kino=cinema|die Kinokarte=cinema ticket|die Leinwand=screen
 278|die Fotografie=photography|die Kamera=camera|ein Foto machen=to take a photo
 279|das Spiel=game|spielen=to play|das Brettspiel=board game
 283|das Fest=festival or celebration|feiern=to celebrate|die Veranstaltung=event
 284|Weihnachten=Christmas|der Weihnachtsbaum=Christmas tree|das Geschenk=present
 286|Ostern=Easter|das Osterei=Easter egg|der Osterhase=Easter bunny
 290|der Nachbar=male neighbour|die Nachbarin=female neighbour|die Nachbarschaft=neighbourhood
 295|die Bitte=request|bitte=please|um Hilfe bitten=to ask for help
 302|aufstehen=to get up|essen=to eat|arbeiten=to work
 303|der Tagesablauf=daily routine|der Morgen=morning|der Abend=evening
 305|der Haushalt=household|aufräumen=to tidy up|den Müll rausbringen=to take out the rubbish
 309|die Verabredung=date or arrangement|sich treffen=to meet|die Beziehung=relationship
 311|die Erziehung=upbringing|die Eltern=parents|das Kind=child
 316|das Land=country|der Kontinent=continent|die Grenze=border
 317|die Geografie=geography|die Weltkarte=world map|die Hauptstadt=capital city
 322|die Mathematik=mathematics|addieren=to add|subtrahieren=to subtract
 325|das Werkzeug=tool|der Hammer=hammer|der Schraubenzieher=screwdriver
 334|die Lieferung=delivery|liefern=to deliver|das Paket=parcel
 340|der Tod=death|sterben=to die|tot=dead
 341|die Beerdigung=funeral|das Grab=grave|trauern=to mourn
 361|die Rente=pension|der Ruhestand=retirement|in Rente gehen=to retire
 369|der Unternehmer=entrepreneur|das Unternehmen=company|gründen=to found or establish
 `.trim();
 const starters=new Map(starterRows.split('\n').map(line=>{
  const [id,...words]=line.trim().split('|');
  return [Number(id),words.filter(Boolean).map((pair,i)=>{
   const split=pair.indexOf('=');
   return {id:'starter-'+id+'-'+i,de:pair.slice(0,split),en:pair.slice(split+1),mm:'',level:'—',source:'starter'};
  })];
 }));
 const normalize=s=>String(s||'').toLocaleLowerCase('de').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9äöü ]+/g,' ').replace(/\s+/g,' ').trim();
 const stem=s=>s.length>4&&s.endsWith('ies')?s.slice(0,-3)+'y':
  s.length>4&&s.endsWith('s')?s.slice(0,-1):s;
 const words=s=>normalize(s).split(' ').filter(x=>x.length>=3&&!stop.has(x));
 const labelToken=(s,allowShort=false)=>[...new Set(words(s).filter(x=>allowShort||x.length>=4).map(stem))];
 const searchData=bank.map(w=>({
  word:w,de:normalize(w.de),en:normalize(w.en),
  tokenDe:new Set(words(w.de).map(stem)),tokenEn:new Set(words(w.en).map(stem))
 }));
 function getMatches(topic){
  if(topic.id===1)return curated.map(w=>({...w,source:'curated'}));
  const en=labelToken(topic.en,true),de=labelToken(topic.de,true);
  const additional=labelToken(hint[topic.id]||'',true);
  const hits=[];
  for(const entry of searchData){
   let score=0;
   for(const token of en){
    if(entry.tokenEn.has(token))score+=10;
    if(entry.tokenDe.has(token))score+=7;
   }
   for(const token of de)if(entry.tokenDe.has(token))score+=10;
   for(const token of additional){
    if(entry.tokenEn.has(token))score+=3;
    if(entry.tokenDe.has(token))score+=3;
   }
   if(!score)continue;
   // The original bank contains many mechanically constructed collocations.
   // Prefer actual base nouns/verbs before long or vaguely related phrases.
   if(entry.en===normalize(topic.en)||entry.de===normalize(topic.de))score+=30;
   if(['noun','verb','adjective'].includes(entry.word.type))score+=9;
   if(entry.word.de.split(/\s+/).length<=2)score+=4;
   score+=Math.max(0,5-(rank.get(entry.word.level)??5));
   hits.push({word:entry.word,score});
  }
  hits.sort((a,b)=>b.score-a.score||
   (rank.get(a.word.level)??6)-(rank.get(b.word.level)??6)||
   a.word.de.localeCompare(b.word.de,'de'));
  return hits.slice(0,120).map(x=>({...x.word,source:'bank'}));
 }
 function entriesFor(topic){
  const suggestions=getMatches(topic),existing=new Set(suggestions.map(w=>normalize(w.de)));
  const title={id:'topic-heading-'+topic.id,de:topic.de,en:topic.en,mm:'',level:'—',source:'heading'};
  const items=[];
  // The topic name itself is a real German expression with an existing English
  // translation; it is never passed off as a CEFR bank item or given a made-up CEFR level.
  if(!existing.has(normalize(topic.de)))items.push(title);
  for(const w of starters.get(topic.id)||[]){
   if(!existing.has(normalize(w.de))&&!items.some(x=>normalize(x.de)===normalize(w.de)))items.push(w);
  }
  return {curated:suggestions,extras:items,all:[...items,...suggestions]};
 }
 function key(w){
  return w.source==='curated'?'c:'+w.de.toLowerCase():'b:'+w.id;
 }
 function seen(w){
  if(w.source==='heading'||w.source==='starter')return null;
  const p=window.WortWeg.getProgress(),k=key(w);
  return Boolean(p?.seen?.[k]||p?.items?.[k]);
 }
 function speak(de){
  if(window.WortWegAudio?.speak){window.WortWegAudio.speak(de);return;}
  const synth=window.speechSynthesis;
  if(synth&&window.SpeechSynthesisUtterance){
   const utterance=new SpeechSynthesisUtterance(de);utterance.lang='de-DE';
   synth.cancel();synth.speak(utterance);
  }
 }
 const page=document.createElement('section');page.className='section ww-topic-detail';page.id='ww-topic-detail';
 page.innerHTML='<button type="button" class="ww-menu-back" id="ww-topic-back">‹  All 370 topics</button>'+
  '<div class="ww-topic-title"><span class="ww-menu-eyebrow" id="ww-topic-id">TOPIC</span>'+
  '<h2 id="ww-topic-heading"></h2><p id="ww-topic-english"></p></div>'+
  '<div class="ww-topic-summary" id="ww-topic-summary"></div>'+
  '<div class="ww-topic-actions"><button class="btn primary" type="button" id="ww-topic-practice">Practice topic words</button>'+
  '<button class="btn secondary" type="button" id="ww-topic-show">Show vocabulary</button></div>'+
  '<div id="ww-topic-quiz" hidden></div>'+
  '<div id="ww-topic-study"><p class="ww-topic-note" id="ww-topic-note"></p>'+
  '<div class="ww-topic-filter"><label>Search German, English or Myanmar'+
  '<input id="ww-topic-search" type="search" placeholder="Search this topic…"></label>'+
  '<label>Level<select id="ww-topic-level"><option value="ALL">All levels</option>'+
  '<option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></label></div>'+
  '<div id="ww-topic-count" class="muted tiny"></div>'+
  '<div id="ww-topic-list" class="ww-topic-list"></div>'+
  '<button type="button" class="btn secondary" id="ww-topic-more" hidden>Show more words</button></div>';
 root.append(page);
 const el=id=>page.querySelector('#'+id);
 let selected=null,shown=40,lesson=null;
 function tag(parent,type,value,className){
  const n=document.createElement(type);
  if(className)n.className=className;
  n.textContent=value;parent.append(n);return n;
 }
 function displayWords(){
  if(!selected)return;
  const q=normalize(el('ww-topic-search').value),level=el('ww-topic-level').value;
  const matches=selected.all.filter(w=>
   (level==='ALL'||w.level===level)&&
   (!q||[w.de,w.en,w.mm].some(x=>normalize(x).includes(q))));
  const box=el('ww-topic-list');box.replaceChildren();
  for(const w of matches.slice(0,shown)){
   const card=tag(box,'div','','ww-topic-word');
   const desc=tag(card,'div','','ww-topic-word-copy');
   const name=tag(desc,'strong',w.de);
   tag(desc,'span',w.en||'Translation not yet available');
   if(w.mm)tag(desc,'small',w.mm);
   if(w.pron)tag(desc,'small',w.pron,'ww-topic-pron');
   const meta=tag(card,'div','','ww-topic-word-end');
   tag(meta,'span',w.source==='heading'?'Topic phrase':
    w.source==='starter'?'Starter word':(w.level||'Bank'),'ww-topic-tag');
   const status=seen(w);
   if(status)tag(meta,'small','✓ Seen','ww-topic-seen');
   const play=tag(meta,'button','🔊','ww-topic-listen');
   play.type='button';play.setAttribute('aria-label','Hear '+w.de+' pronounced in German');
   play.addEventListener('click',()=>speak(w.de));
  }
  el('ww-topic-count').textContent=matches.length+' entries · '+Math.min(matches.length,shown)+' shown';
  const more=el('ww-topic-more');more.hidden=shown>=matches.length;
  more.textContent='Show '+Math.min(40,matches.length-shown)+' more words';
 }
 function refreshSummary(){
  if(!selected)return;
  const count=selected.curated.length,done=selected.curated.filter(seen).length;
  const label=count?done+' of '+count+' Word Bank / curated words answered · '+(count?Math.round(100*done/count):0)+'% explored':'This topic has starter expressions; matched CEFR bank words are not yet available.';
  el('ww-topic-summary').textContent=label;
  el('ww-topic-practice').disabled=!count;
  el('ww-topic-practice').title=count?'Practice matched CEFR/curated vocabulary':'More verified words are needed before a quiz can be offered.';
 }
 function showWords(){
  lesson=null;el('ww-topic-quiz').hidden=true;el('ww-topic-study').hidden=false;
  el('ww-topic-show').hidden=true;el('ww-topic-practice').hidden=false;
  refreshSummary();displayWords();
 }
 function open(topic){
  selected={topic,...entriesFor(topic)};shown=40;
  el('ww-topic-id').textContent='TOPIC '+topic.id+' OF '+topics.length;
  el('ww-topic-heading').textContent=topic.de;el('ww-topic-english').textContent=topic.en;
  el('ww-topic-note').textContent=selected.curated.length?
   'German–English–Myanmar meanings and audio. Topic matches are suggestions from the existing CEFR Word Bank; topic phrases and starter words are labelled separately.':
   'Starter expressions for this topic. Additional verified Word Bank terms have not been curated yet; these expressions do not count as CEFR bank progress.';
  el('ww-topic-search').value='';el('ww-topic-level').value='ALL';
  showWords();
  window.WortWeg.navigate('ww-topic-detail');
 }
 function shuffle(items){
  const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
 }
 const today=()=>{
  const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 };
 function record(w,correct){
  // Exactly the same legacy per-user key schema as the existing study quiz.
  const p=window.WortWeg.getProgress(),k=key(w);
  const old=p.items[k]||{de:w.de,en:w.en,mm:w.mm,wrong:0,streak:0,due:null,last:null};
  const item={...old,de:w.de,en:w.en,mm:w.mm||'',last:today()};
  if(correct){
   if(item.wrong>0){
    item.streak=(Number(item.streak)||0)+1;
    const days=[1,3,7,14,30][Math.min(item.streak-1,4)];
    const next=new Date();next.setDate(next.getDate()+days);
    item.due=next.getFullYear()+'-'+String(next.getMonth()+1).padStart(2,'0')+'-'+String(next.getDate()).padStart(2,'0');
   }
  }else{item.wrong=(Number(item.wrong)||0)+1;item.streak=0;item.due=today();}
  p.items[k]=item;p.seen[k]=true;p.answered++;
  if(correct)p.correct++;
  window.WortWeg.setProgress(p);
 }
 function startQuiz(){
  if(!selected?.curated?.length)return;
  lesson={list:shuffle(selected.curated).slice(0,10),pos:0,correct:0,answered:false};
  el('ww-topic-study').hidden=true;el('ww-topic-quiz').hidden=false;
  el('ww-topic-show').hidden=false;el('ww-topic-practice').hidden=true;
  renderQuestion();
 }
 function renderQuestion(){
  const host=el('ww-topic-quiz');host.replaceChildren();
  if(!lesson)return;
  if(lesson.pos>=lesson.list.length){
   tag(host,'h3','Quiz completed!');
   tag(host,'p',lesson.correct+' correct out of '+lesson.list.length+'. Your answers were saved in your existing learning history.');
   const again=tag(host,'button','Practice again','btn primary');again.type='button';again.addEventListener('click',startQuiz);
   return;
  }
  const w=lesson.list[lesson.pos],choices=[w.en];
  const distractors=shuffle(selected.curated.concat(bank.filter(x=>x.level===w.level))).filter(x=>
   x.en&&x.en!==w.en&&x.de!==w.de);
  for(const other of distractors)if(!choices.includes(other.en)&&choices.length<4)choices.push(other.en);
  const opts=shuffle(choices);
  tag(host,'p','Question '+(lesson.pos+1)+' of '+lesson.list.length,'ww-topic-quiz-counter');
  const question=tag(host,'div','','ww-topic-question');
  tag(question,'strong',w.de);
  const play=tag(question,'button','🔊 Listen','btn secondary');
  play.type='button';play.addEventListener('click',()=>speak(w.de));
  tag(host,'p','Choose the correct English meaning','muted');
  const choicesBox=tag(host,'div','','ww-topic-choices');
  const feedback=tag(host,'p','','ww-topic-feedback');feedback.setAttribute('aria-live','polite');
  let chosen=null;
  const submit=tag(host,'button','Check answer','btn primary');
  submit.type='button';submit.disabled=true;
  for(const opt of opts){
   const button=tag(choicesBox,'button',opt,'ww-topic-choice');button.type='button';
   button.addEventListener('click',()=>{
    if(lesson.answered)return;
    chosen=opt;submit.disabled=false;
    for(const b of choicesBox.children)b.classList.toggle('selected',b===button);
   });
  }
  submit.addEventListener('click',()=>{
   if(!lesson||chosen===null)return;
   if(!lesson.answered){
    const correct=chosen===w.en;
    lesson.answered=true;if(correct)lesson.correct++;
    record(w,correct);
    for(const b of choicesBox.children){
     b.disabled=true;b.classList.toggle('correct',b.textContent===w.en);
     b.classList.toggle('incorrect',b.textContent===chosen&&!correct);
    }
    feedback.textContent=(correct?'✓ Correct':'✕ Not quite')+' · '+w.en+(w.mm?' · '+w.mm:'');
    feedback.className='ww-topic-feedback '+(correct?'good':'bad');
    submit.textContent=lesson.pos===lesson.list.length-1?'View result':'Next question →';
   }else{lesson.pos++;lesson.answered=false;renderQuestion();}
  });
 }
 el('ww-topic-back').addEventListener('click',()=>{
  lesson=null;window.WortWeg.navigate('topics');
 });
 el('ww-topic-show').addEventListener('click',showWords);
 el('ww-topic-practice').addEventListener('click',startQuiz);
 el('ww-topic-search').addEventListener('input',()=>{shown=40;displayWords()});
 el('ww-topic-level').addEventListener('change',()=>{shown=40;displayWords()});
 el('ww-topic-more').addEventListener('click',()=>{shown+=40;displayWords()});
 // The original built-in Topics page has a button onclick which previously
 // started Topic 1's quiz or showed "Roadmap" for the other 369 topics.
 // Stop that old handler before it runs, and open the selected word list.
 document.addEventListener('click',event=>{
  const button=event.target.closest('#topicList button.topic');
  if(!button)return;
  const found=button.querySelector('strong')?.textContent||button.textContent||'';
  const match=found.match(/^\s*(\d+)\./);
  const topic=match&&byId.get(Number(match[1]));
  if(!topic)return;
  event.preventDefault();event.stopImmediatePropagation();
  open(topic);
 },true);
 window.addEventListener('wortweg:account',()=>{lesson=null;if(selected)showWords()});
 window.addEventListener('wortweg:changed',()=>{
  if(!selected||!page.classList.contains('active')||lesson)return;
  refreshSummary();displayWords();
 });
 window.WortWegTopics={open:id=>{const t=byId.get(Number(id));if(t)open(t)},getWords:id=>{
  const t=byId.get(Number(id));return t?entriesFor(t):null;
 },getCount:()=>topics.length};
})();