import React, { useState, useCallback } from 'react';
import { 
  Steps, 
  Card, 
  Space, 
  Typography, 
  Alert, 
  Button,
  Modal,
  message
} from 'antd';
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined,
  FilePdfOutlined,
  RobotOutlined,
  GoogleOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// 导入组件和服务
import PDFUploader from '@/components/PDFUploader';
import PDFInterpretationResult from '@/components/PDFInterpretationResult';
import StandardEditModal from '@/components/common/StandardEditModal';
import AIServiceSelector from '@/components/AIServiceSelector';

// 导入服务
import { pdfParseService } from '@/services/pdfParseService';
import { chatGPTService } from '@/services/chatGPTService';
import { geminiService } from '@/services/geminiService';
import { fieldMappingService } from '@/services/fieldMappingService';
import { dataValidationService } from '@/services/dataValidationService';
import { databaseWriteService } from '@/services/databaseWriteService';

// 导入类型
import { 
  PDFInterpretationState, 
  PDFInterpretationStep,
  StandardEditModalData,
  ChatGPTResponse
} from '@/types/pdfInterpretation';

const { Title, Text } = Typography;

const PDFInterpretationPage: React.FC = () => {
  const navigate = useNavigate();
  
  // AI服务选择状态
  const [selectedAIService, setSelectedAIService] = useState<'chatgpt' | 'gemini'>('chatgpt');

  // 组件初始化时显示AI服务状态
  React.useEffect(() => {
    console.log(`🚀 PDF解读页面初始化`);
    console.log(`🎯 默认AI服务:`, selectedAIService);
    console.log(`📋 服务配置状态:`, {
      chatGPT: chatGPTService.isConfigured() ? '✅ 已配置' : '❌ 未配置',
      gemini: geminiService.isConfigured() ? '✅ 已配置' : '❌ 未配置'
    });
  }, []);

  // AI服务切换处理函数
  const handleAIServiceChange = useCallback((service: 'chatgpt' | 'gemini') => {
    console.log(`🔄 AI服务切换: ${selectedAIService} → ${service}`);
    console.log(`📋 服务配置状态:`, {
      chatGPT: chatGPTService.isConfigured() ? '✅ 已配置' : '❌ 未配置',
      gemini: geminiService.isConfigured() ? '✅ 已配置' : '❌ 未配置'
    });
    setSelectedAIService(service);
  }, [selectedAIService]);

  // 状态管理
  const [state, setState] = useState<PDFInterpretationState>({
    currentStep: 0,
    steps: [
      {
        title: '上传PDF',
        description: '选择指标文件',
        status: 'waiting'
      },
      {
        title: 'AI解读',
        description: 'AI分析内容',
        status: 'waiting'
      },
      {
        title: '字段映射',
        description: '生成表单数据',
        status: 'waiting'
      },
      {
        title: '验证确认',
        description: '检查数据完整性',
        status: 'waiting'
      },
      {
        title: '保存完成',
        description: '写入系统数据库',
        status: 'waiting'
      }
    ],
    uploadedFile: null,
    pdfContent: '',
    chatGPTResponse: null,
    standardData: null,
    validationResult: null,
    isProcessing: false,
    error: null
  });

  // 标准编辑模态框状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState<StandardEditModalData | null>(null);

  // 监控模态框状态变化
  React.useEffect(() => {
    console.log('📱 模态框状态变化:', {
      showEditModal,
      hasEditModalData: !!editModalData,
      currentStep: state.currentStep
    });
  }, [showEditModal, editModalData, state.currentStep]);

  // 更新步骤状态
  const updateStepStatus = useCallback((stepIndex: number, status: PDFInterpretationStep['status'], error?: string) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map((step, index) => 
        index === stepIndex ? { ...step, status, error } : step
      )
    }));
  }, []);

  // 文件上传处理
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      console.log('📁 开始处理文件上传:', file.name);
      console.log(`🎯 当前选择的AI服务:`, selectedAIService);
      
      // 防止重复处理
      if (state.isProcessing) {
        console.log('⚠️ 文件正在处理中，跳过重复调用');
        return;
      }
      
      setState(prev => ({ 
        ...prev, 
        uploadedFile: file, 
        isProcessing: true, 
        error: null 
      }));
      
      updateStepStatus(0, 'processing');

      // 解析PDF
      const pdfResult = await pdfParseService.parsePDF(file);
      console.log('✅ PDF解析完成:', pdfResult);

      // 预处理文本
      const processedText = pdfParseService.preprocessText(pdfResult.text);
      
      setState(prev => ({ 
        ...prev, 
        pdfContent: processedText 
      }));

      updateStepStatus(0, 'completed');
      
      // 自动进入下一步
      setTimeout(() => {
        handleAIIntepretation(processedText, file.name);
      }, 1000);

    } catch (error) {
      console.error('❌ 文件处理失败:', error);
      const errorMessage = error instanceof Error ? error.message : '文件处理失败';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false 
      }));
      updateStepStatus(0, 'error', errorMessage);
      message.error(errorMessage);
    }
  }, [updateStepStatus, state.isProcessing, selectedAIService]);

  // AI解读处理（支持ChatGPT和Gemini）
  const handleAIIntepretation = useCallback(async (pdfContent: string, filename: string) => {
    try {
      const serviceName = selectedAIService === 'chatgpt' ? 'ChatGPT' : 'Gemini';
      console.log(`🤖 开始${serviceName}解读`);
      console.log(`🔍 当前选择的AI服务:`, selectedAIService);
      console.log(`📊 服务配置状态:`, {
        chatGPT: chatGPTService.isConfigured() ? '✅ 已配置' : '❌ 未配置',
        gemini: geminiService.isConfigured() ? '✅ 已配置' : '❌ 未配置',
        selected: selectedAIService
      });
      
      setState(prev => ({ 
        ...prev, 
        currentStep: 1,
        isProcessing: true 
      }));
      
      updateStepStatus(1, 'processing');

      // 根据选择的服务进行解读
      let aiResponse;
      if (selectedAIService === 'chatgpt') {
        // 检查ChatGPT配置
        if (!chatGPTService.isConfigured()) {
          console.warn('⚠️ ChatGPT API未配置，使用默认响应');
          aiResponse = {
            awardType: 'efficient_star',
            basicFields: {
              title: 'PDF解读结果',
              description: 'PDF文件已成功解析，但AI解读功能需要有效的OpenAI API密钥。请手动填写相关字段。',
              deadline: '2025-12-31',
              externalLink: undefined
            },
            categoryFields: {
              categoryId: undefined,
              category: undefined
            },
            specificFields: {
              no: undefined,
              guidelines: undefined,
              objective: undefined,
              nationalAllocation: undefined,
              areaAllocation: undefined,
              status: 'open'
            },
            scoreRules: [],
            teamManagement: undefined,
            confidence: 0.1,
            extractedKeywords: [],
            notes: 'PDF解析成功，但AI解读功能需要OpenAI API密钥。请手动填写相关字段信息。如需使用AI解读功能，请配置有效的VITE_OPENAI_API_KEY环境变量。'
          };
        } else {
          aiResponse = await chatGPTService.interpretPDF(pdfContent, filename);
        }
      } else {
        // 检查Gemini配置
        if (!geminiService.isConfigured()) {
          console.warn('⚠️ Gemini API未配置，使用默认响应');
          aiResponse = {
            awardType: 'efficient_star',
            basicFields: {
              title: 'PDF解读结果',
              description: 'PDF文件已成功解析，但AI解读功能需要有效的Gemini API密钥。请手动填写相关字段。',
              deadline: '2025-12-31',
              externalLink: undefined
            },
            categoryFields: {
              categoryId: undefined,
              category: undefined
            },
            specificFields: {
              no: undefined,
              guidelines: undefined,
              objective: undefined,
              nationalAllocation: undefined,
              areaAllocation: undefined,
              status: 'open'
            },
            scoreRules: [],
            teamManagement: undefined,
            confidence: 0.1,
            extractedKeywords: [],
            notes: 'PDF解析成功，但AI解读功能需要Gemini API密钥。请手动填写相关字段信息。如需使用AI解读功能，请配置有效的VITE_GEMINI_API_KEY环境变量。'
          };
        } else {
          aiResponse = await geminiService.interpretPDF(pdfContent, filename);
        }
      }

      console.log(`✅ ${serviceName}解读完成:`, aiResponse);

      setState(prev => ({ 
        ...prev, 
        chatGPTResponse: aiResponse as ChatGPTResponse
      }));

      updateStepStatus(1, 'completed');
      
      // 自动进入下一步
      setTimeout(() => {
        handleFieldMapping(aiResponse as ChatGPTResponse, pdfContent);
      }, 1000);

    } catch (error) {
      console.error(`❌ ${selectedAIService === 'chatgpt' ? 'ChatGPT' : 'Gemini'}解读失败:`, error);
      const errorMessage = error instanceof Error ? error.message : 'AI解读失败';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false 
      }));
      updateStepStatus(1, 'error', errorMessage);
      message.error(errorMessage);
    }
  }, [updateStepStatus, selectedAIService]);

  // 字段映射处理
  const handleFieldMapping = useCallback(async (chatGPTResponse: ChatGPTResponse, pdfContent: string) => {
    try {
      console.log('🔄 开始字段映射');
      
      setState(prev => ({ 
        ...prev, 
        currentStep: 2,
        isProcessing: true 
      }));
      
      updateStepStatus(2, 'processing');

      // 字段映射
      const standardData = fieldMappingService.mapToStandardFields(chatGPTResponse, pdfContent);
      console.log('✅ 字段映射完成:', standardData);

      setState(prev => ({ 
        ...prev, 
        standardData 
      }));

      updateStepStatus(2, 'completed');
      
      // 自动进入下一步
      setTimeout(() => {
        handleDataValidation(standardData);
      }, 1000);

    } catch (error) {
      console.error('❌ 字段映射失败:', error);
      const errorMessage = error instanceof Error ? error.message : '字段映射失败';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false 
      }));
      updateStepStatus(2, 'error', errorMessage);
      message.error(errorMessage);
    }
  }, [updateStepStatus]);

  // 数据验证处理
  const handleDataValidation = useCallback(async (standardData: StandardEditModalData) => {
    try {
      console.log('🔍 开始数据验证');
      
      setState(prev => ({ 
        ...prev, 
        currentStep: 3,
        isProcessing: true 
      }));
      
      updateStepStatus(3, 'processing');

      // 数据验证
      const validationResult = dataValidationService.validateStandardFields(standardData);
      console.log('✅ 数据验证完成:', validationResult);

      // 修复常见问题
      const fixedData = dataValidationService.fixCommonIssues(standardData);

      setState(prev => ({ 
        ...prev, 
        standardData: fixedData,
        validationResult,
        isProcessing: false 
      }));

      updateStepStatus(3, 'completed');

      // 添加详细的调试日志
      console.log('🔍 数据验证完成，准备进入下一步');
      console.log('📊 当前状态:', {
        currentStep: 3,
        isProcessing: false,
        validationResult: validationResult.isValid,
        hasStandardData: !!fixedData,
        showEditModal: false
      });
      console.log('⏰ 准备在1秒后打开模态框...');

      // 自动进入下一步 - 打开编辑模态框
      setTimeout(() => {
        console.log('📱 正在打开编辑模态框...');
        setEditModalData(fixedData);
        setShowEditModal(true);
        console.log('✅ 模态框状态已更新为 true');
      }, 1000);

    } catch (error) {
      console.error('❌ 数据验证失败:', error);
      const errorMessage = error instanceof Error ? error.message : '数据验证失败';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false 
      }));
      updateStepStatus(3, 'error', errorMessage);
      message.error(errorMessage);
    }
  }, [updateStepStatus]);

  // 保存数据到数据库
  const handleSaveToDatabase = useCallback(async () => {
    console.log('🚀 保存流程被触发');
    console.log('📊 当前状态:', {
      hasStandardData: !!state.standardData,
      currentStep: state.currentStep,
      isProcessing: state.isProcessing,
      validationResult: state.validationResult?.isValid
    });

    if (!state.standardData) {
      console.log('❌ 没有标准数据，无法保存');
      return;
    }

    try {
      console.log('💾 开始保存数据到数据库');
      
      setState(prev => ({ 
        ...prev, 
        currentStep: 4,
        isProcessing: true 
      }));
      
      updateStepStatus(4, 'processing');

      // 保存到数据库
      const saveResult = await databaseWriteService.saveStandardData(state.standardData);
      
      if (saveResult.success) {
        console.log('✅ 数据保存成功:', saveResult.standardId);
        updateStepStatus(4, 'completed');
        
        setState(prev => ({ 
          ...prev, 
          isProcessing: false 
        }));

        message.success('数据保存成功！');
        
        // 显示成功对话框
        Modal.success({
          title: '保存成功',
          content: 'PDF指标文件已成功解读并保存到系统。您可以继续上传其他文件或返回主页面。',
          onOk: () => {
            // 重置状态
            setState({
              currentStep: 0,
              steps: state.steps.map(step => ({ ...step, status: 'waiting' as const })),
              uploadedFile: null,
              pdfContent: '',
              chatGPTResponse: null,
              standardData: null,
              validationResult: null,
              isProcessing: false,
              error: null
            });
          }
        });
      } else {
        throw new Error(saveResult.error || '保存失败');
      }

    } catch (error) {
      console.error('❌ 数据保存失败:', error);
      const errorMessage = error instanceof Error ? error.message : '数据保存失败';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false 
      }));
      updateStepStatus(4, 'error', errorMessage);
      message.error(errorMessage);
    }
  }, [state.standardData, state.steps, updateStepStatus]);

  // 手动编辑
  const handleEdit = useCallback(() => {
    if (state.standardData) {
      setEditModalData(state.standardData);
      setShowEditModal(true);
    }
  }, [state.standardData]);

  // 重新解读
  const handleRetry = useCallback(() => {
    if (state.pdfContent && state.uploadedFile) {
      // 重置状态
      setState(prev => ({
        ...prev,
        currentStep: 1,
        chatGPTResponse: null,
        standardData: null,
        validationResult: null,
        error: null
      }));
      
      // 重新开始解读流程
      handleAIIntepretation(state.pdfContent, state.uploadedFile.name);
    }
  }, [state.pdfContent, state.uploadedFile]);

  // 文件移除
  const handleFileRemove = useCallback(() => {
    setState({
      currentStep: 0,
      steps: state.steps.map(step => ({ ...step, status: 'waiting' as const })),
      uploadedFile: null,
      pdfContent: '',
      chatGPTResponse: null,
      standardData: null,
      validationResult: null,
      isProcessing: false,
      error: null
    });
  }, [state.steps]);

  // 返回主页面
  const handleGoBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* 页面标题 */}
        <div style={{ textAlign: 'center' }}>
          <Title level={2}>
            <FilePdfOutlined /> PDF指标解读系统
          </Title>
          <Text type="secondary">
            通过AI智能解读PDF指标文件，自动生成StandardEditModal表单数据
          </Text>
        </div>

        {/* 步骤指示器 */}
        <Card>
          <Steps 
            current={state.currentStep} 
            items={state.steps.map((step, index) => ({
              title: step.title,
              description: step.description,
              status: step.status === 'completed' ? 'finish' : 
                      step.status === 'error' ? 'error' :
                      step.status === 'processing' ? 'process' :
                      'wait',
              icon: step.status === 'completed' ? <CheckCircleOutlined /> : 
                    step.status === 'error' ? <ArrowRightOutlined /> :
                    step.status === 'processing' ? <ArrowRightOutlined /> :
                    index === 0 ? <FilePdfOutlined /> :
                    index === 1 ? <RobotOutlined /> :
                    index === 2 ? <ApiOutlined /> :
                    index === 3 ? <CheckCircleOutlined /> :
                    <SaveOutlined />
            }))}
          />
        </Card>

        {/* 错误提示 */}
        {state.error && (
          <Alert
            message="处理失败"
            description={state.error}
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={handleRetry}>
                重试
              </Button>
            }
          />
        )}

        {/* AI服务选择器 */}
        {state.currentStep === 0 && (
          <AIServiceSelector
            selectedService={selectedAIService}
            onServiceChange={handleAIServiceChange}
            chatGPTConfigured={chatGPTService.isConfigured()}
            geminiConfigured={geminiService.isConfigured()}
          />
        )}

        {/* 当前步骤内容 */}
        {state.currentStep === 0 && (
          <PDFUploader
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
            uploadedFile={state.uploadedFile}
            isProcessing={state.isProcessing}
          />
        )}

        {state.currentStep === 1 && (
          <Card title={`🤖 ${selectedAIService === 'chatgpt' ? 'ChatGPT' : 'Gemini'}解读中...`} size="small">
            <Space direction="vertical" style={{ width: '100%' }} align="center">
              {selectedAIService === 'chatgpt' ? (
                <RobotOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              ) : (
                <GoogleOutlined style={{ fontSize: '48px', color: '#4285f4' }} />
              )}
              <Text>{selectedAIService === 'chatgpt' ? 'ChatGPT' : 'Gemini'}正在分析PDF内容...</Text>
              <Text type="secondary">这可能需要几秒钟时间，请耐心等待</Text>
            </Space>
          </Card>
        )}

        {state.currentStep === 2 && (
          <Card title="🔄 字段映射中..." size="small">
            <Space direction="vertical" style={{ width: '100%' }} align="center">
              <ApiOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              <Text>正在将AI解读结果映射为表单字段...</Text>
              <Text type="secondary">生成标准化的数据结构</Text>
            </Space>
          </Card>
        )}

        {state.currentStep === 3 && (
          <Card title="🔍 数据验证中..." size="small">
            <Space direction="vertical" style={{ width: '100%' }} align="center">
              <CheckCircleOutlined style={{ fontSize: '48px', color: '#faad14' }} />
              <Text>正在验证数据完整性和正确性...</Text>
              <Text type="secondary">检查必填字段和格式</Text>
            </Space>
          </Card>
        )}

        {state.currentStep === 4 && state.standardData && state.validationResult && (
          <PDFInterpretationResult
            data={state.standardData}
            validationResult={state.validationResult}
            onConfirm={handleSaveToDatabase}
            onEdit={handleEdit}
            onRetry={handleRetry}
            isProcessing={state.isProcessing}
          />
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
              disabled={state.isProcessing}
            >
              返回主页面
            </Button>
            
            {state.currentStep > 0 && !state.isProcessing && (
              <Button 
                onClick={() => {
                  setState(prev => ({ 
                    ...prev, 
                    currentStep: Math.max(0, prev.currentStep - 1) 
                  }));
                }}
              >
                上一步
              </Button>
            )}
          </Space>
        </div>
      </Space>

      {/* 标准编辑模态框 */}
      {showEditModal && editModalData && (
        <StandardEditModal
          visible={showEditModal}
          onClose={() => {
            console.log('📱 用户关闭模态框');
            setShowEditModal(false);
          }}
          onSave={(data) => {
            console.log('💾 用户点击保存按钮');
            console.log('📊 保存的数据:', data);
            setState(prev => ({ 
              ...prev, 
              standardData: { ...prev.standardData!, ...data }
            }));
            console.log('📱 关闭模态框');
            setShowEditModal(false);
            console.log('✅ 数据已更新，准备进入保存流程');
            message.success('数据已更新');
            
            // 自动进入步骤4，显示确认界面
            setTimeout(() => {
              console.log('🔄 进入步骤4，显示确认界面');
              setState(prev => ({
                ...prev,
                currentStep: 4
              }));
            }, 500);
          }}
          title="编辑解读结果"
          initialValues={editModalData}
          members={[]} // 这里应该传入实际的会员数据
          awardType={editModalData.awardType as any}
          showTeamManagement={!!editModalData.teamManagement}
        />
      )}
    </div>
  );
};

export default PDFInterpretationPage;
