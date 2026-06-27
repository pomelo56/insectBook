#!/bin/bash

# 部署 calliNat 云函数脚本

echo "========================================"
echo "开始部署 calliNat 云函数"
echo "========================================"

# 进入云函数目录
cd cloudfunctions/calliNat

echo ""
echo "1. 清理旧的依赖..."
rm -rf node_modules
rm -f package-lock.json

echo ""
echo "2. 安装依赖..."
npm install --production

echo ""
echo "3. 依赖安装完成，文件列表："
ls -lh

echo ""
echo "========================================"
echo "✅ 准备工作完成！"
echo "========================================"
echo ""
echo "接下来请在微信开发者工具中："
echo "1. 右键点击 cloudfunctions/calliNat 文件夹"
echo "2. 选择 '上传并部署：云端安装依赖'"
echo "3. 等待部署完成"
echo ""
echo "部署完成后，请测试昆虫识别功能"
echo "========================================"
