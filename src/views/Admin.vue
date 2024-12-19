<template>
  <div class="admin-panel">
    <van-nav-bar
      title="婚礼管理后台"
      left-text="返回"
      left-arrow
      @click-left="$router.push('/')"
    />

    <van-tabs v-model:active="activeTab" sticky>
      <!-- 照片管理标签页 -->
      <van-tab title="照片管理">
        <!-- 照片列表 -->
        <div class="photo-list">
          <van-empty v-if="photos.length === 0" description="暂无照片" />
          
          <van-swipe-cell v-for="photo in photos" :key="photo.id">
            <van-card 
              :thumb="getPhotoUrl(photo.url)"
              @click-thumb="previewImage(photo.url)"
            >
              <template #title>
                <van-field
                  v-model="photo.description"
                  label="描述"
                  @blur="updatePhoto(photo)"
                />
              </template>
              <template #tags>
                <van-field
                  v-model="photo.orderNum"
                  type="number"
                  :value="photo.orderNum || 0"
                  label="排序"
                  @blur="updatePhoto(photo)"
                />
              </template>
              <template #footer>
                <van-button size="small" type="danger" @click="deletePhoto(photo.id)">
                  删除
                </van-button>
              </template>
            </van-card>
          </van-swipe-cell>
        </div>

        <!-- 添加照片表单 -->
        <van-form @submit="onSubmit" class="add-form">
          <van-field
            v-model="photoForm.url"
            name="url"
            label="照片URL"
            placeholder="请输入照片URL"
            :rules="[{ required: true, message: '请填写照片URL' }]"
          />
          
          <van-field
            v-model="photoForm.description"
            name="description"
            label="照片描述"
            type="textarea"
            placeholder="请输入照片描述"
          />
          
          <van-field
            v-model="photoForm.orderNum"
            name="orderNum"
            label="排序号"
            type="number"
            placeholder="请输入排序号"
            :rules="[{ required: true, message: '请填写排序号' }]"
          />

          <van-field name="photo" label="本地上传">
            <template #input>
              <van-uploader
                v-model="photoForm.file"
                :max-count="1"
                :after-read="afterRead"
              />
            </template>
          </van-field>

          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit">
              添加照片
            </van-button>
          </div>
        </van-form>
      </van-tab>

      <!-- 宾客管理标签页 -->
      <van-tab title="宾客管理">
        <div class="guest-list">
          <van-empty v-if="guests.length === 0" description="暂无宾客信息" />
          
          <van-cell-group v-for="guest in guests" :key="guest.id" inset>
            <van-cell title="姓名" :value="guest.name" />
            <van-cell title="手机" :value="guest.phone" />
            <van-cell title="参加情况" :value="guest.attendance === 'yes' ? '参加' : '不参加'" />
            <van-cell title="留言" :label="guest.message" />
            <van-cell>
              <template #default>
                <van-button 
                  size="small" 
                  type="danger" 
                  @click="deleteGuest(guest.id)"
                >
                  删除
                </van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 加载状态 -->
    <van-overlay :show="isLoading">
      <div class="loading-spinner">
        <van-loading type="spinner" color="#1989fa" />
      </div>
    </van-overlay>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Toast, showImagePreview } from 'vant';

const activeTab = ref(0);
const photos = ref([]);
const guests = ref([]);
const isLoading = ref(false);
const photoForm = ref({
  url: '',
  description: '',
  orderNum: '',
  file: []
});

// 获取照片列表
const fetchPhotos = async () => {
  try {
    isLoading.value = true;
    const response = await fetch('/api/photos');
    const data = await response.json();
    photos.value = data;
  } catch (error) {
    Toast.fail('加载照片失败');
    console.error('加载照片错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// 获取宾客列表
const fetchGuests = async () => {
  try {
    isLoading.value = true;
    const response = await fetch('/api/guests');
    const data = await response.json();
    guests.value = data;
  } catch (error) {
    Toast.fail('加载宾客信息失败');
    console.error('加载宾客信息错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// 更新照片信息
const updatePhoto = async (photo) => {
  try {
    isLoading.value = true;
    const response = await fetch(`/api/photos/${photo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: photo.description,
        orderNum: parseInt(photo.orderNum) || 0
      })
    });
    
    if (!response.ok) throw new Error('更新失败');
    const result = await response.json();
    
    // 更新本地数据
    const index = photos.value.findIndex(p => p.id === photo.id);
    if (index !== -1) {
      photos.value[index] = {
        ...photos.value[index],
        description: photo.description,
        orderNum: parseInt(photo.orderNum) || 0
      };
    }
    
    Toast.success('更新成功');
  } catch (error) {
    Toast.fail('更新失败');
    console.error('更新照片错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// 处理本地文件上传
const afterRead = (file) => {
  photoForm.value.url = URL.createObjectURL(file.file);
};

// 提交表单
const onSubmit = async (values) => {
  try {
    isLoading.value = true;
    
    // 如果有本地文件，先上传文件
    if (photoForm.value.file.length > 0) {
      const formData = new FormData();
      formData.append('photo', photoForm.value.file[0].file);
      formData.append('description', values.description);
      formData.append('orderNum', values.orderNum);
      
      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('上传失败');
      
      await response.json();
    } else {
      // 直接使用URL添加照片
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: values.url,
          description: values.description,
          orderNum: parseInt(values.orderNum)
        })
      });
      
      if (!response.ok) throw new Error('添加失败');
    }
    
    Toast.success('添加成功');
    photoForm.value = {
      url: '',
      description: '',
      orderNum: '',
      file: []
    };
    
    // 刷新照片列表
    await fetchPhotos();
  } catch (error) {
    Toast.fail('添加失败');
    console.error('添加照片错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// 删除照片
const deletePhoto = async (id) => {
  try {
    isLoading.value = true;
    const response = await fetch(`/api/photos/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('删除失败');
    
    Toast.success('删除成功');
    await fetchPhotos();
  } catch (error) {
    Toast.fail('删除失败');
    console.error('删除照片错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// 删除宾客信息
const deleteGuest = async (id) => {
  try {
    isLoading.value = true;
    const response = await fetch(`/api/guests/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('删除失败');
    
    Toast.success('删除成功');
    await fetchGuests();
  } catch (error) {
    Toast.fail('删除失败');
    console.error('删除宾客信息错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// 获取完整的图片URL
const getPhotoUrl = (url) => {
  return url.startsWith('http') ? url : `http://192.168.1.7:3000${url}`;
};

// 预览图片
const previewImage = (url) => {
  showImagePreview({
    images: [getPhotoUrl(url)],
    closeable: true,
    showIndex: false,
    maxZoom: 3,
    minZoom: 0.5
  });
};

onMounted(() => {
  fetchPhotos();
  fetchGuests();
});
</script>

<style lang="scss" scoped>
.admin-panel {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 20px;
}

.photo-list,
.guest-list {
  padding: 16px;
  
  .van-swipe-cell,
  .van-cell-group {
    margin-bottom: 10px;
  }
}

.add-form {
  margin-top: 20px;
  padding: 16px;
  background: #fff;
}

.loading-spinner {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.van-card {
  &__thumb {
    cursor: pointer;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
    }
  }
}
</style> 