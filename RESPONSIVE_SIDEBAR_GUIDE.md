# 响应式侧边栏功能指南

## 功能概述

本系统实现了响应式侧边栏功能，当屏幕尺寸过小时，侧边栏会自动收起以提供更好的用户体验。

## 实现特性

### 1. 自动响应式行为
- **移动设备** (< 768px): 侧边栏自动收起，宽度为 0
- **平板设备** (768px - 992px): 侧边栏可手动收起，收起时宽度为 80px
- **桌面设备** (> 992px): 侧边栏可手动收起，收起时宽度为 80px，展开时宽度为 200px

### 2. 断点配置
使用全局配置中的响应式断点：
```typescript
RESPONSIVE_BREAKPOINTS: {
  xs: 480,
  sm: 576,
  md: 768,    // 移动设备断点
  lg: 992,    // 平板设备断点
  xl: 1200,
  xxl: 1600
}
```

### 3. 组件更新

#### SidebarContext 增强
- 添加了屏幕尺寸检测
- 提供设备类型判断 (`isMobile`, `isTablet`, `isDesktop`)
- 自动监听窗口大小变化
- 在小屏幕时自动收起侧边栏

#### AppSider 组件
- 使用 Ant Design 的 `breakpoint` 属性
- 响应式标题显示
- 响应式菜单配置
- 平滑过渡动画

#### AppHeader 组件
- 响应式标题显示
- 响应式用户信息显示
- 动态调整位置和宽度

#### MainContent 组件
- 响应式边距调整
- 响应式内边距
- 动态高度计算

## 使用方法

### 1. 在组件中使用响应式状态
```typescript
import { useSidebar } from '@/contexts/SidebarContext';

const MyComponent = () => {
  const { collapsed, isMobile, isTablet, isDesktop } = useSidebar();
  
  return (
    <div>
      {isMobile && <div>移动设备内容</div>}
      {isTablet && <div>平板设备内容</div>}
      {isDesktop && <div>桌面设备内容</div>}
    </div>
  );
};
```

### 2. 手动控制侧边栏
```typescript
const { collapsed, setCollapsed, toggleCollapsed } = useSidebar();

// 手动设置状态
setCollapsed(true);

// 切换状态
toggleCollapsed();
```

## 技术实现

### 1. 窗口大小监听
```typescript
useEffect(() => {
  const handleResize = () => {
    const newSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    setScreenSize(newSize);

    // 当屏幕变小时自动收起侧边栏
    if (newSize.width < breakpoints.md && !collapsed) {
      setCollapsed(true);
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [breakpoints.md, collapsed]);
```

### 2. 响应式样式计算
```typescript
const sidebarWidth = isMobile ? 0 : (collapsed ? 80 : 200);
```

### 3. 平滑过渡动画
```typescript
style={{
  transition: 'all 0.2s ease-in-out'
}}
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 注意事项

1. **性能优化**: 使用防抖技术避免频繁的窗口大小变化事件
2. **内存管理**: 正确清理事件监听器避免内存泄漏
3. **用户体验**: 保持平滑的过渡动画提供良好的视觉体验
4. **可访问性**: 确保在收起状态下用户仍能访问所有功能

## 未来改进

1. 添加触摸手势支持
2. 支持自定义断点配置
3. 添加侧边栏状态持久化
4. 支持键盘快捷键控制
