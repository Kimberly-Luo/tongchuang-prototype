<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { gsap } from 'gsap';
import RequestForm from '../../components/RequestForm.vue';
import AppTabs from '../../components/AppTabs.vue';
import TutorOnboarding from '../../components/TutorOnboarding.vue';
import { createState, initialRequest, migrateState, match, diagnose, invite, act, addDemoTutor, expire, clone, money, subjectText, slotText, statusText, HOUR, activeOrder } from '../../domain.mjs';
const storageKey='tongchuang-v01';
let saved;
try { saved=uni.getStorageSync(storageKey); if(saved?.version===1)saved=migrateState(saved);if(saved && (saved.version!==2 || !Array.isArray(saved.tutors) || !Array.isArray(saved.orders))) saved=null; } catch { saved=null; }
const state=reactive(saved||createState());
const form=reactive(clone(state.request));
const page=ref('request'), role=ref('parent'), results=ref([]), detail=ref(null), notice=ref(''), error=ref(''), showTools=ref(false);
const currentTutorId=ref('t1');
const clock=ref(Date.now());
const appRoot=ref(null);
let motionContext, viewTween;
const now=()=>clock.value+state.offset;
const currentTutor=computed(()=>state.tutors.find(t=>t.id===currentTutorId.value));
const orders=computed(()=>role.value==='parent'?state.orders:state.orders.filter(o=>o.tutorId===currentTutorId.value));
const diagnostics=computed(()=>results.value.length?[]:diagnose(state,form,now()));
const save=()=>{try{uni.setStorageSync(storageKey,clone(state));}catch{error.value='本地保存失败，请保持页面打开；刷新后可能丢失进度。';}};
const tick=setInterval(()=>{clock.value=Date.now();const prev=state.orders.map(o=>o.status).join();expire(state,now());if(prev!==state.orders.map(o=>o.status).join())save();},15000);
function motionScope(){return appRoot.value?.$el||appRoot.value;}
function prefersReducedMotion(){return typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
async function revealView(){
 await nextTick();
 const scope=motionScope();
 if(!scope||prefersReducedMotion()||typeof scope.querySelector!=='function')return;
 const screen=scope.querySelector('.motion-enter');
 if(!screen)return;
 const pieces=screen.children?.length?[...screen.children].slice(0,8):[screen];
 viewTween?.kill();
 viewTween=gsap.fromTo(pieces,{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.62,stagger:.055,ease:'power3.out',clearProps:'transform,opacity,visibility'});
}
onMounted(()=>{
 const scope=motionScope();
 if(scope&&!prefersReducedMotion()){
  motionContext=gsap.context(()=>{
   gsap.from('.motion-strip',{autoAlpha:0,y:-10,duration:.42,ease:'power2.out'});
   gsap.from('.motion-brand',{autoAlpha:0,x:-18,duration:.7,ease:'power3.out',delay:.08});
   gsap.from('.motion-info',{autoAlpha:0,x:14,duration:.7,ease:'power3.out',delay:.12});
  },scope);
 }
 revealView();
});
watch(page,()=>revealView());
onUnmounted(()=>{clearInterval(tick);viewTween?.kill();motionContext?.revert();});
expire(state,now());
function run(fn){error.value='';notice.value='';try{fn();save();}catch(e){error.value=e.message;}}
function go(to){page.value=to;error.value='';notice.value='';detail.value=null; if(to==='student')role.value='tutor';if(to==='request'||to==='results')role.value='parent';uni.pageScrollTo({scrollTop:0,duration:150});}
function find(){run(()=>{results.value=match(state,form,now());state.request=clone(form);go('results');});}
function select(c){run(()=>{const o=invite(state,form,c.tutor.id,now());currentTutorId.value=o.tutorId;detail.value=null;go('orders');notice.value='邀请已发送。可切换学生视角，体验接受试课。';});}
async function action(o,type){run(()=>{act(state,o.id,type,role.value,now());notice.value=({accept:'已接受邀请，联系方式已模拟解锁；请由家长确认试课安排。',confirmTrial:'试课时间、方式和费用快照已确认。',payTrial:'已模拟家长付款，切换学生视角确认收款。',receive:'已模拟确认收款，可以体验完成试课。',finish:'已模拟试课结束，请双方分别确认结果。',success:'你的结果已记录。只有双方成功才产生服务费。',fail:'已结束本次匹配，不收平台服务费。',payService:'模拟结算已完成，没有实际扣款。'})[type]||'状态已更新';});await nextTick();uni.pageScrollTo({scrollTop:0,duration:220});}
function switchRole(v){role.value=v;if(v==='tutor'&&state.orders[0])currentTutorId.value=state.orders[0].tutorId;}
function left(deadline){const mins=Math.max(0,Math.ceil((deadline-now())/60000));return `${Math.floor(mins/60)} 小时 ${mins%60} 分钟`;}
function demoAdvance(h){run(()=>{state.offset+=h*HOUR;expire(state,now());notice.value=`演示时间已推进 ${h} 小时`;});}
function reset(){uni.showModal({title:'重置体验数据',content:'仅清空此设备的模拟需求和试课记录。',confirmText:'重置',success:r=>{if(r.confirm){Object.assign(state,createState());Object.assign(form,initialRequest());results.value=[];go('request');save();}}});}
function resume(){run(()=>{const t=currentTutor.value;if(state.orders.some(o=>o.tutorId===t.id&&activeOrder(o)))throw Error('当前试课尚未结束，请先完成流程');if(t.verifiedUntil<now())throw Error('请先完成模拟年度复验');t.active=!t.active;notice.value=t.active?'已重新接单，成功课次仍保持占用。':'已暂停接单';});}
function renew(){run(()=>{currentTutor.value.verifiedUntil=new Date(new Date(now()).getFullYear()+1,8,30,23,59).getTime();notice.value='已模拟 9 月邮箱复验；未发送真实邮件。';});}
function releaseBlock(orderId){run(()=>{currentTutor.value.blocks=currentTutor.value.blocks.filter(b=>b.orderId!==orderId);notice.value='该合作的固定时间已释放';});}
function applySuggestion(type){if(type==='try_online'){form.mode='均可';find();return;}if(type==='relax_gender'){form.gender='无所谓';find();return;}go('request');notice.value=type==='edit_time'?'请在第二步增加每次课的备选时间。':type==='edit_budget'?'请在第三步调整预算。':'请调整科目后重新匹配。';}
function completeOnboarding(profile){run(()=>{const t=addDemoTutor(state,profile,now());currentTutorId.value=t.id;role.value='tutor';go('student');notice.value='模拟审核已通过，资料已加入本机匹配池。';});}
function resultText(x){return x==='success'?'已确认成功':x==='fail'?'不继续合作':'尚未确认';}
function step(o){return ({invited:0,arranging:1,accepted:1,paid:1,scheduled:2,review:3,success:4})[o.status]??0;}
</script>

<template>
 <view ref="appRoot" class="app">
  <view class="demo-strip motion-strip"><text>DEMO / 体验版</text><text>人物、认证与付款均为模拟</text></view>
  <view class="header">
   <view class="brand motion-brand" @tap="go('request')"><view class="brand-seal">同</view><view><text class="brand-name">同窗</text><text class="brand-caption">TONGCHUANG · SHANGHAI</text></view></view>
   <view class="desktop-nav"><button :class="{selected:page==='request'||page==='results'}" @tap="go('request')">找家教</button><button :class="{selected:page==='orders'}" @tap="go('orders')">我的试课<text v-if="state.orders.length" class="count">{{state.orders.length}}</text></button><button :class="{selected:page==='student'||page==='onboarding'}" @tap="go('student')">学生工作台</button></view>
   <button class="explain motion-info" @tap="go('about')"><text>INFO</text><t-icon name="arrow-right-up" size="16" /></button>
  </view>

  <view class="main">
   <view v-if="error" class="message error" role="alert"><t-icon name="error-circle" size="18" />{{error}}<button @tap="error=''">关闭</button></view>
   <view v-if="notice" class="message" role="status"><t-icon name="check-circle" size="18" />{{notice}}<button @tap="notice=''">关闭</button></view>

   <RequestForm v-if="page==='request'" class="motion-enter" :form="form" @submit="find" @about="go('about')" />

   <view v-else-if="page==='results'" class="view-screen motion-enter">
    <button class="back" @tap="go('request')">← 修改需求</button><view class="intro tight"><view><text class="eyebrow">推荐同学</text><text class="title">{{results.length?'认识几位合适的同学':'暂时没有完全合适的同学'}}</text><text class="subtitle">{{form.grade}} · {{subjectText(form)}} · 每周 {{form.sessions.length}} 次 · 预算 ¥{{money(form.budgetMin)}}–{{money(form.budgetMax)}} / 小时</text></view><t-tag theme="primary" variant="light">{{results.length}} 位可选</t-tag></view>
    <view class="results-layout"><view class="result-list">
     <view v-if="!results.length" class="panel empty"><t-icon name="search" size="48"/><text class="section-title">这次卡在了这里</text><view v-for="d in diagnostics" :key="d.code" class="diagnostic"><text class="diagnostic-title">{{d.title}}</text><text class="small">{{d.detail}}</text><button v-if="!['wait'].includes(d.action)" class="diagnostic-action" @tap="applySuggestion(d.action)">{{d.action==='try_online'?'同时看看线上':d.action==='relax_gender'?'取消性别偏好':'去调整需求'}}</button></view><t-button theme="primary" @click="go('request')">返回修改需求</t-button><text class="hint">系统不会降低认证、科目、时间或预算条件来凑人数。两人拆单仍在后续开发范围。</text></view>
     <view v-for="(c,ci) in results" :key="c.tutor.id" class="tutor-card panel"><view class="card-top"><view class="avatar" :class="c.tutor.color">{{c.tutor.letter}}</view><view class="person"><view class="name-row"><text class="person-name">{{c.tutor.name}}</text><t-tag v-if="ci===0" size="small" theme="primary" variant="light">优先推荐</t-tag></view><text class="small">复旦大学 · {{c.tutor.major}} · {{c.tutor.year}}</text></view><text class="mock-label">模拟人物</text></view><text class="bio">{{c.tutor.style}}</text><view class="reason"><t-icon name="check-circle" size="17"/><text>覆盖 {{form.subjects.length}} 门科目与每周全部 {{c.slots.length}} 次课 · {{c.mode}}</text></view><view class="tags"><text v-for="s in c.slots" :key="s.day+'-'+s.start" class="time-chip">{{slotText(s)}}</text></view><view class="price-row"><view><text class="price">¥{{money(c.rate)}}<text class="price-unit"> / 小时</text></text><text class="small">基础时薪 · 通勤 {{c.commute?'¥'+money(c.commute)+' / 次':'无需补贴'}}</text></view><view class="card-actions"><t-button variant="text" theme="primary" @click="detail=c">了解同学</t-button><t-button theme="primary" @click="select(c)">邀请试课</t-button></view></view></view>
    </view><view class="aside"><view class="panel summary"><text class="section-title">这次匹配的依据</text><view class="summary-row"><text>教学条件</text><text>{{form.grade}} · {{subjectText(form)}}</text></view><view class="summary-row"><text>费用范围</text><text>每节含通勤均在预算内</text></view><view class="summary-row"><text>时间安排</text><text>同一同学覆盖全部科目与课次</text></view><text class="hint">价格为共同可成交范围内的建议值。体验版邀请时按该值锁定，实际版本需双方确认。</text><view class="line"/><text class="small">校园邮箱验证不能单独证明仍在校。真实版本需要补充在校核验；此处认证与经历均为模拟。</text></view></view></view>
   </view>

   <view v-else-if="page==='orders'" class="view-screen motion-enter">
    <view class="intro tight"><view><text class="eyebrow">试课记录</text><text class="title">我的试课</text><text class="subtitle">从发出邀请，到一起确认下一步。</text></view><view class="role-switch"><button :class="{active:role==='parent'}" @tap="switchRole('parent')">家长视角</button><button :class="{active:role==='tutor'}" @tap="switchRole('tutor')">学生视角</button></view></view>
    <view v-if="!orders.length" class="panel empty"><t-icon name="calendar" size="48"/><text class="section-title">还没有安排试课</text><text class="small">你还没有发出邀请，先找到时间合适的同学吧。</text><t-button theme="primary" @click="go('request')">去找家教</t-button></view>
    <view v-for="o in orders" :key="o.id" class="panel order-card"><view class="section-heading"><view><text class="section-title">{{o.quote.tutor.name}} · {{o.request.grade}}{{subjectText(o.request)}}</text><text class="small">{{o.id}} · {{o.quote.mode}} · 每周 {{o.quote.slots.length}} 次</text></view><t-tag :theme="o.status==='success'?'success':'primary'" variant="light">{{statusText[o.status]}}</t-tag></view>
     <view class="progress"><view v-for="(label,i) in ['邀请','付款','试课','双向确认','完成']" :key="label" :class="['progress-item',{done:i<=step(o)}]"><view class="progress-dot">{{i<step(o)?'✓':i+1}}</view><text>{{label}}</text></view></view>
     <view class="order-body"><view class="order-main">
      <template v-if="o.status==='invited'"><text class="order-title">邀请已发出，等待同学回应</text><text class="subtitle">学生剩余 {{left(o.inviteDeadline)}} 可接受。这段时间里，该同学不会被其他家长选中。</text><text class="contact locked"><t-icon name="lock-on" size="17"/> 接受邀请后解锁联系方式</text></template>
      <template v-else-if="o.status==='arranging'"><text class="order-title">先把试课安排确认清楚</text><text class="subtitle">学生已接受邀请。真实版本由双方在微信沟通，回到小程序核对试课方式、时间和费用后再付款。</text><text class="contact"><t-icon name="chat" size="17"/> 联系方式已模拟解锁 · 无真实微信号</text><view class="trial-snapshot"><view class="summary-row"><text>建议试课时间</text><text>{{slotText(o.quote.slots[0])}} · 1 小时</text></view><view class="summary-row"><text>方式与地点</text><text>{{o.quote.mode}} · {{o.quote.mode==='线上'?'视频平台双方商定':o.request.location}}</text></view><view class="summary-row"><text>付款前确认</text><text>课时 ¥{{money(o.quote.rate)}} ＋ 通勤 ¥{{money(o.quote.commute)}}</text></view></view></template>
      <template v-else-if="['accepted','paid','scheduled'].includes(o.status)"><text class="order-title">{{o.status==='accepted'?'试课安排已确认，等待付款':o.status==='paid'?'等待学生确认收到试课费':'待完成一小时试课'}}</text><text class="subtitle">试课时长 1 小时。课时费 ¥{{money(o.quote.rate)}}，通勤补贴 ¥{{money(o.quote.commute)}}，全部归学生。</text><text class="contact"><t-icon name="chat" size="17"/> 联系方式已模拟解锁 · 无真实微信号</text><text v-if="o.trial" class="hint">{{slotText(o.trial.slot)}} · {{o.trial.place}}。费用和地点已保存为本次试课快照。</text><text v-else class="hint">这条旧演示订单尚无试课安排快照，可继续按原流程体验。</text></template>
      <template v-else-if="o.status==='review'"><text class="order-title">愿意继续这段合作吗？</text><text class="subtitle">还有 {{left(o.confirmDeadline)}} 确认。任一方不合适或超时未确认，平台均不收费。</text><view class="confirmations"><text>家长：{{resultText(o.parentResult)}}</text><text>学生：{{resultText(o.tutorResult)}}</text></view></template>
      <template v-else-if="o.status==='success'"><text class="order-title">双方已确认，合作开始</text><text class="subtitle">固定上课时间已占用，学生默认暂停接单。后续约课和付款由双方自行沟通。</text><view class="confirmations"><text>家长服务费：¥{{money(o.parentFee)}} · {{o.parentPaid?'已模拟支付':'待结算'}}</text><text>学生服务费：¥{{money(o.tutorFee)}} · {{o.tutorPaid?'已模拟支付':'待结算'}}</text></view></template>
      <template v-else><text class="order-title">本次试课已结束</text><text class="subtitle">没有产生平台服务费。已完成的付费试课不会因匹配失败而自动退款。</text></template>
     </view><view class="order-price"><text class="small">1 小时试课合计</text><text class="large-price">¥{{money(o.quote.rate+o.quote.commute)}}</text><text class="small">含通勤 ¥{{money(o.quote.commute)}}</text><view class="line"/><text class="small">成功后平台服务费</text><text>家长 ¥{{money(o.quote.rate/2)}} · 学生 ¥{{money(o.quote.rate)}}</text></view></view>
     <view class="order-actions"><template v-if="role==='tutor'&&o.status==='invited'"><t-button variant="outline" @click="action(o,'reject')">暂不合适</t-button><t-button theme="primary" @click="action(o,'accept')">接受试课邀请</t-button></template><t-button v-else-if="role==='parent'&&o.status==='arranging'" theme="primary" @click="action(o,'confirmTrial')">确认以上试课安排</t-button><template v-else-if="role==='parent'&&o.status==='accepted'"><t-button theme="primary" @click="action(o,'payTrial')">模拟支付试课费 ¥{{money(o.quote.rate+o.quote.commute)}}</t-button></template><t-button v-else-if="role==='tutor'&&o.status==='paid'" theme="primary" @click="action(o,'receive')">模拟确认已收到试课费</t-button><t-button v-else-if="role==='tutor'&&o.status==='scheduled'" theme="primary" @click="action(o,'finish')">模拟完成 1 小时试课</t-button><template v-else-if="o.status==='review'&&!(role==='parent'?o.parentResult:o.tutorResult)"><t-button variant="outline" @click="action(o,'fail')">不合适，继续寻找</t-button><t-button theme="primary" @click="action(o,'success')">确认合适，继续合作</t-button></template><t-button v-else-if="o.status==='success'&&!(role==='parent'?o.parentPaid:o.tutorPaid)" theme="primary" @click="action(o,'payService')">模拟支付{{role==='parent'?'家长':'学生'}}服务费</t-button><text v-else-if="activeOrder(o)" class="small">等待{{role==='parent'?'学生':'家长'}}操作，可切换上方体验视角。</text><t-button v-if="!activeOrder(o)" variant="text" theme="primary" @click="go('request')">继续找家教</t-button><t-button v-if="role==='parent'&&['invited','arranging','accepted'].includes(o.status)" variant="text" @click="action(o,'cancel')">取消邀请</t-button></view>
    </view>
    <view class="demo-tools"><button class="text-button" @tap="showTools=!showTools">{{showTools?'收起':'打开'}}超时演示工具</button><view v-if="showTools" class="tools-row"><t-button size="small" variant="outline" @click="demoAdvance(25)">推进 25 小时</t-button><t-button size="small" variant="outline" @click="demoAdvance(73)">推进 73 小时</t-button><text class="hint">只改变本机演示时钟，用于验证超时释放。</text></view></view>
   </view>

   <TutorOnboarding v-else-if="page==='onboarding'" class="motion-enter" @complete="completeOnboarding" @cancel="go('student')"/>

   <view v-else-if="page==='student'" class="view-screen motion-enter">
    <view class="intro tight"><view><text class="eyebrow">我的授课</text><text class="title">学生工作台</text><text class="subtitle">查看邀请、预计周收入与已经占用的固定时间。</text></view><view class="student-entry"><picker :range="state.tutors.map(t=>t.name)" @change="currentTutorId=state.tutors[Number($event.detail.value)].id"><view class="select">体验角色：{{currentTutor.name}}<t-icon name="chevron-down" size="16"/></view></picker><button class="student-onboard-action" @tap="go('onboarding')">体验新学生入驻</button></view></view>
    <view class="student-layout"><view class="panel profile"><view class="card-top"><view class="avatar" :class="currentTutor.color">{{currentTutor.letter}}</view><view><text class="person-name">{{currentTutor.name}}</text><text class="small">{{currentTutor.major}} · {{currentTutor.year}}</text></view></view><text class="bio">{{currentTutor.style}}</text><view class="summary-row"><text>身份认证</text><text>模拟邮箱与在校核验</text></view><view class="summary-row"><text>接单状态</text><text>{{state.orders.some(o=>o.tutorId===currentTutor.id&&activeOrder(o))?'当前试课占用':currentTutor.active?'可接单':'暂停接单'}}</text></view><view class="summary-row"><text>每年复验</text><text>9 月 · {{currentTutor.verifiedUntil>now()?'模拟有效':'已过期'}}</text></view><view class="profile-actions"><t-button theme="primary" block @click="resume">{{currentTutor.active?'暂停接单':'重新接单'}}</t-button><button class="profile-secondary" @tap="renew">模拟完成年度复验</button></view><text class="hint">不接收真实邮箱或密码。资料编辑和真实邮件验证在后续版本接入。</text></view>
     <view><view class="panel"><view class="section-heading"><text class="section-title">收到的邀请</text><t-button variant="text" theme="primary" @click="page='orders';role='tutor'">查看并处理 →</t-button></view><text v-if="!orders.length" class="small">暂无邀请。先在家长端选择这位同学，即可在这里体验回应。</text><view v-for="o in orders" :key="o.id" class="income-row"><view><text class="label">{{o.request.grade}}{{subjectText(o.request)}} · {{statusText[o.status]}}</text><text class="small">{{o.quote.slots.map(slotText).join(' / ')}}</text></view><view class="income"><text class="price">¥{{money(o.quote.weeklyBase+o.quote.weeklyCommute)}}<text class="price-unit"> / 周</text></text><text class="small">课时 ¥{{money(o.quote.weeklyBase)}} ＋ 通勤 ¥{{money(o.quote.weeklyCommute)}}</text></view></view></view>
      <view class="panel occupied"><text class="section-title">固定时间占用</text><text class="small">匹配成功后自动扣除。重新接单仍会避开这些时段。</text><view v-if="!currentTutor.blocks.length" class="empty-small">还没有占用的课次</view><view v-for="(b,bi) in currentTutor.blocks" :key="bi" class="summary-row"><text>{{slotText(b)}}</text><button class="text-button" @tap="releaseBlock(b.orderId)">合作已结束，释放</button></view></view>
     </view></view>
   </view>

   <view v-else class="view-screen motion-enter">
    <view class="intro tight"><view><text class="eyebrow">使用说明</text><text class="title">关于同窗体验版</text><text class="subtitle">同窗是临时产品名，与复旦大学无官方隶属或背书关系。</text></view></view>
    <view class="panel about"><text class="section-title">完整走一遍</text><view v-for="(s,i) in ['填写需求并查看推荐，选择一位学生。','在「我的试课」切换学生视角，接受邀请。','家长确认试课时间、方式与费用，再模拟付款。','学生确认收款并完成试课，双方分别确认结果。','分别模拟支付服务费，在工作台查看时间占用。']" :key="s" class="about-step"><text class="step-circle">{{i+1}}</text><text>{{s}}</text></view><view class="line"/><text class="section-title">这轮已经可体验</text><text class="body-copy">多科目、预算、多个课次和备选时间匹配；无匹配原因诊断；学生分步入驻和校园邮箱演示；5 公里通勤规则；24 小时邀请占用；试课安排快照；72 小时双向确认；成功后一次性收费与固定时间占用。</text><text class="section-title">下一轮接入</text><text class="body-copy">两人拆单、分学段报价、真实微信登录和邮箱核验、地图距离、服务端并发控制、正式支付及运营后台。当前仅本机存储，不支持多人联机；正式运营另需完成业务合规和平台准入核实。</text><text class="section-title">复用来源</text><text class="body-copy">基于 TDesign 团队的 Uniapp 通用模板与 TDesign 组件库（MIT）。同一份页面可构建为 H5 和微信小程序。来源版本与改动已记录在项目说明。</text><t-button theme="primary" @click="go('request')">开始体验</t-button><t-button variant="text" @click="reset">重置本机演示数据</t-button></view>
   </view>
   <view class="footer"><text>同窗 TONGCHUANG</text><text>本地体验 · 无真实收费</text></view>
  </view>
  <AppTabs :value="page==='results'?'request':page==='onboarding'?'student':page" @change="go" />
  <view class="profile-popup"><t-popup :visible="!!detail" placement="bottom" @visible-change="!$event.visible && (detail=null)">
   <view v-if="detail" class="profile-sheet">
    <view class="sheet-handle" />
    <view class="sheet-header"><text class="section-title">认识这位同学</text><button class="sheet-close" aria-label="关闭同学资料" @tap="detail=null"><t-icon name="close" size="21" /></button></view>
    <scroll-view scroll-y class="sheet-scroll">
     <view class="card-top"><view class="avatar" :class="detail.tutor.color">{{detail.tutor.letter}}</view><view><text class="person-name">{{detail.tutor.name}}</text><text class="small">复旦大学 · {{detail.tutor.major}} · {{detail.tutor.year}}</text><text class="small">模拟人物 · 认证与经历仅作演示</text></view></view>
     <text class="body-copy">{{detail.tutor.intro}}</text>
     <text class="label">经历与教学风格</text><text class="small">{{detail.tutor.experience}} · {{detail.tutor.styles.join(' / ')}}</text>
     <view class="tags"><text v-for="subject in form.subjects" :key="subject" class="time-chip">{{subject}}</text><text v-for="s in detail.slots" :key="s.day+'-'+s.start" class="time-chip">{{slotText(s)}}</text></view>
     <view class="line"/><view class="summary-row"><text>可成交基础时薪</text><text>¥{{money(detail.low)}}–{{money(detail.high)}}</text></view><view class="summary-row"><text>本次建议基础时薪</text><text>¥{{money(detail.rate)}}</text></view><view class="summary-row"><text>通勤补贴 / 次</text><text>¥{{money(detail.commute)}}</text></view><view class="summary-row"><text>一小时试课合计</text><text>¥{{money(detail.rate+detail.commute)}}</text></view><text class="hint">试课费用直接付给同学。只有双方确认继续合作，才收一次性平台服务费。</text>
    </scroll-view>
    <view class="sheet-action"><t-button theme="primary" block @click="select(detail)">邀请试课 · ¥{{money(detail.rate+detail.commute)}}</t-button></view>
   </view>
  </t-popup></view>
 </view>
</template>
