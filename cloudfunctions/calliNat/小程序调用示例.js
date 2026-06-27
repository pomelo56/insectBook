// 小程序端调用calliNat云函数的完整示例代码
// 适用于camera页面的昆虫识别功能

/**
 * 识别昆虫函数
 * @param {string} tempFilePath - 拍摄或选择的图片临时路径
 */
function recognizeInsect(tempFilePath) {
  wx.showLoading({
    title: '识别中...',
    mask: true
  });

  // 读取图片文件并转换为Base64
  wx.getFileSystemManager().readFile({
    filePath: tempFilePath,
    encoding: 'base64',
    success: res => {
      const base64Data = res.data;
      console.log('图片已读取，大小约:', Math.round(base64Data.length * 0.75 / 1024), 'KB');
      
      // 调用云函数进行昆虫识别
      wx.cloud.callFunction({
        name: 'calliNat',
        data: {
          imageBase64: base64Data
        },
        success: res => {
          console.log('昆虫识别云函数调用成功', res);
          
          // 处理识别结果
          if (res.result && res.result.isRecognized) {
            const insectName = res.result.insectName || '';
            console.log('昆虫识别成功', insectName);
            
            // 构建结果数组，适配前端显示
            const results = [{ name: insectName }];
            
            // 更新页面状态
            this.setData({
              hasResult: true,
              results: results,
              isNotAnimal: false,
              loading: false
            });
            
            // 显示识别成功提示
            wx.showToast({
              title: '识别成功',
              icon: 'success',
              duration: 1500
            });
            
            // 隐藏相机并显示结果
            this.hideCamera();
          } else {
            console.log('昆虫识别失败或未识别');
            
            // 处理未识别出昆虫的情况
            wx.showToast({
              title: '未识别到昆虫',
              icon: 'none',
              duration: 1500
            });
            
            // 1.5秒后询问是否手动输入
            setTimeout(() => {
              wx.showModal({
                title: '提示',
                content: '未能自动识别昆虫，是否手动输入昆虫信息？',
                success: resModal => {
                  if (resModal.confirm) {
                    // 用户确认手动输入，跳转到输入页面或显示输入框
                    this.manualInput();
                  } else {
                    this.setData({ loading: false });
                  }
                }
              });
            }, 1500);
          }
        },
        fail: err => {
          console.error('昆虫识别云函数调用失败', err);
          wx.showToast({
            title: '识别服务异常',
            icon: 'none',
            duration: 2000
          });
          this.setData({ loading: false });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    },
    fail: err => {
      console.error('读取图片文件失败', err);
      wx.showToast({
        title: '图片处理失败',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false });
      wx.hideLoading();
    }
  });
}

/**
 * 隐藏相机并显示结果
 */
function hideCamera() {
  this.setData({
    showCamera: false,
    showResult: true
  });
}

/**
 * 手动输入昆虫信息
 */
function manualInput() {
  // 这里实现手动输入昆虫信息的逻辑
  // 例如打开一个模态框或跳转到输入页面
  wx.navigateTo({
    url: '/pages/insect-input/index'
  });
}

/**
 * 从相册选择图片
 */
function chooseImageFromAlbum() {
  wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album'],
    success: res => {
      const tempFilePath = res.tempFiles[0].tempFilePath;
      recognizeInsect.call(this, tempFilePath);
    },
    fail: err => {
      console.error('选择图片失败', err);
    }
  });
}

/**
 * 拍摄照片
 */
function takePhoto() {
  const ctx = wx.createCameraContext();
  ctx.takePhoto({
    quality: 'high',
    success: res => {
      const tempFilePath = res.tempImagePath;
      recognizeInsect.call(this, tempFilePath);
    },
    fail: err => {
      console.error('拍照失败', err);
      wx.showToast({
        title: '拍照失败',
        icon: 'none'
      });
    }
  });
}

/**
 * 页面配置示例
 */
Page({
  data: {
    showCamera: true,
    showResult: false,
    loading: false,
    hasResult: false,
    results: [],
    isNotAnimal: false
  },
  
  onLoad() {
    // 页面加载时的初始化逻辑
  },
  
  // 拍照按钮点击事件
  onTakePhoto() {
    takePhoto.call(this);
  },
  
  // 从相册选择按钮点击事件
  onChooseFromAlbum() {
    chooseImageFromAlbum.call(this);
  },
  
  // 重新拍摄按钮点击事件
  onRetake() {
    this.setData({
      showCamera: true,
      showResult: false,
      hasResult: false,
      results: [],
      isNotAnimal: false
    });
  },
  
  // 手动输入按钮点击事件
  onManualInput() {
    manualInput.call(this);
  }
});

// 注意事项：
// 1. 确保在app.json中已配置相机权限
// 2. 使用前请初始化云开发环境：wx.cloud.init()
// 3. 确保calliNat云函数已正确部署
// 4. 对于大图可能需要进行适当压缩，避免超过云函数的请求大小限制// 小程序昆虫识别功能完整示例
// 该文件展示如何在小程序中实现昆虫识别功能的完整流程

// 1. 初始化云环境
wx.cloud.init({
  env: '你的云环境ID', // 替换为实际的云环境ID
  traceUser: true
});

// 2. 选择图片并进行昆虫识别的主函数
function recognizeInsectImage() {
  wx.showLoading({
    title: '正在选择图片...',
  });
  
  // 选择图片
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'], // 选择压缩图以减少数据量
    sourceType: ['album', 'camera'], // 可从相册选择或拍照
    success: function(res) {
      const tempFilePath = res.tempFilePaths[0];
      wx.hideLoading();
      wx.showLoading({
        title: '正在处理图片...',
      });
      
      // 将图片转为Base64编码
      wx.getFileSystemManager().readFile({
        filePath: tempFilePath,
        encoding: 'base64',
        success: function(base64Res) {
          const imageBase64 = base64Res.data;
          console.log('图片转Base64成功，数据长度:', imageBase64.length);
          
          // 调用云函数进行昆虫识别
          callInsectRecognitionCloudFunction(imageBase64);
        },
        fail: function(err) {
          wx.hideLoading();
          console.error('图片转Base64失败:', err);
          wx.showToast({
            title: '图片处理失败',
            icon: 'none'
          });
        }
      });
    },
    fail: function(err) {
      wx.hideLoading();
      console.error('选择图片失败:', err);
      wx.showToast({
        title: '取消选择',
        icon: 'none'
      });
    }
  });
}

