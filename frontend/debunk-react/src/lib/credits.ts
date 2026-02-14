const STORAGE_KEY = 'debunkai_usage';
const ANONYMOUS_LIMIT = 5;
const LOGGED_IN_BONUS = 10;

export interface UsageData {
  anonymousCount: number;
  isLoggedIn: boolean;
  credits: number;
  detections: Detection[];
}

export interface Detection {
  id: string;
  contentType: 'image' | 'video';
  classification: 'AI' | 'Human' | 'Inconclusive';
  probability: number;
  source: string;
  timestamp: number;
  thumbnail?: string;
  snippet?: string;
}

export function getUsageData(): UsageData {
  if (typeof window === 'undefined') {
    return { anonymousCount: 0, isLoggedIn: false, credits: ANONYMOUS_LIMIT, detections: [] };
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { anonymousCount: 0, isLoggedIn: false, credits: ANONYMOUS_LIMIT, detections: [] };
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return { anonymousCount: 0, isLoggedIn: false, credits: ANONYMOUS_LIMIT, detections: [] };
  }
}

export function saveUsageData(data: UsageData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getRemainingCredits(): number {
  const data = getUsageData();
  return data.credits;
}

export function useCredit(): boolean {
  const data = getUsageData();
  if (data.credits <= 0) return false;
  
  data.credits -= 1;
  if (!data.isLoggedIn) {
    data.anonymousCount += 1;
  }
  
  saveUsageData(data);
  return true;
}

export function addDetection(detection: Omit<Detection, 'id' | 'timestamp'>): Detection {
  const data = getUsageData();
  const newDetection: Detection = {
    ...detection,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  data.detections.unshift(newDetection);
  saveUsageData(data);
  return newDetection;
}

export function loginUser(): void {
  const data = getUsageData();
  if (!data.isLoggedIn) {
    data.isLoggedIn = true;
    data.credits += LOGGED_IN_BONUS;
    saveUsageData(data);
  }
}

export function logoutUser(): void {
  const data = getUsageData();
  data.isLoggedIn = false;
  data.detections = [];
  data.credits = Math.max(ANONYMOUS_LIMIT - data.anonymousCount, 0);
  saveUsageData(data);
}

export function addCredits(amount: number): void {
  const data = getUsageData();
  data.credits += amount;
  saveUsageData(data);
}

export function getConfidenceEmoji(probability: number, classification: string): string {
  if (classification === 'Inconclusive') return '🤔';
  if (classification === 'Human') {
    // probability is 0-100 (percentage)
    if (probability >= 90) return '✅';
    if (probability >= 70) return '👍';
    return '🤷';
  }
  // AI - probability is 0-100 (percentage)
  if (probability >= 90) return '🤖';
  if (probability >= 70) return '⚠️';
  return '❓';
}

export function getConfidenceLabel(probability: number): string {
  // probability is 0-100 (percentage)
  if (probability >= 90) return 'Very High';
  if (probability >= 75) return 'High';
  if (probability >= 50) return 'Medium';
  return 'Low';
}
