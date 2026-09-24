<script setup>
// Adapted from TDesignOteam/tdesign-uniapp-starter-apply src/components/tag-filter.vue (MIT).
// Semantic single/multi-select buttons and mobile typography customized for Tongchuang.
const props=defineProps({ modelValue:[String,Array], options:Array, title:String, columns:{type:Number,default:3}, large:Boolean, multiple:Boolean });
const emit=defineEmits(['update:modelValue']);
const active=item=>props.multiple?props.modelValue.includes(item):props.modelValue===item;
function toggle(item){if(!props.multiple)return emit('update:modelValue',item);const values=[...props.modelValue],i=values.indexOf(item);if(i<0)values.push(item);else if(values.length>1)values.splice(i,1);emit('update:modelValue',values);}
</script>
<template>
 <view class="choice-group">
  <text v-if="title" class="field-title">{{title}}</text>
  <view :class="['choice-grid',{large}]" :style="{gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`}">
   <button v-for="item in options" :key="item" :class="['choice',{selected:active(item)}]" :aria-pressed="active(item)" @tap="toggle(item)"><text>{{item}}</text><t-icon v-if="large && active(item)" class="choice-check" name="check" size="15" /></button>
  </view>
 </view>
</template>
<style scoped>
.field-title{display:block;font-size:15px;font-weight:600;margin-bottom:13px;color:#252a33}.choice-grid{display:grid;gap:9px}.choice{margin:0;padding:0 6px;min-width:0;min-height:46px;display:flex;align-items:center;justify-content:center;border:1px solid #e5e7eb;border-radius:12px;background:#fff;color:#69717d;font-size:14px;line-height:1.4;position:relative}.choice::after{border:0}.choice.selected{color:#2857bc;border-color:#2857bc;background:#f2f6ff;font-weight:600}.large .choice{height:66px;font-size:19px;font-weight:500;justify-content:flex-start;padding-left:19px;border-radius:14px}.choice-check{position:absolute;right:12px;bottom:10px}.choice:focus-visible{outline:2px solid #2857bc;outline-offset:3px}
</style>
