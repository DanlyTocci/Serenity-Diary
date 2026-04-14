export interface DiaryEntry {
  id: string;
  date: string; // ISO string
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  gratitude: string;
  notes: string;
  photo?: string; // base64
}

export interface DailyInspiration {
  quote: string;
  author: string;
  reflectionPrompt: string;
}
