import { Video, Memo, Task } from '@/types';

export interface RelationshipScore {
  itemId: string;
  score: number; // 0-1の範囲
  reason: string;
}

export interface RecommendationResult {
  relatedVideos: (Video & { score: number; reason: string })[];
  relatedMemos: (Memo & { score: number; reason: string })[];
  suggestedTasks: { title: string; description: string; priority: 'low' | 'medium' | 'high'; reason: string }[];
}

class RecommendationService {
  
  // メモの内容から関連する動画を推薦
  getRelatedVideos(memo: Memo, allVideos: Video[]): (Video & { score: number; reason: string })[] {
    const memoKeywords = this.extractKeywords(memo.content);
    
    return allVideos
      .map(video => {
        const videoKeywords = this.extractKeywords(video.title + ' ' + (video.description || ''));
        const score = this.calculateSimilarity(memoKeywords, videoKeywords);
        
        let reason = '';
        if (score > 0.7) reason = '内容が非常に関連している';
        else if (score > 0.5) reason = '似たトピックを扱っている';
        else if (score > 0.3) reason = 'いくつかの共通点がある';
        else reason = '参考になるかもしれない';
        
        return { ...video, score, reason };
      })
      .filter(item => item.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  // 動画から関連するメモを見つける
  getRelatedMemos(video: Video, allMemos: Memo[]): (Memo & { score: number; reason: string })[] {
    const videoKeywords = this.extractKeywords(video.title + ' ' + (video.description || ''));
    
    return allMemos
      .filter(memo => memo.video_id !== video.id) // 同じ動画のメモは除外
      .map(memo => {
        const memoKeywords = this.extractKeywords(memo.content);
        const score = this.calculateSimilarity(videoKeywords, memoKeywords);
        
        let reason = '';
        if (score > 0.7) reason = '関連する気づきがある';
        else if (score > 0.5) reason = '似たテーマについて考えている';
        else if (score > 0.3) reason = '参考になりそう';
        else reason = '関連するかもしれない';
        
        return { ...memo, score, reason };
      })
      .filter(item => item.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  // メモから実行可能なタスクを提案
  suggestTasksFromMemo(memo: Memo): { title: string; description: string; priority: 'low' | 'medium' | 'high'; reason: string }[] {
    const content = memo.content.toLowerCase();
    const suggestions = [];

    // アクション系キーワードの検出
    const actionKeywords = {
      '実践': { priority: 'high' as const, reason: '実践が必要' },
      '試す': { priority: 'medium' as const, reason: '試してみる価値がある' },
      '調べる': { priority: 'medium' as const, reason: '詳しく調査が必要' },
      '学ぶ': { priority: 'medium' as const, reason: '深い理解が必要' },
      '検討': { priority: 'low' as const, reason: '検討の余地がある' },
      '改善': { priority: 'high' as const, reason: '改善の機会' },
      '変更': { priority: 'medium' as const, reason: '変更を検討' },
      '導入': { priority: 'high' as const, reason: '導入を検討' }
    };

    // メモタイプに基づいた提案
    switch (memo.memo_type) {
      case 'action':
        suggestions.push({
          title: this.extractFirstSentence(memo.content),
          description: `メモ「${memo.content.substring(0, 50)}...」からの実践タスク`,
          priority: 'high' as const,
          reason: 'アクション型メモからの提案'
        });
        break;

      case 'question':
        suggestions.push({
          title: `疑問を解決: ${this.extractFirstSentence(memo.content)}`,
          description: `疑問について調査し、答えを見つける`,
          priority: 'medium' as const,
          reason: '疑問解決のための調査'
        });
        break;

      case 'insight':
        if (memo.importance && memo.importance >= 4) {
          suggestions.push({
            title: `重要な気づきを活用する`,
            description: `「${this.extractFirstSentence(memo.content)}」を実際に活用する方法を考える`,
            priority: 'medium' as const,
            reason: '重要度の高い気づきからの提案'
          });
        }
        break;
    }

    // キーワードベースの提案
    Object.entries(actionKeywords).forEach(([keyword, config]) => {
      if (content.includes(keyword)) {
        const sentence = this.findSentenceWithKeyword(memo.content, keyword);
        if (sentence) {
          suggestions.push({
            title: sentence,
            description: `「${keyword}」に関するタスク`,
            priority: config.priority,
            reason: config.reason
          });
        }
      }
    });

    return suggestions.slice(0, 3); // 最大3つの提案
  }

  // 完了したタスクから次のステップを提案
  suggestNextStepsFromTask(completedTask: Task, relatedMemos: Memo[]): RecommendationResult {
    const suggestions: RecommendationResult = {
      relatedVideos: [],
      relatedMemos: [],
      suggestedTasks: []
    };

    // タスクの内容に基づいて次のステップを提案
    const taskContent = (completedTask.title + ' ' + (completedTask.description || '')).toLowerCase();

    if (taskContent.includes('学習') || taskContent.includes('理解')) {
      suggestions.suggestedTasks.push({
        title: '学んだ内容を実践する',
        description: `${completedTask.title}で学んだことを実際に試してみる`,
        priority: 'high',
        reason: '学習から実践へのステップアップ'
      });
    }

    if (taskContent.includes('調べる') || taskContent.includes('リサーチ')) {
      suggestions.suggestedTasks.push({
        title: '調べた結果をまとめる',
        description: '調査結果をドキュメント化して共有する',
        priority: 'medium',
        reason: '調査結果の活用'
      });
    }

    return suggestions;
  }

  // 視聴履歴に基づく推薦
  recommendBasedOnHistory(viewingHistory: { video: Video; watchedAt: Date }[]): Video[] {
    // 最近視聴したジャンル・キーワードを分析
    const recentVideos = viewingHistory
      .sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime())
      .slice(0, 10); // 最近の10件

    const keywords = recentVideos
      .flatMap(({ video }) => this.extractKeywords(video.title + ' ' + (video.description || '')))
      .reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // 頻出キーワードを基準にした推薦ロジックをここに実装
    // 現在は簡易版
    return [];
  }

  // ユーザーの成長パスを提案
  suggestGrowthPath(user: { completedTasks: Task[]; memos: Memo[]; videos: Video[] }): {
    currentLevel: string;
    nextSteps: string[];
    recommendedContent: Video[];
  } {
    const skillAreas = this.analyzeSkillAreas(user.memos);
    const completionRate = this.calculateCompletionRate(user.completedTasks);

    let currentLevel = 'ビギナー';
    if (completionRate > 0.7) currentLevel = 'アドバンス';
    else if (completionRate > 0.4) currentLevel = 'インターミディエート';

    const nextSteps = [];
    if (skillAreas.length > 0) {
      nextSteps.push(`${skillAreas[0]}をさらに深める`);
    }
    if (completionRate < 0.5) {
      nextSteps.push('タスクの完了率を上げる');
    }

    return {
      currentLevel,
      nextSteps,
      recommendedContent: []
    };
  }

  // プライベートヘルパーメソッド
  private extractKeywords(text: string): string[] {
    // 簡易的なキーワード抽出
    const cleanText = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const stopWords = new Set(['の', 'に', 'を', 'は', 'が', 'と', 'で', 'から', 'まで', 'について']);
    
    return cleanText
      .split(' ')
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 20); // 最大20キーワード
  }

  private calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private extractFirstSentence(text: string): string {
    const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 0);
    return sentences[0]?.trim().substring(0, 50) || text.substring(0, 50);
  }

  private findSentenceWithKeyword(text: string, keyword: string): string | null {
    const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 0);
    const found = sentences.find(s => s.toLowerCase().includes(keyword));
    return found?.trim() || null;
  }

  private analyzeSkillAreas(memos: Memo[]): string[] {
    const keywords = memos.flatMap(memo => this.extractKeywords(memo.content));
    const frequency = keywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([keyword]) => keyword);
  }

  private calculateCompletionRate(completedTasks: Task[]): number {
    if (completedTasks.length === 0) return 0;
    const completed = completedTasks.filter(task => task.status === 'completed').length;
    return completed / completedTasks.length;
  }
}

export const recommendationService = new RecommendationService();