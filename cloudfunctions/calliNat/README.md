# calliNat 云函数

## 功能说明

该云函数用于通过豆包视觉模型识别昆虫图片，返回具体的昆虫物种名称。

## API配置指南

### 环境变量配置

在部署前，需要在云函数的环境变量中配置以下参数：

1. `ARK_API_KEY` - 火山引擎API密钥
2. `ARK_BASE_URL` - API基础URL，默认值：`https://ark.cn-beijing.volces.com/api/v3`
3. `MODEL_ID` - 模型ID，默认值：`doubao-seed-1-6-vision-250815`

### 依赖安装

使用以下命令安装依赖：

```bash
cd /path/to/cloudfunctions/calliNat
npm install
```

## API请求参数

调用云函数时需要传入以下参数：

| 参数名 | 类型 | 必选 | 说明 |
|-------|------|------|------|
| imageBase64 | String | 是 | 图片的Base64编码字符串（可选包含前缀） |

## API返回结果

云函数返回的结果结构如下：

```json
{
  "isRecognized": Boolean,  // 是否成功识别
  "insectName": String,     // 识别出的昆虫名称或"未识别出昆虫"
  "choices": Array,         // 原始API返回的choices数组（供调试使用）
  "features": Object        // 功能特性标记（当前为空对象）
}
```

## 使用示例

### 小程序端调用示例

```javascript
// 拍摄照片或选择图片后
const tempFilePath = '...'; // 临时文件路径

wx.getFileSystemManager().readFile({
  filePath: tempFilePath,
  encoding: 'base64',
  success: res => {
    const base64Data = res.data;
    wx.cloud.callFunction({
      name: 'calliNat',
      data: {
        imageBase64: base64Data
      },
      success: result => {
        const { isRecognized, insectName } = result.result;
        if (isRecognized) {
          console.log('成功识别昆虫：', insectName);
          // 处理识别成功的逻辑
        } else {
          console.log('未识别出昆虫');
          // 处理未识别的逻辑
        }
      },
      fail: err => {
        console.error('调用云函数失败', err);
      }
    });
  }
});
```

## 注意事项

1. 确保传入的图片质量良好，清晰展示昆虫特征
2. 过大的图片会被自动压缩以满足API要求
3. 识别结果依赖于模型的能力，对于不常见或特征不明显的昆虫可能无法准确识别
4. 超时时间设置为20秒，确保足够的处理时间

## 技术细节

- 使用了request-promise库发起HTTP请求
- 图片预处理包括Base64编码处理和大小压缩
- 提示词优化为精确的种级识别指令
- 结果处理包括清洗、验证和格式化

## 故障排除

如果遇到识别失败或错误，请检查：
1. API密钥是否正确配置
2. 图片是否清晰且包含足够的昆虫特征
3. 云函数的超时设置是否合适
4. 查看云函数日志获取详细错误信息# 豆包视觉识别服务配置指南 - 增强调试版

## 重要提示：API端点配置

为了解决可能出现的"无法连接到豆包API服务器"问题，云函数现在支持通过环境变量自定义豆包API端点。本配置指南已根据最新的火山方舟API使用规范进行更新。

## 配置说明

本云函数用于昆虫识别服务，基于豆包Seed-1.6-vision视觉模型实现。
当前版本已集成**全面的调试日志功能**，可帮助快速定位API调用失败原因。

### Doubao-Seed-1.6-vision模型介绍

Doubao-Seed-1.6-vision是火山引擎平台上的豆包大模型家族首个具备工具调用能力的视觉深度思考模型，拥有强大的通用多模态理解和推理能力，特别适合图像识别任务。

**模型特点：**
- 支持高清图像识别
- 强大的视觉理解和推理能力
- 适合复杂场景的识别任务
- 支持JSON格式输出

## 环境变量配置

## 获取火山方舟API Key

在配置环境变量前，您需要先获取火山方舟API密钥：

1. 登录 `https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey` ，进入 **系统管理 > API Key 管理**
2. 点击「新建 API Key」，生成并复制 `API Key`（需妥善保管，避免公开）

### 必要环境变量

云函数需要配置以下环境变量：

