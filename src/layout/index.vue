<template>
  <el-container>
    <el-aside width="200px"><app-aside /></el-aside>
    <el-container>
      <el-header><app-header /></el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import Vue from 'vue'
import AppHeader from './components/app-header.vue'
import AppAside from './components/app-aside.vue'

export default Vue.extend({
  name: 'LayoutPage',
  components: {
    AppHeader,
    AppAside
  }
})
</script>

<style lang="scss" scoped>
  .el-aside {
    height: 100vh;
    background-color: rgb(84, 92, 100);
  }
  .el-header {
    background: #fff;
  }
</style>
