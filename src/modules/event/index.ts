// 活动模块导出索引
// Event Module Export Index

// 组件导出
export { default as ActivityGanttChart } from './components/ActivityGanttChart';
export { default as ActivityParticipationManager } from './components/ActivityParticipationManager';
export { default as ActivityParticipationTracker } from './components/ActivityParticipationTracker';
export { default as EventDetail } from './components/EventDetail';
export { default as EventForm } from './components/EventForm';
export { default as EventList } from './components/EventList';
export { default as EventRegistrationForm } from './components/EventRegistrationForm';
export { default as EventRegistrationManagement } from './components/EventRegistrationManagement';
export { default as EventSettings } from './components/EventSettings';
export { default as EventStatistics } from './components/EventStatistics';

// EventForm子组件导出
export { default as EventBasicInfo } from './components/EventForm/EventBasicInfo';
export { default as EventCommittee } from './components/EventForm/EventCommittee';
export { default as EventFormRefactored } from './components/EventForm/EventFormRefactored';
export { default as EventPricing } from './components/EventForm/EventPricing';
export { default as EventPrograms } from './components/EventForm/EventPrograms';
export { default as EventRegistration } from './components/EventForm/EventRegistration';
export { default as EventTimeLocation } from './components/EventForm/EventTimeLocation';
export { default as EventTrainers } from './components/EventForm/EventTrainers';

// 服务导出
export * from './services/eventService';
export * from './services/EventFormValidator';

// 页面导出
export { default as EventCreatePage } from './pages/EventCreatePage';
export { default as EventDetailPage } from './pages/EventDetailPage';
export { default as EventManagementPage } from './pages/EventManagementPage';
export { default as EventRegistrationPage } from './pages/EventRegistrationPage';
export { default as EventRegistrationSuccessPage } from './pages/EventRegistrationSuccessPage';
export { default as PublicEventListPage } from './pages/PublicEventListPage';
