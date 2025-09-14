/**
 * 活动数据初始化脚本
 * 用于创建演示数据和测试数据
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase配置 - 请替换为您的实际配置
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 演示项目户口数据
const demoProjectAccounts = [
  {
    name: "2025年度培训项目",
    description: "JCI Kuala Lumpur 2025年度会员培训和发展项目",
    fiscalYear: "2025",
    budget: 50000,
    currency: "MYR",
    responsiblePerson: "张小明",
    responsiblePersonEmail: "xiaoming.zhang@jcikl.org",
    status: "active",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: "admin@jcikl.org",
    updatedBy: "admin@jcikl.org",
  },
  {
    name: "社区服务项目基金",
    description: "用于支持各种社区服务和公益活动",
    fiscalYear: "2025",
    budget: 30000,
    currency: "MYR",
    responsiblePerson: "李美丽",
    responsiblePersonEmail: "meili.li@jcikl.org",
    status: "active",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: "admin@jcikl.org",
    updatedBy: "admin@jcikl.org",
  },
  {
    name: "青年企业家发展计划",
    description: "支持年轻企业家和创业者的发展项目",
    fiscalYear: "2025",
    budget: 75000,
    currency: "MYR",
    responsiblePerson: "王大伟",
    responsiblePersonEmail: "dawei.wang@jcikl.org",
    status: "active",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: "admin@jcikl.org",
    updatedBy: "admin@jcikl.org",
  }
];

// 演示活动数据
const demoEvents = [
  {
    title: "2025 JCI Kuala Lumpur Annual General Meeting",
    description: "Join us for the annual general meeting where we will review the past year's achievements and plan for the future. This is a great opportunity to connect with fellow members and contribute to the chapter's direction.",
    type: "Event",
    category: "Meeting",
    level: "Local",
    status: "Published",
    startDate: Timestamp.fromDate(new Date('2025-03-15T14:00:00')),
    endDate: Timestamp.fromDate(new Date('2025-03-15T18:00:00')),
    registrationStartDate: Timestamp.fromDate(new Date('2025-02-01T00:00:00')),
    registrationEndDate: Timestamp.fromDate(new Date('2025-03-14T23:59:59')),
    venue: "Excellence Leo Malaysia",
    address: "57000 Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia",
    latitude: 3.06127,
    longitude: 101.708927,
    isVirtual: false,
    hostingLO: "JCI Kuala Lumpur",
    coHostingLOs: [],
    contactEmail: "events@jcikl.org",
    contactPhone: "+60 3-1234 5678",
    isFree: true,
    currency: "MYR",
    maxParticipants: 100,
    minParticipants: 20,
    isPrivate: false,
    registrationOpenFor: ["Member", "Alumni", "Friend"],
    programs: [],
    committeeMembers: [],
    trainers: [],
    tickets: [],
    registrationSettings: {
      isPrivate: false,
      limitedSeats: 100,
      registrationOpenFor: ["Member", "Alumni", "Friend"],
      registrationClosingDate: Timestamp.fromDate(new Date('2025-03-14T23:59:59')),
      bankAccountDetails: "Account details will be provided upon registration",
      collectPersonalInfo: {
        nricPassport: false,
        proofOfPayment: false,
      },
      eventArrangements: {
        nameOnTag: true,
        meal: true,
        foodAllergy: true,
        tshirt: false,
        accommodation: false,
        transportation: false,
      },
      emergencyContact: {
        required: false,
        defaultOptional: true,
      },
    },
    createdBy: "admin@jcikl.org",
    createdAt: Timestamp.now(),
    updatedBy: "admin@jcikl.org",
    updatedAt: Timestamp.now(),
    totalRegistrations: 0,
    approvedRegistrations: 0,
    pendingRegistrations: 0,
  },
  {
    title: "Digital Marketing Workshop",
    description: "Learn the latest digital marketing strategies and tools in this comprehensive workshop. Perfect for entrepreneurs and marketing professionals looking to enhance their digital presence.",
    type: "Skill Development",
    category: "Workshop",
    level: "Local",
    status: "Published",
    startDate: Timestamp.fromDate(new Date('2025-04-20T09:00:00')),
    endDate: Timestamp.fromDate(new Date('2025-04-20T17:00:00')),
    registrationStartDate: Timestamp.fromDate(new Date('2025-03-01T00:00:00')),
    registrationEndDate: Timestamp.fromDate(new Date('2025-04-19T23:59:59')),
    venue: "JCI Kuala Lumpur Training Center",
    address: "123 Jalan Bukit Bintang, 50200 Kuala Lumpur",
    latitude: 3.1586,
    longitude: 101.7123,
    isVirtual: false,
    hostingLO: "JCI Kuala Lumpur",
    coHostingLOs: ["JCI Petaling Jaya"],
    contactEmail: "training@jcikl.org",
    contactPhone: "+60 3-1234 5679",
    isFree: false,
    currency: "MYR",
    regularPrice: 150,
    earlyBirdPrice: 120,
    memberPrice: 100,
    alumniPrice: 110,
    maxParticipants: 50,
    minParticipants: 10,
    isPrivate: false,
    registrationOpenFor: ["Member", "Alumni", "Friend", "Public"],
    programs: [],
    committeeMembers: [],
    trainers: [],
    tickets: [],
    registrationSettings: {
      isPrivate: false,
      limitedSeats: 50,
      registrationOpenFor: ["Member", "Alumni", "Friend", "Public"],
      registrationClosingDate: Timestamp.fromDate(new Date('2025-04-19T23:59:59')),
      bankAccountDetails: "Bank: Maybank\nAccount: 1234567890\nName: JCI Kuala Lumpur",
      collectPersonalInfo: {
        nricPassport: true,
        proofOfPayment: true,
      },
      eventArrangements: {
        nameOnTag: true,
        meal: true,
        foodAllergy: true,
        tshirt: true,
        accommodation: false,
        transportation: false,
      },
      emergencyContact: {
        required: true,
        defaultOptional: false,
      },
    },
    createdBy: "admin@jcikl.org",
    createdAt: Timestamp.now(),
    updatedBy: "admin@jcikl.org",
    updatedAt: Timestamp.now(),
    totalRegistrations: 0,
    approvedRegistrations: 0,
    pendingRegistrations: 0,
  },
  {
    title: "Community Service Project - Clean Up Drive",
    description: "Join us for a meaningful community service project to clean up our local park. This is a great opportunity to give back to the community and make a positive environmental impact.",
    type: "Project",
    category: "Community Service",
    level: "Local",
    status: "Published",
    startDate: Timestamp.fromDate(new Date('2025-05-10T08:00:00')),
    endDate: Timestamp.fromDate(new Date('2025-05-10T12:00:00')),
    registrationStartDate: Timestamp.fromDate(new Date('2025-04-01T00:00:00')),
    registrationEndDate: Timestamp.fromDate(new Date('2025-05-09T23:59:59')),
    venue: "Taman Tasik Perdana",
    address: "Taman Tasik Perdana, 50480 Kuala Lumpur",
    latitude: 3.1487,
    longitude: 101.6895,
    isVirtual: false,
    hostingLO: "JCI Kuala Lumpur",
    coHostingLOs: [],
    contactEmail: "community@jcikl.org",
    contactPhone: "+60 3-1234 5680",
    isFree: true,
    currency: "MYR",
    maxParticipants: 30,
    minParticipants: 5,
    isPrivate: false,
    registrationOpenFor: ["Member", "Alumni", "Friend", "Public"],
    programs: [],
    committeeMembers: [],
    trainers: [],
    tickets: [],
    registrationSettings: {
      isPrivate: false,
      limitedSeats: 30,
      registrationOpenFor: ["Member", "Alumni", "Friend", "Public"],
      registrationClosingDate: Timestamp.fromDate(new Date('2025-05-09T23:59:59')),
      bankAccountDetails: "This is a free event, no payment required",
      collectPersonalInfo: {
        nricPassport: false,
        proofOfPayment: false,
      },
      eventArrangements: {
        nameOnTag: false,
        meal: false,
        foodAllergy: false,
        tshirt: true,
        accommodation: false,
        transportation: true,
      },
      emergencyContact: {
        required: true,
        defaultOptional: false,
      },
    },
    createdBy: "admin@jcikl.org",
    createdAt: Timestamp.now(),
    updatedBy: "admin@jcikl.org",
    updatedAt: Timestamp.now(),
    totalRegistrations: 0,
    approvedRegistrations: 0,
    pendingRegistrations: 0,
  }
];

// 初始化函数
async function initEventData() {
  try {
    console.log('开始初始化项目户口和活动数据...');
    
    // 创建项目户口
    const projectAccountIds = [];
    for (const accountData of demoProjectAccounts) {
      const docRef = await addDoc(collection(db, 'projectAccounts'), accountData);
      projectAccountIds.push(docRef.id);
      console.log(`项目户口创建成功: ${accountData.name} (ID: ${docRef.id})`);
    }
    
    // 创建活动并关联项目户口
    for (let i = 0; i < demoEvents.length; i++) {
      const eventData = { ...demoEvents[i] };
      // 为前两个活动关联项目户口
      if (i < 2 && projectAccountIds[i]) {
        eventData.projectAccountId = projectAccountIds[i];
      }
      
      const docRef = await addDoc(collection(db, 'events'), eventData);
      console.log(`活动创建成功: ${eventData.title} (ID: ${docRef.id})`);
    }
    
    console.log('项目户口和活动数据初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('初始化数据失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initEventData();
