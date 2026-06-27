// miniprogram/pages/admin/insects/detail-insect.js
Page({
  data: {
    insectId: '',
    insect: null,
    loading: true,
    saving: false,
    encyclopediaContent: '',
    fetchingEncyclopedia: false,
    encyclopediaLoading: false
  },

  onLoad: function(options) {
    // 优先从eventChannel获取数据（新方式）
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel) {
      eventChannel.on('acceptDataFromOpenerPage', (data) => {
        console.log('通过eventChannel接收到数据:', data);
        if (data.id) {
          this.setData({ insectId: data.id });
          // 检查是否为图片配置模式
          if (data.mode === 'image_config') {
            this.setData({ showImageConfig: true });
            console.log('进入图片配置模式');
          }
          this.loadInsectDetail();
        }
      });
    }
    
    // 同时保留原有options.id参数获取方式作为兼容
    if (options.id) {
      console.log('通过options获取ID:', options.id);
      this.setData({ insectId: options.id });
      // 如果没有通过eventChannel设置过，则加载详情
      if (!eventChannel) {
        this.loadInsectDetail();
      }
    }
  },
  
  // 更新昆虫图片
  updateInsectImage: async function(imageUrl) {
    if (!this.data.insectId) {
      wx.showToast({ title: '缺少昆虫ID', icon: 'none' });
      return false;
    }
    
    try {
      wx.showLoading({ title: '保存中...' });
      
      // 使用externalId参数调用云函数
      const result = await wx.cloud.callFunction({
        name: 'updateInsectImage',
        data: {
          externalId: this.data.insectId,
          imageUrl: imageUrl
        }
      });
      
      if (result.result.success) {
        wx.showToast({ title: '图片更新成功' });
        // 更新本地昆虫数据
        const updatedInsect = { ...this.data.insect, imageUrl: imageUrl };
        this.setData({ insect: updatedInsect });
        return true;
      } else {
        wx.showToast({ 
          title: result.result.message || '更新失败', 
          icon: 'none' 
        });
        return false;
      }
    } catch (error) {
      console.error('更新昆虫图片失败:', error);
      wx.showToast({ title: '更新异常', icon: 'none' });
      return false;
    } finally {
      wx.hideLoading();
    }
  },

  // 强制刷新昆虫详情
  forceRefreshInsectDetail: function() {
    wx.showLoading({ title: '强制刷新中...' });
    // 设置loading状态并重新加载数据
    this.setData({ loading: true });
    this.loadInsectDetail();
  },
  
  // 加载昆虫详情
  loadInsectDetail: async function() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 传递insectId参数，让云函数根据格式自动判断是普通ID还是externalId
      const result = await wx.cloud.callFunction({
        name: 'getInsectDetail',
        data: { insectId: this.data.insectId }
      });

      if (result.result) {
        // 处理昆虫数据，添加默认值确保所有字段都有值
        const insectData = {
          // 确保基本信息都有默认值
          name: result.result.name || '未知昆虫',
          id: result.result.id || result.result._id || this.data.insectId || '',
          recognitionCount: result.result.recognitionCount || 0,
          createTime: result.result.createTime || '未知',
          encyclopedia: result.result.encyclopedia || '',
          imageUrl: result.result.imageUrl || '',
          // 保留其他原有字段
          ...result.result
        };
        
        this.setData({
          insect: insectData,
          encyclopediaContent: insectData.encyclopedia || ''
        });
      } else {
        console.warn('获取昆虫数据失败或数据为空');
        // 创建默认昆虫对象，确保所有基本信息都有默认值
        const defaultInsect = {
          name: '未知昆虫',
          id: this.data.insectId || '',
          recognitionCount: 0,
          createTime: '未知',
          encyclopedia: ''
        };
        
        this.setData({
          insect: defaultInsect,
          encyclopediaContent: ''
        });
        wx.showToast({ title: '加载失败，显示默认数据', icon: 'none' });
      }
    } catch (error) {
      console.error('加载昆虫详情失败:', error);
      // 发生异常时也设置默认昆虫对象
      const defaultInsect = {
        name: '未知昆虫',
        id: this.data.insectId || '',
        recognitionCount: 0,
        createTime: '未知',
        encyclopedia: ''
      };
      
      this.setData({
        insect: defaultInsect,
        encyclopediaContent: ''
      });
      wx.showToast({ title: '加载异常，显示默认数据', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  // 从百度百科获取信息
  fetchFromBaiduEncyclopedia: async function() {
    // 如果昆虫名称为'未知昆虫'，提供输入昆虫名称的选项
    if (!this.data.insect || !this.data.insect.name || this.data.insect.name === '未知昆虫') {
      wx.showModal({
        title: '昆虫名称缺失',
        content: '当前昆虫名称不完整，需要您输入昆虫名称以获取百科信息',
        editable: true,
        placeholderText: '请输入昆虫名称',
        success: async (res) => {
          if (res.confirm && res.content && res.content.trim() !== '') {
            // 用户输入了昆虫名称，使用输入的名称获取百科信息
            await this._fetchEncyclopediaWithKeyword(res.content.trim());
          }
        }
      });
      return;
    }

    // 正常情况下，直接使用昆虫名称获取百科信息
    await this._fetchEncyclopediaWithKeyword(this.data.insect.name);
  },
  
  // 内部方法：使用关键词获取百科信息
  _fetchEncyclopediaWithKeyword: async function(keyword) {
    // 参数验证和日志
    console.log('准备获取百科信息，关键词:', keyword);
    
    if (!keyword || keyword.trim() === '') {
      console.error('关键词为空，无法获取百科信息');
      wx.showToast({ title: '关键词不能为空', icon: 'none' });
      return;
    }
    
    this.setData({ encyclopediaLoading: true });
    wx.showLoading({ title: `获取"${keyword}"的百科信息...` });
    
    try {
      // 确保参数格式正确
      const callFunctionParams = {
        name: 'fetchBaiduEncyclopedia',
        data: { keyword: keyword.trim() }
      };
      console.log('调用云函数参数:', callFunctionParams);
      
      const result = await wx.cloud.callFunction(callFunctionParams);

      if (result.result) {
        if (result.result.success) {
          this.setData({
            encyclopediaContent: result.result.content || ''
          });
          wx.showToast({ title: '获取成功' });
        } else {
          console.warn('百科信息获取失败:', result.result.message);
          wx.showToast({ 
            title: result.result.message || '获取失败', 
            icon: 'none',
            duration: 3000
          });
          // 保持原有的百科内容不变，不覆盖用户可能已编辑的内容
        }
      } else {
        console.error('百科信息返回结果异常');
        wx.showToast({ 
          title: '返回结果异常', 
          icon: 'none',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('获取百科信息失败:', error);
      // 根据错误类型提供更具体的错误提示
      let errorMessage = '获取异常';
      if (error.errCode) {
        errorMessage = `获取异常 (错误码: ${error.errCode})`;
      } else if (error.message) {
        errorMessage = `获取异常: ${error.message}`;
      }
      wx.showToast({ 
        title: errorMessage, 
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({ encyclopediaLoading: false });
      wx.hideLoading();
    }
  },

  // 处理百科内容输入
  onEncyclopediaInput: function(e) {
    this.setData({
      encyclopediaContent: e.detail.value
    });
  },

  // 保存百科信息
  saveEncyclopedia: async function() {
    console.log('开始保存百科信息...');
    
    if (!this.data.insectId || this.data.saving) {
      console.error('保存条件不满足:', { insectId: this.data.insectId, saving: this.data.saving });
      return;
    }

    console.log('保存参数:', {
      insectId: this.data.insectId,
      encyclopediaContentLength: this.data.encyclopediaContent ? this.data.encyclopediaContent.length : 0
    });

    this.setData({ saving: true });
    wx.showLoading({ title: '保存中...' });

    try {
      // 向云函数传递externalId参数，确保能正确识别昆虫
      console.time('云函数调用时间');
      const result = await wx.cloud.callFunction({
        name: 'updateInsectEncyclopedia',
        data: {
          externalId: this.data.insectId,
          encyclopedia: this.data.encyclopediaContent
        }
      });
      console.timeEnd('云函数调用时间');
      
      console.log('云函数调用结果:', JSON.stringify(result));

      if (result && result.result) {
        if (result.result.success) {
          console.log('保存成功，更新本地数据');
          
          // 保存成功后立即重新加载昆虫详情，验证数据是否真正保存到数据库
          console.log('保存成功后立即验证数据...');
          const verifyResult = await wx.cloud.callFunction({
            name: 'getInsectDetail',
            data: { insectId: this.data.insectId }
          });
          
          console.log('验证数据结果:', JSON.stringify(verifyResult));
          
          // 更新本地昆虫数据
          const updatedInsect = {
            ...this.data.insect,
            encyclopedia: this.data.encyclopediaContent
          };
          this.setData({ insect: updatedInsect });
          
          // 验证本地数据是否已更新
          console.log('本地数据更新后:', {
            encyclopediaLength: this.data.insect.encyclopedia ? this.data.insect.encyclopedia.length : 0
          });
          
          // 如果验证结果中存在encyclopedia字段，使用它更新encyclopediaContent
          if (verifyResult.result && verifyResult.result.encyclopedia) {
            console.log('从数据库验证获取的百科信息长度:', verifyResult.result.encyclopedia.length);
            this.setData({
              encyclopediaContent: verifyResult.result.encyclopedia
            });
            wx.showToast({ title: '保存并验证成功' });
          } else {
            console.warn('数据库中未找到保存的百科信息，但本地已更新');
            wx.showToast({ 
              title: '保存成功，建议刷新页面确认', 
              icon: 'success',
              duration: 2000
            });
          }
        } else {
          console.error('保存失败:', result.result);
          wx.showToast({ 
            title: result.result.message || '保存失败', 
            icon: 'none' 
          });
          
          // 显示详细错误信息到控制台
          if (result.result.errorCode) {
            console.error('错误代码:', result.result.errorCode);
          }
          if (result.result.errorDetails) {
            console.error('错误详情:', result.result.errorDetails);
          }
        }
      } else {
        console.error('云函数返回格式异常:', result);
        wx.showToast({ 
          title: '云函数返回异常', 
          icon: 'none' 
        });
      }
    } catch (error) {
      console.error('保存百科信息异常:', error);
      console.error('异常详情:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      wx.showToast({ 
        title: `保存异常: ${error.message || '未知错误'}`, 
        icon: 'none',
        duration: 3000
      });
    } finally {
      console.log('保存操作完成');
      this.setData({ saving: false });
      wx.hideLoading();
    }
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  }
});