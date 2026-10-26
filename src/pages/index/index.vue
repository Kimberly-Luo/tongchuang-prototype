<script setup>
import {computed,onUnmounted,reactive,ref} from 'vue';
import ChoiceGroup from '../../components/ChoiceGroup.vue';
import WeeklyPeriods from '../../components/WeeklyPeriods.vue';
import {HOUR,SUBJECTS,clone,money,slotLabel,normalizeEmail,validEmail,createPlatformState,registerStudent,publishRequest,listRequests,claimRequest,contactDetail,confirmContact,expireClaims} from '../../platform.mjs';
const storageKey='tongchuang-platform-v4';
let saved;
try{saved=uni.getStorageSync(storageKey);if(saved?.version!==4||!Array.isArray(saved.students)||!Array.isArray(saved.requests)||!Array.isArray(saved.claims))saved=null;}catch{saved=null;}
const state=reactive(saved||createPlatformState());
const page=ref('home'),message=ref(''),error=ref(''),registerStep=ref(0),demoParent=ref(false),clock=ref(Date.now());
const student=computed(()=>state.students.find(s=>s.id===state.studentId));
const currentClaim=computed(()=>state.claims.find(c=>c.studentId===state.studentId&&c.status==='active'));
const lastClaim=computed(()=>state.claims.find(c=>c.studentId===state.studentId));
const parentRequest=computed(()=>state.requests.find(r=>r.id===(demoParent.value?state.demoParentRequestId:state.parentRequestId)));
const parentClaim=computed(()=>state.claims.find(c=>c.id===parentRequest.value?.claimId));
const parents=computed(()=>listRequests(state,clock.value+state.offset));
const activeDetail=computed(()=>{if(!currentClaim.value)return null;try{return contactDetail(state,currentClaim.value.id,clock.value+state.offset);}catch{return null;}});
const studentForm=reactive({email:'',demoCode:'',verifiedEmail:'',name:'',subjects:[],slots:[],low:230,high:270,gender:'女'});
const parentForm=reactive({name:'',subjects:[],slots:[],low:230,high:270,gender:'无所谓',contactType:'微信',contact:'',note:''});
const now=()=>clock.value+state.offset;
function persist(){try{uni.setStorageSync(storageKey,clone(state));}catch{throw Error('本机保存失败，请保持页面打开并检查浏览器存储设置');}}
function notify(text){message.value=text;error.value='';}
function run(fn){message.value='';error.value='';try{fn();persist();}catch(e){error.value=e.message;}}
function go(to){page.value=to;message.value='';error.value='';uni.pageScrollTo({scrollTop:0,duration:0});}
function showSuccessNotice(){const claim=lastClaim.value;if(claim?.status==='success'&&!claim.studentNotified){claim.studentNotified=true;uni.showModal({title:'本次接单已完成',content:'家长需求已移出匹配池。下次接单请重新注册，并重新选择科目和可授课时间。',showCancel:false,confirmText:'知道了'});persist();}}
function enterStudent(){go(student.value?'student-list':'student-register');showSuccessNotice();}
function enterParent(){demoParent.value=false;go(parentRequest.value?'parent-status':'parent-form');}
function sendCode(){error.value='';if(!validEmail(studentForm.email)){error.value='邮箱后缀只支持 @m.fudan.edu.cn';return;}studentForm.verifiedEmail=normalizeEmail(studentForm.email);studentForm.demoCode='2026';notify('模拟验证码 2026 已填入，没有发送真实邮件。');}
function verifyEmail(){error.value='';if(!validEmail(studentForm.email)||studentForm.demoCode!=='2026'||normalizeEmail(studentForm.email)!==studentForm.verifiedEmail){error.value='请先获取当前邮箱的模拟验证码';return;}registerStep.value=1;message.value='';uni.pageScrollTo({scrollTop:0,duration:0});}
function signup(){run(()=>{registerStudent(state,{...clone(studentForm),low:Math.round(Number(studentForm.low)*100),high:Math.round(Number(studentForm.high)*100)},now());go('student-list');notify('模拟注册完成。以下是与你的科目、时段和报价匹配的家长需求。');});}
function registerAgain(){Object.assign(studentForm,{email:student.value?.email||'',demoCode:'',verifiedEmail:'',name:'',subjects:[],slots:[],low:230,high:270,gender:student.value?.gender||'女'});registerStep.value=0;go('student-register');}
function publish(){run(()=>{publishRequest(state,{...clone(parentForm),low:Math.round(Number(parentForm.low)*100),high:Math.round(Number(parentForm.high)*100)},now());demoParent.value=false;go('parent-status');notify('需求已进入本机匹配池，等待合适的学生选择。');});}
function editParent(){const r=parentRequest.value;if(!r||r.isDemo)return;Object.assign(parentForm,{...clone(r),low:r.low/100,high:r.high/100});go('parent-form');}
function chooseParent(id){run(()=>{claimRequest(state,id,now());go('student-contact');notify('已为你保留这条需求 12 小时，请主动联系家长并由双方分别确认。');});}
function respond(role,result){run(()=>{const claim=role==='student'?currentClaim.value:parentClaim.value;if(!claim)throw Error('没有待确认的联系');confirmContact(state,claim.id,role,result,now());go(role==='student'?'student-list':'parent-status');notify(claim.status==='success'?'双方已联系好。家长需求已移出匹配池，学生本次接单结束。':claim.status==='declined'?'已结束这次联系，家长需求已退回匹配池。':'已记录“联系好了”，仍需另一方在 12 小时内确认。');if(role==='student'&&claim.status==='success')showSuccessNotice();});}
function showDemoParent(){state.demoParentRequestId=currentClaim.value?.requestId;demoParent.value=true;run(()=>go('parent-status'));}
function remain(claim){const seconds=Math.max(0,Math.ceil((claim.deadline-now())/1000));return `${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
function refreshExpiry(){clock.value=Date.now();const before=state.claims.filter(c=>c.status==='active').length;expireClaims(state,now());if(before!==state.claims.filter(c=>c.status==='active').length){run(()=>{if(page.value==='student-contact')go('student-list');notify('12 小时内双方未同时确认，需求已退回匹配池。');});}}
function advance(){state.offset+=13*HOUR;refreshExpiry();run(()=>notify('演示时钟已推进 13 小时；超时联系会退回匹配池。'));}
function resetDemo(){uni.showModal({title:'重置本机体验',content:'清空此浏览器的新版本模拟注册、需求和联系记录？',confirmText:'重置',success:r=>{if(r.confirm){Object.assign(state,createPlatformState());demoParent.value=false;registerStep.value=0;Object.assign(studentForm,{email:'',demoCode:'',verifiedEmail:'',name:'',subjects:[],slots:[],low:230,high:270,gender:'女'});Object.assign(parentForm,{name:'',subjects:[],slots:[],low:230,high:270,gender:'无所谓',contactType:'微信',contact:'',note:''});run(()=>go('home'));}}});}
refreshExpiry();const timer=setInterval(refreshExpiry,1000);onUnmounted(()=>clearInterval(timer));
</script>

<template>
 <view class="platform-app">
  <view class="p-demo">流程初版 · 本机模拟 <text>邮箱与联系方式均为演示</text></view>
  <view class="p-header"><button class="p-brand" @tap="go('home')">同窗</button><button v-if="page!=='home'" class="p-link" @tap="go('home')">切换身份 ↗</button><text v-else class="p-caption">复旦学生 · 家长需求平台</text></view>
  <view class="p-main">
   <view v-if="error" class="p-alert p-alert-error" role="alert">{{error}}<button class="p-link" @tap="error=''">关闭</button></view>
   <view v-if="message" class="p-alert" role="status">{{message}}<button class="p-link" @tap="message=''">关闭</button></view>
   <template v-if="page==='home'">
    <view class="p-intro"><text class="p-eyebrow">从你的身份开始</text><text class="p-title">同窗，连接所需。</text><text class="p-copy">家长发布需求，复旦学生主动联系。具体上课时间和合作细节，由你们一起商量。</text></view>
    <button class="role-entry role-student" @tap="enterStudent"><view><text class="role-title">我是学生</text><text class="role-copy">校园邮箱注册 · 查看匹配的家长需求</text></view><text class="role-arrow">↗</text></button>
    <button class="role-entry" @tap="enterParent"><view><text class="role-title">我是家长</text><text class="role-copy">直接填写要求 · 留下联系方式</text></view><text class="role-arrow">↗</text></button>
    <view class="p-panel p-muted-panel"><text class="p-section-title">先连接，再共同决定</text><text class="p-copy">学生选中需求后保留 12 小时。只有双方都点“联系好了”，才会结束本次匹配；任一方未联系好或超时，需求重新开放。</text></view>
    <text class="p-hint">当前仅本机保存，其他手机不会同步。请使用虚构资料；本版没有真实邮件、付款或在线交易。</text>
   </template>
   <template v-else-if="page==='student-register'">
    <button class="p-link p-back" @tap="registerStep?registerStep=0:go('home')">← {{registerStep?'返回邮箱验证':'返回身份选择'}}</button>
    <view class="p-intro"><text class="p-eyebrow">学生端 · {{registerStep?'02 授课资料':'01 校园邮箱'}}</text><text class="p-title">{{registerStep?'告诉我们你的擅长':'用复旦学生邮箱开始'}}</text><text class="p-copy">{{registerStep?'完成后就可以查看匹配的家长需求。':'邮箱后缀限定为 @m.fudan.edu.cn。本版仅模拟验证。'}}</text></view>
    <view v-if="!registerStep" class="p-panel">
     <label class="p-label">复旦学生邮箱</label><input v-model="studentForm.email" class="p-input" placeholder="name@m.fudan.edu.cn" maxlength="100"/>
     <view class="p-code-row"><input v-model="studentForm.demoCode" class="p-input" placeholder="演示验证码" maxlength="4"/><button class="p-secondary" @tap="sendCode">获取模拟验证码</button></view>
     <text class="p-hint">仅演示校园邮箱流程；未连接邮件服务，也不代表真实在校认证。</text><button class="p-primary" @tap="verifyEmail">下一步，填写授课信息</button>
    </view>
    <view v-else class="p-panel">
     <text class="p-hint">注册邮箱：{{studentForm.email}}</text>
     <label class="p-label">称呼（选填）</label><input v-model="studentForm.name" class="p-input" placeholder="例如：陈同学" maxlength="12"/>
     <label class="p-label">可授课科目 · 多选</label><ChoiceGroup v-model="studentForm.subjects" :options="SUBJECTS" multiple :columns="3"/>
     <label class="p-label">可授课时段 · 多选</label><WeeklyPeriods v-model="studentForm.slots"/><text class="p-hint">上午、中午、下午、晚上为粗时段，具体几点由双方联系后商定。</text>
     <label class="p-label">每小时课时费范围（元）</label><view class="p-prices"><input v-model="studentForm.low" class="p-input" type="digit" aria-label="学生最低课时费"/><text>至</text><input v-model="studentForm.high" class="p-input" type="digit" aria-label="学生最高课时费"/></view><text class="p-hint">最低 160 元，区间跨度不超过 50 元；也可以填写相同金额。</text>
     <label class="p-label">你的性别</label><ChoiceGroup v-model="studentForm.gender" :options="['女','男']" :columns="2"/>
     <button class="p-primary" @tap="signup">完成模拟注册，查看家长需求</button>
    </view>
   </template>
   <template v-else-if="page==='student-list'">
    <view class="p-intro"><text class="p-eyebrow">学生端 · {{student?.name||'复旦同学'}}</text><text class="p-title">{{student?.active?'合适的家长需求':'本次接单已完成'}}</text><text class="p-copy">{{student?.active?'先看科目、报价和时段。选择后进入家长详情，查看联系方式和留言。':'双方已确认联系好。家长信息已移出匹配池；下次接单需要重新注册并重新选择授课时段。'}}</text></view>
    <view v-if="!student?.active" class="p-panel"><text class="p-section-title">下次接单，重新填写可授课时间</text><text class="p-copy">沿用邮箱也需要重新完成模拟注册，本次资料不会自动用于下一单。</text><button class="p-primary" @tap="registerAgain">重新注册接单</button></view>
    <template v-else>
     <view class="p-profile-summary"><text>{{student.subjects.join('、')}} · {{student.gender}} · ¥{{money(student.low)}}–{{money(student.high)}} / 小时</text><text>{{student.slots.map(slotLabel).join('、')}}</text></view>
     <view v-if="currentClaim" class="p-panel"><text class="p-status">联系中 · 还剩 {{remain(currentClaim)}}</text><text class="p-section-title">有一位家长正在等待联系结果</text><text class="p-copy">你：{{currentClaim.studentResult==='yes'?'已点联系好了':'尚未确认'}} · 家长：{{currentClaim.parentResult==='yes'?'已点联系好了':'尚未确认'}}</text><button class="p-primary" @tap="go('student-contact')">继续查看家长详情</button></view>
     <template v-else>
      <text v-if="lastClaim?.status==='expired'||lastClaim?.status==='declined'" class="p-hint">上次联系{{lastClaim.status==='expired'?'已超时':'未达成一致'}}，家长需求已退回匹配池。</text>
      <view v-for="p in parents" :key="p.id" class="p-panel parent-card">
       <view class="p-card-head"><text class="p-section-title">{{p.name}}</text><text class="p-badge">{{p.isDemo?'模拟需求':'待联系'}}</text></view>
       <text class="p-card-subjects">{{p.subjects.join('、')}}</text><text class="p-copy">预算 ¥{{money(p.low)}}–{{money(p.high)}} / 小时 · 性别要求：{{p.gender}}</text>
       <view class="p-tags"><text v-for="slot in p.slots" :key="slot" :class="['p-tag',{'p-tag-match':p.quote.commonSlots.includes(slot)}]">{{slotLabel(slot)}}</text></view>
       <text class="p-hint">共同报价 ¥{{money(p.quote.low)}}–{{money(p.quote.high)}} / 小时 · {{p.quote.commonSlots.map(slotLabel).join('、')}}</text>
       <button class="p-primary" @tap="chooseParent(p.id)">选择并查看家长详情</button><text class="p-hint">点击后保留 12 小时；联系方式与留言仅在详情显示。</text>
      </view>
      <view v-if="!parents.length" class="p-panel p-empty"><text class="p-section-title">暂时没有合适的需求</text><text class="p-copy">需要同时满足科目覆盖、性别要求、共同粗时段和课时费交集。可以先让家长发布一条符合条件的模拟需求。</text><button class="p-secondary" @tap="enterParent">切换到家长端</button></view>
     </template>
    </template>
   </template>
   <template v-else-if="page==='student-contact'">
    <button class="p-link p-back" @tap="go('student-list')">← 返回学生端</button>
    <template v-if="currentClaim&&activeDetail">
     <view class="p-intro"><text class="p-eyebrow">家长详情 · 主动联系</text><text class="p-title">{{activeDetail.name}}</text><text class="p-status">联系保留中 · 还剩 {{remain(currentClaim)}}</text></view>
     <view class="p-panel"><text class="p-section-title">{{activeDetail.subjects.join('、')}}</text><text class="p-copy">性别要求：{{activeDetail.gender}} · 预算 ¥{{money(activeDetail.low)}}–{{money(activeDetail.high)}} / 小时</text><text class="p-copy">共同可上课时段：{{currentClaim.quote.commonSlots.map(slotLabel).join('、')}}</text><text class="p-copy">共同报价 ¥{{money(currentClaim.quote.low)}}–{{money(currentClaim.quote.high)}} / 小时，具体钟点和最终价格请双方协商。</text></view>
     <view class="p-panel contact-card"><text class="p-label">{{activeDetail.contactType}}联系方式</text><text class="contact-value" selectable>{{activeDetail.contact}}</text><text v-if="activeDetail.isDemo" class="p-hint">此为模拟信息，没有真实家长可以联系。</text><text class="p-label">家长想说的话</text><text class="p-note" selectable>{{activeDetail.note||'家长暂未留言。'}}</text></view>
     <view class="fee-placeholder"><text class="p-section-title">收费提示（预留）</text><text class="p-copy">这里等待你提供正式提示内容。当前未设置收费金额，也不会发起付款。</text></view>
     <view class="p-panel"><text class="p-section-title">联系结果</text><text class="p-copy">你：{{currentClaim.studentResult==='yes'?'已点联系好了':'尚未确认'}} · 家长：{{currentClaim.parentResult==='yes'?'已点联系好了':'尚未确认'}}</text><text class="p-hint">双方都需在期限内点击联系好了；任一方没联系好或超时，需求退回。</text><view class="p-confirm"><button class="p-secondary" @tap="respond('student','no')">没联系好</button><button class="p-primary" @tap="respond('student','yes')">联系好了</button></view></view>
     <button v-if="activeDetail.isDemo" class="p-link p-demo-switch" @tap="showDemoParent">体验这位家长的确认视角 →</button>
    </template>
    <view v-else class="p-panel"><text class="p-copy">这次联系已结束，请返回学生端查看最新状态。</text><button class="p-primary" @tap="go('student-list')">返回学生端</button></view>
   </template>
   <template v-else-if="page==='parent-form'">
    <button class="p-link p-back" @tap="parentRequest?enterParent():go('home')">← {{parentRequest?'返回家长端':'返回身份选择'}}</button>
    <view class="p-intro"><text class="p-eyebrow">家长端 · 直接发布需求</text><text class="p-title">把你的要求留下来</text><text class="p-copy">无需校园邮箱注册。学生先看到粗要求，选择后进入详情查看联系方式与留言。</text></view>
    <view class="p-panel">
     <label class="p-label">称呼（选填）</label><input v-model="parentForm.name" class="p-input" placeholder="例如：王家长" maxlength="12"/>
     <label class="p-label">需要辅导的科目 · 多选</label><ChoiceGroup v-model="parentForm.subjects" :options="SUBJECTS" multiple :columns="3"/>
     <label class="p-label">可以上课的时段 · 多选</label><WeeklyPeriods v-model="parentForm.slots"/><text class="p-hint">有任一共同粗时段即可匹配，具体几点请与学生商量。</text>
     <label class="p-label">每小时课时费预算（元）</label><view class="p-prices"><input v-model="parentForm.low" class="p-input" type="digit" aria-label="家长最低课时费"/><text>至</text><input v-model="parentForm.high" class="p-input" type="digit" aria-label="家长最高课时费"/></view><text class="p-hint">最低 160 元，区间跨度不超过 50 元；实际报价须处于双方交集。</text>
     <label class="p-label">对学生的性别要求</label><ChoiceGroup v-model="parentForm.gender" :options="['无所谓','女','男']" :columns="3"/>
     <label class="p-label">联系方式类型</label><ChoiceGroup v-model="parentForm.contactType" :options="['微信','QQ','电话']" :columns="3"/>
     <label class="p-label">{{parentForm.contactType}}联系方式</label><input v-model="parentForm.contact" class="p-input" placeholder="演示版请填写虚构联系方式" maxlength="80"/>
     <label class="p-label">想说的话（选填）</label><textarea v-model="parentForm.note" class="p-textarea" placeholder="孩子的基础、辅导重点，或你想提前沟通的事情" maxlength="500"/><text class="p-hint">{{parentForm.note.length}} / 500 · 留言不会出现在粗要求列表中。</text>
     <button class="p-primary" @tap="publish">发布模拟需求</button>
    </view>
   </template>
   <template v-else-if="page==='parent-status'">
    <view class="p-intro"><text class="p-eyebrow">家长端{{demoParent?' · 演示确认视角':''}}</text><text class="p-title">{{parentRequest?.status==='matched'?'已经联系好了':parentRequest?.status==='claimed'?'有学生选择了你的需求':'你的需求已发布'}}</text></view>
    <view v-if="parentRequest?.status==='matched'" class="p-panel"><text class="p-section-title">双方确认，本次匹配结束</text><text class="p-copy">你的需求已从匹配池移除。学生下次接单需要重新注册并选择时间。</text><button class="p-secondary" @tap="enterStudent">查看学生端提示</button></view>
    <view v-else-if="parentRequest" class="p-panel">
     <text class="p-section-title">{{parentRequest.name}} · {{parentRequest.subjects.join('、')}}</text><text class="p-copy">预算 ¥{{money(parentRequest.low)}}–{{money(parentRequest.high)}} / 小时 · 性别要求：{{parentRequest.gender}}</text><view class="p-tags"><text v-for="slot in parentRequest.slots" :key="slot" class="p-tag">{{slotLabel(slot)}}</text></view>
     <template v-if="parentClaim?.status==='active'"><text class="p-status">等待双方确认 · 还剩 {{remain(parentClaim)}}</text><text class="p-copy">{{state.students.find(s=>s.id===parentClaim.studentId)?.name}}正在联系你。</text><text class="p-copy">你：{{parentClaim.parentResult==='yes'?'已点联系好了':'尚未确认'}} · 学生：{{parentClaim.studentResult==='yes'?'已点联系好了':'尚未确认'}}</text><text class="p-hint">双方在 12 小时内都点联系好了才结束；只要一方点没联系好，或到期未同时确认，就退回匹配池。</text><view class="p-confirm"><button class="p-secondary" @tap="respond('parent','no')">没联系好</button><button class="p-primary" @tap="respond('parent','yes')">联系好了</button></view></template>
     <template v-else><text class="p-status">{{parentRequest.lastResult?'上次联系未完成，已重新开放':'匹配池中 · 等待学生主动联系'}}</text><text class="p-copy">联系方式和留言仅在学生选择后的家长详情页展示。</text><button v-if="!parentRequest.isDemo" class="p-secondary" @tap="editParent">修改需求</button></template>
    </view>
    <view v-else class="p-panel"><text class="p-copy">还没有发布需求。</text><button class="p-primary" @tap="go('parent-form')">填写家长需求</button></view>
    <button v-if="demoParent" class="p-link p-demo-switch" @tap="enterStudent">返回学生视角 →</button>
   </template>
   <view class="p-tools"><text class="p-hint">同窗流程初版 · 本机体验，非真实交易</text><view><button v-if="state.claims.some(c=>c.status==='active')" class="p-link" @tap="advance">演示：推进 13 小时</button><button class="p-link" @tap="resetDemo">重置本机体验</button></view></view>
  </view>
 </view>
</template>
