// Local demonstration only. Authentication, private contacts and atomic claims require a backend.
export const HOUR=3600000;
export const SUBJECTS=['数学','英语','语文','物理','化学','生物','政治','历史','地理'];
export const DAYS=['周一','周二','周三','周四','周五','周六','周日'];
export const PERIODS=['上午','中午','下午','晚上'];
export const clone=value=>JSON.parse(JSON.stringify(value));
export const money=value=>(value/100).toLocaleString('zh-CN',{maximumFractionDigits:2});
export const normalizeEmail=value=>String(value||'').trim().toLowerCase();
export const validEmail=value=>/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@m\.fudan\.edu\.cn$/i.test(String(value||'').trim());
export const slotLabel=value=>{const [day,period]=value.split('-').map(Number);return `${DAYS[day-1]}${PERIODS[period]}`;};
const validSlot=value=>typeof value==='string'&&/^[1-7]-[0-3]$/.test(value);
const activeClaim=claim=>claim.status==='active';
const currentStudent=state=>state.students.find(student=>student.id===state.studentId);

function validateBasics(data){
 if(!Array.isArray(data.subjects)||!data.subjects.length||data.subjects.some(s=>!SUBJECTS.includes(s)))throw Error('请至少选择一门有效科目');
 if(!Array.isArray(data.slots)||!data.slots.length||data.slots.some(s=>!validSlot(s)))throw Error('请至少选择一个上课时段');
 if(![data.low,data.high].every(Number.isInteger)||data.low<16000||data.high<data.low||data.high-data.low>5000)throw Error('课时费最低 160 元，上下限差不超过 50 元');
}
export function createPlatformState(){
 const base={subjects:['数学','物理'],low:23000,high:27000,slots:['3-3','6-2'],gender:'无所谓',status:'open',claimId:null,contactType:'微信',note:'这是模拟需求。希望先沟通孩子的基础，再一起商量具体钟点。',isDemo:true};
 const requests=[
  {...base,id:'p-demo-1',name:'周家长',contact:'DEMO-WECHAT-001'},
  {...base,id:'p-demo-2',name:'林家长',subjects:['英语'],low:22000,high:25000,slots:['6-0','7-2'],gender:'女',contactType:'QQ',contact:'DEMO-QQ-002'},
  {...base,id:'p-demo-3',name:'许家长',subjects:['政治','历史','地理'],low:23000,high:26000,slots:['7-2'],contactType:'电话',contact:'演示号码，无真实电话'}
 ];
 return {version:4,sequence:0,offset:0,studentId:null,parentRequestId:null,demoParentRequestId:null,students:[],requests,claims:[]};
}
export function registerStudent(state,data,now=Date.now()){
 validateBasics(data);
 if(!validEmail(data.email))throw Error('仅支持 @m.fudan.edu.cn 复旦学生邮箱');
 if(data.demoCode!=='2026'||normalizeEmail(data.verifiedEmail)!==normalizeEmail(data.email))throw Error('请先完成当前邮箱的模拟验证');
 if(!['男','女'].includes(data.gender))throw Error('请选择学生性别');
 const email=normalizeEmail(data.email);
 if(state.students.some(s=>s.email===email&&s.active))throw Error('该邮箱已注册，请直接进入学生端');
 const student={id:`s-${++state.sequence}`,email,name:(data.name||'复旦同学').trim().slice(0,12)||'复旦同学',subjects:[...new Set(data.subjects)],slots:[...new Set(data.slots)],low:data.low,high:data.high,gender:data.gender,active:true,createdAt:now,verification:'demo'};
 state.students.push(student);state.studentId=student.id;return student;
}
export function publishRequest(state,data,now=Date.now()){
 validateBasics(data);
 if(!['无所谓','男','女'].includes(data.gender))throw Error('请选择有效的性别要求');
 if(!['微信','QQ','电话'].includes(data.contactType)||!String(data.contact||'').trim()||String(data.contact).length>80)throw Error('请填写微信、QQ 或电话联系方式');
 if(String(data.note||'').length>500)throw Error('想说的话请控制在 500 字以内');
 const old=state.requests.find(r=>r.id===state.parentRequestId);
 if(old?.status==='claimed')throw Error('已有学生联系中，确认结果后再修改需求');
 const request={id:old?.status==='open'?old.id:`p-${++state.sequence}`,name:(data.name||'家长').trim().slice(0,12)||'家长',subjects:[...new Set(data.subjects)],slots:[...new Set(data.slots)],low:data.low,high:data.high,gender:data.gender,contactType:data.contactType,contact:String(data.contact).trim(),note:String(data.note||'').trim(),status:'open',claimId:null,isDemo:false,createdAt:now};
 if(request.id===old?.id)Object.assign(old,request);else state.requests.unshift(request);
 state.parentRequestId=request.id;return request;
}
function fit(student,request){
 if(!student?.active||request.status!=='open')return null;
 if(!request.subjects.every(subject=>student.subjects.includes(subject)))return null;
 if(request.gender!=='无所谓'&&request.gender!==student.gender)return null;
 const commonSlots=request.slots.filter(s=>student.slots.includes(s));
 const low=Math.max(student.low,request.low),high=Math.min(student.high,request.high);
 if(!commonSlots.length||low>high)return null;
 return {low,high,rate:Math.round((low+high)/2),commonSlots};
}
function closeClaim(state,claim,status){
 claim.status=status;
 const request=state.requests.find(r=>r.id===claim.requestId);
 if(request?.claimId===claim.id){request.status='open';request.claimId=null;request.lastResult=status;}
}
export function expireClaims(state,now=Date.now()){
 for(const claim of state.claims)if(activeClaim(claim)&&now>=claim.deadline)closeClaim(state,claim,'expired');
}
export function listRequests(state,now=Date.now()){
 expireClaims(state,now);const student=currentStudent(state);
 if(!student?.active||state.claims.some(c=>activeClaim(c)&&c.studentId===student.id))return [];
 return state.requests.flatMap(request=>{
  const quote=fit(student,request);if(!quote)return [];
  // The coarse list deliberately omits contact details and private notes.
  return [{id:request.id,name:request.name,subjects:clone(request.subjects),slots:clone(request.slots),gender:request.gender,low:request.low,high:request.high,isDemo:request.isDemo,quote}];
 });
}
export function claimRequest(state,requestId,now=Date.now()){
 expireClaims(state,now);const student=currentStudent(state);
 if(!student?.active)throw Error('请先完成学生注册；合作成功后需重新注册接单');
 if(state.claims.some(c=>activeClaim(c)&&c.studentId===student.id))throw Error('请先确认当前家长的联系结果');
 const request=state.requests.find(r=>r.id===requestId);const quote=request&&fit(student,request);
 if(!quote)throw Error('这条需求已被选择或不再符合条件，请刷新匹配池');
 const claim={id:`c-${++state.sequence}`,studentId:student.id,requestId,createdAt:now,deadline:now+12*HOUR,status:'active',studentResult:null,parentResult:null,quote:clone(quote)};
 state.claims.unshift(claim);request.status='claimed';request.claimId=claim.id;return claim;
}
export function contactDetail(state,claimId,now=Date.now()){
 expireClaims(state,now);const claim=state.claims.find(c=>c.id===claimId);
 if(!claim||claim.studentId!==state.studentId||!activeClaim(claim))throw Error('当前联系权限已结束，请返回匹配池');
 return clone(state.requests.find(r=>r.id===claim.requestId));
}
export function confirmContact(state,claimId,role,result,now=Date.now()){
 expireClaims(state,now);const claim=state.claims.find(c=>c.id===claimId);
 if(!claim||!activeClaim(claim))throw Error('这次联系已结束，请查看最新状态');
 if(!['student','parent'].includes(role)||!['yes','no'].includes(result))throw Error('无效的联系结果');
 if(role==='student'&&claim.studentId!==state.studentId)throw Error('请使用本次接单的学生身份');
 if(role==='parent'&&claim.requestId!==state.parentRequestId&&!(claim.requestId===state.demoParentRequestId&&state.requests.find(r=>r.id===claim.requestId)?.isDemo))throw Error('请使用这条需求的家长身份');
 claim[role==='student'?'studentResult':'parentResult']=result;
 if(result==='no'){closeClaim(state,claim,'declined');return claim;}
 if(claim.studentResult==='yes'&&claim.parentResult==='yes'){
  claim.status='success';claim.finishedAt=now;
  const request=state.requests.find(r=>r.id===claim.requestId);request.status='matched';
  const student=state.students.find(s=>s.id===claim.studentId);student.active=false;
 }
 return claim;
}
