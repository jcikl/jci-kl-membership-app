import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import {
  Event,
  EventProgram,
  CommitteeMember,
  EventTrainer,
  EventTicket,
  EventRegistration,
  EventCreateData,
  EventUpdateData,
  EventRegistrationData,
  EventSearchParams,
  EventListResponse,
  EventRegistrationListResponse,
  EventStatistics,
  EventStatus,
  RegistrationStatus,
} from '@/types/event';
import { projectAccountService } from '@/services/projectAccountService';

// 活动服务类
export class EventService {
  private static readonly COLLECTION_NAME = 'events';
  private static readonly PROGRAMS_COLLECTION = 'eventPrograms';
  private static readonly COMMITTEE_COLLECTION = 'eventCommittee';
  private static readonly TRAINERS_COLLECTION = 'eventTrainers';
  private static readonly TICKETS_COLLECTION = 'eventTickets';
  private static readonly REGISTRATIONS_COLLECTION = 'eventRegistrations';

  // 创建活动
  static async createEvent(eventData: EventCreateData, userId: string): Promise<string> {
    try {
      const eventRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...eventData,
        status: EventStatus.DRAFT,
        startDate: Timestamp.fromDate(eventData.startDate),
        endDate: Timestamp.fromDate(eventData.endDate),
        registrationStartDate: eventData.registrationStartDate 
          ? Timestamp.fromDate(eventData.registrationStartDate) 
          : null,
        registrationEndDate: eventData.registrationEndDate 
          ? Timestamp.fromDate(eventData.registrationEndDate) 
          : null,
        coHostingLOs: eventData.coHostingLOs || [],
        registrationOpenFor: eventData.registrationOpenFor || [],
        programs: [],
        committeeMembers: [],
        trainers: [],
        tickets: [],
        registrationSettings: {
          isPrivate: eventData.isPrivate || false,
          limitedSeats: 0,
          registrationOpenFor: eventData.registrationOpenFor || [],
          registrationClosingDate: null,
          bankAccountDetails: '',
          collectPersonalInfo: {
            nricPassport: false,
            proofOfPayment: false,
          },
          eventArrangements: {
            nameOnTag: false,
            meal: false,
            foodAllergy: false,
            tshirt: false,
            accommodation: false,
            transportation: false,
          },
          emergencyContact: {
            required: false,
            defaultOptional: true,
          },
        },
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedBy: userId,
        updatedAt: serverTimestamp(),
        totalRegistrations: 0,
        approvedRegistrations: 0,
        pendingRegistrations: 0,
      });

