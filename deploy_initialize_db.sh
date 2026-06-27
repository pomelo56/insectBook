#!/bin/bash

echo "============================================="
echo "昆虫图鉴小程序 - 数据库初始化函数部署脚本"
echo "============================================="

echo "开始部署 initializeDatabase 云函数..."

# 进入云函数目录
cd /Users/pomelo/WeChatProjects/insectBook/cloudfunctions

# 确认目录存在
if [ ! -d "initializeDatabase" ]; then
  echo "错误：initializeDatabase 目录不存在！"
  exit 1
fi

# 进入initializeDatabase目录
cd initializeDatabase

echo "确认必要文件存在..."
if [ ! -f "index.js" ] || [ ! -f "package.json" ] || [ ! -f "config.json" ]; then
  echo "错误：缺少必要的函数文件！"
  exit 1
fi

echo "文件检查通过，准备执行手动部署步骤..."
echo ""
echo "============================================="
echo "手动部署步骤："
echo "============================================="
echo "1. 打开微信开发者工具"
echo "2. 点击左侧菜单的 '云开发' 按钮"
echo "3. 进入 '云函数' 页面"
echo "4. 点击右上角的 '新建云函数' 按钮"
echo "5. 函数名称填写：initializeDatabase"
echo "6. 保持默认配置，点击 '确定'"
echo "7. 等待函数创建完成后，点击 '上传并部署：云端安装依赖'"
echo ""
echo "如果无法通过界面部署，可以尝试使用微信开发者工具的CLI命令："
echo "在微信开发者工具的菜单栏中，点击 '工具' -> '开发者工具命令行'"
echo "复制命令行路径，然后使用以下命令部署："
echo "<微信开发者工具CLI路径> upload --project /Users/pomelo/WeChatProjects/insectBook --upload-path cloudfunctions/initializeDatabase --upload-desc 'initializeDatabase'"
echo ""
echo "============================================="
echo "函数部署后，请点击 '测试' 按钮执行数据库初始化！"
echo "============================================="

echo "脚本执行完成，祝您部署顺利！"