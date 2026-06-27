# 火山方舟API配置指南

## 一、开通模型服务

1. **登录火山引擎控制台**：访问 [https://console.volcengine.com](https://console.volcengine.com)
2. **进入方舟平台**：在左侧菜单中找到并点击"方舟"服务
3. **开通模型**：在模型广场搜索 `doubao-seed-1-6-vision` 模型（注意使用连字符格式，不是点号），点击"立即开通"
4. **确认开通**：根据提示完成开通流程和相关协议签署

## 二、获取API Key

1. **进入API密钥管理**：访问 [https://console.volcengine.com/ark/region:ark+cn-beijing/apikey](https://console.volcengine.com/ark/region:ark+cn-beijing/apikey)
2. **创建密钥**：点击"新建密钥"按钮
3. **保存密钥**：创建成功后，复制并安全保存`API Key`（如`AKLTY2RjODk3ZTEyN2Y4YjE4NzQxN2E5NzQxN2E5NzQxN2E5NzQxN2E5`）
4. **注意事项**：API密钥非常重要，请妥善保管，避免泄露

## 三、配置云函数环境变量

### 微信云开发控制台配置

1. **登录微信云开发控制台**：访问 [https://console.cloud.tencent.com/tcb](https://console.cloud.tencent.com/tcb)
2. **进入云函数**：找到并点击`calliNat`云函数
3. **配置环境变量**：
   - 点击"函数配置"
   - 在"环境变量"部分添加以下配置：
     - **ARK_API_KEY**: 输入从火山引擎获取的完整API Key（**重要**：不要添加Bearer前缀，代码会自动处理）
     - **ARK_BASE_URL**: 设置为`https://ark.cn-beijing.volces.com/api/v3/`（默认火山方舟API域名，**注意末尾需要包含斜杠**）
     - **MODEL_ID**: 设置为`doubao-seed-1-6-vision-250815`（Doubao-Seed-1.6-vision的Model ID，**请勿拼写为oubao**）
4. **保存配置**：点击"保存"按钮
5. **重新部署**：保存后重新部署云函数

### 注意事项
- 确保环境变量名称完全正确
- **API Key不需要添加Bearer前缀**，代码会自动处理
- 不要在API端点URL中包含任何多余的引号、反引号或空格
- 确保API Key值完整正确，没有多余的空格或换行符

## 四、云函数代码示例

```javascript
// 云函数入口文件
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 调用Doubao-Seed-1.6-vision API
exports.main = async (event, context) => {
  const { imageUrl, question } = event; // 接收小程序传递的图片URL和问题
  const { ARK_API_KEY, ARK_BASE_URL, MODEL_ID } = process.env;

  try {
    const response = await axios.post(
      `${ARK_BASE_URL}/chat/completions`,
      {
        model: MODEL_ID,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } }, // 图片URL
              { type: "text", text: question } // 昆虫识别问题
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ARK_API_KEY}`
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("API调用失败:", error.response?.data || error.message);
    throw new Error("调用模型失败，请检查参数或API Key");
  }
};
```

## 五、小程序端调用云函数

```javascript
// 小程序页面代码
wx.cloud.callFunction({
  name: 'calliNat',
  data: {
    imageUrl: 'https://example.com/insect.jpg', // 昆虫图片URL（需公网可访问）
    question: '请识别这是什么昆虫？'
  }
}).then(res => {
  console.log("识别结果:", res.result);
  wx.showModal({
    title: "昆虫识别结果",
    content: res.result,
    showCancel: false
  });
}).catch(err => {
  console.error("云函数调用失败:", err);
});
```

## 六、小程序网络配置

1. **打开小程序项目**：在微信开发者工具中打开项目
2. **配置request合法域名**：
   - 进入"详情" → "本地设置" → "项目设置"
   - 在"request合法域名"中添加：`https://ark.cn-beijing.volces.com`
   - 点击"确定"保存

## 七、测试验证

1. **部署云函数**：在微信开发者工具中上传并部署`calliNat`云函数
2. **测试调用**：在小程序中调用云函数，上传昆虫图片进行测试
3. **查看日志**：在微信云开发控制台查看云函数运行日志，确认API调用状态

## 八、常见问题排查

### 1. 配置错误: 无API_KEY - 密钥缺失
- **症状**：小程序前端报错 `配置错误: 无API_KEY - 密钥缺失`
- **排查步骤**：
  - 检查云函数是否重新部署（环境变量修改后必须重新部署）
  - 确认环境变量键名是否为 `ARK_API_KEY`（大小写敏感）
  - 验证环境变量是否正确设置在云函数的函数配置中，而非全局设置
  - 检查API Key值是否完整，没有多余空格或换行符
  - 查看云函数日志，确认环境变量是否成功加载

### 2. API连接失败 (ENOTFOUND)
- 检查API端点URL是否正确（`https://ark.cn-beijing.volces.com/api/v3/`，**注意末尾需要包含斜杠**）
- 确认网络连接正常
- 检查域名是否已添加到小程序合法域名列表
- 验证云函数是否开启互联网访问权限

### 3. 认证失败 (401)
- 检查API Key格式是否正确，确保没有添加Bearer前缀
- 确认API Key没有过期或被吊销
- 验证API Key是否完整复制，没有遗漏字符

### 4. 模型错误 (404 Model Not Found)
- 确认已成功开通`doubao-seed-1-6-vision-250815`模型
- 检查MODEL_ID环境变量是否配置正确，**特别注意"doubao"不要拼写为"oubao"**
- 确认您的API密钥有该模型的访问权限
- 验证模型ID格式是否正确（使用连字符格式）

### 5. 请求超时
- 检查图片大小是否过大，建议压缩后再上传
- 尝试增加超时时间配置
- 检查网络连接稳定性

### 6. 400 InvalidParameter
- 检查图片URL是否有效或参数格式是否正确
- 确保图片URL为公网可访问
- 检查请求参数是否符合API规范

### 7. API端点URL格式问题
- 确保URL末尾包含斜杠(`/`)
- 移除URL中的任何反引号(`)、引号或空格
- 验证URL是否以`https://`开头

## 九、模型能力说明

doubao-seed-1.6-vision支持以下能力：
- ✅ 视觉理解（图片/视频识别）  
- ✅ 深度思考（复杂推理）  
- ✅ 流式输出（需在API中设置`stream: true`）  
- ✅ 工具调用、结构化输出等  

详细能力可参考 [https://www.volcengine.com/docs/82379/1799865](https://www.volcengine.com/docs/82379/1799865)

## 十、最佳实践

1. **安全性**：绝对禁止在前端代码中直接暴露API Key，必须通过云函数中转

2. **图片预处理**：
   - 压缩图片尺寸（建议宽度不超过1000px）
   - 控制图片质量，平衡清晰度和文件大小
   - 小程序端上传图片前压缩至300KB以内，减少API调用耗时

3. **错误处理**：
   - 在小程序中实现完善的错误捕获和用户提示
   - 记录关键错误日志，便于排查问题

4. **性能优化**：
   - 实现图片本地缓存，减少重复上传
   - 对识别结果进行缓存，提高用户体验
   - 若需处理大图片，可使用`stream: true`参数开启流式响应（需调整代码逻辑）

5. **配置规范**：
   - 在API中指定正确的`model`参数
   - 确保URL格式正确，包含必要的斜杠
   - 定期检查API密钥有效性

## 十一、图片要求

- 图片URL需为公网可访问（推荐使用微信云存储或火山TOS生成的临时链接）
- 图片格式支持JPG/PNG/WebP，单张图片大小不超过10MB
- 确保云函数已开启**互联网访问权限**（在云开发控制台→云函数→设置中开启）

## 十二、参考资源

- [火山引擎方舟文档](https://www.volcengine.com/docs/82379/1185831)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [豆包视觉模型介绍](https://www.volcengine.com/product/ark/model-detail/doubao-seed-1-6-vision)
- [图片压缩优化指南](https://www.volcengine.com/docs/82379/1362931#f6bc4e62)