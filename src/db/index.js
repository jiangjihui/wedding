const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'wedding.db');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接错误:', err);
  } else {
    console.log('数据库连接成功');
  }
});

// 初始化数据库表
db.serialize(() => {
  // 检查并创建表的函数
  const createTableIfNotExists = (tableName, schema) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
        if (err) {
          console.error(`检查${tableName}表存在性错误:`, err);
          reject(err);
          return;
        }

        if (!row) {
          // 表不存在，创建新表
          db.run(schema, (err) => {
            if (err) {
              console.error(`创建${tableName}表错误:`, err);
              reject(err);
            } else {
              console.log(`${tableName}表创建成功`);
              resolve();
            }
          });
        } else {
          // 表已存在，检查是否需要添加 created_at 列
          db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
            if (err) {
              console.error(`检查${tableName}表结构错误:`, err);
              reject(err);
              return;
            }

            // 确保 columns 是数组并且有数据
            if (Array.isArray(columns)) {
              const hasCreatedAt = columns.some(col => col.name === 'created_at');
              if (!hasCreatedAt) {
                // 添加 created_at 列，但不修改现有数据的时间戳
                db.run(`ALTER TABLE ${tableName} ADD COLUMN created_at DATETIME`, (err) => {
                  if (err) {
                    console.error(`添加created_at列到${tableName}表错误:`, err);
                    reject(err);
                  } else {
                    console.log(`${tableName}表添加created_at列成功`);
                    resolve();
                  }
                });
              } else {
                resolve();
              }
            } else {
              console.error(`获取${tableName}表结构信息格式错误:`, columns);
              resolve(); // 即使获取结构信息失败，也不影响表的使用
            }
          });
        }
      });
    });
  };

  // 创建照片表
  createTableIfNotExists('photos', `
    CREATE TABLE photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      description TEXT,
      order_num INTEGER DEFAULT 0 NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(err => console.error('照片表初始化错误:', err));

  // 创建宾客信息表
  createTableIfNotExists('guests', `
    CREATE TABLE guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT,
      attendance TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(err => console.error('宾客表初始化错误:', err));

  // 创建点赞表
  createTableIfNotExists('likes', `
    CREATE TABLE likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(err => console.error('点赞表初始化错误:', err));

  // 添加测试数据（仅在照片表为空时）
  db.get('SELECT COUNT(*) as count FROM photos', (err, row) => {
    if (err) {
      console.error('检查照片数量错误:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('添加测试数据...');
      db.run(`
        INSERT INTO photos (url, description, order_num)
        VALUES 
        ('https://picsum.photos/800/1200', '测试照片1', 1),
        ('https://picsum.photos/800/1200', '测试照片2', 2)
      `, (err) => {
        if (err) {
          console.error('添加测试数据错误:', err);
        } else {
          console.log('测试数据添加成功');
        }
      });
    }
  });
});

// 数据库操作方法
const dbOperations = {
  // 添加照片
  addPhoto: (photo) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO photos (url, description, order_num) VALUES (?, ?, ?)',
        [photo.url, photo.description, parseInt(photo.orderNum) || 0],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  // 获取所有照片
  getPhotos: () => {
    return new Promise((resolve, reject) => {
      console.log('正在查询照片数据...');
      db.all(`
        SELECT 
          id,
          url,
          description,
          COALESCE(order_num, 0) as orderNum
        FROM photos 
        ORDER BY order_num
      `, (err, rows) => {
        if (err) {
          console.error('查询照片错误:', err);
          reject(err);
        }
        console.log('查询到的照片数据:', rows);
        resolve(rows);
      });
    });
  },

  // 添加宾客信息
  addGuest: (guest) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO guests (name, phone, message, attendance) VALUES (?, ?, ?, ?)',
        [guest.name, guest.phone, guest.message, guest.attendance],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  // 添加点赞
  addLike: (ip) => {
    return new Promise((resolve, reject) => {
      console.log('添加点赞，IP:', ip);
      db.run(
        'INSERT INTO likes (ip, created_at) VALUES (?, datetime("now", "localtime"))',
        [ip],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  // 获取点赞数
  getLikeCount: () => {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM likes', (err, row) => {
        if (err) reject(err);
        resolve(row.count);
      });
    });
  },

  // 删除照片
  deletePhoto: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM photos WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  },

  // 更新照片信息
  updatePhoto: (id, photo) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE photos SET description = ?, order_num = ? WHERE id = ?',
        [photo.description, photo.orderNum, id],
        (err) => {
          if (err) reject(err);
          resolve({ 
            id, 
            description: photo.description,
            orderNum: photo.orderNum
          });
        }
      );
    });
  },

  // 获取所有宾客信息
  getGuests: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM guests ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  // 删除宾客信息
  deleteGuest: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM guests WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  },

  getLikeStats: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        WITH daily_likes AS (
          SELECT 
            date(created_at) as date,
            COUNT(*) as count
          FROM likes
          GROUP BY date(created_at)
        )
        SELECT
          (SELECT COUNT(*) FROM likes) as totalLikes,
          (SELECT COUNT(*) FROM likes WHERE date(created_at) = date('now', 'localtime')) as todayLikes,
          (SELECT COUNT(*) FROM likes WHERE date(created_at) >= date('now', 'localtime', '-7 days')) as weeklyLikes,
          json_group_array(
            json_object(
              'date', date,
              'count', count,
              'percentage', ROUND(count * 100.0 / NULLIF((SELECT MAX(count) FROM daily_likes), 0))
            )
          ) as trend
        FROM daily_likes
        ORDER BY date DESC
        LIMIT 7
      `, (err, rows) => {
        if (err) {
          console.error('获取点赞统计错误:', err);
          reject(err);
        } else {
          const result = rows[0] || { totalLikes: 0, todayLikes: 0, weeklyLikes: 0, trend: '[]' };
          try {
            result.trend = JSON.parse(result.trend || '[]').reverse();
          } catch (e) {
            console.error('解析趋势数据错误:', e);
            result.trend = [];
          }
          console.log('点赞统计结果:', result);
          resolve(result);
        }
      });
    });
  },

  getLikesForExport: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id,
          ip,
          datetime(created_at) as created_at
        FROM likes
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = dbOperations; 