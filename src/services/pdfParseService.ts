import * as pdfjsLib from 'pdfjs-dist';
import { PDFUploadResult } from '@/types/pdfInterpretation';

// Configure PDF.js worker - use local worker to avoid CORS issues
if (typeof window !== 'undefined') {
  try {
    // Use local worker file from node_modules to avoid CORS issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    console.log('✅ PDF.js worker配置成功:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  } catch (error) {
    // Fallback to CDN if local worker is not available
    console.warn('⚠️ 无法加载本地PDF.js worker，使用CDN版本:', error);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  }
}

/**
 * PDF解析服务
 * 负责解析PDF文件并提取文本内容
 */
export class PDFParseService {
  private static instance: PDFParseService;
  
  public static getInstance(): PDFParseService {
    if (!PDFParseService.instance) {
      PDFParseService.instance = new PDFParseService();
    }
    return PDFParseService.instance;
  }

  /**
   * 解析PDF文件并提取文本内容
   */
  async parsePDF(file: File): Promise<PDFUploadResult> {
    try {
      console.log('🔄 开始解析PDF文件:', file.name);
      
      // 验证文件类型
      if (!this.isValidPDFFile(file)) {
        throw new Error('不支持的文件格式，请上传PDF文件');
      }

      // 验证文件大小 (最大10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('文件大小超过10MB限制');
      }

      // 将File对象转换为ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // 加载PDF文档
      const pdfDocument = await pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: true,
        disableFontFace: false,
        disableRange: false,
        disableStream: false,
      }).promise;

      console.log('📄 PDF文档加载完成:', {
        pages: pdfDocument.numPages,
        fingerprint: pdfDocument.fingerprints?.[0]
      });

      // 提取所有页面的文本
      let fullText = '';
      const pageTexts: string[] = [];

      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // 合并文本项
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        pageTexts.push(pageText);
        fullText += pageText + '\n';
      }

      // 获取文档元数据
      const metadata = await pdfDocument.getMetadata();
      const info = metadata?.info as any || {};

      console.log('✅ PDF解析完成:', {
        pages: pdfDocument.numPages,
        textLength: fullText.length,
        hasMetadata: !!info
      });

      return {
        file,
        text: fullText.trim(),
        pages: pdfDocument.numPages,
        metadata: {
          title: info.Title || undefined,
          author: info.Author || undefined,
          creationDate: info.CreationDate ? info.CreationDate.toString() : undefined,
          fileSize: file.size
        }
      };
    } catch (error) {
      console.error('❌ PDF解析失败:', error);
      throw new Error(`PDF解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 验证PDF文件格式
   */
  private isValidPDFFile(file: File): boolean {
    const validTypes = [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'application/vnd.pdf',
      'text/pdf',
      'text/x-pdf'
    ];
    
    const validExtensions = ['.pdf'];
    
    // 检查MIME类型
    if (validTypes.includes(file.type)) {
      return true;
    }
    
    // 检查文件扩展名
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * 预处理PDF文本内容
   * 清理和格式化文本以提高ChatGPT解读效果
   */
  preprocessText(text: string): string {
    try {
      console.log('🔄 预处理PDF文本内容');
      
      let processedText = text;
      
      // 移除多余的空白字符
      processedText = processedText.replace(/\s+/g, ' ').trim();
      
      // 移除页眉页脚常见模式
      processedText = processedText.replace(/第\s*\d+\s*页\s*共\s*\d+\s*页/g, '');
      processedText = processedText.replace(/Page\s+\d+\s+of\s+\d+/gi, '');
      
      // 移除页码
      processedText = processedText.replace(/^\s*\d+\s*$/gm, '');
      
      // 修复常见的OCR错误
      processedText = processedText.replace(/[|]/g, 'I'); // 管道符号替换为字母I
      
      // 确保句子之间有适当的空格
      processedText = processedText.replace(/([.!?])([A-Z])/g, '$1 $2');
      
      // 移除过多的换行符
      processedText = processedText.replace(/\n{3,}/g, '\n\n');
      
      console.log('✅ 文本预处理完成:', {
        originalLength: text.length,
        processedLength: processedText.length,
        reduction: ((text.length - processedText.length) / text.length * 100).toFixed(1) + '%'
      });
      
      return processedText;
    } catch (error) {
      console.warn('⚠️ 文本预处理失败，使用原始文本:', error);
      return text;
    }
  }

  /**
   * 提取PDF中的关键信息
   */
  extractKeyInformation(text: string): {
    hasDeadline: boolean;
    hasScoreInfo: boolean;
    hasMemberInfo: boolean;
    hasActivityInfo: boolean;
    keywords: string[];
  } {
    const keywords: string[] = [];
    
    // 检查是否包含截止日期信息
    const deadlinePatterns = [
      /截止日期[：:]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
      /deadline[：:]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
      /(\d{4}年\d{1,2}月\d{1,2}日)/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/
    ];
    const hasDeadline = deadlinePatterns.some(pattern => pattern.test(text));
    
    // 检查是否包含分数信息
    const scorePatterns = [
      /分数|score|points?|积分|分值/i,
      /\d+\s*分|\d+\s*points?/i
    ];
    const hasScoreInfo = scorePatterns.some(pattern => pattern.test(text));
    
    // 检查是否包含会员信息
    const memberPatterns = [
      /会员|member|参与者|participant/i,
      /人数|count|数量/
    ];
    const hasMemberInfo = memberPatterns.some(pattern => pattern.test(text));
    
    // 检查是否包含活动信息
    const activityPatterns = [
      /活动|activity|event|会议|meeting/i,
      /培训|training|workshop/
    ];
    const hasActivityInfo = activityPatterns.some(pattern => pattern.test(text));
    
    // 提取关键词
    const commonKeywords = [
      'JCI', 'Junior Chamber International', '青年商会',
      'Efficient Star', 'Star Point', 'National Area Incentive',
      'Network Star', 'Experience Star', 'Social Star', 'Outreach Star',
      '会员', 'member', '活动', 'activity', '分数', 'score',
      '截止日期', 'deadline', '标准', 'standard', '指标', 'indicator'
    ];
    
    commonKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    });
    
    return {
      hasDeadline,
      hasScoreInfo,
      hasMemberInfo,
      hasActivityInfo,
      keywords: [...new Set(keywords)] // 去重
    };
  }
}

// 导出单例实例
export const pdfParseService = PDFParseService.getInstance();
