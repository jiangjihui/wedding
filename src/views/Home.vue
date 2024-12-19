<template>
  <div class="wedding-invitation">
    <Fireworks />
    <!-- 加载状态 -->
    <van-overlay :show="isLoading">
      <div class="loading-spinner">
        <van-loading type="spinner" color="#1989fa" />
      </div>
    </van-overlay>

    <!-- 错误提示 -->
    <van-toast id="error-toast" />
    
    <!-- 音乐控制器 -->
    <div class="music-control" @click="toggleMusic">
      <van-icon 
        name="music-o"
        :class="{ rotating: isPlaying }" 
        ref="musicIconRef"
        :style="{ color: isPlaying ? '#ff69b4' : '#999' }"
      />
    </div>
    
    <!-- 照片轮播区域 -->
    <div class="photo-container">
      <div v-if="isLoading" class="loading-info">
        加载中...
      </div>
      <div v-else-if="!sortedPhotos.length" class="loading-info">
        暂无照片数据
      </div>
      <div v-else v-for="photo in sortedPhotos" :key="photo.id" class="photo-item">
        <img 
          :src="getPhotoUrl(photo.url)" 
          :alt="photo.description"
          @error="handleImageError"
          @load="handleImageLoad"
          :class="{ loaded: true }"
        >
        <p class="photo-description">{{ photo.description }}</p>
      </div>
    </div>

    <!-- 宾客信息表单 -->
    <div class="guest-form">
      <van-form @submit="onSubmit">
        <van-field
          v-model="guestInfo.name"
          name="name"
          label="姓名"
          placeholder="请输入姓名"
          :rules="[{ required: true, message: '请填写姓名' }]"
        />
        
        <van-field
          v-model="guestInfo.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          :rules="[{ required: true, message: '请填写手机号' }]"
        />

        <van-field
          v-model="guestInfo.message"
          name="message"
          label="祝福语"
          type="textarea"
          placeholder="请输入祝福语"
        />

        <van-field name="attendance">
          <template #input>
            <van-radio-group v-model="guestInfo.attendance" direction="horizontal">
              <van-radio name="yes">参加</van-radio>
              <van-radio name="no">不参加</van-radio>
            </van-radio-group>
          </template>
        </van-field>

        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit">
            提交
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 点赞区域 -->
    <div class="like-section">
      <van-button icon="like" :class="{ active: isLiked }" @click="handleLike">
        {{ likeCount }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { Howl } from 'howler';
import gsap from 'gsap';
import { Toast, Icon } from 'vant';
import { preloadImages } from '../utils/preloader';
import Fireworks from '../components/Fireworks.vue';

// 状态管理
const isPlaying = ref(false);
const isLiked = ref(false);
const likeCount = ref(0);
const photos = ref([]);
const guestInfo = ref({
  name: '',
  phone: '',
  message: '',
  attendance: 'yes'
});
const isLoading = ref(false);
const hasUserInteracted = ref(false);
let scrollTimer = null; // 添加滚动计时器

// 按照排序号排序的照片列表
const sortedPhotos = computed(() => {
  return [...photos.value].sort((a, b) => (a.orderNum || 0) - (b.orderNum || 0));
});

// 获取完整的图片URL
const getPhotoUrl = (url) => {
  return url.startsWith('http') ? url : `http://192.168.1.7:3000${url}`;
};

// 获照片列表
const fetchPhotos = async () => {
  try {
    console.log('开始获取照片列表');
    isLoading.value = true;
    const response = await fetch('/api/photos');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('获取到的照片数据:', data);
    
    if (!Array.isArray(data)) {
      throw new Error('返回的数据格式不正确');
    }
    
    photos.value = data;
    console.log('照片列表已更新:', photos.value);
    console.log('排序后的照片列表:', sortedPhotos.value);
  } catch (error) {
    console.error('加载照片错误:', error);
    Toast.fail('加载照片失败');
  } finally {
    isLoading.value = false;
  }
};

// 音乐播放器实例
const bgMusic = new Howl({
  src: ['/music/wedding-bgm.mp3'],
  loop: true,
  volume: 0.5,
  autoplay: false,
  html5: true,
  preload: true,
  onload: () => {
    console.log('音乐加载完成');
    // 音乐加载完成后添加滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true });
  },
  onloaderror: (id, error) => {
    console.error('音乐加载失败:', error);
  },
  onplay: () => {
    isPlaying.value = true;
    console.log('音乐开始播放');
  },
  onpause: () => {
    isPlaying.value = false;
    console.log('音乐暂停');
  }
});

// 切换音乐播放状态
const toggleMusic = () => {
  try {
    console.log('当前播放状态:', isPlaying.value);
    hasUserInteracted.value = true;
    if (isPlaying.value) {
      bgMusic.pause();
    } else {
      bgMusic.play();
    }
  } catch (error) {
    console.error('音乐控制错误:', error);
  }
};

// 获取点赞数
const initializeLikeCount = async () => {
  try {
    const response = await fetch('/api/likes/count');
    if (!response.ok) {
      throw new Error('获取点赞数失败');
    }
    const data = await response.json();
    likeCount.value = data.count;
  } catch (error) {
    console.error('获取点赞数错误:', error);
  }
};

// 处理点赞
const handleLike = async () => {
  try {
    const response = await fetch('/api/likes', {
      method: 'POST'
    });
    
    if (!response.ok) throw new Error('点赞失败');
    
    const data = await response.json();
    likeCount.value = data.totalLikes;
    isLiked.value = true;
    Toast.success('感谢您的祝福');
  } catch (error) {
    Toast.fail('点赞失败');
    console.error('点赞错误:', error);
  }
};

// 提交表单
const onSubmit = async (values) => {
  try {
    isLoading.value = true;
    const response = await fetch('/api/guests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    });
    
    if (!response.ok) throw new Error('提交失败');
    
    Toast.success('提交成功');
    guestInfo.value = {
      name: '',
      phone: '',
      message: '',
      attendance: 'yes'
    };
  } catch (error) {
    Toast.fail('提交失败');
    console.error('提交单错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// 添加照片动画效果
const animatePhoto = (element) => {
  gsap.from(element, {
    opacity: 0,
    scale: 0.8,
    duration: 1,
    ease: 'power2.out'
  });
};

// 添加滑动检测
const initializeScroll = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animatePhoto(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  document.querySelectorAll('.photo-item').forEach(photo => {
    observer.observe(photo);
  });
};

// 音乐图标旋转动画
const musicIconRef = ref(null);
const animateMusicIcon = () => {
  gsap.to(musicIconRef.value, {
    rotation: isPlaying.value ? '+=360' : 0,
    duration: 2,
    ease: 'none',
    repeat: isPlaying.value ? -1 : 0
  });
};

// 处理页面滚动
const handleScroll = () => {
  console.log('滚动事件触发');
  // 修复逻辑错误
  if (bgMusic.state() !== 'loaded') {
    console.log('音乐还未加载完成');
    return;
  }

  // 清除之前的计时器
  if (scrollTimer) {
    clearTimeout(scrollTimer);
  }

  // 设置新的计时器，延迟500ms后执行
  scrollTimer = setTimeout(() => {
    if (!hasUserInteracted.value) {
      console.log('开始自动播放音乐');
      // 检查音乐是否已经在播放
      if (!bgMusic.playing()) {
        bgMusic.play();
        hasUserInteracted.value = true; // 标记已经自动播放过
        console.log('音乐已自动播放');
      } else {
        console.log('音乐已经在播放中');
      }
    } else {
      console.log('用户已交互过，不自动播放');
    }
  }, 500);
};

onMounted(async () => {
  try {
    console.log('组件挂载，开始初始化...');
    
    initializeScroll();
    await fetchPhotos();
    await initializeLikeCount();
    
    console.log('初始化完成');
  } catch (error) {
    console.error('初始化错误:', error);
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if (scrollTimer) {
    clearTimeout(scrollTimer);
  }
  bgMusic.unload(); // 卸载音乐
  console.log('组件卸载，清理资源');
});
</script>

<style lang="scss" scoped>
.wedding-invitation {
  min-height: 100vh;
  background: #fff;
  
  @media (max-width: 768px) {
    .music-control {
      top: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
    }
    
    .photo-description {
      font-size: 14px;
      padding: 8px;
    }
    
    .guest-form {
      padding: 15px;
    }
    
    .like-section {
      bottom: 15px;
    }
  }
}

.music-control {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  
  &:hover {
    transform: scale(1.1);
  }
  
  .van-icon {
    font-size: 24px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.rotating {
      animation: rotate 4s linear infinite;
    }
    
    &:not(.rotating) {
      opacity: 0.6;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.photo-container {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  background: #000;
  position: relative;

  .photo-item {
    height: 100vh;
    scroll-snap-align: start;
    position: relative;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      position: relative;
      z-index: 1;
    }

    .photo-description {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      text-align: center;
      color: #fff;
      padding: 10px;
      background: rgba(0, 0, 0, 0.5);
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
      z-index: 2;
    }
  }
}

.guest-form {
  padding: 20px;
  background: #fff;
}

.like-section {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;

  .active {
    color: #ff4444;
  }
}

// 禁用双击缩放
* {
  touch-action: manipulation;
}

.loading-info {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 16px;
  z-index: 1000;
}

/* 添加动画过渡效果 */
.van-icon {
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    filter: brightness(1.2);
  }
}
</style> 