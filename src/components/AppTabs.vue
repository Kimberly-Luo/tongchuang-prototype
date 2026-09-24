<script setup>
// Adapted from TDesignOteam/tdesign-uniapp-starter-apply custom-tab-bar.vue (MIT).
// Retains TDesign fixed/placeholder behavior; emits local view changes instead of redirectTo.
defineProps({value:String});
defineEmits(['change']);
</script>
<template>
 <view class="app-tabs"><t-tab-bar fixed placeholder :value="value" theme="normal" :split="true" @change="$emit('change',$event.value)">
  <t-tab-bar-item icon="search" value="request">找家教</t-tab-bar-item>
  <t-tab-bar-item icon="calendar" value="orders">我的试课</t-tab-bar-item>
  <t-tab-bar-item icon="user" value="student">学生端</t-tab-bar-item>
 </t-tab-bar></view>
</template>
