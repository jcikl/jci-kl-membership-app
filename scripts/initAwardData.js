// JCI Malaysia 奖励系统数据初始化脚本
import { db } from '../src/services/firebase.ts';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const currentYear = new Date().getFullYear();

// Efficient Star 奖励数据
const efficientStarData = {
  title: `${currentYear} Efficient Star`,
  description: `This program will recognize Local Organization with the achievement as follows:`,
  category: 'efficient_star',
  year: currentYear,
  status: 'active',
  totalScore: 100,
  currentScore: 0,
  deadline: '2025-12-31',
  criteria: {
    tiers: [
      { score: '90%-99%', award: 'Good Local Organization Management' },
      { score: '100%-119%', award: 'Efficient Local Organization Management' },
      { score: '120%-134%', award: 'Super Efficient Local Organization Management' },
      { score: '135%-140%', award: 'Ultra Efficient Local Organization Management' }
    ]
  },
  standards: [
    {
      id: 'standard_1',
      no: 1,
      title: 'Update Local Officer\'s information at jvc.cc and JCI Malaysia Roadmap',
      description: 'Ensure all local officer information is up to date',
      deadline: '31 Dec 2024',
      score: 5,
      status: 'pending',
      guidelines: 'https://example.com/guideline1'
    },
    {
      id: 'standard_2',
      no: 2,
      title: 'Submission of Documents and Compliance',
      description: 'Submit required documents and ensure compliance',
      deadline: '31 Jan 2025',
      score: 10,
      status: 'pending',
      subStandards: [
        {
          id: 'standard_2_1',
          no: '2.1',
          title: 'Submit 2024 AGM Meeting Minutes, endorsed 2025 Plan of Action, endorsed 2025 Budget and the latest Constitution & By-Law with proof of submission to ROY or ROS',
          description: 'Submit all required documents',
          deadline: '31 Jan 2025',
          score: 5,
          status: 'pending',
          guidelines: 'https://example.com/guideline2_1'
        },
        {
          id: 'standard_2_2',
          no: '2.2',
          title: 'Submission complete by ROY or ROS',
          description: 'Ensure submission is complete',
          deadline: '11 Sep 2025',
          score: 5,
          status: 'pending',
          guidelines: 'https://example.com/guideline2_2'
        }
      ]
    }
  ]
};

// Star Point 奖励数据
const starPointData = {
  title: `${currentYear} JCI Malaysia Star Point Award`,
  description: 'This award is designed to recognizes Local Organizations (LOs) with active involvement in JCI Malaysia and JCI programs, promoting the JCI movement, advancing its values, and providing learning opportunities to strengthen their members\' leadership and organizational skills.',
  category: 'star_point',
  year: currentYear,
  status: 'active',
  totalScore: 100,
  currentScore: 0,
  deadline: '2025-09-04',
  terms: [
    'In the situation of an event or function being changed from Physical to Virtual or Vice Versa, the affected standard will still be valid.',
    'In the situation of an event or function being cancelled, the affected Standard shall automatically cease to be valid.',
    'Refer to the guide for each standard submission due date. If not stated otherwise, the due date is on 4 September 2025 10pm (GMT+8).'
  ],
  starCategories: [
    {
      id: 'network_star',
      type: 'network_star',
      title: 'NETWORK STAR',
      description: 'Part of becoming an enterprising leader is about being an effective networker. Active participation in JCI, JCI Malaysia and Area events provides members a chance to travel to new places, experience new concepts and become a better leader while meeting other young leaders making a difference all around Malaysia and the world.',
      objective: 'To encourage members to actively participate in JCI / JCIM events and enhance their networking and social skills throughout the events.',
      note: 'All event which include training events / LO events shall be create through JCIM Roadmap. Failure to do so will result your points disqualified',
      points: 100,
      myPoints: 0,
      activities: [
        {
          id: 'network_1',
          no: 1,
          title: 'Registration and participation in Leadership Summit',
          description: 'Participate in JCI Leadership Summit',
          score: '20 points per LO President *Double points for Area Sabah and Area Sarawak Delegates*\n10 points per LO Secretary *Double points for Area Sabah and Area Sarawak Delegates*\n10 points per member',
          status: 'pending',
          guidelines: 'https://example.com/leadership-summit',
          deadline: '2025-03-31'
        },
        {
          id: 'network_2',
          no: 2,
          title: 'Registration for JCI Malaysia Area Conventions',
          description: 'Register and participate in Area Conventions',
          score: '15 points per LO President\n10 points per LO Secretary\n5 points per member',
          status: 'pending',
          guidelines: 'https://example.com/area-conventions',
          deadline: '2025-06-30'
        }
      ]
    },
    {
      id: 'experience_star',
      type: 'experience_star',
      title: 'EXPERIENCE STAR',
      description: 'Experience is the best teacher. Through various JCI programs and activities, members gain valuable experience that helps them grow as leaders and contribute to their communities.',
      objective: 'To provide members with diverse experiences that enhance their leadership skills and personal development.',
      points: 100,
      myPoints: 0,
      activities: [
        {
          id: 'experience_1',
          no: 1,
          title: 'Participation in Training Programs',
          description: 'Attend and complete JCI training programs',
          score: '10 points per program completed',
          status: 'pending',
          guidelines: 'https://example.com/training-programs'
        }
      ]
    },
    {
      id: 'outreach_star',
      type: 'outreach_star',
      title: 'OUTREACH STAR',
      description: 'Outreach activities help members connect with the community and make a positive impact. These activities demonstrate leadership and social responsibility.',
      objective: 'To engage members in community outreach activities that demonstrate leadership and social responsibility.',
      points: 100,
      myPoints: 0,
      activities: [
        {
          id: 'outreach_1',
          no: 1,
          title: 'Community Service Projects',
          description: 'Organize or participate in community service projects',
          score: '15 points per project',
          status: 'pending',
          guidelines: 'https://example.com/community-service'
        }
      ]
    },
    {
      id: 'social_star',
      type: 'social_star',
      title: 'SOCIAL STAR',
      description: 'Social activities foster camaraderie and build strong relationships among members. These activities create a supportive environment for personal and professional growth.',
      objective: 'To foster social connections and build strong relationships among members through various social activities.',
      points: 100,
      myPoints: 0,
      activities: [
        {
          id: 'social_1',
          no: 1,
          title: 'Social Events Participation',
          description: 'Participate in JCI social events and activities',
          score: '5 points per event',
          status: 'pending',
          guidelines: 'https://example.com/social-events'
        }
      ]
    }
  ]
};

