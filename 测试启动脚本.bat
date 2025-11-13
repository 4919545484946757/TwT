@echo off
chcp 65001 >nul
title TwT启动脚本

echo.
echo ========================================
echo            TwT 启动脚本
echo ========================================
echo.

REM 检查当前目录是否存在package.json文件
if not exist "package.json" (
    echo 错误：在当前目录中未找到 package.json 文件！
    echo 请确保在包含 package.json 的目录中运行此脚本。
    echo.
    pause
    exit /b 1
)

echo 正在启动 npm run start...
echo.

REM 执行npm run start命令
npm run start

REM 检查命令执行结果
if errorlevel 1 (
    echo.
    echo npm run start: 命令执行失败
    echo 错误代码: %errorlevel%
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo 程序已退出。
pause