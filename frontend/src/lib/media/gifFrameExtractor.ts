/**
 * GIF 파일의 첫 번째 프레임을 추출하여 정적 이미지로 변환하는 유틸리티
 */

export interface FrameExtractionResult {
  success: boolean;
  file?: File;
  error?: string;
}

/**
 * GIF 파일의 첫 번째 프레임을 추출하여 PNG 파일로 변환
 * @param gifFile - GIF 파일
 * @returns Promise<FrameExtractionResult>
 */
export async function extractFirstFrameFromGif(gifFile: File): Promise<FrameExtractionResult> {
  try {
    // GIF 파일인지 확인
    if (!gifFile.type.includes('gif')) {
      return {
        success: false,
        error: 'GIF 파일이 아닙니다.'
      };
    }

    // Canvas를 사용하여 첫 번째 프레임 추출
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return {
        success: false,
        error: 'Canvas 컨텍스트를 생성할 수 없습니다.'
      };
    }

    // Image 객체로 GIF 로드
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        try {
          // Canvas 크기를 이미지 크기로 설정
          canvas.width = img.width;
          canvas.height = img.height;
          
          // 첫 번째 프레임을 Canvas에 그리기
          ctx.drawImage(img, 0, 0);
          
          // Canvas를 Blob으로 변환 (PNG 형식)
          canvas.toBlob((blob) => {
            if (blob) {
              // 원본 파일명에서 확장자를 png로 변경
              const originalName = gifFile.name;
              const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
              const newFileName = `${nameWithoutExt}_frame.png`;
              
              // Blob을 File 객체로 변환
              const extractedFile = new File([blob], newFileName, {
                type: 'image/png',
                lastModified: Date.now()
              });
              
              resolve({
                success: true,
                file: extractedFile
              });
            } else {
              resolve({
                success: false,
                error: 'Canvas를 Blob으로 변환하는데 실패했습니다.'
              });
            }
          }, 'image/png', 0.9);
        } catch (error) {
          resolve({
            success: false,
            error: `프레임 추출 중 오류가 발생했습니다: ${error}`
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          error: 'GIF 파일을 로드할 수 없습니다.'
        });
      };
      
      // 이미지 로드 시작
      img.src = URL.createObjectURL(gifFile);
    });
  } catch (error) {
    return {
      success: false,
      error: `프레임 추출 중 예상치 못한 오류가 발생했습니다: ${error}`
    };
  }
}

/**
 * 파일이 GIF인지 확인
 * @param file - 확인할 파일
 * @returns boolean
 */
export function isGifFile(file: File): boolean {
  return file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
}
