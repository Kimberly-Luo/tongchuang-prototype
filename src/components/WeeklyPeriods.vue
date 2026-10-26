<script setup>
// Choice-button pattern reused from this project's MIT TDesign-derived ChoiceGroup.
import { DAYS, PERIODS } from '../platform.mjs';
const props=defineProps({modelValue:{type:Array,required:true}});
const emit=defineEmits(['update:modelValue']);
function toggle(key){const selected=props.modelValue.includes(key);emit('update:modelValue',selected?props.modelValue.filter(s=>s!==key):[...props.modelValue,key]);}
</script>
<template>
 <view class="weekly-periods">
  <view v-for="(day,di) in DAYS" :key="day" class="period-row">
   <text class="period-day">{{day}}</text>
   <button v-for="(period,pi) in PERIODS" :key="period" :class="['period-choice',{picked:modelValue.includes(`${di+1}-${pi}`)}]" :aria-label="`${day}${period}`" :aria-pressed="modelValue.includes(`${di+1}-${pi}`)" @tap="toggle(`${di+1}-${pi}`)">{{period}}</button>
  </view>
 </view>
</template>
<style scoped>
.weekly-periods{display:flex;flex-direction:column;gap:7px}.period-row{display:grid;grid-template-columns:30px repeat(4,minmax(0,1fr));gap:5px;align-items:center}.period-day{font-size:12px;color:#526077}.period-choice{display:flex;align-items:center;justify-content:center;min-width:0;min-height:44px;margin:0;padding:0 3px;border:1px solid #cbd1dc;border-radius:5px;background:#fff;color:#526077;font-size:12px;line-height:1.2}.period-choice.picked{background:#1f4ed8;color:#fff;border-color:#1f4ed8;font-weight:700}.period-choice::after{border:0}
</style>
