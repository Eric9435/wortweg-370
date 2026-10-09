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
 // Original Word Bank progress stays cloud-compatible. Additional topic
 // expressions have their own per-account, device-local quiz history.
 // No artificial A1 / CEFR level is assigned to new expressions.
 const expressionStorage=()=> 'wortweg370-topic-expressions-v1:'+String(window.WortWegAccountSnapshot?.uid||'guest');
 function expressionRecords(){
  try{const saved=JSON.parse(localStorage.getItem(expressionStorage())||'{}');
   return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};}
  catch{return {};}
 }
 function expressionKey(topicId,w){
  return String(topicId)+':'+normalize(w.de);
 }
 function known(w){
  if(w.source==='heading'||w.source==='starter'){
   const entry=selected&&expressionRecords()[expressionKey(selected.topic.id,w)];
   return Boolean(entry&&(typeof entry.known==='boolean'?entry.known:entry.lastCorrect));
  }
  const p=window.WortWeg.getProgress(),item=p?.items?.[key(w)];
  if(!item)return false;
  // A later incorrect legacy quiz always revokes mastery, regardless of an older checkbox.
  if(Number(item.wrong)>0)return Number(item.streak)>0;
  return item.known!==false;
 }
 function markKnown(w,value){
  if(w.source==='heading'||w.source==='starter'){
   const records=expressionRecords(),k=expressionKey(selected.topic.id,w);
   records[k]={...(records[k]||{}),de:w.de,en:w.en,known:value,lastCorrect:value,
    answered:records[k]?.answered||0,correct:records[k]?.correct||0,wrong:records[k]?.wrong||0};
   try{localStorage.setItem(expressionStorage(),JSON.stringify(records));}catch{}
  }else{
   const p=window.WortWeg.getProgress(),k=key(w);
   const old=p.items[k]||{de:w.de,en:w.en,mm:w.mm||'',wrong:0,streak:0,due:null,last:null};
   // Never delete prior attempts; preserve the reviewed-word evidence.
   const item={...old,de:w.de,en:w.en,mm:w.mm||'',known:value,last:today()};
   if(value){
    if(Number(item.wrong)>0&&Number(item.streak)===0)item.streak=1;
   }else{
    item.wrong=Math.max(1,Number(item.wrong)||0);item.streak=0;item.due=today();
   }
   p.items[k]=item;p.seen[k]=true;
   window.WortWeg.setProgress(p);
  }
  refreshSummary();displayWords();
 }
 function seen(w){
  if(w.source==='heading'||w.source==='starter'){
   return Boolean(selected&&expressionRecords()[expressionKey(selected.topic.id,w)]?.answered);
  }
  const p=window.WortWeg.getProgress(),k=key(w);
  return Boolean(p?.seen?.[k]||p?.items?.[k]);
 }
 function recordExpression(w,correct){
  if(!selected)return;
  const all=expressionRecords(),k=expressionKey(selected.topic.id,w);
  const prev=all[k]||{answered:0,correct:0,wrong:0};
  all[k]={answered:(Number(prev.answered)||0)+1,
   correct:(Number(prev.correct)||0)+(correct?1:0),
   wrong:(Number(prev.wrong)||0)+(correct?0:1),
   lastCorrect:Boolean(correct),known:Boolean(correct),de:w.de,en:w.en};
  try{localStorage.setItem(expressionStorage(),JSON.stringify(all));}
  catch{/* Browsers with storage disabled still allow a session quiz. */}
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
  '<button class="btn secondary" type="button" id="ww-topic-show">Show vocabulary</button>'+ 
  '<button class="btn secondary" type="button" id="ww-topic-read" aria-expanded="false">📖 Read passage · sentence audio</button></div>'+ 
  '<div class="ww-passage" id="ww-topic-passage" hidden><div id="ww-topic-passage-content"></div></div>'+
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
 // Scoped styling: existing topic list, quiz, navigation, and saved progress remain unchanged.
 const articleStyle=document.createElement('style');
 articleStyle.textContent=`
  .ww-topic-detail .ww-topic-german .ww-topic-article{font-weight:800}
  .ww-topic-detail .ww-topic-article-der .ww-topic-article{color:#2563eb}
  .ww-topic-detail .ww-topic-article-die .ww-topic-article{color:#db2777}
  .ww-topic-detail .ww-topic-article-das .ww-topic-article{color:#15803d}
  .ww-topic-detail .ww-topic-article-der .ww-topic-noun,
  .ww-topic-detail .ww-topic-article-die .ww-topic-noun,
  .ww-topic-detail .ww-topic-article-das .ww-topic-noun{color:inherit}
 `;
 page.append(articleStyle);
 const el=id=>page.querySelector('#'+id);
 let selected=null,shown=40,lesson=null;
 function tag(parent,type,value,className){
  const n=document.createElement(type);
  if(className)n.className=className;
  n.textContent=value;parent.append(n);return n;
 }

 // Inline memory practice. All entries have a conversation; common identity nouns
 // additionally get a contextual, translated sentence.
 const exampleBank={
  'der name':['Mein Name ist Alex.','My name is Alex.'],
  'der vorname':['Mein Vorname ist Alex.','My first name is Alex.'],
  'der nachname':['Mein Nachname ist Müller.','My last name is Müller.'],
  'das alter':['Mein Alter ist 25 Jahre.','My age is 25 years.'],
  'das geburtsdatum':['Mein Geburtsdatum ist der 14. Januar.','My date of birth is January 14.'],
  'die staatsangehörigkeit':['Meine Staatsangehörigkeit ist deutsch.','My nationality is German.'],
  'der wohnort':['Mein Wohnort ist Hamburg.','My place of residence is Hamburg.'],
  'der beruf':['Mein Beruf ist Ingenieur.','My profession is engineer.'],
  'der familienstand':['Mein Familienstand ist ledig.','My marital status is single.'],
  'die adresse':['Wie lautet deine Adresse?','What is your address?'],
  'der geburtsort':['Mein Geburtsort ist Berlin.','My place of birth is Berlin.'],
  'das geschlecht':['Das Geschlecht ist ein Feld im Formular.','Gender is a field on the form.'],
  'die muttersprache':['Meine Muttersprache ist Deutsch.','My native language is German.'],
  'das land':['Deutschland ist ein Land in Europa.','Germany is a country in Europe.'],
  'ledig':['Ich bin ledig.','I am single.'],
  'die postleitzahl':['Wie lautet deine Postleitzahl?','What is your postal code?'],
  'die hausnummer':['Meine Hausnummer ist zwölf.','My house number is twelve.'],
  'die anrede':['Welche Anrede soll ich verwenden?','Which form of address should I use?'],
  'die unterschrift':['Bitte setzen Sie hier Ihre Unterschrift.','Please put your signature here.'],
  'der geburtsname':['Bitte tragen Sie Ihren Geburtsnamen ein.','Please enter your birth name.'],
  'die ausweisnummer':['Wo steht meine Ausweisnummer?','Where is my ID card number?'],
  'die telefonnummer':['Wie lautet deine Telefonnummer?','What is your phone number?'],
  'die e-mail-adresse':['Meine E-Mail-Adresse steht im Formular.','My email address is on the form.'],
  'die geburtsurkunde':['Ich brauche meine Geburtsurkunde.','I need my birth certificate.'],
  'die kontaktdaten':['Bitte schicken Sie mir Ihre Kontaktdaten.','Please send me your contact details.'],
  'das heimatland':['Myanmar ist mein Heimatland.','Myanmar is my home country.'],
  'der wohnsitz':['Mein Wohnsitz ist in Hamburg.','My legal residence is in Hamburg.'],
  'die namensänderung':['Ich muss die Namensänderung melden.','I have to report the name change.'],
  'die anschrift':['Bitte geben Sie Ihre Anschrift an.','Please provide your postal address.'],
  'das herkunftsland':['Was ist Ihr Herkunftsland?','What is your country of origin?'],
  'die angabe':['Diese Angabe ist wichtig.','This information is important.'],
  'der rufname':['Mein Rufname ist Alex.','The name I usually go by is Alex.'],
  'der familienname':['Mein Familienname ist Müller.','My family name is Müller.'],
  'der zweitname':['Mein Zweitname ist Paul.','My second given name is Paul.'],
  'die initialen':['Meine Initialen sind A. M.','My initials are A. M.'],
  'die schreibweise':['Ist diese Schreibweise richtig?','Is this spelling correct?'],
  'der geburtsmonat':['Mein Geburtsmonat ist Januar.','My birth month is January.'],
  'das geburtsjahr':['Mein Geburtsjahr ist 2000.','My birth year is 2000.'],
  'die geburtsstadt':['Meine Geburtsstadt ist Yangon.','My birth city is Yangon.'],
  'die meldeadresse':['Meine Meldeadresse ist in Hamburg.','My registered address is in Hamburg.'],
  'die aufenthaltsdauer':['Die Aufenthaltsdauer beträgt zwei Wochen.','The duration of stay is two weeks.']
 };
 function addMemoryPractice(card,w){
  const outer=tag(card,'div','','ww-topic-memory');
  const toggle=tag(outer,'button','Example & conversation  ▾','ww-topic-memory-toggle');
  toggle.type='button';toggle.setAttribute('aria-expanded','false');
  const panel=tag(outer,'div','','ww-topic-memory-panel');panel.hidden=true;
  const entry=exampleBank[String(w.de||'').toLocaleLowerCase('de')];
  const german=entry?.[0]||('Ich lerne heute den Ausdruck „'+w.de+'“.');
  const english=entry?.[1]||('Today I am learning the expression “'+w.de+'”.');
  tag(panel,'small','EXAMPLE SENTENCE','ww-topic-memory-label');
  const sentence=tag(panel,'p',german,'ww-topic-memory-de');
  tag(panel,'p',english,'ww-topic-memory-en');
  tag(panel,'small','MINI CONVERSATION','ww-topic-memory-label');
  const question='Wie sagt man „'+(w.en||w.de)+'“ auf Deutsch?';
  const answer='Auf Deutsch sagt man „'+w.de+'“.';
  tag(panel,'p','A: '+question,'ww-topic-memory-de');
  tag(panel,'p','B: '+answer,'ww-topic-memory-de');
  tag(panel,'p','A: How do you say “'+(w.en||w.de)+'” in German?','ww-topic-memory-en');
  tag(panel,'p','B: In German, you say “'+w.de+'”.','ww-topic-memory-en');
  const hear=tag(panel,'button','🔊 Listen to German','ww-topic-memory-speak');
  hear.type='button';hear.addEventListener('click',()=>speak(german+' '+question+' '+answer));
  toggle.addEventListener('click',()=>{
   panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));
   toggle.textContent=panel.hidden?'Example & conversation  ▾':'Hide example & conversation  ▴';
  });
 }

