import { env } from 'cloudflare:workers';
import { chat, createServices } from '@/lib/chat-engine.mjs';
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Origin not allowed'},{status:403});
 if(Number(request.headers.get('content-length')||0)>12000)return Response.json({error:'Request too large'},{status:413});
 try{const raw=await request.text();if(raw.length>12000)return Response.json({error:'Request too large'},{status:413});const body=JSON.parse(raw);
 const config = {
  ...process.env,
  ...(typeof env !== 'undefined' ? env : {})
 } as Record<string, string | undefined>;
 if(config.N8N_WEBHOOK_URL){
  if(typeof body?.message!=='string'||!body.message.trim()||body.message.length>2000)throw new TypeError('Invalid message');
  try{const upstream=await fetch(config.N8N_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:raw,signal:AbortSignal.timeout(55000)});if(!upstream.ok)throw new Error('n8n unavailable');const result=await upstream.json() as {text?:string};if(typeof result.text!=='string')throw new Error('Invalid n8n response');return Response.json(result,{headers:{'Cache-Control':'no-store'}});}
  catch{return Response.json({text:'ยังเชื่อมต่อ n8n ไม่ได้ครับ กรุณาตรวจว่าระบบเปิดอยู่แล้วลองอีกครั้ง',context:body.context||{},error:true,actions:[{label:'ลองอีกครั้ง',value:body.message}]});}
 }
 const result=await chat(body,createServices(config));return Response.json(result,{headers:{'Cache-Control':'no-store'}});}
 catch(e){return Response.json({error:e instanceof TypeError||e instanceof SyntaxError?'Invalid message':'Chat unavailable'},{status:e instanceof TypeError||e instanceof SyntaxError?400:503});}
}
