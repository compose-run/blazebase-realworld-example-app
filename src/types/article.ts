import { Profile } from './profile';
export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: Profile;
}

export interface MultipleArticles {
  articles: Article[];
  articlesCount: number;
}
export interface ArticleForEditor {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

export interface ArticlesFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export interface FeedFilters {
  limit?: number;
  offset?: number;
}