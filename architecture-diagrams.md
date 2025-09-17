# JCI KL Membership App - 架构图表集合

## 📊 PHASE 1: 系统整体架构图

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App] --> B[Ant Design UI]
        A --> C[React Router]
        A --> D[Zustand Store]
        A --> E[React Query]
    end
    
    subgraph "Application Layer"
        F[App.tsx] --> G[Layout Components]
        F --> H[Page Components]
        F --> I[Module Components]
        
        G --> G1[AppHeader]
        G --> G2[AppSider]
        G --> G3[MainContent]
        
        H --> H1[DashboardPage]
        H --> H2[LoginPage]
        H --> H3[RegisterPage]
        
        I --> I1[Member Module]
        I --> I2[Finance Module]
        I --> I3[Event Module]
        I --> I4[Permission Module]
        I --> I5[Award Module]
        I --> I6[Survey Module]
        I --> I7[Image Module]
        I --> I8[System Module]
    end
    
    subgraph "Service Layer"
        J[Auth Service] --> K[Firebase Auth]
        L[Member Service] --> M[Firestore]
        N[Finance Service] --> M
        O[Event Service] --> M
        P[Permission Service] --> M
        Q[Image Service] --> R[Cloudinary]
    end
    
    subgraph "Configuration Layer"
        S[Global Collections] --> T[Firebase Collections]
        U[Global Settings] --> V[System Config]
        W[Global Permissions] --> X[RBAC System]
        Y[Global Validation] --> Z[Form Validation]
    end
    
    subgraph "External Services"
        AA[Firebase] --> BB[Firestore Database]
        AA --> CC[Firebase Auth]
        AA --> DD[Firebase Storage]
        EE[Cloudinary] --> FF[Image Storage]
        GG[Netlify] --> HH[Deployment]
    end
    
    A --> F
    F --> J
    F --> L
    F --> N
    F --> O
    F --> P
    F --> Q
    
    J --> AA
    L --> AA
    N --> AA
    O --> AA
    P --> AA
    Q --> EE
    
    S --> AA
    U --> AA
    W --> AA
    Y --> AA
