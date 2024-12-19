<template>
  <div class="admin-layout">
    <van-nav-bar
      title="婚礼后台管理"
      left-text="返回首页"
      left-arrow
      @click-left="$router.push('/')"
    />
    
    <div class="admin-content">
      <van-sidebar v-model="activeMenu" @change="handleMenuChange">
        <van-sidebar-item title="照片管理" />
        <van-sidebar-item title="宾客管理" />
        <van-sidebar-item title="点赞统计" />
      </van-sidebar>
      
      <div class="content-area">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const activeMenu = ref(0);

const menuRoutes = [
  '/admin/photos',
  '/admin/guests',
  '/admin/likes'
];

const handleMenuChange = (index) => {
  router.push(menuRoutes[index]);
};
</script>

<style lang="scss" scoped>
.admin-layout {
  min-height: 100vh;
  background: #f5f5f5;

  .admin-content {
    display: flex;
    height: calc(100vh - 46px);

    .van-sidebar {
      width: 200px;
      height: 100%;
      background: #fff;
    }

    .content-area {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
  }
}
</style> 