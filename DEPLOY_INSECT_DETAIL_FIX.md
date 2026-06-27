# 昆虫详情修复部署指南

## 问题说明

虽然我们已经修改了`getInsectDetail`云函数的代码，确保在所有情况下都返回`encyclopedia`字段，但根据错误日志，用户仍然遇到了相同的错误：

```
detail-insect.js:104 加载昆虫详情失败: TypeError: Cannot read properties of undefined (reading 'encyclopedia')
```

这表明修改后的代码尚未部署到微信云开发环境，前端仍然在调用旧版本的云函数。

## 部署步骤

请按照以下步骤将修复后的云函数部署到云端环境：

### 方法一：使用微信开发者工具部署

1. 打开微信开发者工具并加载项目
2. 确保登录状态有效
3. 找到左侧导航栏中的「云开发」按钮并点击
4. 在云开发控制台中，找到「云函数」选项卡
5. 找到`getInsectDetail`云函数，点击右侧的「上传并部署」按钮
6. 选择「云端安装依赖」选项，确保所有依赖正确安装
7. 等待部署完成，看到成功提示后关闭

### 方法二：使用命令行部署（可选）

项目中已经有一个部署脚本，可以使用以下命令部署特定的云函数：

```bash
cd /Users/pomelo/WeChatProjects/insectBook

# 只部署getInsectDetail云函数
bash uploadCloudFunction.sh getInsectDetail
```

## 验证部署

部署完成后，请按照以下步骤验证部署是否成功：

1. 在云开发控制台中，找到已部署的`getInsectDetail`云函数
2. 点击「测试」按钮
3. 输入测试参数：
   ```json
   {
     "insectId": "insect_mhlajdxg4qleo6p"
   }
   ```
4. 检查返回结果中是否包含`encyclopedia`字段

## 注意事项

- 确保部署到正确的环境（环境ID：cloud1-8ggzed032ed5e7ec）
- 部署后可能需要等待几分钟让缓存生效
- 如果部署后仍然遇到问题，请检查云函数的日志，查看是否有其他错误

## 常见问题排查

1. **部署失败**：检查网络连接，确保有足够的权限
2. **依赖安装失败**：尝试手动安装依赖后再部署
3. **函数执行超时**：检查代码中是否有耗时操作
4. **返回数据结构错误**：确认代码中所有返回路径都包含`encyclopedia`字段

部署完成后，昆虫详情页应该能够正常加载，不会再出现`Cannot read properties of undefined (reading 'encyclopedia')`错误。