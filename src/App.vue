<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<!-- Global by design: the index page visual system must also reach child form components. -->
<style src="./pages/index/platform.css"></style>
<style src="./pages/index/design-preview.css"></style>
<style src="./pages/index/book-theme.css"></style>
