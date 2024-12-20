<template>
  <div class="photo-management">
    <div class="page-header">
      <h2>照片管理</h2>
      <van-button type="primary" @click="showUploadDialog">上传照片</van-button>
    </div>

    <van-search
      v-model="searchText"
      placeholder="搜索照片描述"
      @search="handleSearch"
    />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div class="photo-grid">
          <van-swipe-cell v-for="photo in photos" :key="photo.id">
            <van-card
              :thumb="getPhotoUrl(photo.url)"
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
                  label="排序"
                  :model-value="photo.orderNum"
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
      </van-list>
    </van-pull-refresh>

    <van-dialog 
      v-model:show="showUpload" 
      title="上传照片"
      closeable
      :before-close="handleBeforeClose"
      class="upload-dialog"
    >
      <van-form>
        <van-field
          v-model="uploadForm.url"
          name="url"
          label="照片URL"
          placeholder="请输入照片URL"
        />
        
        <van-field
          v-model="uploadForm.description"
          name="description"
          label="照片描述"
          type="textarea"
          placeholder="请输入照片描述"
        />
        
        <van-field
          v-model="uploadForm.orderNum"
          name="orderNum"
          label="排序号"
          type="number"
          placeholder="请输入排序号"
        />

        <van-field name="photo" label="本地上传">
          <template #input>
            <van-uploader
              v-model="uploadForm.file"
              :max-count="1"
              :after-read="handleFileUpload"
            />
          </template>
        </van-field>
      </van-form>
      <template #footer>
        <div class="dialog-footer">
          <van-button 
            type="primary" 
            class="footer-btn" 
            @click="handleUpload" 
            :loading="loading"
          >
            上传
          </van-button>
        </div>
      </template>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { showToast, showDialog } from 'vant';

const photos = ref([]);
const loading = ref(false);
const finished = ref(true);
const refreshing = ref(false);
const searchText = ref('');
const showUpload = ref(false);
const uploadForm = ref({
  url: '',
  description: '',
  orderNum: 0,
  file: []
});

// 获取完整的图片URL
const getPhotoUrl = (url) => {
  return url.startsWith('http') ? url : `http://192.168.1.7:3000${url}`;
};

// 获取照片列表
const fetchPhotos = async () => {
  try {
    loading.value = true;
    const response = await fetch('/api/photos');
    if (!response.ok) throw new Error('获取照片列表失败');
    const data = await response.json();
    photos.value = data;
    photos.value.sort((a, b) => a.orderNum - b.orderNum);
  } catch (error) {
    showToast({
      type: 'fail',
      message: '加载失败'
    });
    console.error('加载照片错误:', error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 显示上传对话框
const showUploadDialog = () => {
  showUpload.value = true;
  uploadForm.value = {
    url: '',
    description: '',
    orderNum: 0,
    file: []
  };
};

// 处理文件选择
const handleFileUpload = (file) => {
  uploadForm.value.file = [file];
};

// 更新照片信息
const updatePhoto = async (photo) => {
  try {
    const orderNum = parseInt(photo.orderNum) || 0;
    const response = await fetch(`/api/photos/${photo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: photo.description,
        orderNum
      })
    });

    if (!response.ok) throw new Error('更新失败');
    photo.orderNum = orderNum;
    showToast({
      type: 'success',
      message: '更新成功'
    });
    photos.value.sort((a, b) => a.orderNum - b.orderNum);
  } catch (error) {
    showToast({
      type: 'fail',
      message: '更新失败'
    });
    console.error('更新照片错误:', error);
  }
};

// 删除照片
const deletePhoto = async (id) => {
  try {
    await showDialog({
      title: '确认删除',
      message: '确定要删除这张照片吗？',
    });

    loading.value = true;
    const response = await fetch(`/api/photos/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('删除失败');
    showToast({
      type: 'success',
      message: '删除成功'
    });
    photos.value = photos.value.filter(photo => photo.id !== id);
  } catch (error) {
    if (error.toString().includes('cancel')) return;
    showToast({
      type: 'fail',
      message: '删除失败'
    });
    console.error('删除照片错误:', error);
  } finally {
    loading.value = false;
  }
};

const onRefresh = () => {
  refreshing.value = true;
  fetchPhotos();
};

const onLoad = () => {
  finished.value = true;
};

// 统一处理上传
const handleUpload = async () => {
  try {
    loading.value = true;
    
    let response;
    
    if (uploadForm.value.file.length > 0) {
      // 文件上传
      const formData = new FormData();
      formData.append('photo', uploadForm.value.file[0].file);
      formData.append('description', uploadForm.value.description);
      formData.append('orderNum', uploadForm.value.orderNum);
      
      response = await fetch('/api/photos', {
        method: 'POST',
        body: formData
      });
    } else if (uploadForm.value.url) {
      // URL上传
      response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: uploadForm.value.url,
          description: uploadForm.value.description,
          orderNum: uploadForm.value.orderNum
        })
      });
    } else {
      throw new Error('请选择文件或输入URL');
    }

    if (!response.ok) throw new Error('上传失败');

    showToast({
      type: 'success',
      message: '上传成功'
    });
    
    showUpload.value = false;
    uploadForm.value = {
      url: '',
      description: '',
      orderNum: 0,
      file: []
    };
    await fetchPhotos();
  } catch (error) {
    showToast({
      type: 'fail',
      message: error.message || '上传失败'
    });
    console.error('上传照片错误:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchPhotos();
});
</script>

<style lang="scss" scoped>
.photo-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 16px;

    h2 {
      margin: 0;
    }
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
  }

  .van-card {
    background: #fff;
    margin-bottom: 10px;
    
    &__thumb {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
  }

  :deep(.upload-dialog) {
    .van-dialog__header {
      padding: 20px 24px;
      font-size: 18px;
      font-weight: 600;
      color: #323233;
      border-bottom: 1px solid #ebedf0;
    }

    .van-dialog__content {
      padding: 20px 24px;
    }

    .dialog-footer {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px 24px 24px;
      border-top: 1px solid #ebedf0;

      .footer-btn {
        width: 240px;
        height: 40px;
        font-size: 16px;
        border-radius: 20px;
        background: linear-gradient(to right, #ff6b6b, #ff8e8e);
        border: none;
        
        &:active {
          opacity: 0.9;
        }
      }
    }

    .van-field {
      padding: 16px 0;
      
      &__label {
        color: #323233;
        font-weight: 500;
      }
    }

    .van-uploader {
      &__upload {
        border-radius: 8px;
        background-color: #f7f8fa;
        
        &:active {
          background-color: #e8e8e8;
        }
      }
    }
  }
}
</style> 