// Sentence-by-sentence reading stays inside the current topic page.
// The authored identity passage uses no actual address, birth date or contact numbers.
 const identityPassage="Hallo! Mein Name ist Eric.\nMein Vorname ist Eric und mein Nachname steht in meinem Reisepass.\nMein Familienname und mein Geburtsname sind gleich.\nIch habe keinen Zweitnamen.\nMein Rufname ist Eric.\nMeine Initialen sind E. S.\nDie Schreibweise meines Namens ist wichtig, besonders bei offiziellen Formularen.\nEine Namensänderung habe ich nicht gemacht.\nIch bin ein junger Erwachsener.\nMein Alter ist fünfundzwanzig Jahre.\nMein Geburtsdatum möchte ich hier nicht nennen.\nMein Geburtsmonat und mein Geburtsjahr stehen in meinen persönlichen Dokumenten.\nMein Geburtsort liegt in Myanmar und meine Geburtsstadt ist Yangon.\nMeine Geburtsurkunde enthält diese Informationen.\nMein Heimatland ist Myanmar.\nAuch mein Herkunftsland ist Myanmar.\nDas Land, in dem ich jetzt lebe, ist Deutschland.\nMeine Staatsangehörigkeit ist myanmarisch.\nMeine Muttersprache ist Birmanisch.\nAußerdem spreche ich Englisch und lerne Deutsch.\nMein Wohnort ist Hamburg.\nMein Wohnsitz ist jetzt in Deutschland.\nMeine genaue Adresse ist privat.\nMeine Anschrift möchte ich nicht öffentlich zeigen.\nMeine Postleitzahl und meine Hausnummer stehen in meinen persönlichen Unterlagen.\nMein Beruf ist Ingenieur.\nIch habe Elektrotechnik studiert und studiere jetzt im Master an der Technischen Universität Hamburg.\nIch interessiere mich für Automatisierung, Steuerungstechnik und digitale Technologien.\nAußerdem spiele ich Klavier und unterrichte Musik.\nMein Familienstand ist privat.\nIn einem Formular gibt es verschiedene Möglichkeiten, zum Beispiel ledig oder verheiratet.\nMein Geschlecht ist männlich.\nMeine Kontaktdaten sind ebenfalls privat.\nMeine Telefonnummer und meine E-Mail-Adresse gebe ich nur an vertrauenswürdige Personen weiter.\nMeine Ausweisnummer veröffentliche ich nicht.\nWenn ich ein Formular ausfülle, lese ich zuerst die Anrede, zum Beispiel Herr oder Frau.\nDanach mache ich die erforderlichen Angaben.\nAm Ende kontrolliere ich alles und schreibe meine Unterschrift.\nDas bin ich!\nIch lebe in Hamburg, lerne jeden Tag Deutsch und möchte mich persönlich und beruflich weiterentwickeln.";
 // Topic-specific contextual reading scenes, organized by the actual 370-topic syllabus.
 // These are full guided readings, not a list of English dictionary definitions.
 const sceneSets=[
  [2,20,['In meinem Deutschkurs stellen wir uns heute vor.','Zuerst sprechen wir über uns und unsere Familien.','Ich höre aufmerksam zu und stelle einfache Fragen.','Meine Mitschüler antworten freundlich und langsam.','Danach erzählen wir etwas über unser Leben.','Wir finden Gemeinsamkeiten und lernen uns besser kennen.','Am Ende schreibe ich fünf neue Sätze in mein Heft.']],
  [21,40,['Am Morgen achte ich auf meinen Körper und meine Gesundheit.','Ich stehe auf, trinke Wasser und beginne meinen Tag.','Manchmal fühle ich mich müde und brauche eine Pause.','Ich möchte meine Gewohnheiten verbessern und mich gesund fühlen.','Bei Beschwerden frage ich nach Hilfe und erkläre die Situation.','Am Abend denke ich darüber nach, was heute gut war.','Ich lerne dabei auch neue deutsche Wörter.']],
  [41,62,['Heute plane ich meinen Tag und bereite meine Sachen vor.','Ich schaue auf die Uhr und überlege, was ich machen muss.','Danach treffe ich eine Entscheidung und beginne mit meiner Aufgabe.','Im Alltag gibt es viele kleine Unterschiede und wichtige Details.','Ich frage nach, wenn ich etwas nicht verstehe.','Später erzähle ich einem Freund von meinem Tag.','Am Ende habe ich wieder etwas Neues gelernt.']],
  [63,91,['Ich bin zu Hause und möchte meinen Wohnbereich gut organisieren.','Am Morgen öffne ich das Fenster und schaue mich um.','Ich prüfe, ob alles sauber und in Ordnung ist.','Manchmal muss ich etwas kaufen, reparieren oder aufräumen.','Mein Mitbewohner hilft mir und wir teilen die Aufgaben.','Am Nachmittag machen wir eine kleine Pause.','So wird unser Alltag zu Hause einfacher.']],
  [92,140,['Heute gehe ich einkaufen und plane mein Essen.','Zuerst schreibe ich eine Liste und denke an mein Budget.','Im Geschäft vergleiche ich Produkte und frage nach dem Preis.','Eine freundliche Person erklärt mir die verschiedenen Möglichkeiten.','Ich wähle etwas Passendes und bezahle an der Kasse.','Zu Hause bereite ich alles vor und genieße meine Mahlzeit.','Danach prüfe ich, ob ich genug Geld für die Woche habe.']],
  [141,157,['Heute ist ein neuer Lerntag und ich gehe zum Unterricht.','Die Lehrperson erklärt uns das Thema mit Beispielen.','Ich höre zu, lese die Aufgaben und mache Notizen.','Wenn ich etwas nicht verstehe, stelle ich eine Frage.','Mit meinen Mitschülern übe ich die neuen Ausdrücke.','Nach dem Unterricht wiederhole ich die wichtigsten Wörter.','Schritt für Schritt mache ich gute Fortschritte.']],
  [158,190,['Heute beschäftige ich mich mit Arbeit und beruflichen Aufgaben.','Am Morgen bespreche ich meinen Plan mit einem Kollegen.','Wir sammeln Informationen und überlegen uns eine Lösung.','Anschließend bearbeiten wir eine Aufgabe gemeinsam.','Bei Schwierigkeiten fragen wir nach und kontrollieren die Ergebnisse.','Am Nachmittag schreiben wir eine kurze Nachricht über unseren Fortschritt.','So lernen wir, klar und professionell zu kommunizieren.']],
  [191,202,['Heute muss ich eine wichtige Angelegenheit erledigen.','Zuerst lese ich die Informationen und bereite meine Dokumente vor.','Ich achte auf die Regeln und frage bei Unsicherheit nach.','Die Mitarbeiterin erklärt mir Schritt für Schritt, was ich tun soll.','Ich kontrolliere meine Angaben und vermeide Fehler.','Zum Schluss bedanke ich mich für die Unterstützung.','Jetzt weiß ich besser, wie dieser Vorgang funktioniert.']],
  [203,259,['Heute bin ich unterwegs und entdecke meine Umgebung.','Zuerst überlege ich, wo ich hinfahren oder hingehen möchte.','Ich schaue auf den Weg und prüfe die wichtigsten Informationen.','Unterwegs sehe ich viele interessante Dinge.','Ich frage eine Person nach dem richtigen Weg.','Später mache ich eine Pause und genieße die Umgebung.','Am Abend erzähle ich von meinem kleinen Ausflug.']],
  [260,301,['Heute habe ich Freizeit und möchte etwas Schönes unternehmen.','Ich spreche mit einem Freund über unsere Pläne.','Wir überlegen, was uns Freude macht und was wir ausprobieren möchten.','Gemeinsam verbringen wir Zeit und sammeln neue Erfahrungen.','Wenn etwas nicht klappt, finden wir eine andere Möglichkeit.','Am Abend sprechen wir über unsere Erlebnisse.','So bleiben viele gute Erinnerungen an diesen Tag.']],
  [302,319,['Heute denke ich über Menschen und das Zusammenleben nach.','Jeder Mensch hat eigene Erfahrungen und Gewohnheiten.','Wir sprechen miteinander und hören verschiedene Meinungen.','Ich versuche, andere Menschen besser zu verstehen.','Bei Problemen ist es wichtig, ruhig und respektvoll zu bleiben.','Gemeinsam können wir Lösungen finden und voneinander lernen.','Am Ende nehme ich eine neue Idee mit.']],
  [320,350,['Heute lese ich etwas über Wissenschaft, Technik und unsere Welt.','Zuerst stelle ich eine Frage und sammle Informationen.','Ich untersuche ein Beispiel und vergleiche die Ergebnisse.','Manche Begriffe sind schwierig, deshalb lerne ich sie Schritt für Schritt.','Ich bespreche meine Beobachtungen mit anderen.','Danach prüfe ich, welche Lösung sinnvoll ist.','Zum Schluss fasse ich zusammen, was ich verstanden habe.']],
  [351,370,['Heute geht es um eine wichtige Situation im Alltag.','Ich informiere mich über die Möglichkeiten und meine Rechte.','Zuerst prüfe ich alle Details und entscheide, was zu tun ist.','Wenn ich Hilfe brauche, spreche ich mit einer zuständigen Person.','Gemeinsam klären wir die Fragen und finden einen nächsten Schritt.','Ich bewahre wichtige Unterlagen sicher auf.','Danach fühle ich mich auf ähnliche Situationen besser vorbereitet.']]
 ];
 function passageSentences(){
  if(!selected)return {story:[],reinforcement:[]};
  const engine=window.WortWegReading;
  if(!engine)throw Error('Reading module is not yet loaded');
  return engine.build(selected.topic,selected.all,identityPassage,exampleBank);
 }
 function highlightPassageWords(node,line,words){
  const terms=[...new Set(words.flatMap(w=>{
   const full=String(w.de||'').trim();
   const noun=/^(der|die|das)\s+/i.test(full);
   const base=full.replace(/^(der|die|das)\s+/i,'');
   const forms=[full,base];
   // Add common regular noun/verb inflections, but only highlight full words.
   // Irregular forms remain conservatively excluded to avoid false matches.
   if(noun&&/^[A-Za-zÄÖÜäöüß-]+$/.test(base)){
    for(const ending of ['n','en','e','er','s'])forms.push(base+ending);
   }else if(!noun&&/^[A-Za-zÄÖÜäöüß]+en$/.test(base)){
    const stem=base.slice(0,-2);
    for(const ending of ['e','st','t','en'])forms.push(stem+ending);
   }
   return forms;
  }).filter(w=>w.length>2))].sort((a,b)=>b.length-a.length);
  let pieces=[{text:line,hit:false}];
  const isLetter=c=>Boolean(c&&/[a-zA-ZäöüÄÖÜß]/.test(c));
  for(const term of terms){
   const lower=term.toLocaleLowerCase('de');
   const next=[];
   for(const piece of pieces){
    if(piece.hit){next.push(piece);continue}
    const src=piece.text,hay=src.toLocaleLowerCase('de');
    let cursor=0,searchFrom=0,at;
    while((at=hay.indexOf(lower,searchFrom))>=0){
     const finish=at+term.length;
     if((at>0&&isLetter(src[at-1]))||(finish<src.length&&isLetter(src[finish]))){
      // Rejected substring: advance search only. Never drop original text.
      searchFrom=at+1;continue;
     }
     if(at>cursor)next.push({text:src.slice(cursor,at),hit:false});
     next.push({text:src.slice(at,finish),hit:true});
     cursor=finish;searchFrom=finish;
    }
    if(cursor<src.length)next.push({text:src.slice(cursor),hit:false});
   }
   pieces=next;
  }
  // Not every natural sentence contains a literal topic-bank lemma.
  // In those rows, emphasize one genuine contextual German vocabulary word
  // from the ORIGINAL sentence, rather than adding awkward artificial text.
  // Distinguish the contextual word from an actual topic-bank match.
  if(!pieces.some(p=>p.hit)){
   const ignored=new Set(['ich','wir','mir','mich','uns','mein','meine','meinen','meinem',
    'unser','unsere','unserem','und','oder','aber','auch','noch','schon',
    'nicht','ein','eine','einen','einem','einer','der','die','das','den','dem',
    'des','mit','für','von','vom','auf','aus','bei','nach','zum','zur','über',
    'unter','vor','dann','weil','wenn','dass','als','sich','sie','ihm','ihr',
    'dieser','diese','dieses','heute','jetzt','hier','dort','sehr','etwas',
    'mehr','alles','alle','einem','eines','einer','einen','sind','ist',
    'habe','haben','hat','wird','werden','kann','können','möchte','muss']);
   const candidates=[...line.matchAll(/\p{L}+(?:[-’']\p{L}+)*/gu)];
   const focus=candidates.find(m=>m[0].length>=4&&!ignored.has(m[0].toLocaleLowerCase('de')))
      ||candidates.find(m=>m[0].length>=2);
   if(focus){
    const i=focus.index,finish=i+focus[0].length;
    pieces=[
     {text:line.slice(0,i),hit:false},
     {text:line.slice(i,finish),hit:true,context:true},
     {text:line.slice(finish),hit:false}
    ];
   }
  }
  for(const p of pieces){
   if(!p.text)continue;
   if(p.hit)tag(node,'strong',p.text,p.context?'ww-passage-vocab ww-passage-context-vocab':'ww-passage-vocab');
   else node.append(document.createTextNode(p.text));
  }
 }
 let showReadingTranslation=false,showExtraVocabulary=false;
 function renderPassage(){
  const host=el('ww-topic-passage-content');host.replaceChildren();
  if(!selected)return;
  const lesson=passageSentences(),words=selected.all,id=selected.topic.id,reader=window.WortWegReading;
  tag(host,'h3',id===1?'Über mich – Das bin ich!':'Lesetext – '+selected.topic.de,'ww-passage-heading');
  const controls=tag(host,'div','','ww-passage-controls');
  const audio=tag(controls,'button','🔊 Read full story','btn secondary');
  audio.type='button';audio.addEventListener('click',()=>speak(lesson.story.map(row=>row.de).join(' ')));
  const translations=tag(controls,'button',showReadingTranslation?'Hide English':'Show English','btn secondary');
  translations.type='button';translations.setAttribute('aria-pressed',String(showReadingTranslation));
  translations.addEventListener('click',()=>{showReadingTranslation=!showReadingTranslation;renderPassage();});
  const done=tag(controls,'button',reader.completed(id)?'✓ Reading completed':'Mark reading complete','btn secondary ww-passage-complete');
  done.type='button';done.setAttribute('aria-pressed',String(reader.completed(id)));
  done.addEventListener('click',()=>{
   reader.setCompleted(id,!reader.completed(id));
   refreshSummary();renderPassage();
  });
  tag(host,'p','Reading '+reader.count(topics)+' / '+topics.length+' topics · '+lesson.story.length+
   ' story sentences · '+lesson.storyVocabulary+' / '+lesson.totalVocabulary+
   ' vocabulary items in story · '+lesson.reinforcement.length+' extra practice examples · Bold: topic or context words.','ww-passage-info');
  function section(parent,rows,numbered){
   for(let i=0;i<rows.length;i++){
    const row=tag(parent,'div','','ww-passage-row');
    tag(row,'span',numbered?String(i+1).padStart(2,'0'):'•','ww-passage-number');
    const copy=tag(row,'div','','ww-passage-copy');
    const german=tag(copy,'p','','ww-passage-sentence');
    highlightPassageWords(german,rows[i].de,words);
    const english=tag(copy,'p',rows[i].en||'Translation unavailable','ww-passage-en');
    english.hidden=!showReadingTranslation;
    const listen=tag(row,'button','🔊','ww-passage-audio');
    listen.type='button';listen.setAttribute('aria-label','Hear German sentence '+(i+1));
    listen.addEventListener('click',()=>speak(rows[i].de));
   }
  }
  const story=tag(host,'div','','ww-passage-story');
  section(story,lesson.story,true);
  if(lesson.reinforcement.length){
   const extra=tag(host,'div','','ww-passage-extra');
   const open=tag(extra,'button',showExtraVocabulary?'Hide extra vocabulary practice':'Show '+lesson.reinforcement.length+' extra vocabulary examples','btn secondary ww-passage-extra-toggle');
   open.type='button';open.setAttribute('aria-expanded',String(showExtraVocabulary));
   open.addEventListener('click',()=>{showExtraVocabulary=!showExtraVocabulary;renderPassage();});
   if(showExtraVocabulary){
    tag(extra,'p','Additional word exercises are separate from the natural reading story.','ww-passage-info');
    section(extra,lesson.reinforcement,false);
   }
  }
 }
 function togglePassage(force){
  const panel=el('ww-topic-passage'),button=el('ww-topic-read');
  const open=typeof force==='boolean'?force:panel.hidden;
  panel.hidden=!open;button.setAttribute('aria-expanded',String(open));
  button.textContent=open?'Hide reading passage':'📖 Read passage · sentence audio';
  if(open)renderPassage();
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
   // Colour only the definite article; keep the complete German word accessible.
   const name=tag(desc,'strong','','ww-topic-german');
   const articleMatch=String(w.de||'').match(/^(der|die|das)\s+(.+)$/i);
   if(articleMatch){
    name.classList.add('ww-topic-article-'+articleMatch[1].toLowerCase());
    tag(name,'span',articleMatch[1]+' ','ww-topic-article');
    tag(name,'span',articleMatch[2],'ww-topic-noun');
   }else{name.textContent=w.de;}
   tag(desc,'span',w.en||'Translation not yet available');
   if(w.mm)tag(desc,'small',w.mm);
   if(w.pron)tag(desc,'small',w.pron,'ww-topic-pron');
   const meta=tag(card,'div','','ww-topic-word-end');
   tag(meta,'span',w.source==='heading'?'Topic phrase':
    w.source==='starter'?'Starter word':(w.level||'Bank'),'ww-topic-tag');
   const status=seen(w);
   if(status)tag(meta,'small','✓ Seen','ww-topic-seen');
   const check=tag(meta,'label','','ww-topic-know-label');
   const input=document.createElement('input');input.type='checkbox';input.checked=known(w);
   input.setAttribute('aria-label','I know '+w.de);
   input.addEventListener('change',()=>markKnown(w,input.checked));
   check.append(input,document.createTextNode(' I know it'));
   const play=tag(meta,'button','🔊','ww-topic-listen');
   play.type='button';play.setAttribute('aria-label','Hear '+w.de+' pronounced in German');
   play.addEventListener('click',()=>speak(w.de));
   addMemoryPractice(card,w);
  }
  el('ww-topic-count').textContent=matches.length+' entries · '+Math.min(matches.length,shown)+' shown';
  const more=el('ww-topic-more');more.hidden=shown>=matches.length;
  more.textContent='Show '+Math.min(40,matches.length-shown)+' more words';
 }
 function refreshSummary(){
  if(!selected)return;
  const bankCount=selected.curated.length,bankDone=selected.curated.filter(seen).length;
  const extraCount=selected.extras.length,extraDone=selected.extras.filter(seen).length;
  const learned=selected.all.filter(known).length;
  el('ww-topic-summary').textContent=
   'Learned '+learned+' / '+selected.all.length+' · Quiz or checklist · '+
   'Quiz ready · '+selected.all.length+' practice entries · '+
   (bankCount?bankDone+' / '+bankCount+' Word Bank entries answered':'No matched Word Bank entries yet')+
   (extraCount?' · '+extraDone+' / '+extraCount+' topic expressions practised':'')+
   (window.WortWegReading?' · Reading '+window.WortWegReading.count(topics)+' / '+topics.length:'');
  el('ww-topic-practice').disabled=!selected.all.length;
  el('ww-topic-practice').title='Start the '+selected.topic.en+' vocabulary quiz';
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
   'Quiz ready! Practise the translated topic title and starter expressions. These are saved separately on this device and do not count toward CEFR Word Bank totals.';
  el('ww-topic-search').value='';el('ww-topic-level').value='ALL';
  showReadingTranslation=false;showExtraVocabulary=false;
  togglePassage(false);showWords();
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
  item.known=Boolean(correct);
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
  if(!selected?.all?.length)return;
  // Include the topic expression when present, even if a large CEFR bank
  // provides other questions. Single-expression lessons still have a real quiz.
  const unique=items=>items.filter((w,i,a)=>
   a.findIndex(other=>normalize(other.de)===normalize(w.de))===i);
  // A real bank word stays first when available. This guarantees that the
  // existing quiz updates legacy progress correctly; starter phrases are
  // included after it and are recorded in the separate topic practice store.
  const bankQuestions=shuffle(unique(selected.curated)).slice(0,selected.extras.length?9:10);
  const extraQuestions=shuffle(unique(selected.extras)).slice(0,Math.max(1,10-bankQuestions.length));
  const list=bankQuestions.concat(extraQuestions).slice(0,10);
  lesson={list,pos:0,correct:0,answered:false,bankAnswered:0,expressionAnswered:0};
  el('ww-topic-study').hidden=true;el('ww-topic-quiz').hidden=false;
  el('ww-topic-show').hidden=false;el('ww-topic-practice').hidden=true;
  renderQuestion();
 }
 function renderQuestion(){
  const host=el('ww-topic-quiz');host.replaceChildren();
  if(!lesson)return;
  if(lesson.pos>=lesson.list.length){
   tag(host,'h3','Quiz completed!');
   tag(host,'p',lesson.correct+' correct out of '+lesson.list.length+'. '+
    (lesson.bankAnswered?lesson.bankAnswered+' Word Bank answer(s) saved to your regular learning history. ':'')+
    (lesson.expressionAnswered?lesson.expressionAnswered+' topic expression answer(s) saved on this device separately from CEFR progress.':''));
   const again=tag(host,'button','Practice again','btn primary');again.type='button';again.addEventListener('click',startQuiz);
   return;
  }
  const w=lesson.list[lesson.pos],choices=[w.en];
  // Four distinct English answers for every topic, including lessons whose
  // only authored entry is their translated heading. Distractors come from
  // vocabulary entries, never fabricated definitions.
  const sameLevel=bank.filter(x=>x.level===w.level);
  const sourcePool=shuffle(selected.all.filter(x=>x!==w)).concat(
   shuffle(w.source==='heading'||w.source==='starter'?
    topics.map(t=>({de:t.de,en:t.en})):sameLevel));
  for(const other of sourcePool){
   if(choices.length===4)break;
   if(other.en&&normalize(other.en)!==normalize(w.en)&&
    !choices.some(choice=>normalize(choice)===normalize(other.en)))choices.push(other.en);
  }
  if(choices.length<4){
   for(const other of bank){
    if(choices.length===4)break;
    if(other.en&&normalize(other.en)!==normalize(w.en)&&
     !choices.some(choice=>normalize(choice)===normalize(other.en)))choices.push(other.en);
   }
  }
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
    if(w.source==='heading'||w.source==='starter'){
     recordExpression(w,correct);lesson.expressionAnswered++;
    }else{record(w,correct);lesson.bankAnswered++;}
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
 el('ww-topic-read').addEventListener('click',()=>togglePassage());
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
 // The original Topic browser is regenerated on searches. Replace its
 // legacy "Roadmap" status without mutating the 2 MB bundled dictionary.
 const topicList=$('topicList');
 function updateQuizReadyLabels(){
  if(!topicList)return;
  for(const button of topicList.querySelectorAll('button.topic')){
   const badge=button.lastElementChild;
   if(badge&&badge.textContent==='Roadmap'){
    badge.textContent='Quiz ready';
    badge.classList.add('ww-topic-ready');
   }else if(badge&&badge.textContent==='Quiz ready'){
    badge.classList.add('ww-topic-ready');
   }
  }
 }
 if(topicList){
  new MutationObserver(updateQuizReadyLabels).observe(topicList,{childList:true});
  updateQuizReadyLabels();
 }
 window.addEventListener('wortweg:account',()=>{lesson=null;if(selected){showWords();if(!el('ww-topic-passage').hidden)renderPassage();}});
 window.addEventListener('wortweg:changed',()=>{
  if(!selected||!page.classList.contains('active')||lesson)return;
  refreshSummary();displayWords();
 });
 window.WortWegTopics={open:id=>{const t=byId.get(Number(id));if(t)open(t)},getWords:id=>{
  const t=byId.get(Number(id));return t?entriesFor(t):null;
 },getCount:()=>topics.length,isQuizReady:id=>{
  const t=byId.get(Number(id));return Boolean(t&&entriesFor(t).all.length);
 },getLocalQuizHistory:()=>expressionRecords(),getReading:id=>{
  const t=byId.get(Number(id));return t&&window.WortWegReading?window.WortWegReading.build(t,entriesFor(t).all,identityPassage,exampleBank):null;
 },getReadingProgress:()=>window.WortWegReading?.count(topics)||0,
 inspectSentence:(sentence,words)=>{
  const span=document.createElement('span');
  highlightPassageWords(span,String(sentence||''),Array.isArray(words)?words:[]);
  return {text:span.textContent,bold:span.querySelectorAll('strong.ww-passage-vocab').length,
   topic:span.querySelectorAll('strong.ww-passage-vocab:not(.ww-passage-context-vocab)').length,
   context:span.querySelectorAll('strong.ww-passage-context-vocab').length};
 }};
})();