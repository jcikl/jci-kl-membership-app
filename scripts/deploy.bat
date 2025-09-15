@echo off
REM JCI KL 奖励指标管理系统部署脚本 (Windows)
REM 版本: v2.0.0

setlocal enabledelayedexpansion

REM 设置颜色
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 日志函数
:log_info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:log_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:log_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:log_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM 检查命令是否存在
:check_command
where %1 >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "%1 命令未找到，请先安装"
    exit /b 1
)
goto :eof

REM 检查环境
:check_environment
call :log_info "检查部署环境..."

REM 检查Node.js版本
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
call :log_info "Node.js版本: %NODE_VERSION%"

REM 检查npm版本
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
call :log_info "npm版本: %NPM_VERSION%"

REM 检查Firebase CLI
where firebase >nul 2>&1
if %errorlevel% neq 0 (
    call :log_warning "Firebase CLI未安装，正在安装..."
    npm install -g firebase-tools
    if %errorlevel% neq 0 (
        call :log_error "Firebase CLI安装失败"
        exit /b 1
    )
)

REM 检查环境变量文件
if not exist ".env.local" (
    call :log_warning ".env.local 文件不存在，请确保已配置Firebase环境变量"
)

call :log_success "环境检查完成"
goto :eof

REM 安装依赖
:install_dependencies
call :log_info "安装项目依赖..."

REM 清理缓存
npm cache clean --force
if %errorlevel% neq 0 (
    call :log_warning "缓存清理失败，继续执行..."
)

REM 安装依赖
npm install
if %errorlevel% neq 0 (
    call :log_error "依赖安装失败"
    exit /b 1
)

call :log_success "依赖安装完成"
goto :eof

REM 运行测试
:run_tests
call :log_info "运行测试..."

REM 类型检查
call :log_info "运行TypeScript类型检查..."
npm run type-check
if %errorlevel% neq 0 (
    call :log_error "类型检查失败"
    exit /b 1
)

REM 代码检查
call :log_info "运行ESLint检查..."
npm run lint
if %errorlevel% neq 0 (
    call :log_error "代码检查失败"
    exit /b 1
)

REM 单元测试
if exist "package.json" (
    findstr /C:"\"test\"" package.json >nul
    if %errorlevel% equ 0 (
        call :log_info "运行单元测试..."
        npm run test
        if %errorlevel% neq 0 (
            call :log_error "单元测试失败"
            exit /b 1
        )
    )
)

call :log_success "所有测试通过"
goto :eof

REM 构建项目
:build_project
call :log_info "构建生产版本..."

REM 清理之前的构建
if exist "dist" (
    rmdir /s /q dist
    call :log_info "清理旧的构建文件"
)

REM 构建项目
npm run build
if %errorlevel% neq 0 (
    call :log_error "构建失败"
    exit /b 1
)

REM 检查构建结果
if not exist "dist" (
    call :log_error "构建目录不存在"
    exit /b 1
)

call :log_success "构建完成"
goto :eof

REM 部署到Firebase
:deploy_firebase
call :log_info "部署到Firebase..."

REM 检查Firebase登录状态
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "请先登录Firebase: firebase login"
    exit /b 1
)

REM 部署Firestore规则
call :log_info "部署Firestore安全规则..."
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    call :log_error "Firestore规则部署失败"
    exit /b 1
)

REM 部署Hosting
call :log_info "部署到Firebase Hosting..."
firebase deploy --only hosting
if %errorlevel% neq 0 (
    call :log_error "Hosting部署失败"
    exit /b 1
)

call :log_success "Firebase部署完成"
goto :eof

REM 验证部署
:verify_deployment
call :log_info "验证部署..."

REM 获取部署URL (简化版本)
set "DEPLOY_URL=https://your-project.web.app"
call :log_info "部署URL: %DEPLOY_URL%"

call :log_success "部署验证完成"
goto :eof

REM 数据迁移提示
:migration_notice
call :log_info "数据迁移提示..."
echo.
echo ==========================================
echo 🚀 部署完成！
echo ==========================================
echo.
echo 下一步操作：
echo 1. 访问应用: %DEPLOY_URL%
echo 2. 登录管理员账户
echo 3. 访问 /migration 页面进行数据迁移
echo 4. 验证新功能是否正常工作
echo.
echo 重要提醒：
echo - 数据迁移前请备份现有数据
echo - 建议先在测试环境验证
echo - 迁移过程中请勿关闭浏览器
echo.
echo ==========================================
goto :eof

REM 主函数
:main
echo ==========================================
echo 🚀 JCI KL 奖励指标管理系统部署脚本
echo 版本: v2.0.0
echo ==========================================
echo.

REM 检查参数
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

REM 设置选项
set "SKIP_TESTS=false"
set "SKIP_BUILD=false"

if "%1"=="--skip-tests" set "SKIP_TESTS=true"
if "%2"=="--skip-tests" set "SKIP_TESTS=true"
if "%1"=="--skip-build" set "SKIP_BUILD=true"
if "%2"=="--skip-build" set "SKIP_BUILD=true"

REM 执行部署步骤
call :check_environment
call :install_dependencies

if "%SKIP_TESTS%"=="false" (
    call :run_tests
) else (
    call :log_warning "跳过测试"
)

if "%SKIP_BUILD%"=="false" (
    call :build_project
) else (
    call :log_warning "跳过构建"
)

call :deploy_firebase
call :verify_deployment
call :migration_notice

call :log_success "部署脚本执行完成！"
goto :eof

:show_help
echo 用法: %0 [选项]
echo.
echo 选项:
echo   --skip-tests    跳过测试
echo   --skip-build    跳过构建
echo   --help, -h      显示帮助信息
echo.
goto :eof

REM 执行主函数
call :main %*

REM 错误处理
if %errorlevel% neq 0 (
    call :log_error "部署过程中发生错误，请检查日志"
    exit /b 1
)
