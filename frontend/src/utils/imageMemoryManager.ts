class ImageMemoryManager {
  private cache = new Map<string, HTMLImageElement>();
  private accessOrder: string[] = [];
  private maxCacheSize = 50; // 최대 50개만 캐시
  private maxMemoryUsage = 100 * 1024 * 1024; // 100MB 제한
  private currentMemoryUsage = 0;

  // 이미지 메모리 사용량 추정 (대략적)
  private estimateImageMemoryUsage(img: HTMLImageElement): number {
    return img.width * img.height * 4; // RGBA 기준
  }

  // LRU 캐시에서 오래된 이미지 제거
  private evictOldestImages(): void {
    while (this.cache.size >= this.maxCacheSize || this.currentMemoryUsage > this.maxMemoryUsage) {
      if (this.accessOrder.length === 0) break;

      const oldestUrl = this.accessOrder.shift()!;
      const img = this.cache.get(oldestUrl);
      
      if (img) {
        this.currentMemoryUsage -= this.estimateImageMemoryUsage(img);
        this.cache.delete(oldestUrl);
      }
    }
  }

  // 이미지 가져오기
  getImage(url: string): HTMLImageElement | null {
    if (this.cache.has(url)) {
      // LRU: 접근한 이미지를 맨 뒤로
      this.accessOrder = this.accessOrder.filter(key => key !== url);
      this.accessOrder.push(url);
      return this.cache.get(url)!;
    }
    return null;
  }

  // 이미지 저장
  setImage(url: string, img: HTMLImageElement): void {
    // 이미 존재하는 이미지면 업데이트
    if (this.cache.has(url)) {
      const oldImg = this.cache.get(url)!;
      this.currentMemoryUsage -= this.estimateImageMemoryUsage(oldImg);
    }

    // 메모리 사용량 계산
    const memoryUsage = this.estimateImageMemoryUsage(img);
    this.currentMemoryUsage += memoryUsage;

    // 캐시 크기 초과 시 오래된 이미지 제거
    this.evictOldestImages();

    this.cache.set(url, img);
    this.accessOrder.push(url);
  }

  // 이미지 preload
  async preloadImage(url: string): Promise<HTMLImageElement> {
    // 이미 캐시에 있으면 반환
    const cached = this.getImage(url);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
    const img = new Image();
    // CORS는 외부 도메인에서만 필요 (같은 도메인은 제거)
    if (url.includes('duckstar.kr')) {
      // 같은 도메인이므로 CORS 설정 제거 (성능 향상)
    } else {
      img.crossOrigin = 'anonymous';
    }
    img.decoding = 'async';
      
      img.onload = () => {
        this.setImage(url, img);
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }

  // 배치 preload
  async preloadImages(urls: string[], batchSize = 3): Promise<void> {
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(url => this.preloadImage(url))
      );
      
      // 배치 간 지연
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // 캐시 상태 확인
  getCacheStatus() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      memoryUsage: this.currentMemoryUsage,
      maxMemoryUsage: this.maxMemoryUsage,
      memoryUsagePercent: (this.currentMemoryUsage / this.maxMemoryUsage) * 100
    };
  }

  // 캐시 정리
  clearCache(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.currentMemoryUsage = 0;
  }

  // 특정 이미지 제거
  removeImage(url: string): boolean {
    if (this.cache.has(url)) {
      const img = this.cache.get(url)!;
      this.currentMemoryUsage -= this.estimateImageMemoryUsage(img);
      this.cache.delete(url);
      this.accessOrder = this.accessOrder.filter(key => key !== url);
      return true;
    }
    return false;
  }

  // 메모리 사용량이 높을 때 자동 정리
  cleanupIfNeeded(): void {
    if (this.currentMemoryUsage > this.maxMemoryUsage * 0.8) {
      // 80% 이상 사용 시 오래된 이미지 30% 제거
      const removeCount = Math.floor(this.cache.size * 0.3);
      for (let i = 0; i < removeCount; i++) {
        if (this.accessOrder.length > 0) {
          const oldestUrl = this.accessOrder.shift()!;
          this.removeImage(oldestUrl);
        }
      }
    }
  }
}

export const imageMemoryManager = new ImageMemoryManager();

// 메모리 사용량 모니터링 (프로덕션에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  setInterval(() => {
    imageMemoryManager.cleanupIfNeeded();
  }, 30000); // 30초마다 체크
}