// 3. 调用云函数进行昆虫识别
function callInsectRecognitionCloudFunction(imageBase64) {
  wx.showLoading({
    title: '正在识别昆虫...',
  });
  
  wx.cloud.callFunction({
    name: 'calliNat', // 云函数名称
    data: {
      imageBase64: imageBase64 // 传递Base64编码的图片数据
    },
    success: function(res) {
      wx.hideLoading();
      console.log('云函数调用成功:', res);
      
      // 处理识别结果 - 适应新的返回结构
      if (res.result) {
        const { isRecognized, insectName } = res.result;
        
        if (isRecognized) {
          // 识别成功，显示昆虫名称
          wx.showModal({
            title: '昆虫识别结果',
            content: `识别到: ${insectName}`,
            showCancel: false,
            success: function(res) {
              // 可以在这里添加保存历史记录等功能
            }
          });
        } else {
          // 未识别出昆虫
          wx.showModal({
            title: '识别结果',
            content: '未能识别出昆虫，请尝试拍摄更清晰的照片',
            showCancel: false
          });
        }
      } else {
        wx.showModal({
          title: '识别失败',
          content: '云函数返回格式异常',
          showCancel: false
        });
      }
    },
    fail: function(err) {
      wx.hideLoading();
      console.error('云函数调用失败:', err);
      
      // 错误处理
      let errorMsg = '识别失败，请稍后重试';
      if (err.errMsg && err.errMsg.includes('request:fail')) {
        errorMsg = '网络连接失败，请检查网络';
      } else if (err.result && err.result.error) {
        errorMsg = `识别错误: ${err.result.error.message || '未知错误'}`;
      }
      
      wx.showModal({
        title: '识别失败',
        content: errorMsg,
        showCancel: false
      });
    }
  });
}

