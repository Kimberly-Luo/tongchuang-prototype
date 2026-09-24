// Local prototype only. Live authentication, payments and concurrent locks require a server.
export const HOUR = 3600000;
export const grades = ['小学','初中','高中','竞赛'];
export const subjects = ['数学','英语','语文','物理','化学','生物','政治','历史','地理'];
export const weekdays = ['周一','周二','周三','周四','周五','周六','周日'];
export const clone = o => JSON.parse(JSON.stringify(o));
export const money = n => (Math.round(n)/100).toLocaleString('zh-CN',{maximumFractionDigits:2});
export const timeText = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
export const slotText = s => `${weekdays[s.day-1]} ${timeText(s.start)}–${timeText(s.end)}`;
export function initialRequest(){return {grade:'高中',subjects:['数学'],mode:'线下',city:'上海',location:'杨浦 · 五角场附近',distance:4,budgetMin:23000,budgetMax:27000,gender:'无所谓',childGender:'女',period:'一学期',notes:'',style:'耐心型',sessions:[{options:[{day:3,start:1140,end:1200}]},{options:[{day:6,start:840,end:960}]}]};}
export const subjectText=r=>(Array.isArray(r?.subjects)?r.subjects:(r?.subject?[r.subject]:[])).join('、');
export function migrateState(saved){const state=clone(saved);const migrate=r=>{if(r&&!Array.isArray(r.subjects))r.subjects=r.subject?[r.subject]:[];return r;};state.request=migrate(state.request);for(const o of state.orders||[])migrate(o.request);for(const t of createState().tutors)if(!state.tutors.some(x=>x.id===t.id))state.tutors.push(t);state.version=2;return state;}
export function createState(now=Date.now()){
 const base={grades:['小学','初中','高中'],subjects:['数学','物理'],gender:'男',mode:'均可',far:true,verifiedUntil:new Date(new Date(now).getFullYear()+1,8,30,23,59).getTime(),active:true,currentStudent:true,availability:[{day:3,start:1080,end:1320},{day:4,start:1080,end:1320},{day:6,start:540,end:1080},{day:7,start:540,end:1080}],blocks:[],styles:['耐心型'],period:'一学期',completeness:85,low:23000,high:26000};
 const tutors=[
 {id:'t1',name:'林同学',major:'数学与应用数学',year:'大三',gender:'女',letter:'林',color:'jade',low:23000,high:25000,style:'耐心细致，擅长把难题拆成小步骤。',intro:'从基础概念出发，和孩子一起梳理解题思路。课前了解薄弱环节，试课以一道典型题展开。',experience:'两段高中数学辅导经历',styles:['耐心型','善于沟通型'],completeness:96},
 {id:'t2',name:'陈同学',major:'物理学',year:'大二',letter:'陈',color:'blue',low:24000,high:27000,style:'重视理解，用具体例子讲清抽象概念。',intro:'喜欢讨论为什么，把公式和真实场景联系起来，帮助建立知识框架。',experience:'高中数学、物理辅导经历',styles:['善于沟通型'],completeness:92},
 {id:'t3',name:'许同学',major:'计算机科学与技术',year:'大三',gender:'女',letter:'许',color:'orange',low:25000,high:28000,style:'善于总结方法，帮助形成稳定的学习节奏。',intro:'先检查基础，再做针对性练习。希望和家长保持清晰沟通，共同制定学习安排。',experience:'一学期数学陪伴辅导',completeness:90},
 {id:'t4',name:'周同学',major:'英语',year:'大二',gender:'女',letter:'周',color:'blue',subjects:['英语','语文'],low:22000,high:25000,style:'注重表达与反馈，让学习更有参与感。',intro:'通过阅读和交流发现问题，再细化练习目标。',experience:'英语学习小组组织经历'},
 {id:'t5',name:'沈同学',major:'化学',year:'大四',letter:'沈',color:'jade',subjects:['化学','生物'],style:'先搭建知识框架，再逐个解决疑问。',intro:'将知识点连接起来，帮助理解反应规律。',experience:'高中化学辅导经历'},
 {id:'t6',name:'陆同学',major:'数学与应用数学',year:'研一',letter:'陆',color:'orange',grades:['竞赛'],low:29000,high:33000,style:'用推导培养思维，重视过程。',intro:'竞赛经历是演示数据，实际能力需要进一步核验。',experience:'数学竞赛经历（自报）'},
 {id:'t7',name:'顾同学',major:'国际政治',year:'大三',gender:'女',letter:'顾',color:'blue',grades:['初中','高中'],subjects:['政治','历史','地理'],low:22000,high:25000,style:'用时间线和知识框架串起人文社科内容。',intro:'先梳理材料与概念，再练习提取信息和组织答案。',experience:'高中人文社科学习小组经历',styles:['耐心型','善于沟通型'],completeness:91}
 ].map(x=>({...clone(base),...x}));
 return {version:2,tutors,orders:[],request:initialRequest(),offset:0,sequence:0};
}
export function addDemoTutor(state,p,now=Date.now()){
 if(!p?.name?.trim()||!p?.major?.trim()||!Array.isArray(p.grades)||!p.grades.length||!Array.isArray(p.subjects)||!p.subjects.length)throw Error('请完整填写学生资料');
 if(!p.email?.toLowerCase().endsWith('@fudan.edu.cn'))throw Error('请先完成复旦校园邮箱模拟验证');
 const slotMap={
  '周三晚':{day:3,start:1080,end:1320},'周四晚':{day:4,start:1080,end:1320},
  '周六上午':{day:6,start:540,end:720},'周六下午':{day:6,start:780,end:1080},
  '周日上午':{day:7,start:540,end:720},'周日下午':{day:7,start:780,end:1080}
 };
 const availability=(p.slots||[]).map(x=>slotMap[x]).filter(Boolean);
 if(!availability.length)throw Error('请至少选择一个可接时间');
 const low=Math.round(Number(p.low)*100),high=Math.round(Number(p.high)*100);
 if(!Number.isInteger(low)||!Number.isInteger(high)||low<16000||high<low||high-low>5000)throw Error('报价最低 160 元，区间跨度不能超过 50 元');
 const id=`t-demo-${++state.sequence}`;
 const tutor={id,name:p.name.trim(),major:p.major.trim(),year:p.year,gender:p.gender,letter:p.name.trim()[0],color:'blue',grades:clone(p.grades),subjects:clone(p.subjects),mode:p.mode,far:!!p.far,verifiedUntil:new Date(new Date(now).getFullYear()+1,8,30,23,59).getTime(),active:true,currentStudent:true,availability,blocks:[],styles:[p.style||'耐心型'],period:'一学期',completeness:88,low,high,style:p.style==='善于沟通型'?'善于倾听和反馈，重视与家长同步学习情况。':'耐心讲清知识点，并根据孩子的理解速度调整节奏。',intro:p.intro||'先了解孩子的学习情况，再一起确定合适的辅导节奏。',experience:'入驻体验资料（自报）',verificationLabel:'模拟邮箱与在校核验'};
 state.tutors.push(tutor);return tutor;
}
export function validateRequest(r){
 if(!grades.includes(r.grade)||!Array.isArray(r.subjects)||!r.subjects.length||r.subjects.some(s=>!subjects.includes(s)))throw Error('请至少选择一门有效科目');
 if(!['线上','线下','均可'].includes(r.mode))throw Error('请选择授课方式');
 if(r.mode==='线下'&&r.city!=='上海')throw Error('线下目前仅支持上海');
 if(![r.budgetMin,r.budgetMax].every(Number.isInteger)||r.budgetMin<16000||r.budgetMax<r.budgetMin||r.budgetMax-r.budgetMin>5000)throw Error('预算最低 160 元，上下限差不得超过 50 元');
 if(!Number.isFinite(r.distance)||r.distance<0||r.distance>100)throw Error('请填写 0–100 公里的估算距离');
 if(!Array.isArray(r.sessions)||!r.sessions.length||r.sessions.length>4)throw Error('请填写 1–4 个每周课次');
 for(const g of r.sessions){
  if(!g.options?.length||g.options.length>3)throw Error('每次课需有 1–3 个备选时间');
  for(const s of g.options)if(![s.day,s.start,s.end].every(Number.isInteger)||s.day<1||s.day>7||s.start<0||s.end>1440||s.end-s.start!==(s.day>=6?120:60))throw Error('周中每次 1 小时，周末每次 2 小时，请检查时间');
 }return r;
}
export function commute(d,mode){if(mode==='线上'||d<=5)return 0;return Math.round((14+2.7*Math.min(Math.max(d-3,0),12)+4.05*Math.max(d-15,0))*200);}
const overlaps=(a,b)=>a.day===b.day&&a.start<b.end&&b.start<a.end;
const contains=(a,b)=>a.day===b.day&&a.start<=b.start&&a.end>=b.end;
export const activeOrder=o=>['invited','arranging','accepted','paid','scheduled','review'].includes(o.status);
export function expire(state,now){for(const o of state.orders){if(o.status==='invited'&&now>=o.inviteDeadline)o.status='expired';if(o.status==='review'&&now>=o.confirmDeadline)o.status='unconfirmed';}}
export function match(state,r,now=Date.now()){
 validateRequest(r);expire(state,now);const results=[];
 for(const t of state.tutors){
  if(!t.active||!t.currentStudent||t.verifiedUntil<now||state.orders.some(o=>o.tutorId===t.id&&activeOrder(o)))continue;
  if(!t.grades.includes(r.grade)||!r.subjects.every(s=>t.subjects.includes(s))||(r.gender!=='无所谓'&&t.gender!==r.gender))continue;
  const modes=(r.mode==='均可'?['线上','线下']:[r.mode]).filter(m=>(t.mode==='均可'||t.mode===m)&&(m!=='线下'||r.city==='上海'));
  let best=null;
  for(const mode of modes){
   if(mode==='线下'&&r.distance>5&&!t.far)continue;
   const c=commute(r.distance,mode);
   const options=r.sessions.map(g=>g.options.filter(s=>t.availability.some(a=>contains(a,s))&&!t.blocks.some(b=>overlaps(b,s))));
   if(options.some(a=>!a.length))continue;
   // ponytail: <=4 sessions x 3 choices gives <=81 schedules; use a solver only if this limit grows.
   function search(i,slots,low,high){
    if(i===options.length){
     const rate=Math.round((low+high)/2),hours=slots.reduce((n,s)=>n+(s.end-s.start)/60,0);
     const x={tutor:clone(t),mode,commute:c,low,high,rate,slots:clone(slots),hours,weeklyBase:Math.round(rate*hours),weeklyCommute:c*slots.length,alternatives:options.reduce((n,a)=>n+a.length,0),score:Math.abs(rate+c*slots.length/hours-(r.budgetMin+r.budgetMax)/2)};
     if(!best||x.score<best.score)best=x;return;
    }
    for(const s of options[i]){if(slots.some(b=>overlaps(b,s)))continue;const h=(s.end-s.start)/60,lo=Math.max(low,Math.ceil(r.budgetMin-c/h)),hi=Math.min(high,Math.floor(r.budgetMax-c/h));if(lo<=hi)search(i+1,[...slots,s],lo,hi);}
   }search(0,[],t.low,t.high);
  }if(best)results.push(best);
 }return results.sort((a,b)=>a.score-b.score||b.alternatives-a.alternatives||b.tutor.completeness-a.tutor.completeness).slice(0,5);
}
export function diagnose(state,r,now=Date.now()){
 validateRequest(r);expire(state,now);if(match(state,r,now).length)return [];
 let pool=state.tutors.filter(t=>t.active&&t.currentStudent&&t.verifiedUntil>=now&&!state.orders.some(o=>o.tutorId===t.id&&activeOrder(o)));
 if(!pool.length)return [{code:'availability',title:'当前没有可接单学生',detail:'学生可能暂停接单、认证过期或正在处理其他试课。',action:'wait'}];
 let next=pool.filter(t=>t.grades.includes(r.grade));if(!next.length)return [{code:'grade',title:`${r.grade}供给暂时不足`,detail:'当前可接单学生中还没有覆盖这个学段的人。',action:'wait'}];pool=next;
 next=pool.filter(t=>r.subjects.every(s=>t.subjects.includes(s)));if(!next.length)return [{code:'subjects',title:'暂时没人能同时覆盖全部科目',detail:`当前要求同一位学生覆盖“${subjectText(r)}”。可减少本次科目，或等待两人拆单功能。`,action:'edit_subjects'}];pool=next;
 next=pool.filter(t=>r.gender==='无所谓'||t.gender===r.gender);if(!next.length)return [{code:'gender',title:'性别偏好缩小了可选范围',detail:'改为“无所谓”后可能出现可行人选。',action:'relax_gender'}];pool=next;
 next=pool.filter(t=>{const modes=r.mode==='均可'?['线上','线下']:[r.mode];return modes.some(m=>(t.mode==='均可'||t.mode===m)&&(m!=='线下'||r.city==='上海'));});if(!next.length)return [{code:'mode',title:'授课方式暂时没有交集',detail:'接受线上授课通常能扩大候选范围。',action:'try_online'}];pool=next;
 next=pool.filter(t=>r.mode!=='线下'||r.distance<=5||t.far);if(!next.length)return [{code:'commute',title:'远距离线下通勤无人接受',detail:'可以改为线上或选择更靠近邯郸校区的位置。',action:'try_online'}];pool=next;
 next=pool.filter(t=>r.sessions.every(g=>g.options.some(s=>t.availability.some(a=>contains(a,s))&&!t.blocks.some(b=>overlaps(b,s)))));if(!next.length)return [{code:'time',title:'固定时间无法完整覆盖',detail:'增加每次课的备选时间，最容易提高匹配成功率。',action:'edit_time'}];
 return [{code:'price',title:'时间合适，但费用没有交集',detail:'通勤补贴也计入每小时预算；可以调整预算或改为线上。',action:r.mode==='线上'?'edit_budget':'try_online'}];
}
export function invite(state,r,tutorId,now){
 expire(state,now);if(state.orders.some(activeOrder))throw Error('请先完成当前试课，再邀请下一位同学');
 if(state.orders.some(o=>o.status==='success'&&(!o.parentPaid||!o.tutorPaid)))throw Error('请先完成上一单的模拟服务费结算');
 const q=match(state,r,now).find(x=>x.tutor.id===tutorId);if(!q)throw Error('该同学目前不可匹配，请刷新推荐');
 const o={id:`TC${String(++state.sequence).padStart(4,'0')}`,tutorId,status:'invited',createdAt:now,inviteDeadline:now+24*HOUR,request:clone(r),quote:q,parentResult:null,tutorResult:null,parentPaid:false,tutorPaid:false};state.orders.unshift(o);state.request=clone(r);return o;
}
export function act(state,id,action,role,now){
 expire(state,now);const o=state.orders.find(x=>x.id===id);if(!o)throw Error('未找到试课记录');
 const guard=(status,who)=>{if(o.status!==status||role!==who)throw Error('当前身份或阶段不支持此操作');};
 if(action==='accept'){guard('invited','tutor');o.status='arranging';}
 else if(action==='reject'){guard('invited','tutor');o.status='rejected';}
 else if(action==='cancel'){if(role!=='parent'||!['invited','arranging','accepted'].includes(o.status))throw Error('当前阶段不能取消');o.status='cancelled';}
 else if(action==='confirmTrial'){guard('arranging','parent');o.trial={slot:clone(o.quote.slots[0]),mode:o.quote.mode,place:o.quote.mode==='线上'?'双方商定的视频平台':o.request.location,rate:o.quote.rate,commute:o.quote.commute};o.status='accepted';}
 else if(action==='payTrial'){guard('accepted','parent');o.status='paid';}
 else if(action==='receive'){guard('paid','tutor');o.status='scheduled';}
 else if(action==='finish'){guard('scheduled','tutor');o.status='review';o.finishedAt=now;o.confirmDeadline=now+72*HOUR;}
 else if(action==='success'||action==='fail'){
  if(o.status!=='review'||!['parent','tutor'].includes(role))throw Error('请先完成试课，再确认结果');
  const key=role==='parent'?'parentResult':'tutorResult';if(o[key])throw Error('你已提交结果');o[key]=action;
  if(action==='fail')o.status='failed';
  else if(o.parentResult==='success'&&o.tutorResult==='success'){const t=state.tutors.find(x=>x.id===o.tutorId);o.status='success';t.active=false;t.blocks.push(...clone(o.quote.slots).map(s=>({...s,orderId:o.id})));o.parentFee=Math.round(o.quote.rate/2);o.tutorFee=o.quote.rate;}
 }else if(action==='payService'){if(o.status!=='success'||!['parent','tutor'].includes(role))throw Error('尚未双方确认成功');o[role==='parent'?'parentPaid':'tutorPaid']=true;}
 else throw Error('未知操作');return o;
}
export const statusText={invited:'等待学生回应',arranging:'待确认试课安排',accepted:'待支付试课费',paid:'待学生确认收款',scheduled:'待完成试课',review:'待双方确认',success:'匹配成功',failed:'本次不合适',expired:'邀请已超时',unconfirmed:'结果未确认',rejected:'学生已婉拒',cancelled:'邀请已取消'};
