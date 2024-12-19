const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('../db');

const app = express();
const upload = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  })
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// 照片相关API
app.post('/api/photos', upload.single('photo'), async (req, res) => {
  try {
    console.log('收到照片上传请求:', req.body);
    console.log('上传的文件:', req.file);
    const { description, orderNum } = req.body;
    const photoUrl = req.file 
      ? `/uploads/${req.file.filename}` 
      : req.body.url;
    
    if (!photoUrl) {
      throw new Error('未提供照片URL或文件');
    }
    
    console.log('准备保存照片:', { photoUrl, description, orderNum });
    
    const photoId = await db.addPhoto({
      url: photoUrl,
      description,
      orderNum: parseInt(orderNum) || 0
    });
    
    console.log('照片保存成功，ID:', photoId);
    const photos = await db.getPhotos();
    res.json({ success: true, photoId, url: photoUrl, photos });
  } catch (error) {
    console.error('照片上传错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/photos', async (req, res) => {
  try {
    console.log('正在获取照片列表');
    const photos = await db.getPhotos();
    console.log('数据库返回的照片:', photos);
    res.json(photos);
  } catch (error) {
    console.error('获取照片列表错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deletePhoto(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 宾客信息API
app.get('/api/guests', async (req, res) => {
  try {
    const { search } = req.query;
    const guests = await db.getGuests(search);
    res.json(guests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guests', async (req, res) => {
  try {
    const guestId = await db.addGuest(req.body);
    res.json({ success: true, guestId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/guests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteGuest(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 点赞API
app.post('/api/likes', async (req, res) => {
  try {
    const ip = req.ip;
    console.log('收到点赞请求，IP:', ip);
    const likeId = await db.addLike(ip);
    const stats = await db.getLikeStats();
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error('处理点赞请求错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/likes/count', async (req, res) => {
  try {
    const count = await db.getLikeCount();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新照片信息
app.put('/api/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, orderNum } = req.body;
    const updatedPhoto = await db.updatePhoto(id, { 
      description, 
      orderNum: parseInt(orderNum) || 0 
    });
    res.json({ success: true, photo: updatedPhoto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 点赞统计API
app.get('/api/likes/stats', async (req, res) => {
  try {
    console.log('获取点赞统计数据');
    const stats = await db.getLikeStats();
    res.json(stats);
  } catch (error) {
    console.error('获取点赞统计错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 导出点赞数据
app.get('/api/likes/export', async (req, res) => {
  try {
    const data = await db.getLikesForExport();
    const csv = generateCsv(data);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=likes.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}); 