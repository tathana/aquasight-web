// Conversation adapter based on Aqua sight n8n (1).json. No LINE credentials needed.
import { LEGACY_STANDARDS } from './legacy-standards.mjs';
export const STATIONS=['CP01','LS01','LS03','TP01','TP04','TP11','PN01','SK01','SK06'];
export const YEARS=[2026,2025,2024,2023,2022,2021,2020];
const intents=['Summary','Monthly','Forecast','Map','History','AI'];
const action=(label,value=label)=>({label,value});
const home=[action('ตรวจสอบคุณภาพน้ำ'),action('ดูข้อมูลย้อนหลัง'),action('ดูแผนที่'),action('พยากรณ์คุณภาพน้ำ'),action('คุยกับ AI'),action('เกณฑ์คุณภาพน้ำ'),action('เกี่ยวกับ')];
const reports=[action('สรุปรายปี','Summary'),action('ข้อมูลรายเดือน','Monthly'),action('พยากรณ์คุณภาพน้ำ','Forecast')];
const labels={Summary:'สรุปรายปี',Monthly:'ข้อมูลรายเดือน',Forecast:'ผลพยากรณ์',Map:'แผนที่ Chlorophyll-a',History:'ข้อมูลย้อนหลัง'};
const fields=[['tsi','TSI',''],['chl_a','Chlorophyll-a','µg/L'],['secchi_m','Secchi Depth','m'],['pH','pH',''],['turbidity','Turbidity','NTU'],['do_mgL','DO','mg/L'],['salinity_idx','Salinity index','ดัชนี']];
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const fmt=v=>finite(v)?v.toFixed(2):'ไม่มีข้อมูล';
function cleanContext(c){return { ...(STATIONS.includes(c?.station)?{station:c.station}:{}),...(YEARS.includes(c?.year)?{year:c.year}:{}),...(intents.includes(c?.intent)?{intent:c.intent}:{}) };}
function follow(c){return [action('ดูสรุปรายปี',`Summary ${c.station} ${c.year||''}`.trim()),action('ดูรายเดือน',`Monthly ${c.station} ${c.year||''}`.trim()),action('ดูแผนที่',`ดูแผนที่ ${c.station} ${c.year||''}`.trim()),action('เปลี่ยนสถานี'),action('หน้าแรก')];}
function values(row){return fields.map(([k,l,u])=>`${l}: ${fmt(row?.[k])}${finite(row?.[k])&&u?' '+u:''}`).join('\n');}
function baseUrl(value,fallback){const u=new URL(value||fallback);if(!['http:','https:'].includes(u.protocol))throw new Error('Invalid service URL');return u;}
export class ServiceError extends Error {
 constructor(kind,status){super(kind);this.kind=kind;this.status=status;}
}
function serviceErrorText(error){
 if(error instanceof ServiceError){
  if(error.kind==='timeout')return 'เซิร์ฟเวอร์ข้อมูลเดิมไม่ตอบภายใน 45 วินาทีครับ จึงหยุดรอคำขอนี้\nยังไม่สามารถระบุได้ว่าสถานีและปีนี้มีข้อมูลหรือไม่';
  if(error.kind==='network')return 'เชื่อมต่อเซิร์ฟเวอร์ข้อมูลเดิมไม่ได้ครับ\nยังไม่สามารถระบุได้ว่าสถานีและปีนี้มีข้อมูลหรือไม่';
  if(error.status===401||error.status===403)return 'บริการข้อมูลเดิมปฏิเสธสิทธิ์เข้าถึงครับ ต้องตรวจการตั้งค่าการเชื่อมต่อ';
  if(error.status===404)return 'บริการเดิมไม่พบเส้นทางหรือข้อมูลที่ขอ (HTTP 404) ครับ ต้องตรวจ API ต้นทาง';
  return `บริการข้อมูลเดิมตอบข้อผิดพลาด HTTP ${error.status} ครับ`;
 }
 return 'บริการข้อมูลเดิมยังไม่พร้อม หรือส่งผลลัพธ์ที่อ่านไม่ได้ครับ\nยังไม่ได้รับผลข้อมูลสำหรับคำขอนี้';
}
const parameterMap={tsi:'tsi',chl_a:'chlorophyll_a',secchi_m:'secchi',pH:'ph',turbidity:'turbidity',do_mgL:'do',salinity_idx:'salinity'};
export function aggregateActual(series,year){
 const monthly={},mean={},counts={};const dates=[];
 for(const [key,points] of Object.entries(series)){
  const buckets=new Map();
  for(const point of points){
   if(typeof point.date!=='string'||!/^\d{4}-\d{2}-\d{2}/.test(point.date)||!finite(point.value))continue;
   const date=point.date.slice(0,10);const m=Number(date.slice(5,7));
   if(Number(date.slice(0,4))!==year||m<1||m>12)continue;
   dates.push(date);if(!buckets.has(m))buckets.set(m,[]);buckets.get(m).push(point.value);
  }
  monthly[key]=Array.from({length:12},(_,i)=>{const vals=buckets.get(i+1)||[];return {month:i+1,value:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null};});
  const vals=monthly[key].map(p=>p.value).filter(finite);counts[key]=vals.length;
  mean[key]=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
 }
 dates.sort();return {monthly,mean,counts,coverage:dates.length?`${dates[0]} ถึง ${dates.at(-1)}`:'ไม่มีข้อมูลย้อนหลังในปีที่เลือก'};
}
function coverageText(d){return d.coverage?`\nช่วงข้อมูลที่มี: ${d.coverage}\nวิธีสรุป: เฉลี่ยแต่ละเดือนก่อน แล้วเฉลี่ยเดือนที่มีข้อมูลโดยให้น้ำหนักเท่ากัน ไม่เติมเดือนที่ขาด\nจำนวนเดือน: ${fields.map(([k,l])=>`${l} ${d.counts[k]||0}/12`).join(' · ')}`:'';}
export function createServices(env={},fetcher=fetch){
 const dataBase=baseUrl(env.AQUA_API_URL,'https://aqua-sight-api.onrender.com');
 const forecastBase=baseUrl(env.FORECAST_API_URL,'https://predictvalue-api.onrender.com');
 async function request(base,path,params){
  const url=new URL(path,base);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,String(v)));
  const signal=AbortSignal.timeout(45000);
  try{
   const r=await fetcher(url,{signal,headers:{Accept:'application/json, text/plain, image/*'}});
   if(!r.ok)throw new ServiceError('http',r.status);
   const ct=r.headers.get('content-type')||'';if(ct.startsWith('image/'))return {imageUrl:url.href};
   const text=await r.text();try{return JSON.parse(text);}catch{return text.trim();}
  }catch(error){if(error instanceof ServiceError)throw error;throw new ServiceError(signal.aborted||error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'network');}
 }
 const pending=new Map();
 function actual(station){
  if(!pending.has(station))pending.set(station,Promise.all(Object.entries(parameterMap).map(async([key,parameter])=>{
   const d=await request(forecastBase,'/forecast/timeseries',{station:station==='TP11'?'TP011':station,parameter,horizon:12});
   if(!Array.isArray(d?.actual))throw new Error('Invalid actual series');
   return [key,d.actual];
  })).then(Object.fromEntries));
  return pending.get(station);
 }
 return {
  summary:async(station,year)=>aggregateActual(await actual(station),year),
  monthly:async(station,year)=>aggregateActual(await actual(station),year),
  map: async (station, year) => {
    try {
     return await request(new URL('http://localhost:8000'), '/map_png_proxy', { station, year, layer: 'chl_a', ac: 'full', cloud_perc: 10 });
    } catch (e) {
     try {
      return await request(dataBase, '/map_png_proxy', { station, year, layer: 'chl_a', ac: 'full', cloud_perc: 10 });
     } catch (e2) {
      return await request(forecastBase, '/map_png_proxy', { station, year, layer: 'chl_a', ac: 'full', cloud_perc: 10 });
     }
    }
   },
  forecast:station=>request(forecastBase,'/forecast/',{station:station==='TP11'?'TP011':station,resolution:'monthly',horizon:12}),
   ai:async prompt=>{if(!env.GEMINI_API_KEY)return null;const model=env.GEMINI_MODEL||'gemini-3.5-flash';if(!/^[a-zA-Z0-9._-]+$/.test(model))throw new Error('Invalid model');const r=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',signal:AbortSignal.timeout(25000),headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:'คุณคือ Aqua Sight ตอบภาษาไทยแบบกระชับ ให้ความรู้ทั่วไป คุณไม่ได้รับข้อมูลสถานีจาก API ในบทสนทนานี้ อย่าสร้างค่าตรวจวัดหรือผลพยากรณ์ หากถามข้อมูลสถานีให้แนะนำเมนูตรวจสอบคุณภาพน้ำ ห้ามยืนยันความปลอดภัยในการดื่มจากข้อมูลดาวเทียมเพียงอย่างเดียว'}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:2048}})});if(!r.ok)throw new Error('AI unavailable');const d=await r.json();const answer=d.candidates?.[0]?.content?.parts?.filter(p=>!p.thought).map(p=>p.text||'').join('');if(!answer)throw new Error('Empty AI response');return answer;},
 };
}
export async function chat(body,services){
 if(typeof body?.message!=='string'||!body.message.trim()||body.message.length>2000)throw new TypeError('Invalid message');
 let c=cleanContext(body.context);let text=body.message.trim().replace(/\s+/g,' ');
 const reply=(text,actions=[],extra={})=>({text,actions,context:c,...extra});
 if(['หน้าแรก','เริ่มใหม่','เมนู'].includes(text)){c={};return reply('เลือกเมนูที่ต้องการได้เลยครับ',home);}
 if(text==='เกี่ยวกับ')return reply('Aqua Sight ช่วยค้นหาข้อมูลคุณภาพน้ำของ 9 สถานีภาคใต้\nหน้าแชทนี้ต่อยอดจาก workflow v.3 ที่ได้รับมา ใช้บริการข้อมูล แผนที่ และพยากรณ์เดิม\nข้อมูลจากดาวเทียมเป็นค่าประมาณตามช่วงเวลาที่มีภาพ', [action('หน้าแรก')]);
 if(text==='เกณฑ์คุณภาพน้ำ')return reply('ข้อความอ้างอิงจาก workflow เดิม ยังไม่ได้ยืนยันเอกสารมาตรฐานและหน่วยต้นทาง จึงไม่ใช้ตัดสินว่าน้ำปลอดภัยหรือดื่มได้\n\n'+LEGACY_STANDARDS,[action('ตรวจสอบคุณภาพน้ำ'),action('หน้าแรก')],{source:'ข้อความเดิมจากไฟล์ Aqua sight n8n (1).json'});
 if(['ตรวจสอบคุณภาพน้ำ','เลือกสถานี'].includes(text)){c.intent=undefined;return reply('เลือกรูปแบบรายงานครับ',reports);}
 if(text==='เปลี่ยนสถานี'){delete c.station;return reply('เลือกสถานีใหม่ครับ',STATIONS.map(s=>action(s,s)));}
 if(text==='คุยกับ AI'){c.intent='AI';return reply('พิมพ์คำถามได้เลยครับ เช่น ค่า DO คืออะไร\nโหมดนี้ตอบความรู้ทั่วไป หากต้องการค่าของสถานีให้เลือกเมนูตรวจสอบคุณภาพน้ำ', [action('AI ค่า DO คืออะไร'),action('ตรวจสอบคุณภาพน้ำ')]);}
 const aiQuestion=/^AI\s+(.+)$/i.exec(text);
 const alias={'สรุปรายปี':'Summary','ข้อมูลรายเดือน':'Monthly','พยากรณ์คุณภาพน้ำ':'Forecast','ดูข้อมูลย้อนหลัง':'History'};
 text=alias[text]||text;
 const cmd=/^(Summary|Monthly|Forecast|History|Map|ดูแผนที่|ประวัติ)(?:\s+(CP01|LS01|LS03|TP01|TP04|TP011|TP11|PN01|SK01|SK06))?(?:\s+(\d{4}))?$/i.exec(text);
 if(!aiQuestion&&cmd){const n=cmd[1].toLowerCase();c.intent=n==='ดูแผนที่'?'Map':n==='ประวัติ'?'History':intents.find(v=>v.toLowerCase()===n);if(cmd[2])c.station=cmd[2].toUpperCase().replace('TP011','TP11');if(cmd[3]){const y=Number(cmd[3]);if(!YEARS.includes(y))return reply('เลือกปี 2020–2026 ครับ',YEARS.map(y=>action(String(y),String(y))));c.year=y;}}
 else if(STATIONS.includes(text.toUpperCase().replace('TP011','TP11'))){c.station=text.toUpperCase().replace('TP011','TP11');if(c.intent==='AI')delete c.intent;}
 else if(/^\d{4}$/.test(text)){if(!YEARS.includes(Number(text)))return reply('เลือกปี 2020–2026 ครับ',YEARS.map(y=>action(String(y),String(y))));c.year=Number(text);}
 else if(aiQuestion||c.intent==='AI'){
  try{const answer=await services.ai(aiQuestion?aiQuestion[1]:text);c.intent='AI';return answer?reply(answer,[action('ตรวจสอบคุณภาพน้ำ'),action('หน้าแรก')],{source:'Gemini · ความรู้ทั่วไป ไม่ได้ดึงข้อมูลสถานีในคำตอบนี้'}):reply('ยังไม่ได้ตั้งค่าการเชื่อมต่อ AI ครับ เมนูข้อมูลน้ำยังใช้งานแยกกันได้',[action('ตรวจสอบคุณภาพน้ำ'),action('หน้าแรก')],{error:true});}catch{return reply('บริการ AI ยังไม่ตอบครับ กรุณาลองใหม่',[action('ลองอีกครั้ง',`AI ${aiQuestion?aiQuestion[1]:text}`),action('หน้าแรก')],{error:true});}
 }else return reply('เลือกเมนูด้านล่าง หรือพิมพ์คำสั่ง เช่น Summary CP01 2026 ครับ\nหากต้องการถามความรู้ทั่วไป ให้เลือกคุยกับ AI',home);
 if(!c.intent||c.intent==='AI')return reply('เลือกรูปแบบรายงานครับ',reports);
 if(!c.station)return reply(`เลือกสถานีสำหรับ${labels[c.intent]}ครับ`,STATIONS.map(s=>action(s,s)));
 if(!['Forecast','History'].includes(c.intent)&&!c.year)return reply(`สถานี ${c.station} · เลือกปีที่ต้องการครับ`,YEARS.map(y=>action(String(y),String(y))));
 const heading=`${labels[c.intent]} · ${c.station}${!['Forecast','History'].includes(c.intent)?' · '+c.year:''}`;
 const note=c.year===2026?'\nปี 2026 แสดงเฉพาะข้อมูลที่แหล่งข้อมูลมีให้ อาจยังไม่ครบปี':'';
 const source=`${c.intent==='Map'?'Aqua Sight Map API':'PredictValue API · ข้อมูลย้อนหลัง (actual)'} · เรียกเมื่อ ${new Date().toISOString()}`;
 try{
  if(c.intent==='Summary'){const d=await services.summary(c.station,c.year);if(!d||typeof d.mean!=='object'||Array.isArray(d.mean)||d.mean===null)throw new Error('Invalid summary');return reply(`${heading}\n\n${values(d.mean)}${coverageText(d)}${note}\n\nค่าประมาณจากแหล่งข้อมูลเดิม ไม่ใช่การรับรองความปลอดภัยของน้ำ`,follow(c),{source});}
  if(c.intent==='Monthly'){const d=await services.monthly(c.station,c.year);if(!d?.monthly||typeof d.monthly!=='object')throw new Error('Invalid monthly');const months=Array.from({length:12},(_,i)=>{const m=i+1;const row=Object.fromEntries(fields.map(([key])=>[key,Array.isArray(d.monthly[key])?d.monthly[key].find(x=>Number(x.month)===m)?.value:null]));return `เดือน ${m}\n${values(row)}`;});return reply(`${heading}${coverageText(d)}${note}\n\n${months.join('\n\n')}`,follow(c),{source});}
  if(c.intent==='Map'){const d=await services.map(c.station,c.year);const url=typeof d==='string'?d:d?.imageUrl||d?.url||d?.data;let u;try{u=new URL(url);}catch{throw new Error('Invalid map');}if(!['http:','https:'].includes(u.protocol))throw new Error('Unsafe map');return reply(`${heading}\nภาพ Chlorophyll-a จากบริการแผนที่เดิม${note}`,follow(c),{source,image:u.href});}
  if(c.intent==='Forecast'){const d=await services.forecast(c.station);if(!Array.isArray(d?.forecast))throw new Error('Invalid forecast');if(!d.forecast.length)return reply(`${heading}\nยังไม่มีผลพยากรณ์สำหรับสถานีนี้`,follow(c),{source});const rows=d.forecast.slice(0,12);const last=rows.at(-1)?.date;const old=typeof last==='string'&&/^\d{4}-\d{2}-\d{2}/.test(last)&&new Date(last)<new Date();const blocks=rows.map(r=>`วันที่ ${typeof r.date==='string'?r.date:'ไม่ระบุ'}\n${values({tsi:r.tsi,chl_a:r.chlorophyll_a,secchi_m:r.secchi,pH:r.ph,turbidity:r.turbidity,do_mgL:r.do,salinity_idx:r.salinity})}`);return reply(`${heading}\nผลจากบริการพยากรณ์เดิม แสดงตามวันที่ที่บริการส่งกลับ${old?'\nผลชุดนี้เป็นช่วงเวลาในอดีต ไม่ใช่การพยากรณ์ปัจจุบัน':''}\n\n${blocks.join('\n\n')}\n\nบริการเดิมไม่ได้ส่งช่วงความไม่แน่นอนมาด้วย ค่า Salinity ยังต้องตรวจหน่วยต้นทาง`,follow(c),{source:'บริการพยากรณ์ Aqua Sight เดิม'});}
  if(c.intent==='History'){const results=await Promise.all(YEARS.slice().reverse().map(async year=>{try{const d=await services.summary(c.station,year);if(!d?.mean||typeof d.mean!=='object')throw new Error();return {year,ok:true,text:values(d.mean)+coverageText(d)};}catch{return {year,ok:false,text:'เรียกข้อมูลปีนี้ไม่สำเร็จ กรุณาลองอีกครั้ง'};}}));return reply(`${heading}\n2020–2026 (ปี 2026 อาจยังไม่ครบปี)\n\n${results.map(r=>`${r.year}\n${r.text}`).join('\n\n')}`, [action('ลองโหลดประวัติใหม่',`ประวัติ ${c.station}`),...follow(c)],{source,error:results.every(r=>!r.ok)});}
 }catch(error){return reply(`${heading}\n${serviceErrorText(error)}`,[action('ลองอีกครั้ง',`${c.intent} ${c.station}${c.year?' '+c.year:''}`),action('เปลี่ยนสถานี'),action('หน้าแรก')],{error:true});}
 return reply('กรุณาเลือกเมนูครับ',home);
}
