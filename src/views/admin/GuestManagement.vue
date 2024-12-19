<template>
  <div class="guest-management">
    <div class="page-header">
      <h2>宾客管理</h2>
    </div>

    <van-search
      v-model="searchText"
      placeholder="搜索宾客姓名或电话"
      @search="handleSearch"
    />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <van-cell-group v-for="guest in guests" :key="guest.id" inset>
          <van-cell title="姓名" :value="guest.name" />
          <van-cell title="手机" :value="guest.phone" />
          <van-cell title="参加情况" :value="guest.attendance === 'yes' ? '参加' : '不参加'" />
          <van-cell title="留言" :label="guest.message" />
          <van-cell>
            <template #default>
              <van-button size="small" type="danger" @click="deleteGuest(guest.id)">
                删除
              </van-button>
            </template>
          </van-cell>
        </van-cell-group>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { showToast, showDialog } from 'vant';

const guests = ref([]);
const loading = ref(false);
const finished = ref(true);
const refreshing = ref(false);
const searchText = ref('');

const fetchGuests = async () => {
  try {
    loading.value = true;
    const response = await fetch(`/api/guests?search=${searchText.value}`);
    if (!response.ok) throw new Error('获取宾客列表失败');
    const data = await response.json();
    guests.value = data;
  } catch (error) {
    showToast({
      type: 'fail',
      message: '加载失败'
    });
    console.error('加载宾客信息错误:', error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const handleSearch = () => {
  fetchGuests();
};

const onRefresh = () => {
  refreshing.value = true;
  fetchGuests();
};

const onLoad = () => {
  // 由于是一次性加载所有数据，这里直接设置完成
  finished.value = true;
};

const deleteGuest = async (id) => {
  try {
    // 添加删除确认
    await showDialog({
      title: '确认删除',
      message: '确定要删除这条宾客信息吗？',
    });

    loading.value = true;
    const response = await fetch(`/api/guests/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('删除失败');
    
    showToast({
      type: 'success',
      message: '删除成功'
    });
    // 直接从本地数据中移除被删除的宾客
    guests.value = guests.value.filter(guest => guest.id !== id);
  } catch (error) {
    if (error.toString().includes('cancel')) return;
    showToast({
      type: 'fail',
      message: '删除失败'
    });
    console.error('删除宾客信息错误:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchGuests();
});
</script>

<style lang="scss" scoped>
.guest-management {
  .page-header {
    margin-bottom: 20px;
  }

  .van-cell-group {
    margin-bottom: 12px;
  }
}
</style> 