// 4. 图片预览功能（可选）
function previewInsectImage(imageUrl) {
  wx.previewImage({
    urls: [imageUrl],
    current: imageUrl
  });
}

// 5. 保存识别结果功能（可选）
function saveRecognitionResult(insectInfo, imageBase64) {
  // 这里可以实现将识别结果保存到云数据库的功能
  const db = wx.cloud.database();
  
  return db.collection('insect_recognitions').add({
    data: {
      insectName: insectInfo.name,
      category: insectInfo.baike_info.classname,
      description: insectInfo.baike_info.description,
      score: insectInfo.score,
      createTime: db.serverDate(),
      // 注意：不建议直接保存完整的Base64图片数据
      // 应该先上传到云存储，然后保存文件ID
    }
  });
}

// 6. 在页面中使用的示例（复制到页面JS文件中）
Page({
  data: {
    imageUrl: '',         // 选中的图片路径
    recognizedResult: '', // 识别结果文本
    loading: false        // 是否正在加载中
  },
  
  // 点击识别按钮
  onRecognizeTap: function() {
    this.recognizeInsectImage();
  },
  
  // 选择图片并进行识别
  recognizeInsectImage: function() {
    const that = this;
    
    wx.chooseImage({
      count: 1,  // 只允许选择1张图片
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFilePaths[0];
        that.setData({ imageUrl: tempFilePath });
        
        wx.showLoading({ title: '正在处理图片...' });
        
        // 将图片转为Base64
        wx.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: function(base64Res) {
            // 调用云函数进行识别
            wx.cloud.callFunction({
              name: 'calliNat',
              data: { imageBase64: base64Res.data },
              success: function(res) {
                wx.hideLoading();
                
                if (res.result && res.result.isRecognized) {
                  // 识别成功
                  that.setData({
                    recognizedResult: '识别到: ' + res.result.insectName
                  });
                } else {
                  // 未识别出昆虫
                  that.setData({
                    recognizedResult: '未能识别出昆虫，请尝试拍摄更清晰的照片'
                  });
                }
              },
              fail: function(err) {
                wx.hideLoading();
                console.error('识别失败:', err);
                that.setData({
                  recognizedResult: '识别失败，请检查网络连接后重试'
                });
              }
            });
          },
          fail: function(err) {
            wx.hideLoading();
            console.error('图片处理失败:', err);
          }
        });
      }
    });
  },
  
  // 生命周期函数
  onLoad: function() {
    // 页面加载时可以进行一些初始化操作
  }
});

/* 对应的WXML示例代码 */
/*
<view class="container">
  <view class="title">昆虫识别</view>
  
  <!-- 图片预览区域 -->
  <view class="image-container">
    <image wx:if="{{imageUrl}}" src="{{imageUrl}}" mode="aspectFit"></image>
    <view wx:else class="placeholder">点击下方按钮选择图片</view>
  </view>
  
  <!-- 识别结果显示 -->
  <view class="result-container">
    <text wx:if="{{recognizedResult}}" class="result-text">{{recognizedResult}}</text>
  </view>
  <button type="primary" bindtap="onRecognizeTap">选择图片进行识别</button>
</view>
*/

// 使用说明：
// 1. 将此文件内容复制到小程序页面的JS文件中
// 2. 在对应的WXML文件中添加一个识别按钮，绑定onRecognizeTap方法
// 3. 确保已在app.js中初始化云开发环境
// 4. 开通并配置好calliNat云函数
// 5. 确保用户已授权相册和相机权限