      return eventRef.id;
    } catch (error) {
      console.error('创建活动失败:', error);
      throw new Error('创建活动失败');
    }
  }

  // 更新活动
  static async updateEvent(eventId: string, eventData: EventUpdateData, userId: string): Promise<void> {
    try {
      const eventRef = doc(db, this.COLLECTION_NAME, eventId);
      const updateData: any = {
        ...eventData,
        updatedBy: userId,
        updatedAt: serverTimestamp(),
      };

      // 处理日期字段
      if (eventData.startDate) {
        updateData.startDate = Timestamp.fromDate(eventData.startDate);
      }
      if (eventData.endDate) {
        updateData.endDate = Timestamp.fromDate(eventData.endDate);
      }
      if (eventData.registrationStartDate) {
        updateData.registrationStartDate = Timestamp.fromDate(eventData.registrationStartDate);
      }
      if (eventData.registrationEndDate) {
        updateData.registrationEndDate = Timestamp.fromDate(eventData.registrationEndDate);
      }

      await updateDoc(eventRef, updateData);
    } catch (error) {
      console.error('更新活动失败:', error);
      throw new Error('更新活动失败');
    }
  }

  // 删除活动
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // 删除活动
      const eventRef = doc(db, this.COLLECTION_NAME, eventId);
      batch.delete(eventRef);
      
      // 删除相关数据
      const programsQuery = query(collection(db, this.PROGRAMS_COLLECTION), where('eventId', '==', eventId));
      const programsSnapshot = await getDocs(programsQuery);
      programsSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      const committeeQuery = query(collection(db, this.COMMITTEE_COLLECTION), where('eventId', '==', eventId));
      const committeeSnapshot = await getDocs(committeeQuery);
      committeeSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      const trainersQuery = query(collection(db, this.TRAINERS_COLLECTION), where('eventId', '==', eventId));
      const trainersSnapshot = await getDocs(trainersQuery);
      trainersSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      const ticketsQuery = query(collection(db, this.TICKETS_COLLECTION), where('eventId', '==', eventId));
      const ticketsSnapshot = await getDocs(ticketsQuery);
      ticketsSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      const registrationsQuery = query(collection(db, this.REGISTRATIONS_COLLECTION), where('eventId', '==', eventId));
      const registrationsSnapshot = await getDocs(registrationsQuery);
      registrationsSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      await batch.commit();
    } catch (error) {
      console.error('删除活动失败:', error);
      throw new Error('删除活动失败');
    }
  }

  // 获取活动详情
  static async getEvent(eventId: string): Promise<Event | null> {
    try {
      const eventRef = doc(db, this.COLLECTION_NAME, eventId);
      const eventSnapshot = await getDoc(eventRef);
      
      if (!eventSnapshot.exists()) {
        return null;
      }
      
      const eventData = { id: eventSnapshot.id, ...eventSnapshot.data() } as Event;
      
      // 如果有关联的项目户口，获取项目户口详情
      if (eventData.projectAccountId) {
        try {
          const projectAccount = await projectAccountService.getProjectAccount(eventData.projectAccountId);
          eventData.projectAccount = projectAccount || undefined;
        } catch (error) {
          console.warn('获取项目户口详情失败:', error);
        }
      }
      
      return eventData;
    } catch (error) {
      console.error('获取活动详情失败:', error);
      throw new Error('获取活动详情失败');
    }
  }

  // 获取活动列表
  static async getEvents(params: EventSearchParams = {}): Promise<EventListResponse> {
    try {
      const {
        page = 1,
        limit: pageLimit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filter = {}
      } = params;

      let q = query(collection(db, this.COLLECTION_NAME));
      
      // 应用过滤器
      if (filter.type && filter.type.length > 0) {
        q = query(q, where('type', 'in', filter.type));
      }
      if (filter.level && filter.level.length > 0) {
        q = query(q, where('level', 'in', filter.level));
      }
      if (filter.category && filter.category.length > 0) {
        q = query(q, where('category', 'in', filter.category));
      }
      if (filter.status && filter.status.length > 0) {
        q = query(q, where('status', 'in', filter.status));
      }
      if (filter.hostingLO && filter.hostingLO.length > 0) {
        q = query(q, where('hostingLO', 'in', filter.hostingLO));
      }
      
      // 排序
      q = query(q, orderBy(sortBy, sortOrder));
      
      // 分页
      q = query(q, limit(pageLimit));
      
      const snapshot = await getDocs(q);
      const events: Event[] = [];
      
      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as Event);
      });
      
      // 应用文本搜索过滤（客户端过滤）
      let filteredEvents = events;
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase();
        filteredEvents = events.filter(event => 
          event.title.toLowerCase().includes(searchText) ||
          event.description.toLowerCase().includes(searchText) ||
          event.venue.toLowerCase().includes(searchText)
        );
      }
      
      return {
        events: filteredEvents,
        total: filteredEvents.length,
        page,
        limit: pageLimit,
        hasMore: filteredEvents.length === pageLimit,
      };
    } catch (error) {
      console.error('获取活动列表失败:', error);
      throw new Error('获取活动列表失败');
    }
  }

  // 获取公开活动列表（用于前台展示）
  static async getPublicEvents(params: EventSearchParams = {}): Promise<EventListResponse> {
    try {
      const publicParams = {
        ...params,
        filter: {
          ...params.filter,
          status: [EventStatus.PUBLISHED],
        }
      };
      
      return await this.getEvents(publicParams);
    } catch (error) {
      console.error('获取公开活动列表失败:', error);
      throw new Error('获取公开活动列表失败');
    }
  }

  // 根据项目户口获取活动列表
  static async getEventsByProjectAccount(projectAccountId: string): Promise<Event[]> {
    try {
      const eventsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('projectAccountId', '==', projectAccountId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(eventsQuery);
      const events: Event[] = [];
      
      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as Event);
      });
      
      return events;
    } catch (error) {
      console.error('获取项目户口活动失败:', error);
      throw new Error('获取项目户口活动失败');
    }
  }

  // 获取项目户口的活动统计
  static async getProjectAccountEventSummary(projectAccountId: string): Promise<{
    totalEvents: number;
    publishedEvents: number;
    draftEvents: number;
    cancelledEvents: number;
    completedEvents: number;
    totalRegistrations: number;
    totalRevenue: number;
    upcomingEvents: number;
  }> {
    try {
      const events = await this.getEventsByProjectAccount(projectAccountId);
      
      const summary = {
        totalEvents: events.length,
        publishedEvents: events.filter(e => e.status === EventStatus.PUBLISHED).length,
        draftEvents: events.filter(e => e.status === EventStatus.DRAFT).length,
        cancelledEvents: events.filter(e => e.status === EventStatus.CANCELLED).length,
        completedEvents: events.filter(e => e.status === EventStatus.COMPLETED).length,
        totalRegistrations: events.reduce((sum, e) => sum + e.totalRegistrations, 0),
        totalRevenue: events.reduce((sum, e) => {
          if (!e.isFree) {
            return sum + (e.totalRegistrations * (e.regularPrice || 0));
          }
          return sum;
        }, 0),
        upcomingEvents: events.filter(e => {
          const now = new Date();
          const eventDate = e.startDate.toDate();
          return e.status === EventStatus.PUBLISHED && eventDate > now;
        }).length,
      };
      
      return summary;
    } catch (error) {
      console.error('获取项目户口活动统计失败:', error);
      throw new Error('获取项目户口活动统计失败');
    }
  }

  // 发布活动
  static async publishEvent(eventId: string, userId: string): Promise<void> {
    try {
      await this.updateEvent(eventId, { id: eventId, status: EventStatus.PUBLISHED }, userId);
    } catch (error) {
      console.error('发布活动失败:', error);
      throw new Error('发布活动失败');
    }
  }

  // 取消活动
  static async cancelEvent(eventId: string, userId: string): Promise<void> {
    try {
      await this.updateEvent(eventId, { id: eventId, status: EventStatus.CANCELLED }, userId);
    } catch (error) {
      console.error('取消活动失败:', error);
      throw new Error('取消活动失败');
    }
  }

  // 获取活动统计
  static async getEventStatistics(eventId: string): Promise<EventStatistics> {
    try {
      const registrationsQuery = query(
        collection(db, this.REGISTRATIONS_COLLECTION),
        where('eventId', '==', eventId)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      
      const registrations: EventRegistration[] = [];
      registrationsSnapshot.forEach((doc) => {
        registrations.push({ id: doc.id, ...doc.data() } as EventRegistration);
      });
      
      const stats: EventStatistics = {
        totalRegistrations: registrations.length,
        approvedRegistrations: registrations.filter(r => r.status === RegistrationStatus.APPROVED).length,
        pendingRegistrations: registrations.filter(r => r.status === RegistrationStatus.PENDING).length,
        rejectedRegistrations: registrations.filter(r => r.status === RegistrationStatus.REJECTED).length,
        totalRevenue: registrations
          .filter(r => r.status === RegistrationStatus.APPROVED)
          .reduce((sum, r) => sum + r.amount, 0),
        ticketSales: {},
        registrationByType: {},
        registrationByDate: {},
      };
      
      // 按票务类型统计
      const ticketsQuery = query(
        collection(db, this.TICKETS_COLLECTION),
        where('eventId', '==', eventId)
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      
      ticketsSnapshot.forEach((doc) => {
        const ticket = { id: doc.id, ...doc.data() } as EventTicket;
        stats.ticketSales[ticket.id] = {
          ticketName: ticket.name,
          sold: ticket.soldQuantity,
          total: ticket.quantity,
          revenue: ticket.soldQuantity * ticket.regularPrice,
        };
      });
      
      // 按日期统计注册
      registrations.forEach((registration) => {
        const date = registration.registeredAt.toDate().toISOString().split('T')[0];
        stats.registrationByDate[date] = (stats.registrationByDate[date] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('获取活动统计失败:', error);
      throw new Error('获取活动统计失败');
    }
  }
}

// 活动程序服务
export class EventProgramService {
  private static readonly COLLECTION_NAME = 'eventPrograms';

  static async addProgram(eventId: string, programData: Omit<EventProgram, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const programRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...programData,
        eventId,
        date: Timestamp.fromDate(programData.date.toDate()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return programRef.id;
    } catch (error) {
      console.error('添加活动程序失败:', error);
      throw new Error('添加活动程序失败');
    }
  }

  static async updateProgram(programId: string, programData: Partial<EventProgram>): Promise<void> {
    try {
      const programRef = doc(db, this.COLLECTION_NAME, programId);
      await updateDoc(programRef, {
        ...programData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('更新活动程序失败:', error);
      throw new Error('更新活动程序失败');
    }
  }

  static async deleteProgram(programId: string): Promise<void> {
    try {
      const programRef = doc(db, this.COLLECTION_NAME, programId);
      await deleteDoc(programRef);
    } catch (error) {
      console.error('删除活动程序失败:', error);
      throw new Error('删除活动程序失败');
    }
  }

  static async getEventPrograms(eventId: string): Promise<EventProgram[]> {
    try {
      const programsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('eventId', '==', eventId),
        orderBy('sequence', 'asc')
      );
      const snapshot = await getDocs(programsQuery);
      
      const programs: EventProgram[] = [];
      snapshot.forEach((doc) => {
        programs.push({ id: doc.id, ...doc.data() } as EventProgram);
      });
      
      return programs;
    } catch (error) {
      console.error('获取活动程序失败:', error);
      throw new Error('获取活动程序失败');
    }
  }
}

// 活动委员会服务
export class EventCommitteeService {
  private static readonly COLLECTION_NAME = 'eventCommittee';

  static async addCommitteeMember(eventId: string, memberData: Omit<CommitteeMember, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const memberRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...memberData,
        eventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return memberRef.id;
    } catch (error) {
      console.error('添加委员会成员失败:', error);
      throw new Error('添加委员会成员失败');
    }
  }

  static async updateCommitteeMember(memberId: string, memberData: Partial<CommitteeMember>): Promise<void> {
    try {
      const memberRef = doc(db, this.COLLECTION_NAME, memberId);
      await updateDoc(memberRef, {
        ...memberData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('更新委员会成员失败:', error);
      throw new Error('更新委员会成员失败');
    }
  }

  static async deleteCommitteeMember(memberId: string): Promise<void> {
    try {
      const memberRef = doc(db, this.COLLECTION_NAME, memberId);
      await deleteDoc(memberRef);
    } catch (error) {
      console.error('删除委员会成员失败:', error);
      throw new Error('删除委员会成员失败');
    }
  }

  static async getEventCommittee(eventId: string): Promise<CommitteeMember[]> {
    try {
      const committeeQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('eventId', '==', eventId),
        orderBy('sequence', 'asc')
      );
      const snapshot = await getDocs(committeeQuery);
      
      const members: CommitteeMember[] = [];
      snapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() } as CommitteeMember);
      });
      
      return members;
    } catch (error) {
      console.error('获取委员会成员失败:', error);
      throw new Error('获取委员会成员失败');
    }
  }
}

// 活动讲师服务
export class EventTrainerService {
  private static readonly COLLECTION_NAME = 'eventTrainers';

  static async addTrainer(eventId: string, trainerData: Omit<EventTrainer, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const trainerRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...trainerData,
        eventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return trainerRef.id;
    } catch (error) {
      console.error('添加讲师失败:', error);
      throw new Error('添加讲师失败');
    }
  }

  static async updateTrainer(trainerId: string, trainerData: Partial<EventTrainer>): Promise<void> {
    try {
      const trainerRef = doc(db, this.COLLECTION_NAME, trainerId);
      await updateDoc(trainerRef, {
        ...trainerData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('更新讲师失败:', error);
      throw new Error('更新讲师失败');
    }
  }

  static async deleteTrainer(trainerId: string): Promise<void> {
    try {
      const trainerRef = doc(db, this.COLLECTION_NAME, trainerId);
      await deleteDoc(trainerRef);
    } catch (error) {
      console.error('删除讲师失败:', error);
      throw new Error('删除讲师失败');
    }
  }

  static async getEventTrainers(eventId: string): Promise<EventTrainer[]> {
    try {
      const trainersQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('eventId', '==', eventId),
        orderBy('sequence', 'asc')
      );
      const snapshot = await getDocs(trainersQuery);
      
      const trainers: EventTrainer[] = [];
      snapshot.forEach((doc) => {
        trainers.push({ id: doc.id, ...doc.data() } as EventTrainer);
      });
      
      return trainers;
    } catch (error) {
      console.error('获取讲师列表失败:', error);
      throw new Error('获取讲师列表失败');
    }
  }
}

// 活动票务服务
export class EventTicketService {
  private static readonly COLLECTION_NAME = 'eventTickets';

  static async addTicket(eventId: string, ticketData: Omit<EventTicket, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ticketRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...ticketData,
        eventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return ticketRef.id;
    } catch (error) {
      console.error('添加票务失败:', error);
      throw new Error('添加票务失败');
    }
  }

  static async updateTicket(ticketId: string, ticketData: Partial<EventTicket>): Promise<void> {
    try {
      const ticketRef = doc(db, this.COLLECTION_NAME, ticketId);
      await updateDoc(ticketRef, {
        ...ticketData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('更新票务失败:', error);
      throw new Error('更新票务失败');
    }
  }

  static async deleteTicket(ticketId: string): Promise<void> {
    try {
      const ticketRef = doc(db, this.COLLECTION_NAME, ticketId);
      await deleteDoc(ticketRef);
    } catch (error) {
      console.error('删除票务失败:', error);
      throw new Error('删除票务失败');
    }
  }

  static async getEventTickets(eventId: string): Promise<EventTicket[]> {
    try {
      const ticketsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('eventId', '==', eventId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(ticketsQuery);
      
      const tickets: EventTicket[] = [];
      snapshot.forEach((doc) => {
        tickets.push({ id: doc.id, ...doc.data() } as EventTicket);
      });
      
      return tickets;
    } catch (error) {
      console.error('获取票务列表失败:', error);
      throw new Error('获取票务列表失败');
    }
  }
}

// 活动注册服务
export class EventRegistrationService {
  private static readonly COLLECTION_NAME = 'eventRegistrations';

  static async registerForEvent(registrationData: EventRegistrationData, userId: string): Promise<string> {
    try {
      // 检查是否已经注册
      const existingQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('eventId', '==', registrationData.eventId),
        where('userEmail', '==', registrationData.userEmail)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        throw new Error('您已经注册过这个活动');
      }
      
      // 获取票务信息
      let ticket: EventTicket | null = null;
      if (registrationData.ticketId) {
        const ticketDoc = await getDoc(doc(db, 'eventTickets', registrationData.ticketId));
        if (ticketDoc.exists()) {
          ticket = { id: ticketDoc.id, ...ticketDoc.data() } as EventTicket;
        }
      }
      
      const registrationRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...registrationData,
        userId,
        amount: ticket?.regularPrice || 0,
        currency: ticket?.currency || 'MYR',
        paymentMethod: 'Pending',
        paymentStatus: 'Pending',
        status: RegistrationStatus.PENDING,
        registeredAt: serverTimestamp(),
      });
      
      // 更新票务销售数量
      if (ticket) {
        await EventTicketService.updateTicket(ticket.id, {
          soldQuantity: ticket.soldQuantity + 1,
        });
      }
      
      // 更新活动统计
      const eventRef = doc(db, 'events', registrationData.eventId);
      await updateDoc(eventRef, {
        totalRegistrations: serverTimestamp(), // 这里应该用 increment
        pendingRegistrations: serverTimestamp(), // 这里应该用 increment
      });
      
      return registrationRef.id;
    } catch (error) {
      console.error('活动注册失败:', error);
      throw new Error('活动注册失败');
    }
  }

  static async updateRegistrationStatus(
    registrationId: string, 
    status: RegistrationStatus, 
    userId: string,
    rejectionReason?: string
  ): Promise<void> {
    try {
      const registrationRef = doc(db, this.COLLECTION_NAME, registrationId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };
      
      if (status === RegistrationStatus.APPROVED) {
        updateData.approvedAt = serverTimestamp();
        updateData.approvedBy = userId;
      } else if (status === RegistrationStatus.REJECTED) {
        updateData.rejectedAt = serverTimestamp();
        updateData.rejectedBy = userId;
        updateData.rejectionReason = rejectionReason;
      }
      
      await updateDoc(registrationRef, updateData);
      
      // 更新活动统计
      const registrationDoc = await getDoc(registrationRef);
      if (registrationDoc.exists()) {
        const registration = { id: registrationDoc.id, ...registrationDoc.data() } as EventRegistration;
        const eventRef = doc(db, 'events', registration.eventId);
        
        if (status === RegistrationStatus.APPROVED) {
          await updateDoc(eventRef, {
            approvedRegistrations: serverTimestamp(), // 这里应该用 increment
            pendingRegistrations: serverTimestamp(), // 这里应该用 decrement
          });
        } else if (status === RegistrationStatus.REJECTED) {
          await updateDoc(eventRef, {
            pendingRegistrations: serverTimestamp(), // 这里应该用 decrement
          });
        }
      }
    } catch (error) {
      console.error('更新注册状态失败:', error);
      throw new Error('更新注册状态失败');
    }
  }

  static async getEventRegistrations(
    eventId: string, 
    params: { page?: number; limit?: number; status?: RegistrationStatus } = {}
  ): Promise<EventRegistrationListResponse> {
    try {
      const { page = 1, limit: pageLimit = 20, status } = params;
      
      let registrationsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('eventId', '==', eventId),
        orderBy('registeredAt', 'desc')
      );
      
      if (status) {
        registrationsQuery = query(registrationsQuery, where('status', '==', status));
      }
      
      registrationsQuery = query(registrationsQuery, limit(pageLimit));
      
      const snapshot = await getDocs(registrationsQuery);
      const registrations: EventRegistration[] = [];
      
      snapshot.forEach((doc) => {
        registrations.push({ id: doc.id, ...doc.data() } as EventRegistration);
      });
      
      return {
        registrations,
        total: registrations.length,
        page,
        limit: pageLimit,
        hasMore: registrations.length === pageLimit,
      };
    } catch (error) {
      console.error('获取注册列表失败:', error);
      throw new Error('获取注册列表失败');
    }
  }

  static async getUserRegistrations(userEmail: string): Promise<EventRegistration[]> {
    try {
      const registrationsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('userEmail', '==', userEmail),
        orderBy('registeredAt', 'desc')
      );
      const snapshot = await getDocs(registrationsQuery);
      
      const registrations: EventRegistration[] = [];
      snapshot.forEach((doc) => {
        registrations.push({ id: doc.id, ...doc.data() } as EventRegistration);
      });
      
      return registrations;
    } catch (error) {
      console.error('获取用户注册记录失败:', error);
      throw new Error('获取用户注册记录失败');
    }
  }
}

// 导出服务实例
export const eventService = EventService;
export const eventProgramService = EventProgramService;
export const eventCommitteeService = EventCommitteeService;
export const eventTrainerService = EventTrainerService;
export const eventTicketService = EventTicketService;
export const eventRegistrationService = EventRegistrationService;
