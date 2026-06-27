#!/bin/bash

# 实际的云函数部署脚本
echo "=== 开始部署 getInsectDetail 云函数 ==="

echo "1. 进入云函数目录..."
cd "/Users/pomelo/WeChatProjects/insectBook/cloudfunctions/getInsectDetail"

# 检查package.json文件是否存在
if [ ! -f "package.json" ]; then
  echo "错误：找不到 package.json 文件"
  exit 1
fi

echo "2. 安装依赖..."
npm install

if [ $? -ne 0 ]; then
  echo "错误：依赖安装失败"
  exit 1
fi

echo "3. 依赖安装成功，准备部署..."
echo ""
echo "注意：微信小程序云函数的实际部署需要通过微信开发者工具进行"
echo "请按照以下步骤在微信开发者工具中手动部署："
echo ""
echo "1. 打开微信开发者工具并加载项目"
echo "2. 点击左侧导航栏的「云开发」按钮"
echo "3. 在云开发控制台中，选择「云函数」标签"
echo "4. 找到 getInsectDetail 云函数"
echo "5. 点击「上传并部署」-> 「云端安装依赖」"
echo "6. 确保部署到环境ID：cloud1-8ggzed032ed5e7ec"
echo ""
echo "=== 部署准备完成，请在微信开发者工具中完成最终部署步骤 ==="