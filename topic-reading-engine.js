
/* WortWeg 370: bilingual reading data and separate, account-scoped completion. */
(()=>{
'use strict';
const SCENES=[{"first":2,"last":20,"lines":[{"de":"Im Sprachkurs lernen wir neue Menschen kennen.","en":"In language class we meet new people."},{"de":"Ich stelle eine Frage und höre aufmerksam zu.","en":"I ask a question and listen carefully."},{"de":"Wir vergleichen unsere Erfahrungen und lachen zusammen.","en":"We compare our experiences and laugh together."},{"de":"Am Ende weiß ich mehr über die anderen.","en":"At the end, I know more about the others."}]},{"first":21,"last":40,"lines":[{"de":"Am Morgen achte ich auf meine Gesundheit.","en":"In the morning I pay attention to my health."},{"de":"Ich überlege, was meinem Körper guttut.","en":"I think about what is good for my body."},{"de":"Wenn ich etwas nicht verstehe, frage ich nach.","en":"If I do not understand something, I ask."},{"de":"Danach merke ich mir einen wichtigen Tipp.","en":"Afterward I remember an important tip."}]},{"first":41,"last":62,"lines":[{"de":"Heute muss ich meinen Tagesplan gut organisieren.","en":"Today I have to organize my daily schedule well."},{"de":"Ich sehe auf die Uhr und denke an meine Aufgaben.","en":"I look at the clock and think about my tasks."},{"de":"Ich vergleiche zwei Möglichkeiten und wähle eine aus.","en":"I compare two options and choose one."},{"de":"Am Abend erzähle ich, was ich gemacht habe.","en":"In the evening I talk about what I did."}]},{"first":63,"last":91,"lines":[{"de":"Zu Hause gibt es heute einiges zu erledigen.","en":"There is quite a lot to do at home today."},{"de":"Mein Mitbewohner und ich sprechen über die Aufgaben.","en":"My flatmate and I talk about the tasks."},{"de":"Wir prüfen, ob alles gut funktioniert.","en":"We check whether everything is working well."},{"de":"Danach machen wir das Zimmer wieder gemütlich.","en":"Afterward we make the room comfortable again."}]},{"first":92,"last":140,"lines":[{"de":"Vor dem Einkaufen schreibe ich eine Liste.","en":"Before shopping I write a list."},{"de":"Im Geschäft vergleiche ich Preise und Angebote.","en":"At the shop I compare prices and offers."},{"de":"Eine Mitarbeiterin beantwortet meine Frage.","en":"An employee answers my question."},{"de":"Zu Hause freue ich mich über meinen Einkauf.","en":"At home I am happy with my purchases."}]},{"first":141,"last":157,"lines":[{"de":"Im Unterricht zeigt uns die Lehrerin ein neues Beispiel.","en":"In class the teacher shows us a new example."},{"de":"Ich mache Notizen und stelle Fragen.","en":"I take notes and ask questions."},{"de":"Mit den anderen übe ich die neue Aufgabe.","en":"I practise the new exercise with the others."},{"de":"Nach dem Unterricht wiederhole ich das Gelernte.","en":"After class I revise what I learned."}]},{"first":158,"last":190,"lines":[{"de":"Im Team beginnt unser Arbeitstag mit einer Besprechung.","en":"Our team starts the workday with a meeting."},{"de":"Ich erkläre, woran ich gerade arbeite.","en":"I explain what I am working on."},{"de":"Gemeinsam suchen wir nach einer guten Lösung.","en":"Together we look for a good solution."},{"de":"Am Ende halten wir die nächsten Schritte fest.","en":"At the end we write down the next steps."}]},{"first":191,"last":202,"lines":[{"de":"Für einen wichtigen Termin bereite ich Unterlagen vor.","en":"I prepare documents for an important appointment."},{"de":"Vor Ort lese ich die Hinweise aufmerksam.","en":"Once there I read the instructions carefully."},{"de":"Eine Mitarbeiterin erklärt mir den Ablauf.","en":"An employee explains the procedure to me."},{"de":"Ich kontrolliere alles, bevor ich gehe.","en":"I check everything before I leave."}]},{"first":203,"last":259,"lines":[{"de":"Heute bin ich unterwegs und erkunde meine Umgebung.","en":"Today I am out exploring my surroundings."},{"de":"Ich überprüfe zuerst den Weg auf der Karte.","en":"First I check the route on the map."},{"de":"Unterwegs entdecke ich etwas Interessantes.","en":"On the way I discover something interesting."},{"de":"Später erzähle ich einem Freund davon.","en":"Later I tell a friend about it."}]},{"first":260,"last":301,"lines":[{"de":"Heute habe ich etwas Freizeit.","en":"Today I have some free time."},{"de":"Mit einem Freund bespreche ich unseren Plan.","en":"I discuss our plan with a friend."},{"de":"Wir probieren etwas aus und haben viel Spaß.","en":"We try something and have a lot of fun."},{"de":"Am Ende behalten wir schöne Erinnerungen.","en":"In the end we keep fond memories."}]},{"first":302,"last":319,"lines":[{"de":"Heute sprechen wir über unser Zusammenleben.","en":"Today we talk about living together."},{"de":"Jeder erzählt von seinen eigenen Erfahrungen.","en":"Everyone talks about their own experiences."},{"de":"Wir hören zu und respektieren andere Meinungen.","en":"We listen and respect other opinions."},{"de":"Gemeinsam lernen wir etwas Neues.","en":"Together we learn something new."}]},{"first":320,"last":350,"lines":[{"de":"Im Kurs untersuchen wir eine interessante Frage.","en":"In class we investigate an interesting question."},{"de":"Zuerst sammeln wir Informationen und Beispiele.","en":"First we collect information and examples."},{"de":"Danach vergleichen wir verschiedene Ergebnisse.","en":"Then we compare different results."},{"de":"Am Ende erklären wir unsere Beobachtungen.","en":"At the end we explain our observations."}]},{"first":351,"last":370,"lines":[{"de":"Heute möchte ich eine wichtige Alltagssituation verstehen.","en":"Today I want to understand an important everyday situation."},{"de":"Ich lese die Informationen und prüfe die Möglichkeiten.","en":"I read the information and check the options."},{"de":"Wenn etwas unklar ist, hole ich mir Hilfe.","en":"If something is unclear, I get help."},{"de":"Danach weiß ich, was ich als Nächstes tun kann.","en":"Afterward I know what I can do next."}]}];
const IDENTITY_EN=["Hello! My name is Eric.","My first name is Eric, and my last name is in my passport.","My family name and birth name are the same.","I do not have a second given name.","My usual name is Eric.","My initials are E. S.","The spelling of my name is important, particularly on official forms.","I have not changed my name.","I am a young adult.","I am twenty-five years old.","I do not want to give my date of birth here.","My birth month and birth year are in my personal documents.","My place of birth is in Myanmar, and my birth city is Yangon.","My birth certificate contains this information.","My home country is Myanmar.","My country of origin is also Myanmar.","The country where I now live is Germany.","My nationality is Myanmar.","My first language is Burmese.","I also speak English and learn German.","My place of residence is Hamburg.","My legal residence is now in Germany.","My exact address is private.","I do not want to show my postal address publicly.","My postcode and house number are in my personal records.","I am an engineer.","I studied electrical engineering and am now doing a master's at Hamburg University of Technology.","I am interested in automation, control engineering and digital technologies.","I also play piano and teach music.","My marital status is private.","A form offers options such as single or married.","My gender is male.","My contact details are also private.","I give my phone number and email address only to trusted people.","I do not publish my ID number.","When I fill in a form, I first read the salutation, such as Mr or Ms.","Then I enter the required details.","Finally I check everything and add my signature.","That's me!","I live in Hamburg, learn German every day and want to develop personally and professionally."];
const STORAGE_PREFIX='wortweg370-topic-reading-v1:';
const storageKey=()=>STORAGE_PREFIX+String(window.WortWegAccountSnapshot?.uid||'guest');
function records(){
 try{const x=JSON.parse(localStorage.getItem(storageKey())||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}
 catch{return {};}
}
function completed(id){return records()[String(id)]?.complete===true;}
function setCompleted(id,value){
 const copy=records();copy[String(id)]={complete:!!value,updatedAt:new Date().toISOString()};
 try{localStorage.setItem(storageKey(),JSON.stringify(copy));}catch{}
}
function count(topics){const saved=records();return topics.filter(t=>saved[String(t.id)]?.complete===true).length;}
function build(topic,words,identity,examples){
 let story;
 if(topic.id===1){
  story=String(identity).split('\n').flatMap((de,i)=>{
   // The greeting and self-introduction are two spoken sentences.
   // They deserve independent bolding and speaker controls.
   if(i===0&&de.startsWith('Hallo! ')){
    return [{de:'Hallo!',en:'Hello!',kind:'story'},
     {de:de.slice('Hallo! '.length),en:'My name is Eric.',kind:'story'}];
   }
   return [{de,en:IDENTITY_EN[i]||'',kind:'story'}];
  });
 }else{
  const scene=SCENES.find(s=>topic.id>=s.first&&topic.id<=s.last);
  const seed=window.WortWegReadingSeeds?.[topic.id];
  story=[{de:'Heute geht es um das Thema „'+topic.de+'“.',en:'Today we are discussing '+topic.en+'.',kind:'story'}];
  if(seed)story.push({de:seed[0],en:seed[1],kind:'story'});
  for(const row of scene?.lines||[])story.push({...row,kind:'story'});
  story.push({de:'Ich kann jetzt mehr über dieses Thema erzählen.',en:'I can now talk more about this topic.',kind:'story'});
 }
 const reinforcement=[];
 const seen=new Set();
 for(const word of words){
  const raw=String(word.de||'').trim(),bare=raw.replace(/^(der|die|das)\s+/i,'').trim();
  const norm=bare.toLocaleLowerCase('de');
  if(!norm||seen.has(norm))continue;
  seen.add(norm);
  if(story.some(row=>row.de.toLocaleLowerCase('de').includes(norm)))continue;
  const example=examples[raw.toLocaleLowerCase('de')];
  reinforcement.push(example?{de:example[0],en:example[1],kind:'practice',word:raw}:
    {de:'Ich schreibe einen Beispielsatz mit dem Ausdruck „'+raw+'“.',
     en:'I write an example sentence with the expression “'+String(word.en||raw)+'”.',
     kind:'practice',word:raw});
 }
 return {story,reinforcement,totalVocabulary:seen.size,
   storyVocabulary:seen.size-reinforcement.length};
}
window.WortWegReading={build,completed,setCompleted,count,storageKey};
})();