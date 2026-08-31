import { INITIAL_KB_ARTICLES } from '../data/initialKB';
import { KBArticle, KBSourceCitation } from '../types';

export class RAGService {
  private articles: KBArticle[] = INITIAL_KB_ARTICLES;
  private confidenceThreshold: number = 0.65;

  public setConfidenceThreshold(val: number) {
    this.confidenceThreshold = Math.max(0, Math.min(1, val));
  }

  public getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  public getAllArticles(): KBArticle[] {
    return this.articles;
  }

  public addArticle(article: KBArticle) {
    this.articles.push(article);
  }

  /**
   * Simulates Pinecone dense vector retrieval by semantic matching & keyword density scoring
   */
  public searchVectorStore(query: string, topK: number = 3): { citations: KBSourceCitation[]; topScore: number } {
    const q = query.toLowerCase();
    const queryTokens = q.split(/\W+/).filter(t => t.length > 2);

    const scored = this.articles.map(article => {
      let score = 0;
      const textToSearch = `${article.title} ${article.summary} ${article.tags.join(' ')} ${article.content}`.toLowerCase();

      // Keyword token matching
      queryTokens.forEach(token => {
        if (textToSearch.includes(token)) {
          score += 0.15;
          if (article.title.toLowerCase().includes(token)) score += 0.25;
          if (article.tags.some(tag => tag.toLowerCase().includes(token))) score += 0.20;
        }
      });

      // Semantic proximity checks
      if (q.includes('vpn') && article.tags.includes('vpn')) score += 0.45;
      if (q.includes('password') && article.tags.includes('password')) score += 0.45;
      if (q.includes('access') && article.tags.includes('access')) score += 0.40;
      if (q.includes('monitor') || q.includes('display') || q.includes('dock')) {
        if (article.tags.includes('hardware') || article.tags.includes('monitors')) score += 0.45;
      }
      if (q.includes('slack') || q.includes('outlook') || q.includes('mail') || q.includes('sync')) {
        if (article.tags.includes('sync') || article.tags.includes('email')) score += 0.45;
      }

      // Normalize score between 0 and 0.99
      const normalizedScore = Math.min(0.98, Math.max(0.12, Number((score / (queryTokens.length * 0.4 + 1)).toFixed(2))));

      // Extract relevant snippet
      const sentences = article.content.split('\n').filter(s => s.trim().length > 15 && !s.startsWith('#'));
      const matchingSentence = sentences.find(s => queryTokens.some(t => s.toLowerCase().includes(t))) || sentences[0] || article.summary;

      const citation: KBSourceCitation = {
        id: article.id,
        title: article.title,
        snippet: matchingSentence.replace(/[`*#]/g, '').trim(),
        similarityScore: normalizedScore,
        url: article.sourceUrl,
        category: article.category
      };

      return { citation, score: normalizedScore };
    });

    // Sort descending by similarity score
    scored.sort((a, b) => b.score - a.score);

    const topResults = scored.slice(0, topK).map(s => s.citation);
    const topScore = topResults.length > 0 ? topResults[0].similarityScore : 0;

    return {
      citations: topResults,
      topScore
    };
  }
}

export const ragService = new RAGService();
