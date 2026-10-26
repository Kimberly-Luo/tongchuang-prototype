const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=()=>import('../src/platform.mjs');
const now=Date.UTC(2026,9,26,8);
const studentData={email:'demo@m.fudan.edu.cn',verifiedEmail:'demo@m.fudan.edu.cn',demoCode:'2026',subjects:['数学','物理'],slots:['3-3','6-2'],low:23000,high:27000,gender:'女',name:'演示同学'};
async function setup(){const d=await load(),s=d.createPlatformState();d.registerStudent(s,studentData,now);return {d,s};}
test('student registration only accepts exact m.fudan.edu.cn suffix and the verified email',async()=>{
 const d=await load();
 for(const email of ['demo@fudan.edu.cn','demo@m.fudan.edu.cn.evil.com','demo@sub.m.fudan.edu.cn','@m.fudan.edu.cn','demo m@m.fudan.edu.cn'])assert.throws(()=>d.registerStudent(d.createPlatformState(),{...studentData,email,verifiedEmail:email},now));
 const s=d.createPlatformState();assert.equal(d.registerStudent(s,{...studentData,email:'DEMO@M.FUDAN.EDU.CN'},now).email,'demo@m.fudan.edu.cn');
 assert.throws(()=>d.registerStudent(s,studentData,now));
 assert.throws(()=>d.registerStudent(d.createPlatformState(),{...studentData,verifiedEmail:'other@m.fudan.edu.cn'},now));
});
test('parents are matched by full subject subset, common coarse period, gender and price intersection',async()=>{
 const {d,s}=await setup();assert.deepEqual(d.listRequests(s,now).map(p=>p.id),['p-demo-1']);
 s.students[0].subjects=['数学'];assert.equal(d.listRequests(s,now).length,0);
 s.students[0].subjects=['数学','物理'];s.students[0].slots=['3-2'];assert.equal(d.listRequests(s,now).length,0);
 s.students[0].slots=['3-3'];s.requests[0].gender='男';assert.equal(d.listRequests(s,now).length,0);
 s.requests[0].gender='女';s.students[0].low=27000;s.students[0].high=30000;
 assert.deepEqual(d.listRequests(s,now)[0].quote,{low:27000,high:27000,rate:27000,commonSlots:['3-3']});
 s.students[0].low=27001;assert.equal(d.listRequests(s,now).length,0);
});
test('list hides contact and notes; details require a current authorized active claim',async()=>{
 const {d,s}=await setup();const list=d.listRequests(s,now);assert.ok(!JSON.stringify(list).includes('DEMO-WECHAT'));assert.ok(!('note' in list[0]));
 assert.throws(()=>d.contactDetail(s,'unknown',now));const c=d.claimRequest(s,'p-demo-1',now);
 assert.equal(d.contactDetail(s,c.id,now).contact,'DEMO-WECHAT-001');
 s.studentId='other';assert.throws(()=>d.contactDetail(s,c.id,now));
});
test('parent claim is exclusive, student cannot choose twice, and parent cannot edit while reserved',async()=>{
 const {d,s}=await setup();const c=d.claimRequest(s,'p-demo-1',now);assert.equal(c.deadline,now+12*d.HOUR);
 assert.equal(s.requests[0].status,'claimed');assert.equal(d.listRequests(s,now).length,0);assert.throws(()=>d.claimRequest(s,'p-demo-1',now));
 d.registerStudent(s,{...studentData,email:'other@m.fudan.edu.cn',verifiedEmail:'other@m.fudan.edu.cn'},now);assert.throws(()=>d.claimRequest(s,'p-demo-1',now));
 s.parentRequestId=c.requestId;assert.throws(()=>d.publishRequest(s,{...studentData,contactType:'微信',contact:'DEMO'},now));
});
test('both yes in either order completes matching, removes parent and disables student until re-registration',async()=>{
 for(const order of [['student','parent'],['parent','student']]){
  const {d,s}=await setup();const c=d.claimRequest(s,'p-demo-1',now);s.parentRequestId=c.requestId;
  d.confirmContact(s,c.id,order[0],'yes',now);assert.equal(c.status,'active');assert.equal(s.students[0].active,true);
  d.confirmContact(s,c.id,order[1],'yes',now+1);assert.equal(c.status,'success');assert.equal(s.requests[0].status,'matched');assert.equal(s.students[0].active,false);
  assert.throws(()=>d.claimRequest(s,'p-demo-2',now));assert.throws(()=>d.contactDetail(s,c.id,now));
  const next=d.registerStudent(s,{...studentData,slots:['7-3']},now+2);assert.ok(next.active);assert.notEqual(next.id,c.studentId);assert.deepEqual(next.slots,['7-3']);
 }
});
test('either no releases parent immediately, including after the other side says yes',async()=>{
 for(const role of ['student','parent']){
  const {d,s}=await setup();const c=d.claimRequest(s,'p-demo-1',now);s.parentRequestId=c.requestId;
  d.confirmContact(s,c.id,role==='student'?'parent':'student','yes',now);
  d.confirmContact(s,c.id,role,'no',now+1);assert.equal(c.status,'declined');assert.equal(s.requests[0].status,'open');assert.ok(s.students[0].active);
  assert.equal(d.listRequests(s,now+1).length,1);assert.throws(()=>d.confirmContact(s,c.id,'parent','yes',now+2));
  const next=d.claimRequest(s,'p-demo-1',now+2);assert.equal(next.parentResult,null);assert.equal(next.studentResult,null);
 }
});
test('at exactly 12h a one-sided yes expires and stale confirmation cannot finish or release a new claim',async()=>{
 const {d,s}=await setup();const c=d.claimRequest(s,'p-demo-1',now);s.parentRequestId=c.requestId;d.confirmContact(s,c.id,'student','yes',now);
 d.expireClaims(s,now+12*d.HOUR-1);assert.equal(c.status,'active');
 assert.throws(()=>d.confirmContact(s,c.id,'parent','yes',now+12*d.HOUR));assert.equal(c.status,'expired');assert.equal(s.requests[0].status,'open');
 const next=d.claimRequest(s,'p-demo-1',now+12*d.HOUR+1);assert.throws(()=>d.confirmContact(s,c.id,'parent','no',now+12*d.HOUR+2));assert.equal(s.requests[0].claimId,next.id);
});
test('published parent request keeps contact private and unrelated parent cannot confirm',async()=>{
 const {d,s}=await setup();const p=d.publishRequest(s,{...studentData,name:'测试家长',gender:'无所谓',contactType:'QQ',contact:'FAKE-ONLY',note:'PRIVATE-NOTE'},now);
 assert.equal(p.status,'open');assert.equal(s.parentRequestId,p.id);const coarse=d.listRequests(s,now).find(x=>x.id===p.id);assert.ok(coarse);assert.ok(!('contact' in coarse));assert.ok(!('note' in coarse));
 const c=d.claimRequest(s,p.id,now);s.parentRequestId='unrelated';s.demoParentRequestId=p.id;assert.throws(()=>d.confirmContact(s,c.id,'parent','yes',now));
});
test('validation rejects missing contact, empty subjects or periods, malformed periods and invalid prices',async()=>{
 const d=await load();const p={...studentData,gender:'无所谓',contactType:'电话',contact:'DEMO-PHONE'};
 for(const change of [{subjects:[]},{slots:[]},{slots:['8-3']},{slots:['3-4']},{slots:['3-03']},{low:NaN},{low:15999},{low:23000,high:29000},{contact:''},{contactType:'邮件'},{note:'x'.repeat(501)}])assert.throws(()=>d.publishRequest(d.createPlatformState(),{...p,...change},now));
});
test('unregistered students cannot list or claim; demo parent mode only works on seeded demo requests',async()=>{
 const d=await load(),s=d.createPlatformState();assert.equal(d.listRequests(s,now).length,0);assert.throws(()=>d.claimRequest(s,'p-demo-1',now));
 d.registerStudent(s,studentData,now);const c=d.claimRequest(s,'p-demo-1',now);assert.throws(()=>d.confirmContact(s,c.id,'parent','yes',now));
 s.demoParentRequestId=c.requestId;d.confirmContact(s,c.id,'parent','yes',now);assert.equal(c.parentResult,'yes');
});
