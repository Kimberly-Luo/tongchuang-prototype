<script setup>
// Read-only steps pattern reviewed against Tencent/tdesign-miniprogram (MIT).
// The existing claim is the only source of truth; never advance it visually.
defineProps({claim:{type:Object,required:true},perspective:{type:String,default:'student'}});
</script>
<template>
 <view class="contact-progress" role="list" aria-label="双方联系确认进度">
  <view v-for="side in ['student','parent']" :key="side" :class="['contact-progress-item',{'is-confirmed':claim[`${side}Result`]==='yes'}]" role="listitem">
   <text class="progress-person">{{side===perspective?'你':side==='student'?'学生':'家长'}}{{side===perspective?(side==='student'?'（学生）':'（家长）'):''}}</text>
   <view class="progress-result"><t-icon v-if="claim[`${side}Result`]==='yes'" name="check" size="17"/><text>{{claim[`${side}Result`]==='yes'?'已点联系好了':'尚未确认'}}</text></view>
  </view>
 </view>
</template>
