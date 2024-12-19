<template>
  <div class="like-statistics">
    <div class="page-header">
      <h2>点赞统计</h2>
      <div class="header-actions">
        <van-button type="primary" @click="exportData">导出数据</van-button>
        <van-button type="info" @click="refreshStats">刷新</van-button>
      </div>
    </div>

    <div class="statistics-grid">
      <van-card class="stat-card">
        <template #title>
          <div class="stat-title">总点赞数</div>
        </template>
        <template #price>
          <div class="like-count">{{ stats.totalLikes }}</div>
        </template>
      </van-card>

      <van-card class="stat-card">
        <template #title>
          <div class="stat-title">今日点赞</div>
        </template>
        <template #price>
          <div class="like-count">{{ stats.todayLikes }}</div>
        </template>
      </van-card>

      <van-card class="stat-card">
        <template #title>
          <div class="stat-title">本周点赞</div>
        </template>
        <template #price>
          <div class="like-count">{{ stats.weeklyLikes }}</div>
        </template>
      </van-card>
    </div>

    <div class="trend-section">
      <h3>点赞趋势</h3>
      <div class="trend-chart">
        <van-empty v-if="!stats.trend.length" description="暂无趋势数据" />
        <div v-else class="trend-bars">
          <div 
            v-for="(item, index) in stats.trend" 
            :key="index"
            class="trend-bar"
            :style="{ height: `${item.percentage}%` }"
          >
            <span class="trend-value">{{ item.count }}</span>
            <span class="trend-label">{{ item.date }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Toast } from 'vant';

const stats = ref({
  totalLikes: 0,
  todayLikes: 0,
  weeklyLikes: 0,
  trend: []
});
const loading = ref(false);

const fetchStats = async () => {
  try {
    loading.value = true;
    const response = await fetch('/api/likes/stats');
    if (!response.ok) throw new Error('获取统计数据失败');
    const data = await response.json();
    stats.value = data;
  } catch (error) {
    Toast.fail('加载失败');
    console.error('加载统计数据错误:', error);
  } finally {
    loading.value = false;
  }
};

const exportData = async () => {
  try {
    const response = await fetch('/api/likes/export');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `点赞数据_${new Date().toLocaleDateString()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    Toast.success('导出成功');
  } catch (error) {
    Toast.fail('导出失败');
    console.error('导出数据错误:', error);
  }
};

const refreshStats = () => {
  fetchStats();
};

onMounted(() => {
  fetchStats();
});
</script>

<style lang="scss" scoped>
.like-statistics {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .statistics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

    .stat-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

      .stat-title {
        font-size: 16px;
        color: #666;
      }

      .like-count {
        font-size: 36px;
        color: #ff4757;
        font-weight: bold;
        margin-top: 10px;
        text-align: center;
      }
    }
  }

  .trend-section {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 20px;
      color: #333;
    }

    .trend-chart {
      height: 300px;
      
      .trend-bars {
        display: flex;
        align-items: flex-end;
        height: 100%;
        gap: 10px;
        padding: 20px 0;

        .trend-bar {
          flex: 1;
          background: #ff4757;
          border-radius: 4px;
          min-height: 1px;
          transition: height 0.3s;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;

          .trend-value {
            color: #fff;
            font-size: 12px;
            margin-bottom: 5px;
          }

          .trend-label {
            position: absolute;
            bottom: -25px;
            font-size: 12px;
            color: #666;
            transform: rotate(-30deg);
            white-space: nowrap;
          }
        }
      }
    }
  }
}
</style> 