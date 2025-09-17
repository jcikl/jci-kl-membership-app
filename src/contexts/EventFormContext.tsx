import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Event, EventProgram, CommitteeMember, EventTrainer, ProjectAccount, EventType, EventLevel, EventCategory } from '@/types/event';

// 事件表单数据类型
export interface EventFormData {
  // 基本信息
  name: string;
  description: string;
  type: EventType;
  level: EventLevel;
  category: EventCategory;
  
  // 时间地点
  startDate: any;
  endDate: any;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  
  // 定价
  isFree: boolean;
  price: number;
  currency: string;
  paymentMethods: string[];
  
  // 注册
  registrationStartDate?: any;
  registrationEndDate?: any;
  maxParticipants: number;
  registrationForm?: any;
  
  // 程序安排
  programs: EventProgram[];
  
  // 委员会
  committee: CommitteeMember[];
  
  // 讲师
  trainers: EventTrainer[];
  
  // 其他
  projectAccountId?: string;
  imageUrl?: string;
  status?: string;
}

// 验证错误类型
export interface ValidationError {
  field: string;
  message: string;
  step: number;
}

// 上下文状态类型
interface EventFormState {
  formData: EventFormData;
  currentStep: number;
  validationErrors: ValidationError[];
  isLoading: boolean;
  isDirty: boolean;
  projectAccounts: ProjectAccount[];
  currentEvent: Event | null;
}

// 动作类型
type EventFormAction =
  | { type: 'SET_FORM_DATA'; payload: Partial<EventFormData> }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationError[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_PROJECT_ACCOUNTS'; payload: ProjectAccount[] }
  | { type: 'SET_CURRENT_EVENT'; payload: Event | null }
  | { type: 'RESET_FORM' };

// 初始状态
const initialState: EventFormState = {
  formData: {
    name: '',
    description: '',
    type: 'training' as EventType,
    level: 'local' as EventLevel,
    category: 'business' as EventCategory,
    startDate: null,
    endDate: null,
    location: '',
    isVirtual: false,
    virtualLink: '',
    isFree: false,
    price: 0,
    currency: 'MYR',
    paymentMethods: [],
    registrationStartDate: null,
    registrationEndDate: null,
    maxParticipants: 0,
    registrationForm: null,
    programs: [],
    committee: [],
    trainers: [],
    projectAccountId: '',
    imageUrl: '',
    status: 'draft'
  },
  currentStep: 0,
  validationErrors: [],
  isLoading: false,
  isDirty: false,
  projectAccounts: [],
  currentEvent: null
};

// Reducer函数
function eventFormReducer(state: EventFormState, action: EventFormAction): EventFormState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
        isDirty: true
      };
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload
      };
    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload
      };
    case 'SET_PROJECT_ACCOUNTS':
      return {
        ...state,
        projectAccounts: action.payload
      };
    case 'SET_CURRENT_EVENT':
      return {
        ...state,
        currentEvent: action.payload
      };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}

// 上下文类型
interface EventFormContextType {
  state: EventFormState;
  dispatch: React.Dispatch<EventFormAction>;
  updateFormData: (data: Partial<EventFormData>) => void;
  setCurrentStep: (step: number) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  setLoading: (loading: boolean) => void;
  setDirty: (dirty: boolean) => void;
  setProjectAccounts: (accounts: ProjectAccount[]) => void;
  setCurrentEvent: (event: Event | null) => void;
  resetForm: () => void;
}

// 创建上下文
const EventFormContext = createContext<EventFormContextType | undefined>(undefined);

// Provider组件
interface EventFormProviderProps {
  children: ReactNode;
}

export const EventFormProvider: React.FC<EventFormProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(eventFormReducer, initialState);

  const updateFormData = (data: Partial<EventFormData>) => {
    dispatch({ type: 'SET_FORM_DATA', payload: data });
  };

  const setCurrentStep = (step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  };

  const setValidationErrors = (errors: ValidationError[]) => {
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setDirty = (dirty: boolean) => {
    dispatch({ type: 'SET_DIRTY', payload: dirty });
  };

  const setProjectAccounts = (accounts: ProjectAccount[]) => {
    dispatch({ type: 'SET_PROJECT_ACCOUNTS', payload: accounts });
  };

  const setCurrentEvent = (event: Event | null) => {
    dispatch({ type: 'SET_CURRENT_EVENT', payload: event });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  const value: EventFormContextType = {
    state,
    dispatch,
    updateFormData,
    setCurrentStep,
    setValidationErrors,
    setLoading,
    setDirty,
    setProjectAccounts,
    setCurrentEvent,
    resetForm
  };

  return (
    <EventFormContext.Provider value={value}>
      {children}
    </EventFormContext.Provider>
  );
};

// 自定义Hook
export const useEventForm = (): EventFormContextType => {
  const context = useContext(EventFormContext);
  if (context === undefined) {
    throw new Error('useEventForm must be used within an EventFormProvider');
  }
  return context;
};

export default EventFormContext;