```

## 📊 PHASE 2: 模块化架构详细图

```mermaid
graph TB
    subgraph "Core Modules"
        A[Member Module] --> A1[MemberService]
        A --> A2[MemberStore]
        A --> A3[Member Components]
        A --> A4[Member Types]
        
        B[Finance Module] --> B1[FinanceService]
        B --> B2[TransactionService]
        B --> B3[BudgetService]
        B --> B4[Finance Components]
        B --> B5[Finance Types]
        
        C[Event Module] --> C1[EventService]
        C --> C2[EventRegistrationService]
        C --> C3[Event Components]
        C --> C4[Event Types]
        
        D[Permission Module] --> D1[PermissionService]
        D --> D2[RBACService]
        D --> D3[Permission Components]
        D --> D4[Permission Types]
    end
    
    subgraph "Supporting Modules"
        E[Award Module] --> E1[AwardService]
        E --> E2[Award Components]
        E --> E3[Award Types]
        
        F[Survey Module] --> F1[SurveyService]
        F --> F2[Survey Components]
        F --> F3[Survey Types]
        
        G[Image Module] --> G1[ImageService]
        G --> G2[UploadService]
        G --> G3[Image Components]
        G --> G4[Image Types]
        
        H[System Module] --> H1[SystemService]
        H --> H2[SettingsService]
        H --> H3[System Components]
        H --> H4[System Types]
    end
    
    subgraph "Shared Services"
        I[AuthService] --> J[Firebase Auth]
        K[FirebaseService] --> L[Firestore]
        M[GlobalConfig] --> N[System Settings]
        O[ValidationService] --> P[Form Validation]
    end
    
    A1 --> K
    B1 --> K
    C1 --> K
    D1 --> K
    E1 --> K
    F1 --> K
    G1 --> K
    H1 --> K
    
    A --> I
    B --> I
    C --> I
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
```

## 📊 PHASE 3: 数据模型关系图

```mermaid
erDiagram
    MEMBER ||--o{ MEMBER_PROFILE : has
    MEMBER ||--o{ MEMBER_POSITION : holds
    MEMBER ||--o{ MEMBER_CATEGORY : belongs_to
    MEMBER ||--o{ EVENT_REGISTRATION : registers_for
    MEMBER ||--o{ TRANSACTION : creates
    MEMBER ||--o{ BILL_PAYMENT : makes
    
    EVENT ||--o{ EVENT_PROGRAM : contains
    EVENT ||--o{ EVENT_COMMITTEE : has_committee
    EVENT ||--o{ EVENT_TRAINER : has_trainers
    EVENT ||--o{ EVENT_TICKET : offers_tickets
    EVENT ||--o{ EVENT_REGISTRATION : receives_registrations
    EVENT ||--|| PROJECT_ACCOUNT : linked_to
    
    TRANSACTION ||--|| BANK_ACCOUNT : uses
    TRANSACTION ||--o{ TRANSACTION_SPLIT : can_be_split
    TRANSACTION ||--|| TRANSACTION_PURPOSE : categorized_by
    
    BANK_ACCOUNT ||--o{ TRANSACTION : contains_transactions
    
    PROJECT_ACCOUNT ||--o{ TRANSACTION : receives_transactions
    PROJECT_ACCOUNT ||--o{ BUDGET : has_budget
    
    SURVEY ||--o{ SURVEY_QUESTION : contains
    SURVEY ||--o{ SURVEY_RESPONSE : receives_responses
    SURVEY_QUESTION ||--o{ SURVEY_ANSWER : has_answers
    
    AWARD ||--o{ AWARD_SUBMISSION : receives_submissions
    AWARD ||--o{ AWARD_CATEGORY : belongs_to
    
    RBAC_ROLE ||--o{ RBAC_PERMISSION : grants
    RBAC_ROLE_BINDING ||--|| MEMBER : binds_to
    RBAC_ROLE_BINDING ||--|| RBAC_ROLE : binds_role
    
    CHAPTER_SETTINGS ||--o{ MEMBER : manages
    WORLD_REGION ||--o{ COUNTRY : contains
    COUNTRY ||--o{ NATIONAL_REGION : contains
    NATIONAL_REGION ||--o{ LOCAL_CHAPTER : contains
```

## 📊 PHASE 4: 组件层次结构图

```mermaid
graph TB
    subgraph "Layout Components"
        A[App.tsx] --> B[SidebarProvider]
        A --> C[Layout]
        
        C --> D[AppSider]
        C --> E[AppHeader]
        C --> F[MainContent]
        
        D --> D1[Navigation Menu]
        D --> D2[Chapter Logo]
        D --> D3[Collapse Toggle]
        
        E --> E1[User Avatar]
        E --> E2[User Menu]
        E --> E3[Chapter Title]
        
        F --> F1[Page Router]
        F --> F2[Content Area]
    end
    
    subgraph "Page Components"
        G[DashboardPage] --> G1[Statistics Cards]
        G --> G2[Recent Activities]
        G --> G3[Quick Actions]
        
        H[MemberListPage] --> H1[Member Table]
        H --> H2[Search Filters]
        H --> H3[Batch Actions]
        
        I[FinancePage] --> I1[Transaction Table]
        I --> I2[Budget Overview]
        I --> I3[Reports Generator]
        
        J[EventManagementPage] --> J1[Event List]
        J --> J2[Event Calendar]
        J --> J3[Registration Management]
    end
    
    subgraph "Module Components"
        K[Member Components] --> K1[MemberForm]
        K --> K2[MemberCard]
        K --> K3[MemberProfile]
        
        L[Finance Components] --> L1[TransactionForm]
        L --> L2[BudgetModal]
        L --> L3[FinancialReports]
        
        M[Event Components] --> M1[EventForm]
        M --> M2[EventCard]
        M --> M3[RegistrationForm]
        
        N[Permission Components] --> N1[PermissionMatrix]
        N --> N2[RoleSelector]
        N --> N3[AccessControl]
    end
    
    subgraph "Common Components"
        O[Common Components] --> O1[LoadingSpinner]
        O --> O2[StandardEditModal]
        O --> O3[ResponsiblePersonSelector]
        O --> O4[TeamManagementModal]
        O --> O5[IndicatorCard]
    end
    
    F1 --> G
    F1 --> H
    F1 --> I
    F1 --> J
    
    G --> K
    H --> K
    I --> L
    J --> M
    
    K --> O
    L --> O
    M --> O
    N --> O
```

## 📊 PHASE 5: 字段映射关系图

```mermaid
graph TB
    subgraph "Member Field Mapping"
        A[Member Entity] --> A1[Basic Info]
        A --> A2[Profile Data]
        A --> A3[Position Info]
        A --> A4[Category Info]
        
        A1 --> A11[email: string]
        A1 --> A12[name: string]
        A1 --> A13[phone: string]
        A1 --> A14[memberId: string]
        
        A2 --> A21[avatar: string]
        A2 --> A22[birthDate: string]
        A2 --> A23[gender: enum]
        A2 --> A24[address: string]
        A2 --> A25[company: string]
        A2 --> A26[hobbies: array]
        
        A3 --> A31[jciPosition: enum]
        A3 --> A32[positionStartDate: string]
        A3 --> A33[positionEndDate: string]
        A3 --> A34[isActingPosition: boolean]
        
        A4 --> A41[membershipCategory: enum]
        A4 --> A42[categoryReviewStatus: enum]
        A4 --> A43[requiredTasksCompleted: boolean]
    end
    
    subgraph "Finance Field Mapping"
        B[Transaction Entity] --> B1[Basic Info]
        B --> B2[Financial Data]
        B --> B3[Classification]
        B --> B4[Metadata]
        
        B1 --> B11[transactionNumber: string]
        B1 --> B12[transactionDate: string]
        B1 --> B13[mainDescription: string]
        B1 --> B14[subDescription: string]
        
        B2 --> B21[expense: number]
        B2 --> B22[income: number]
        B2 --> B23[bankAccountId: string]
        B2 --> B24[currentBalance: number]
        
        B3 --> B31[transactionPurpose: string]
        B3 --> B32[projectAccountId: string]
        B3 --> B33[transactionType: string]
        
        B4 --> B41[inputBy: string]
        B4 --> B42[notes: string]
        B4 --> B43[attachments: array]
    end
    
    subgraph "Event Field Mapping"
        C[Event Entity] --> C1[Basic Info]
        C --> C2[Schedule Data]
        C --> C3[Registration Data]
        C --> C4[Project Data]
        
        C1 --> C11[title: string]
        C1 --> C12[description: string]
        C1 --> C13[type: enum]
        C1 --> C14[category: enum]
        C1 --> C15[level: enum]
        
        C2 --> C21[startDate: timestamp]
        C2 --> C22[endDate: timestamp]
        C2 --> C23[registrationStartDate: timestamp]
        C2 --> C24[registrationEndDate: timestamp]
        
        C3 --> C31[maxParticipants: number]
        C3 --> C32[currentParticipants: number]
        C3 --> C33[registrationFee: number]
        C3 --> C34[registrationDeadline: timestamp]
        
        C4 --> C41[projectAccountId: string]
        C4 --> C42[responsiblePerson: string]
        C4 --> C43[budget: number]
    end
    
    subgraph "Permission Field Mapping"
        D[RBAC Entity] --> D1[Role Data]
        D --> D2[Permission Data]
        D --> D3[Binding Data]
        
        D1 --> D11[roleId: string]
        D1 --> D12[label: string]
        D1 --> D13[description: string]
        D1 --> D14[inherits: array]
        
        D2 --> D21[permissionId: string]
        D2 --> D22[key: string]
        D2 --> D23[module: string]
        D2 --> D24[action: string]
        
        D3 --> D31[userId: string]
        D3 --> D32[roleId: string]
        D3 --> D33[scopes: object]
        D3 --> D34[expiresAt: string]
    end
```

## 📊 PHASE 6: 服务层交互图

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant S as Service
    participant F as Firebase
    participant E as External API
    
    U->>C: User Action
    C->>S: Service Call
    S->>F: Database Query
    F-->>S: Data Response
    S->>S: Data Processing
    S-->>C: Processed Data
    C->>C: State Update
    C-->>U: UI Update
    
    Note over S,E: External Service Integration
    S->>E: API Call (Cloudinary)
    E-->>S: Response
    S->>F: Store Reference
    F-->>S: Confirmation
```

## 📊 PHASE 7: 数据流架构图

```mermaid
graph LR
    subgraph "Data Input Layer"
        A[User Forms] --> B[File Uploads]
        A --> C[API Calls]
        B --> D[Image Processing]
    end
    
    subgraph "Data Processing Layer"
        E[Validation Service] --> F[Data Transformation]
        F --> G[Business Logic]
        G --> H[Permission Check]
    end
    
    subgraph "Data Storage Layer"
        I[Firestore] --> J[Collections]
        K[Cloudinary] --> L[Media Storage]
        M[Local Storage] --> N[Cache]
    end
    
    subgraph "Data Output Layer"
        O[Reports] --> P[Analytics]
        Q[Export] --> R[File Generation]
        S[Real-time Updates] --> T[Live Data]
    end
    
    A --> E
    B --> D
    D --> K
    C --> E
    
    E --> F
    F --> G
    G --> H
    H --> I
    
    I --> J
    J --> O
    J --> Q
    J --> S
    
    K --> L
    L --> O
    L --> Q
    
    M --> N
    N --> S
```

## 🎯 使用说明

1. **在线查看**: 将代码复制到 [Mermaid Live Editor](https://mermaid.live/) 查看
2. **VS Code**: 安装Mermaid插件，在Markdown文件中预览
3. **导出图片**: 使用在线编辑器导出PNG/SVG/PDF格式
4. **集成文档**: 将代码集成到项目文档中

## 📋 架构总结

- **技术栈**: React + TypeScript + Firebase + Ant Design
- **架构模式**: 模块化分层架构
- **数据管理**: Firebase + Cloudinary + 状态管理
- **权限控制**: RBAC权限管理系统
- **部署方式**: Netlify + Vite构建