// National & Area Incentive 奖励数据
const nationalAreaIncentiveData = {
  title: `${currentYear} JCI Malaysia National & Area Incentive Awards`,
  description: `The ${currentYear} JCI Malaysia National & Area Incentive Awards have been updated based on the ${currentYear} JCI Plan of Action & ${currentYear} JCI Malaysia Plan of Action. The Award categories are divided into:`,
  category: 'national_area_incentive',
  year: currentYear,
  status: 'active',
  submissionGuideline: 'https://example.com/submission-guideline',
  awardCategories: [
    {
      id: 'individual_awards',
      category: 'Category A: Individual Awards',
      awards: [
        {
          id: 'a01',
          no: 'A01',
          title: 'Most Outstanding National Executive Vice President',
          nationalAllocation: '1**',
          areaAllocation: '-',
          status: 'open',
          guidelines: 'https://example.com/a01-guideline'
        },
        {
          id: 'a02',
          no: 'A02',
          title: 'Outstanding National Vice President',
          nationalAllocation: '3',
          areaAllocation: '1*',
          status: 'open',
          guidelines: 'https://example.com/a02-guideline'
        },
        {
          id: 'a03',
          no: 'A03',
          title: 'Largest Delegation to JCI ASPAC in the Assigned Zone',
          nationalAllocation: '1',
          areaAllocation: '1',
          status: 'open',
          guidelines: 'https://example.com/a03-guideline'
        },
        {
          id: 'a04',
          no: 'A04',
          title: 'Outstanding Commission Chairperson',
          nationalAllocation: '3**',
          areaAllocation: '-',
          status: 'open',
          guidelines: 'https://example.com/a04-guideline'
        }
      ]
    },
    {
      id: 'local_org_awards',
      category: 'Category B: Local Organisation Awards',
      awards: [
        {
          id: 'b01',
          no: 'B01',
          title: 'Most Outstanding Local Organisation',
          nationalAllocation: '1',
          areaAllocation: '1',
          status: 'open',
          guidelines: 'https://example.com/b01-guideline'
        }
      ]
    }
  ]
};

// 初始化奖励数据
async function initAwardData() {
  try {
    console.log('开始初始化奖励数据...');

    // 创建 Efficient Star 奖励
    const efficientStarRef = await addDoc(collection(db, 'awards'), {
      ...efficientStarData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('Efficient Star 奖励创建成功:', efficientStarRef.id);

    // 创建 Star Point 奖励
    const starPointRef = await addDoc(collection(db, 'awards'), {
      ...starPointData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('Star Point 奖励创建成功:', starPointRef.id);

    // 创建 National & Area Incentive 奖励
    const nationalAreaIncentiveRef = await addDoc(collection(db, 'awards'), {
      ...nationalAreaIncentiveData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('National & Area Incentive 奖励创建成功:', nationalAreaIncentiveRef.id);

    console.log('奖励数据初始化完成！');
  } catch (error) {
    console.error('初始化奖励数据失败:', error);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  initAwardData();
}

export { initAwardData };
