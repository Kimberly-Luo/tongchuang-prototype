<script setup>
// Step-form pattern follows the existing TDesign Uniapp stack (MIT).
// Verification and document review are intentionally simulated in this prototype.
import { reactive, ref, computed } from 'vue';
import ChoiceGroup from './ChoiceGroup.vue';
import { grades, subjects } from '../domain.mjs';

const emit=defineEmits(['complete','cancel']);
const step=ref(0), sent=ref(false), error=ref('');
const form=reactive({
 email:'demo.student@fudan.edu.cn',code:'',currentStudent:false,
 name:'新同学',major:'',year:'大二',gender:'女',
 grades:['初中','高中'],subjects:['数学'],mode:'均可',far:true,
 low:220,high:260,slots:['周三晚','周六下午'],
 style:'耐心型',intro:'先了解孩子目前的学习情况，再一起确定适合的讲解和练习节奏。'
});
const steps=['校园身份','基本资料','授课设置','提交审核'];
const validEmail=computed(()=>/^[^@\s]+@fudan\.edu\.cn$/i.test(form.email.trim()));
function send(){error.value='';if(!validEmail.value){error.value='请输入 @fudan.edu.cn 校园邮箱';return;}sent.value=true;form.code='2026';}
function next(){
 error.value='';
 if(step.value===0&&(!validEmail.value||form.code!=='2026'||!form.currentStudent)){error.value='请完成校园邮箱验证码和在校状态确认';return;}
 if(step.value===1&&(!form.name.trim()||!form.major.trim())){error.value='请填写昵称和院系专业';return;}
 if(step.value===2&&(!form.grades.length||!form.subjects.length||!form.slots.length||form.low<160||form.high<form.low||form.high-form.low>50)){error.value='请检查学段、科目、时间和报价；报价跨度不能超过 50 元';return;}
 if(step.value<3)step.value++;
}
function submit(){emit('complete',JSON.parse(JSON.stringify(form)));}
</script>

<template>
 <view class="onboarding">
  <button class="back" @tap="step?step--:emit('cancel')">← {{step?'上一步':'返回学生工作台'}}</button>
  <view class="intro tight"><text class="eyebrow">学生入驻 · 模拟流程</text><text class="title">把你的时间与擅长说明白</text><text class="subtitle">完成后会生成一份可参与本机匹配的模拟学生资料。</text></view>
  <view class="onboarding-steps"><view v-for="(label,i) in steps" :key="label" :class="['onboarding-step',{done:i<=step}]"><text class="step-number">{{i<step?'✓':i+1}}</text><text class="step-label">{{label}}</text></view></view>
  <view v-if="error" class="message error" role="alert"><t-icon name="error-circle" size="18"/>{{error}}</view>

  <view v-if="step===0" class="panel onboarding-panel">
   <text class="section-title">验证校园邮箱</text><text class="body-copy">邮箱仅用于验证学校域名。真实版本还需要补充在校状态核验，校园邮箱本身不能证明仍在读。</text>
   <label class="field-label">复旦校园邮箱</label><input v-model="form.email" class="field-input" placeholder="name@fudan.edu.cn"/>
   <view class="code-row"><input v-model="form.code" class="field-input" maxlength="4" placeholder="4 位验证码"/><button class="soft-action" @tap="send">{{sent?'重新发送':'发送验证码'}}</button></view>
   <text v-if="sent" class="demo-code">演示验证码已自动填入：2026 · 没有发送真实邮件</text>
   <button :class="['check-row',{checked:form.currentStudent}]" @tap="form.currentStudent=!form.currentStudent"><text class="check-box">{{form.currentStudent?'✓':''}}</text><text>我确认自己目前为复旦在校学生，愿意在正式版本补充在校核验材料</text></button>
  </view>

  <view v-else-if="step===1" class="panel onboarding-panel">
   <text class="section-title">基本资料</text><text class="body-copy">家长只会看到昵称和教学相关信息；演示版不收集身份证、学号或真实联系方式。</text>
   <label class="field-label">展示昵称</label><input v-model="form.name" class="field-input" maxlength="8" placeholder="例如：林同学"/>
   <label class="field-label">院系或专业</label><input v-model="form.major" class="field-input" maxlength="30" placeholder="例如：数学科学学院"/>
   <label class="field-label">所在年级</label><ChoiceGroup v-model="form.year" :options="['大一','大二','大三','大四','研一及以上']" :columns="3"/>
   <label class="field-label">性别</label><ChoiceGroup v-model="form.gender" :options="['女','男']" :columns="2"/>
  </view>

  <view v-else-if="step===2" class="panel onboarding-panel">
   <text class="section-title">授课设置</text><text class="body-copy">所有选中的科目都会进入资料。系统只推荐你能完整覆盖的家长需求。</text>
   <label class="field-label">可辅导学段</label><ChoiceGroup v-model="form.grades" :options="grades" :columns="4" multiple/>
   <label class="field-label">可辅导科目</label><ChoiceGroup v-model="form.subjects" :options="subjects" :columns="3" multiple/>
   <label class="field-label">授课方式</label><ChoiceGroup v-model="form.mode" :options="['线下','线上','均可']" :columns="3"/>
   <label class="field-label">每小时基础报价</label><view class="price-inputs"><view><text>最低 ¥</text><input v-model.number="form.low" class="field-input" type="number"/></view><text>—</text><view><text>最高 ¥</text><input v-model.number="form.high" class="field-input" type="number"/></view></view>
   <label class="field-label">每周可接时间</label><ChoiceGroup v-model="form.slots" :options="['周三晚','周四晚','周六上午','周六下午','周日上午','周日下午']" :columns="2" multiple/>
   <button :class="['check-row',{checked:form.far}]" @tap="form.far=!form.far"><text class="check-box">{{form.far?'✓':''}}</text><text>接受 5 公里以上线下通勤，并由家长另付往返补贴</text></button>
  </view>

  <view v-else class="panel onboarding-panel review-panel">
   <text class="section-title">提交模拟审核</text><text class="body-copy">以下资料会保存到当前设备，并作为一名新的模拟学生加入匹配池。</text>
   <view class="summary-row"><text>身份</text><text>{{form.email}} · 模拟在校核验</text></view>
   <view class="summary-row"><text>资料</text><text>{{form.name}} · {{form.major}} · {{form.year}}</text></view>
   <view class="summary-row"><text>教学</text><text>{{form.grades.join('、')}} · {{form.subjects.join('、')}}</text></view>
   <view class="summary-row"><text>报价</text><text>¥{{form.low}}–{{form.high}} / 小时</text></view>
   <view class="summary-row"><text>时间</text><text>{{form.slots.join('、')}}</text></view>
   <view class="review-note"><t-icon name="info-circle" size="18"/><text>真实上线后，这一步需要等待运营复核。当前点击即视为模拟审核通过，不代表真实认证。</text></view>
  </view>

  <view class="onboarding-actions"><t-button v-if="step<3" theme="primary" block @click="next">继续</t-button><t-button v-else theme="primary" block @click="submit">提交并加入模拟匹配池</t-button></view>
 </view>