- **ARK_API_KEY**: 您申请的火山引擎API密钥（**必需**，这是环境变量名称，键值应设置为您的实际API密钥值）
- **ARK_BASE_URL**: 火山引擎API基础URL（**必需**，设置为`https://ark.cn-beijing.volces.com/api/v3/`，**注意末尾需要包含斜杠**）
- **MODEL_ID**: 豆包视觉模型ID（**必需**，设置为`doubao-seed-1-6-vision-250815`）
  > **重要提示**：经测试，云函数环境下默认的`api.doubao.com`域名可能存在DNS解析问题。请务必使用火山引擎版本的API端点。
  > **注意**：设置环境变量时，请确保值中不包含反引号(`)、引号或空格等特殊字符

### 模型配置说明

**重要配置参数：**

- **模型名称**: `doubao-seed-1-6-vision-250815`（火山引擎平台最新推荐的模型版本，**请勿拼写为oubao**）
- **API基础URL**: 必须使用火山引擎地址 `https://ark.cn-beijing.volces.com/api/v3/`（**注意末尾需要包含斜杠**）
- **完整API端点**: 会自动拼接为 `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
- **认证方式**: Bearer Token（代码会自动为API密钥添加Bearer前缀）
- **请求格式**: JSON格式，支持多模态（文本+图像）
- **响应格式**: 支持JSON对象输出（推荐）

### 重要注意事项
1. **环境变量格式**: 确保ARK_BASE_URL不包含任何反引号、单引号、双引号或空格
2. **API密钥格式**: **不要**添加`Bearer `前缀，代码会自动处理
3. **模型名称**: 使用推荐的模型ID `doubao-seed-1-6-vision-250815`
4. **权限检查**: 确保您已在火山引擎控制台正确开通了该模型的访问权限
5. **API Key完整性**: 确保API Key值完整正确，没有多余的空格或换行符

如果遇到连接问题，尤其是"ENOTFOUND"错误（DNS解析失败），请尝试以下解决方案：

1. **必须使用火山引擎版本API基础URL**：在云开发控制台设置环境变量`ARK_BASE_URL`为：
   ```
   https://ark.cn-beijing.volces.com/api/v3/
   ```
   **注意：URL末尾必须包含斜杠(/)**

2. **清除特殊字符**：确保环境变量值中不包含任何特殊字符（反引号、引号、空格等）

3. **重新部署云函数**：修改环境变量后，务必重新部署云函数使其生效

4. **联系技术支持**：如果问题仍然存在，请联系火山引擎技术支持确认您的API密钥对应的正确端点地址

> **最新更新**：代码已自动优化，现在会自动尝试使用火山引擎版本的API端点。但仍然建议手动配置环境变量以确保最佳连接效果。

请根据您申请的API密钥类型使用相应的端点地址。

### 配置方法

**安全建议：** 出于安全考虑，API密钥等敏感信息应始终通过云开发控制台的环境变量功能进行配置，而不应硬编码在任何代码文件中，包括config.json和project.config.json。这可以防止API密钥泄露，特别是在代码提交到版本控制系统时。

#### 方法一：通过config.json配置（仅用于参考，不推荐存储真实API密钥）

在微信小程序云函数目录下的`config.json`文件中可以配置环境变量，但**强烈不建议在其中存储真实的API密钥**，因为这存在安全风险：

```json
{
  "timeout": 30000,
  "permissions": {
    "openapi": [
      "wxacode.get",
      "templateMessage.send"
    ]
  },
  "env": {
    "ARK_API_KEY": "",  // 请使用云开发控制台配置真实API密钥
    "ARK_BASE_URL": "https://ark.cn-beijing.volces.com/api/v3/",
    "MODEL_ID": "doubao-seed-1-6-vision"
  }
}
```

> **重要安全提示**：在config.json中存储API密钥是不安全的，尤其是当代码需要提交到版本控制系统时。真实的API密钥应当只通过云开发控制台进行配置。

#### 方法二：通过云开发控制台配置（**强烈推荐**，最安全的方式）

1. 打开微信开发者工具
2. 进入云开发控制台
3. 选择目标云函数（calliNat），进入「函数配置」
4. 在「环境变量」栏点击「添加」，输入：
   - **键**：`ARK_API_KEY`  
   - **值**：粘贴您的火山方舟API密钥
5. 同样添加：
   - **键**：`ARK_BASE_URL`
   - **值**：`https://ark.cn-beijing.volces.com/api/v3/`（**注意末尾需要包含斜杠**）
6. 同样添加：
   - **键**：`MODEL_ID`
   - **值**：`doubao-seed-1-6-vision-250815`
7. 点击「保存」，并**重新部署云函数**（环境变量需重新部署生效）

#### 方法三：通过 `project.config.json` 配置（不推荐，存在安全风险）

在小程序根目录的 `project.config.json` 中添加云函数环境变量：
```json
{
  "cloudfunctionRoot": "cloudfunctions/",
  "cloudfunctionTemplateRoot": "cloudfunctionTemplate/",
  "cloudfunction": {
    "calliNat": {  // 云函数名称
      "envVariables": {
        "ARK_API_KEY": "your-ark-api-key-here",  // 替换为实际密钥
        "ARK_BASE_URL": "https://ark.cn-beijing.volces.com/api/v3/",
        "MODEL_ID": "doubao-seed-1-6-vision-250815"
      }
    }
  }
}
```
保存后，右键云函数选择「上传并部署」

#### 方法四：通过云开发CLI配置（推荐使用，但需注意命令历史记录安全）

```bash
# 登录云开发
cloud login

# 设置环境变量
cloud env set ARK_API_KEY "您的火山引擎API密钥"
cloud env set ARK_BASE_URL "https://ark.cn-beijing.volces.com/api/v3"
cloud env set MODEL_ID "doubao-seed-1-6-vision-250815"
```

## 部署步骤

### 1. 安装依赖

在`calliNat`云函数目录下执行：

```bash
cd /Users/pomelo/WeChatProjects/insectBook/cloudfunctions/calliNat
npm run install-deps
# 或直接执行: npm install --production
```

### 2. 上传并部署云函数

#### 通过微信开发者工具部署

1. 打开微信开发者工具
2. 在「云开发」面板中选择`calliNat`云函数
3. 右键点击，选择「上传并部署 - 云端安装依赖」
4. 等待部署完成

#### 通过脚本部署

如果项目中有部署脚本，可以参考以下命令：

```bash
# 进入项目根目录
cd /Users/pomelo/WeChatProjects/insectBook

# 执行部署命令（如果有相应脚本）
./deploy_callinat.sh
```

## 调试日志查看方法

### 方法1：通过微信开发者工具查看

## 小程序调用方法
### 前提条件
1. **开通模型服务**：在 `https://console.volcengine.com/ark/region:ark+cn-beijing/openManagement` 搜索并开通 `doubao-seed-1-6-vision` 模型。
2. **获取API Key**：在 `https://console.volcengine.com/ark/region:ark+cn-beijing/apikey` 生成API Key（用于鉴权）。
3. **小程序网络配置**：确保小程序支持HTTPS请求，且已配置火山方舟API域名（`ark.cn-beijing.volces.com`）的跨域白名单。

### 调用云函数示例代码
```javascript
// 小程序端调用云函数示例
wx.cloud.callFunction({
  name: 'calliNat',
  data: {
    imageBase64: 'BASE64编码的图片数据' // 替换为实际的Base64编码图片
  },
  success: res => {
    console.log('昆虫识别成功:', res.result);
    const insectInfo = res.result.result[0];
    // 展示识别结果
    wx.showModal({
      title: '昆虫识别结果',
      content: `名称: ${insectInfo.name}\n分类: ${insectInfo.category || '未知分类'}\n描述: ${insectInfo.description || '暂无描述'}`,
      showCancel: false
    });
  },
  fail: err => {
    console.error('调用云函数失败:', err);
    wx.showToast({
      title: '识别失败，请重试',
      icon: 'none'
    });
  }
});
```

### 在云函数中调用Doubao-Seed-1.6-vision API

在云函数代码中，您可以通过以下方式调用API：

```javascript
// 使用获取的环境变量调用API
const response = await cloud.openapi.ark.invoke({
  model: "doubao-seed-1-6-vision",
  apiKey: process.env.ARK_API_KEY,
  input: {
    role: "user",
    content: "识别这张图片中的昆虫",
    image: "base64-encoded-image"
  }
});
```

### 部署和验证指南

#### 重新部署云函数

在修改配置后，必须重新部署云函数才能使环境变量生效：

1. **通过微信开发者工具部署**
   - 右键点击云函数目录（calliNat）
   - 选择「上传并部署 - 云端安装依赖」
   - 等待部署完成

2. **通过命令行部署**（如果有相应脚本）
   ```bash
   # 进入项目根目录
   cd /Users/pomelo/WeChatProjects/insectBook
   
   # 部署云函数
   cloud functions deploy calliNat --force
   ```

#### 验证配置是否正确

部署完成后，可以通过以下方法验证配置是否正确：

1. **查看云函数日志**
   - 打开微信开发者工具
   - 进入「云开发」面板
   - 选择「日志」
   - 过滤条件选择「calliNat」云函数
   - 查找环境变量初始化日志，确认ARK_API_KEY、ARK_BASE_URL和MODEL_ID都已正确加载

2. **测试调用云函数**
   - 使用小程序端测试代码调用云函数
   - 检查返回结果是否正常
   - 查看日志中是否有API调用成功的记录

#### 问题排查建议

如果配置后仍有问题，可以尝试以下排查步骤：

1. **环境变量注入检查**
   - 确认环境变量是否成功注入
   - 检查云函数日志中的环境变量初始化信息

2. **临时测试方法**
   - 尝试直接在代码中临时写入API Key进行测试，确认API本身是否可用
   - 注意：测试完成后请删除硬编码的API Key

3. **检查网络配置**
   - 确保小程序已配置火山方舟API域名的跨域白名单
   - 检查云函数的网络访问权限是否开启

4. **API Key有效性验证**
   - 在火山方舟控制台验证API Key是否有效
   - 确认是否已开通doubao-seed-1-6-vision模型的访问权限

### 直接调用火山方舟API示例（仅参考）
```javascript
// 小程序端直接调用火山方舟API示例（注意：出于安全考虑，建议通过云函数调用）
wx.request({
  url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + '你的API_KEY' // 替换为实际API Key
  },
  data: {
    "model": "doubao-seed-1-6-vision", // 模型ID
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "请识别这张图片中的昆虫种类，并描述其特征。"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/jpeg;base64,BASE64编码的图片数据" // 替换为实际图片数据
            }
          }
        ]
      }
    ],
    "response_format": {
      "type": "json_object"
    }
  },
  success(res) {
    console.log("识别结果：", res.data.choices[0].message.content);
    // 将结果展示给用户
  },
  fail(err) {
    console.error("调用失败：", err);
  }
});
```

### 注意事项
1. **安全性**：API Key不应直接硬编码在小程序中，建议通过云函数调用API
2. **图片处理**：确保Base64编码的图片数据不包含前缀（如'data:image/jpeg;base64,'）
3. **网络优化**：在小程序中使用云函数可以避免跨域问题，并利用云函数的网络优势
4. **错误处理**：添加完善的错误处理机制，确保用户体验

## Doubao-Seed-1.6-vision模型调用示例

### 请求结构示例（内部实现参考）

```javascript
{
  "model": "doubao-seed-1.6-vision", // 火山引擎使用小写格式
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "请识别图片中的昆虫或小动物，返回其名称、分类和描述..."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
          }
        }
      ]
    }
  ],
  "temperature": 0.1,
  "max_tokens": 1000,
  "response_format": {
    "type": "json_object" // 确保返回JSON格式
  }
}
```

### 常见问题解答

**Q: 为什么使用默认API端点会连接失败？**
A: 云函数环境下默认的`api.doubao.com`域名可能存在DNS解析问题。请务必使用火山引擎版本的API端点。

**Q: 模型名称有大小写要求吗？**
A: 是的，在火山引擎平台上，模型名称需要使用小写格式：`doubao-seed-1.6-vision`。

**Q: 如何确保返回JSON格式的结果？**
A: 代码中已添加`response_format`参数，设置为`json_object`可以确保模型返回标准JSON格式。

**Q: 图像数据有大小限制吗？**
A: 建议将图像压缩至1MB以下，过大的图像可能导致API调用失败或超时。

**Q: 为什么API返回的不是JSON格式？**
A: 检查是否添加了`response_format`参数，同时在提示词中明确要求返回JSON格式内容。

## 模型能力说明

doubao-seed-1.6-vision支持以下能力：
- ✅ 视觉理解（图片/视频识别）  
- ✅ 深度思考（复杂推理）  
- ✅ 流式输出（需在API中设置`stream: true`）  
- ✅ 工具调用、结构化输出等  

详细能力可参考 `https://www.volcengine.com/docs/82379/1799865`

### 最佳实践建议

1. **始终使用火山引擎API端点**：确保设置正确的API端点地址
2. **检查模型名称格式**：使用小写格式的模型名称
3. **优化图像质量**：提供清晰、光线充足的昆虫图像
4. **明确提示词**：在提示词中明确要求返回JSON格式的识别结果
5. **配置环境变量**：通过云开发控制台正确设置环境变量
6. **查看调试日志**：利用增强的日志功能排查问题

> **提示**：代码已优化为自动优先使用火山引擎API端点，但仍建议通过环境变量手动配置以确保最佳效果。

1. 打开微信开发者工具
2. 进入「云开发」控制台
3. 点击「云函数」标签
4. 找到「calliNat」函数
5. 点击「日志」标签查看详细日志

### 方法2：通过云开发控制台查看

1. 登录微信公众平台
2. 进入「云开发」控制台
3. 选择「函数服务」
4. 找到「calliNat」函数并查看日志

## 关键日志点说明

1. **环境变量检查**：日志中包含 `API密钥状态` 信息，显示密钥是否存在及长度
2. **API调用过程**：记录请求时间、URL、响应状态码等
3. **响应解析**：详细记录响应结构和内容预览
4. **错误处理**：精确显示错误类型、状态码和详情

## 验证部署

部署完成后，可以通过以下方式验证：

1. 在云开发控制台中查看`calliNat`云函数的日志
2. 检查是否有环境变量配置错误的提示
3. 进行一次昆虫识别测试

## 常见问题排查指南

### 1. API密钥问题

- **症状**：日志中显示 `无API_KEY` 或 `API密钥无效` 或 小程序前端报错 `配置错误: 无API_KEY - 密钥缺失`
- **解决**：
  - 检查云函数环境变量配置是否正确
  - 确保 `ARK_API_KEY` 名称拼写无误（大小写敏感）
  - 验证API密钥值是否正确（非空且格式正确）
  - 重新部署云函数并确认环境变量已生效
  - 检查环境变量是否正确设置在云函数的函数配置中，而非全局设置

### 2. 网络连接问题

- **症状**：日志中包含 `ENOTFOUND`、`DNS`、`socket` 等关键词
- **解决**：
  - 检查云函数所在环境是否开启了外网访问权限（在云开发控制台设置中开启）
  - 检查网络防火墙设置
  - 验证火山引擎API端点是否可访问
  - 可通过设置环境变量`ARK_BASE_URL`来自定义API基础URL
  - 查看日志中的网络请求错误信息，特别关注`NetworkError`类型的日志

### 3. API端点问题

- **症状**：遇到"无法连接到API服务器"错误
- **解决**：
  - 可能是API端点已更新，可通过设置环境变量`ARK_BASE_URL`来使用最新的API地址
  - 检查火山引擎官方文档获取最新的API接入地址
  - 云函数已配置`strictSSL: false`以解决可能的证书验证问题

### 4. 识别失败

如果识别结果不理想，请尝试：
- 提供更清晰的昆虫图片
- 确保昆虫在图片中占比较大
- 确保光线充足，背景不复杂

### 5. 超时错误

如果遇到超时错误：
- 检查网络连接
- 尝试减小图片大小
- 稍后重试

### 6. API响应格式问题

- **症状**：日志中显示 `JSON解析错误` 或 `响应格式不符合预期`
- **解决**：
  - 检查API密钥权限是否包含视觉识别功能
  - 验证请求参数格式是否正确

### 7. 权限问题

- **症状**：日志中出现 `403` 错误
- **解决**：
  - 确认API密钥有调用Seed-1.6-vision模型的权限
  - 检查账号是否有足够的调用额度

## 调试信息说明

### 关键日志点

1. **环境变量检查**：
   - 记录API密钥是否存在
   - 显示环境变量键名列表
   - 记录API密钥长度（隐藏敏感部分）
   - 记录API端点配置信息

2. **网络连接诊断**：
   - 记录网络连接诊断信息
   - 显示Node.js版本、平台架构等环境信息
   - 记录网络配置参数（超时、SSL设置等）
   - 记录API端点地址

3. **API调用过程**：
   - 记录请求配置详情（隐藏敏感信息）
   - 记录API调用耗时
   - 记录响应状态码和内容预览
   - 记录网络错误详细诊断信息

4. **响应解析**：
   - 记录JSON解析结果
   - 记录转换后的百度API格式数据
   - 记录非JSON格式的回退处理

5. **错误处理**：
   - 记录详细的错误信息和堆栈
   - 记录重试策略执行情况
   - 记录最终返回的错误信息
   - 记录网络错误的可能原因

## 依赖管理

- request-promise: ^4.2.6
- wx-server-sdk: ~3.0.1

## 测试方法

建议使用微信开发者工具的「云函数本地调试」功能进行快速测试，可直接查看详细日志输出。

## 注意事项

1. 请确保API密钥保密，不要硬编码在代码中
2. 避免频繁调用API，防止触发频率限制
3. 对于大图片，考虑在调用前进行压缩处理

## 技术说明

- 云函数使用豆包Seed-1.6-vision模型进行视觉识别
- 支持错误重试和详细日志记录
- 返回格式与原百度API兼容，便于前端处理
- 包含JSON解析容错机制，确保服务稳定性