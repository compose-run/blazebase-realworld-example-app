import { None, Some, Option } from '@hqoss/monads';
import { array, boolean, Decoder, iso8601, number, object, string } from 'decoders';
import { emitWithResponse, getRealtimeState, useRealtimeReducer } from '../services/compose';
import { GenericErrors } from './error';
import { Profile, profileDecoder } from './profile';
import { signed, useProfiles, useUsers } from './user';

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

export const articleDecoder: Decoder<Article> = object({
  slug: string,
  title: string,
  description: string,
  body: string,
  tagList: array(string),
  createdAt: iso8601,
  updatedAt: iso8601,
  favorited: boolean,
  favoritesCount: number,
  author: profileDecoder,
});

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

interface CreateArticleAction {
  type: "CreateArticleAction";
  article: ArticleForEditor;
  publicKey: string;
  signature: string;
}

interface UpdateArticleAction {
  type: "UpdateArticleAction";
  article: ArticleForEditor;
  slug: string;
  signature: string;
  publicKey: string;
}

type ArticleAction = CreateArticleAction | UpdateArticleAction

export interface ArticleDB {
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  authorPublicKey: string;
}

interface ArticleResolve { slug?: string, errors?: GenericErrors }

const articlesVersion = 16
export const useArticlesDB = () => useRealtimeReducer<ArticleDB[] | null, ArticleAction, ArticleResolve>(`conduit-articles-${articlesVersion}`, (articles, action, resolve) => {
  let errors = {}
  let returnValue = articles
  let slug = 'slug' in action ? action.slug : Math.random().toString() // TODO This either needs to happen client side or be deterministic
  if (signed(action)) {
    if (action.type === "CreateArticleAction") {
      returnValue = articles.concat([{
        slug, 
        title: action.article.title,
        description: action.article.description,
        body: action.article.body,
        createdAt: Date.now(), // TODO - get server time or just generate on client
        updatedAt: Date.now(), // TODO - get server time or just generate on client
        authorPublicKey: action.publicKey
      }])
      updateArticleTags({slug, tagList: action.article.tagList})
    } else if (action.type === "UpdateArticleAction") {
      returnValue = articles.map(article => 
        article.slug == slug && article.authorPublicKey === action.publicKey 
          ? {
              ...article,
              title: action.article.title,
              description: action.article.description,
              body: action.article.body,
              updatedAt: Date.now(), // TODO - get server time or just generate on client
            } 
          : article
      )
      updateArticleTags({slug, tagList: action.article.tagList})
    } 
  } else {
    errors['unauthorized'] = ['to edit article']
  }
  if (Object.keys(errors).length) {
    resolve({errors})
  } else {
    resolve({slug})
  }
  
  return returnValue
}, getRealtimeState(`conduit-articles-${articlesVersion-1}`), null)


interface ArticleTag {
  slug: string;
  tag: string;
}

interface UpdateArticleTags {
  type: "UpdateArticleTags";
  slug: string,
  tagList: string[];
}

type ArticleTagAction = UpdateArticleTags;

const articleTagsDbId = `conduit-tags-${articlesVersion}`
export const useArticleTags = () => useRealtimeReducer<ArticleTag[] | null, ArticleTagAction, GenericErrors>(articleTagsDbId, (articleTagsOption, action, resolve) => {
  let errors = {}
  let returnValue = articleTagsOption as ArticleTag[]
  if (signed(action)) {
    if (action.type === "UpdateArticleTags") {
      returnValue = returnValue.filter(pt => pt.slug !== action.slug || action.tagList.includes(pt.tag))
      returnValue = returnValue.concat(action.tagList.filter(tag => !returnValue.some(pt => pt.slug === action.slug && pt.tag === tag)).map(tag => ({tag, slug: action.slug})))
    }
  } else {
    errors['unauthorized'] = 'to edit article'
  }
  resolve(errors)
  return returnValue
}, getRealtimeState(`conduit-tags-${articlesVersion-1}`), null) // TODO - need to find way to encode types to and from firebase...

export const useTags = () => {
  const [articleTags] = useArticleTags()
  return articleTags && Array.from(new Set(articleTags.map(({tag}) => tag)))
}

function updateArticleTags(payload: {slug: string, tagList: string[]}) {
  return emitWithResponse(articleTagsDbId, {...payload, type: "UpdateArticleTags"})
}

export const useArticles = ():Article[] => {
  const [articlesDB] = useArticlesDB();
  const [articleTags] = useArticleTags()
  const authors = useProfiles();

  const articles = articlesDB && articleTags && authors && articlesDB.map(articleDB => ({
    slug: articleDB.slug,
    title: articleDB.title,
    description: articleDB.description,
    body: articleDB.body,
    tagList: articleTags.filter(articleTag => articleTag.slug === articleDB.slug).map(({tag}) => tag),
    createdAt: new Date(articleDB.createdAt),
    updatedAt: new Date(articleDB.updatedAt),
    favorited: false, // TODO
    favoritesCount: 0, // TODO
    author: authors.find(u => u.publicKey === articleDB.authorPublicKey),
  }))

  return articles
}

/*

user has many to many users (followers)

articles have many to many users (likes)

articles have many comments


*/