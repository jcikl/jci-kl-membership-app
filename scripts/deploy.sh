#!/bin/bash

# JCI KL 奖励指标管理系统部署脚本
# 版本: v2.0.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 命令未找到，请先安装"
        exit 1
    fi
}

# 检查环境
check_environment() {
    log_info "检查部署环境..."
    
    # 检查Node.js版本
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        log_error "Node.js版本过低，需要 >= $REQUIRED_VERSION，当前版本: $NODE_VERSION"
        exit 1
    fi
    
    # 检查npm版本
    NPM_VERSION=$(npm -v)
    log_info "npm版本: $NPM_VERSION"
    
    # 检查Firebase CLI
    if ! command -v firebase &> /dev/null; then
        log_warning "Firebase CLI未安装，正在安装..."
        npm install -g firebase-tools
    fi
    
    # 检查环境变量文件
    if [ ! -f ".env.local" ]; then
        log_warning ".env.local 文件不存在，请确保已配置Firebase环境变量"
    fi
    
    log_success "环境检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 清理缓存
    npm cache clean --force
    
    # 安装依赖
    npm install
    
    log_success "依赖安装完成"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    # 类型检查
    log_info "运行TypeScript类型检查..."
    npm run type-check || {
        log_error "类型检查失败"
        exit 1
    }
    
    # 代码检查
    log_info "运行ESLint检查..."
    npm run lint || {
        log_error "代码检查失败"
        exit 1
    }
    
    # 单元测试
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        log_info "运行单元测试..."
        npm run test || {
            log_error "单元测试失败"
            exit 1
        }
    fi
    
    log_success "所有测试通过"
}

# 构建项目
build_project() {
    log_info "构建生产版本..."
    
    # 清理之前的构建
    if [ -d "dist" ]; then
        rm -rf dist
        log_info "清理旧的构建文件"
    fi
    
    # 构建项目
    npm run build || {
        log_error "构建失败"
        exit 1
    }
    
    # 检查构建结果
    if [ ! -d "dist" ]; then
        log_error "构建目录不存在"
        exit 1
    fi
    
    log_success "构建完成"
}

# 部署到Firebase
deploy_firebase() {
    log_info "部署到Firebase..."
    
    # 检查Firebase登录状态
    if ! firebase projects:list &> /dev/null; then
        log_error "请先登录Firebase: firebase login"
        exit 1
    fi
    
    # 部署Firestore规则
    log_info "部署Firestore安全规则..."
    firebase deploy --only firestore:rules || {
        log_error "Firestore规则部署失败"
        exit 1
    }
    
    # 部署Hosting
    log_info "部署到Firebase Hosting..."
    firebase deploy --only hosting || {
        log_error "Hosting部署失败"
        exit 1
    }
    
    log_success "Firebase部署完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 获取部署URL
    DEPLOY_URL=$(firebase hosting:channel:list --json | jq -r '.channels[0].url' 2>/dev/null || echo "https://your-project.web.app")
    
    log_info "部署URL: $DEPLOY_URL"
    
    # 检查应用是否可访问
    if command -v curl &> /dev/null; then
        if curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" | grep -q "200"; then
            log_success "应用部署验证成功"
        else
            log_warning "应用可能未正确部署，请手动检查"
        fi
    else
        log_warning "无法验证部署状态，请手动访问 $DEPLOY_URL"
    fi
}

# 数据迁移提示
migration_notice() {
    log_info "数据迁移提示..."
    echo ""
    echo "=========================================="
    echo "🚀 部署完成！"
    echo "=========================================="
    echo ""
    echo "下一步操作："
    echo "1. 访问应用: $DEPLOY_URL"
    echo "2. 登录管理员账户"
    echo "3. 访问 /migration 页面进行数据迁移"
    echo "4. 验证新功能是否正常工作"
    echo ""
    echo "重要提醒："
    echo "- 数据迁移前请备份现有数据"
    echo "- 建议先在测试环境验证"
    echo "- 迁移过程中请勿关闭浏览器"
    echo ""
    echo "=========================================="
}

# 主函数
main() {
    echo "=========================================="
    echo "🚀 JCI KL 奖励指标管理系统部署脚本"
    echo "版本: v2.0.0"
    echo "=========================================="
    echo ""
    
    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  --skip-tests    跳过测试"
        echo "  --skip-build    跳过构建"
        echo "  --help, -h      显示帮助信息"
        echo ""
        exit 0
    fi
    
    # 设置选项
    SKIP_TESTS=false
    SKIP_BUILD=false
    
    for arg in "$@"; do
        case $arg in
            --skip-tests)
                SKIP_TESTS=true
                ;;
            --skip-build)
                SKIP_BUILD=true
                ;;
        esac
    done
    
    # 执行部署步骤
    check_environment
    install_dependencies
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    else
        log_warning "跳过测试"
    fi
    
    if [ "$SKIP_BUILD" = false ]; then
        build_project
    else
        log_warning "跳过构建"
    fi
    
    deploy_firebase
    verify_deployment
    migration_notice
    
    log_success "部署脚本执行完成！"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