</template>
<style scoped>
.back{min-height:44px;display:flex;align-items:center;padding:0;margin:13px 0 0;background:none;color:#5c6d89;font-size:13px;line-height:1.5;text-align:left}.intro{padding:10px 0 24px}.eyebrow{display:block;font-size:12px;letter-spacing:1.4px;color:#60708a;margin-bottom:10px}.title{display:block;font-size:28px;letter-spacing:-.7px;font-weight:650;line-height:1.5;color:#252a33}.subtitle{display:block;color:#747d89;font-size:13px;line-height:1.85;margin-top:9px}.section-title{font-size:18px;font-weight:600;display:block;line-height:1.5;color:#252a33}.body-copy{display:block;font-size:14px;line-height:1.95;color:#69778e;margin:14px 0 23px}.panel{padding:26px 0 23px}.message{display:flex;align-items:flex-start;gap:8px;border-radius:10px;padding:13px;background:#fff2ee;color:#a3493c;font-size:13px;line-height:1.8;margin-top:20px}
.onboarding-steps{display:flex;gap:4px;padding:0 0 22px;border-bottom:1px solid #e7ebf1}.onboarding-step{flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;color:#8a94a3}.step-number{width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#f0f2f6;font-size:11px}.step-label{font-size:10px;line-height:1.4}.onboarding-step.done{color:#355d9f}.onboarding-step.done .step-number{background:#eaf0fb;color:#2857bc}.field-label{display:block;font-size:13px;font-weight:600;color:#3c485b;line-height:1.6;margin:22px 0 9px}.field-input{box-sizing:border-box;width:100%;height:48px;border:1px solid #dfe5ed;border-radius:10px;background:#fafbfd;padding:0 14px;color:#303a4b;font-size:14px}.code-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;margin-top:10px}.soft-action{height:48px;min-width:112px;padding:0 16px;margin:0;border:1px solid #9eb4dc;border-radius:10px;background:#f3f6fc;color:#2857bc;font-size:13px;font-weight:600;line-height:1.4}.demo-code{display:block;font-size:11px;line-height:1.7;color:#6179a0;margin-top:9px}.check-row{display:flex;align-items:flex-start;gap:10px;width:100%;padding:14px;margin:18px 0 0;background:#f6f8fb;border:1px solid #e4e9f1;border-radius:11px;text-align:left;font-size:12px;line-height:1.7;color:#647186}.check-row.checked{border-color:#afc2e8;background:#f1f5fd;color:#435f8d}.check-box{width:20px;height:20px;border:1px solid #c8d1df;border-radius:5px;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#2857bc;font-size:12px;margin-top:1px}.price-inputs{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:9px;color:#818b99}.price-inputs view>text{display:block;font-size:11px;margin-bottom:7px}.onboarding-actions{padding:16px 0 25px;border-top:1px solid #edf0f4}.onboarding-actions .t-button{min-height:50px}.summary-row{display:flex;justify-content:space-between;gap:14px;font-size:13px;line-height:1.9;margin:15px 0}.summary-row>text:first-child{color:#7a8595;flex-shrink:0}.summary-row>text:last-child{text-align:right;color:#394861}.review-note{display:flex;align-items:flex-start;gap:9px;background:#fff7e8;color:#8a6830;border-radius:11px;padding:14px;font-size:12px;line-height:1.8;margin-top:20px}.review-note .t-icon{margin-top:2px;flex-shrink:0}.onboarding button::after{border:0}@media(max-width:350px){.title{font-size:25px}.summary-row{gap:10px;font-size:12px}}
</style>
