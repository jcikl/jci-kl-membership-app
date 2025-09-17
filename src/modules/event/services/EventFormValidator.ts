import { EventFormData, ValidationError } from '@/contexts/EventFormContext';
import { EventProgram, CommitteeMember, EventTrainer } from '@/types/event';

// 验证结果类型
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 验证规则配置
export const EVENT_FORM_RULES = {
  basicInfo: {
    name: { required: true, maxLength: 100 },
    description: { required: true, maxLength: 1000 },
    type: { required: true },
    level: { required: true },
    category: { required: true }
  },
  timeLocation: {
    startDate: { required: true },
    endDate: { required: true },
    location: { required: true, maxLength: 200 },
    virtualLink: { maxLength: 500 }
  },
  pricing: {
    price: { min: 0 },
    currency: { required: true },
    paymentMethods: { minItems: 1 }
  },
  registration: {
    maxParticipants: { min: 1 },
    registrationStartDate: { required: false },
    registrationEndDate: { required: false }
  }
};

// 事件表单验证器类
export class EventFormValidator {
  
  /**
   * 验证基本信息
   */
  static validateBasicInfo(data: Partial<EventFormData>): ValidationResult {
    const errors: ValidationError[] = [];
    const rules = EVENT_FORM_RULES.basicInfo;

    // 验证活动名称
    if (rules.name.required && (!data.name || data.name.trim() === '')) {
      errors.push({
        field: 'name',
        message: '请输入活动名称',
        step: 0
      });
    } else if (data.name && data.name.length > rules.name.maxLength) {
      errors.push({
        field: 'name',
        message: `活动名称不能超过${rules.name.maxLength}个字符`,
        step: 0
      });
    }

    // 验证活动描述
    if (rules.description.required && (!data.description || data.description.trim() === '')) {
      errors.push({
        field: 'description',
        message: '请输入活动描述',
        step: 0
      });
    } else if (data.description && data.description.length > rules.description.maxLength) {
      errors.push({
        field: 'description',
        message: `活动描述不能超过${rules.description.maxLength}个字符`,
        step: 0
      });
    }

    // 验证活动类型
    if (rules.type.required && !data.type) {
      errors.push({
        field: 'type',
        message: '请选择活动类型',
        step: 0
      });
    }

    // 验证活动级别
    if (rules.level.required && !data.level) {
      errors.push({
        field: 'level',
        message: '请选择活动级别',
        step: 0
      });
    }

    // 验证活动分类
    if (rules.category.required && !data.category) {
      errors.push({
        field: 'category',
        message: '请选择活动分类',
        step: 0
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证时间地点信息
   */
  static validateTimeLocation(data: Partial<EventFormData>): ValidationResult {
    const errors: ValidationError[] = [];
    const rules = EVENT_FORM_RULES.timeLocation;

    // 验证开始时间
    if (rules.startDate.required && !data.startDate) {
      errors.push({
        field: 'startDate',
        message: '请选择活动开始时间',
        step: 1
      });
    }

    // 验证结束时间
    if (rules.endDate.required && !data.endDate) {
      errors.push({
        field: 'endDate',
        message: '请选择活动结束时间',
        step: 1
      });
    }

    // 验证时间逻辑
    if (data.startDate && data.endDate && data.endDate.isBefore(data.startDate)) {
      errors.push({
        field: 'endDate',
        message: '活动结束时间不能早于开始时间',
        step: 1
      });
    }

    // 验证地点
    if (rules.location.required && (!data.location || data.location.trim() === '')) {
      errors.push({
        field: 'location',
        message: '请输入活动地点',
        step: 1
      });
    } else if (data.location && data.location.length > rules.location.maxLength) {
      errors.push({
        field: 'location',
        message: `活动地点不能超过${rules.location.maxLength}个字符`,
        step: 1
      });
    }

    // 验证虚拟活动链接
    if (data.isVirtual && data.virtualLink && data.virtualLink.length > rules.virtualLink.maxLength) {
      errors.push({
        field: 'virtualLink',
        message: `虚拟活动链接不能超过${rules.virtualLink.maxLength}个字符`,
        step: 1
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证定价信息
   */
  static validatePricing(data: Partial<EventFormData>): ValidationResult {
    const errors: ValidationError[] = [];
    const rules = EVENT_FORM_RULES.pricing;

    // 验证价格
    if (!data.isFree && data.price !== undefined && data.price < rules.price.min) {
      errors.push({
        field: 'price',
        message: '价格不能小于0',
        step: 2
      });
    }

    // 验证货币
    if (rules.currency.required && (!data.currency || data.currency.trim() === '')) {
      errors.push({
        field: 'currency',
        message: '请选择货币类型',
        step: 2
      });
    }

    // 验证支付方式
    if (!data.isFree && data.paymentMethods && data.paymentMethods.length < rules.paymentMethods.minItems) {
      errors.push({
        field: 'paymentMethods',
        message: '请至少选择一种支付方式',
        step: 2
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证注册信息
   */
  static validateRegistration(data: Partial<EventFormData>): ValidationResult {
    const errors: ValidationError[] = [];
    const rules = EVENT_FORM_RULES.registration;

    // 验证最大参与人数
    if (data.maxParticipants !== undefined && data.maxParticipants < rules.maxParticipants.min) {
      errors.push({
        field: 'maxParticipants',
        message: '最大参与人数不能小于1',
        step: 3
      });
    }

    // 验证注册时间逻辑
    if (data.registrationStartDate && data.registrationEndDate && 
        data.registrationEndDate.isBefore(data.registrationStartDate)) {
      errors.push({
        field: 'registrationEndDate',
        message: '注册结束时间不能早于注册开始时间',
        step: 3
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证程序安排
   */
  static validatePrograms(programs: EventProgram[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (programs.length === 0) {
      errors.push({
        field: 'programs',
        message: '请至少添加一个程序安排',
        step: 4
      });
    }

    programs.forEach((program, index) => {
      if (!program.title || program.title.trim() === '') {
        errors.push({
          field: `programs[${index}].title`,
          message: `程序${index + 1}的标题不能为空`,
          step: 4
        });
      }

      if (!program.startTime) {
        errors.push({
          field: `programs[${index}].startTime`,
          message: `程序${index + 1}的开始时间不能为空`,
          step: 4
        });
      }

      if (!program.endTime) {
        errors.push({
          field: `programs[${index}].endTime`,
          message: `程序${index + 1}的结束时间不能为空`,
          step: 4
        });
      }

      if (program.startTime && program.endTime && program.endTime.isBefore(program.startTime)) {
        errors.push({
          field: `programs[${index}].endTime`,
          message: `程序${index + 1}的结束时间不能早于开始时间`,
          step: 4
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证委员会信息
   */
  static validateCommittee(committee: CommitteeMember[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (committee.length === 0) {
      errors.push({
        field: 'committee',
        message: '请至少添加一个委员会成员',
        step: 5
      });
    }

    committee.forEach((member, index) => {
      if (!member.fullName || member.fullName.trim() === '') {
        errors.push({
          field: `committee[${index}].fullName`,
          message: `委员会成员${index + 1}的姓名不能为空`,
          step: 5
        });
      }

      if (!member.position || member.position.trim() === '') {
        errors.push({
          field: `committee[${index}].position`,
          message: `委员会成员${index + 1}的职位不能为空`,
          step: 5
        });
      }

      if (member.email && !this.isValidEmail(member.email)) {
        errors.push({
          field: `committee[${index}].email`,
          message: `委员会成员${index + 1}的邮箱格式不正确`,
          step: 5
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证讲师信息
   */
  static validateTrainers(trainers: EventTrainer[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (trainers.length === 0) {
      errors.push({
        field: 'trainers',
        message: '请至少添加一个讲师',
        step: 6
      });
    }

    trainers.forEach((trainer, index) => {
      if (!trainer.fullName || trainer.fullName.trim() === '') {
        errors.push({
          field: `trainers[${index}].fullName`,
          message: `讲师${index + 1}的姓名不能为空`,
          step: 6
        });
      }

      if (!trainer.title || trainer.title.trim() === '') {
        errors.push({
          field: `trainers[${index}].title`,
          message: `讲师${index + 1}的头衔不能为空`,
          step: 6
        });
      }

      if (trainer.email && !this.isValidEmail(trainer.email)) {
        errors.push({
          field: `trainers[${index}].email`,
          message: `讲师${index + 1}的邮箱格式不正确`,
          step: 6
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证整个表单
   */
  static validateForm(data: EventFormData): ValidationResult {
    const allErrors: ValidationError[] = [];

    // 验证各个步骤
    const basicInfoResult = this.validateBasicInfo(data);
    const timeLocationResult = this.validateTimeLocation(data);
    const pricingResult = this.validatePricing(data);
    const registrationResult = this.validateRegistration(data);
    const programsResult = this.validatePrograms(data.programs);
    const committeeResult = this.validateCommittee(data.committee);
    const trainersResult = this.validateTrainers(data.trainers);

    // 合并所有错误
    allErrors.push(
      ...basicInfoResult.errors,
      ...timeLocationResult.errors,
      ...pricingResult.errors,
      ...registrationResult.errors,
      ...programsResult.errors,
      ...committeeResult.errors,
      ...trainersResult.errors
    );

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * 验证指定步骤
   */
  static validateStep(data: EventFormData, step: number): ValidationResult {
    switch (step) {
      case 0:
        return this.validateBasicInfo(data);
      case 1:
        return this.validateTimeLocation(data);
      case 2:
        return this.validatePricing(data);
      case 3:
        return this.validateRegistration(data);
      case 4:
        return this.validatePrograms(data.programs);
      case 5:
        return this.validateCommittee(data.committee);
      case 6:
        return this.validateTrainers(data.trainers);
      default:
        return { isValid: true, errors: [] };
    }
  }

  /**
   * 验证邮箱格式
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default EventFormValidator;
