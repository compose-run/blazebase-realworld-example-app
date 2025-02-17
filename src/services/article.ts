import { useProfiles, useUser, useUsers } from './user';
import { emitWithResponse, getRealtimeState, useRealtimeReducer } from '../services/compose';
import { GenericErrors } from '../types/error';
import { Article, ArticleForEditor } from '../types/article';
import { User, UId } from '../types/user';

interface CreateArticleAction {
  type: 'CreateArticleAction';
  article: ArticleForEditor;
  uid: UId;
  slug: string;
  createdAt: number;
}

interface UpdateArticleAction {
  type: 'UpdateArticleAction';
  article: ArticleForEditor;
  slug: string;
  uid: UId;
  updatedAt: number;
}

interface DeleteArticleAction {
  type: 'DeleteArticleAction';
  slug: string;
  uid: UId;
}

type ArticleAction = CreateArticleAction | UpdateArticleAction | DeleteArticleAction;

export interface ArticleDB {
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  uid: UId;
}

interface ArticleResolve {
  slug?: string;
  errors?: GenericErrors;
}

const articlesVersion = 110;
export const useArticlesDB = () =>
  useRealtimeReducer<ArticleDB[], ArticleAction, ArticleResolve>({
    name: `conduit-articles-${articlesVersion}`,
    initialValue: getRealtimeState(`conduit-articles-${articlesVersion - 1}`),
    loadingValue: null,
    reducer: (articles, action, resolve) => {
      let errors = {};
      let returnValue = articles;
      if (action.uid) {
        if (action.type === 'CreateArticleAction') {
          returnValue = articles.concat([
            {
              slug: action.slug,
              title: action.article.title,
              description: action.article.description,
              body: action.article.body,
              createdAt: action.createdAt,
              updatedAt: action.createdAt,
              uid: action.uid,
            },
          ]);
          updateArticleTags({ slug: action.slug, tagList: action.article.tagList });
        } else if (action.type === 'UpdateArticleAction') {
          // TODO - only do if action.uid matches
          returnValue = articles.map((article) =>
            article.slug == action.slug && article.uid === action.uid
              ? {
                  ...article,
                  title: action.article.title,
                  description: action.article.description,
                  body: action.article.body,
                  updatedAt: action.updatedAt,
                }
              : article
          );
          updateArticleTags({ slug: action.slug, tagList: action.article.tagList });
        } else if (action.type === 'DeleteArticleAction') {
          // TODO - only do if action.uid matches
          if (articles.find((a) => a.slug == action.slug).uid === action.uid) {
            returnValue = articles.filter((article) => article.slug !== action.slug);
          }
        }
      } else {
        errors['unauthorized'] = ['to edit article'];
      }
      if (Object.keys(errors).length) {
        resolve({ errors });
      } else {
        resolve({ slug: action.slug });
      }

      return returnValue;
    },
  });
interface ArticleTag {
  slug: string;
  tag: string;
}

interface UpdateArticleTags {
  type: 'UpdateArticleTags';
  slug: string;
  tagList: string[];
  uid: UId;
}

type ArticleTagAction = UpdateArticleTags;

export const useArticleTags = () =>
  useRealtimeReducer<ArticleTag[], ArticleTagAction, GenericErrors>({
    name: `conduit-tags-${articlesVersion}`,
    initialValue: [], //getRealtimeState(`conduit-tags-${articlesVersion - 1}`),
    loadingValue: null,
    reducer: (articleTagsOption, action, resolve) => {
      let errors = {};
      let returnValue = articleTagsOption as ArticleTag[]; // TODO rearchitect this around lookups like favorites?
      if (action.uid === 'TODO') {
        if (action.type === 'UpdateArticleTags') {
          returnValue = returnValue.filter((pt) => pt.slug !== action.slug || action.tagList.includes(pt.tag));
          returnValue = returnValue.concat(
            action.tagList
              .filter((tag) => !returnValue.some((pt) => pt.slug === action.slug && pt.tag === tag))
              .map((tag) => ({ tag, slug: action.slug }))
          );
        }
      } else {
        errors['unauthorized'] = 'to edit article';
      }
      resolve(errors);
      return returnValue;
    },
  });

export const useTags = () => {
  const [articleTags] = useArticleTags();
  return articleTags && Array.from(new Set(articleTags.map(({ tag }) => tag)));
};

// TODO - what's going on with this function...?
function updateArticleTags(payload: { slug: string; tagList: string[] }) {
  return emitWithResponse(`conduit-tags-${articlesVersion}`, { ...payload, type: 'UpdateArticleTags' });
}

interface FavoriteAction {
  type: 'FavoriteAction';
  slug: string;
  uid: UId;
}

export const useArticleFavorites = () =>
  useRealtimeReducer({
    name: `conduit-favorites-${articlesVersion}`,
    initialValue: { articles: {}, users: {} }, //getRealtimeState(`conduit-favorites-${articlesVersion - 5}`),
    loadingValue: null,
    reducer: ({ articles, users }, action: FavoriteAction, resolve) => {
      if (!action.uid) {
        resolve({ errors: { unauthorized: 'to perform this action' } });
        return { articles, users };
      }

      const { slug, uid } = action;
      const favorite = action.type === 'FavoriteAction';

      return {
        articles: {
          ...articles,
          [slug]: {
            ...(articles[slug] || {}),
            [uid]: favorite,
          },
        },
        users: {
          ...users,
          [uid]: {
            ...(users[uid] || {}),
            [slug]: favorite,
          },
        },
      };
    },
  });

export const useArticles = (): Article[] => {
  const user = useUser();
  const [articlesDB] = useArticlesDB();
  const [articleTags] = useArticleTags();
  const [articleFavorites] = useArticleFavorites();
  const authors = useProfiles();

  const articles =
    articlesDB &&
    articleTags &&
    authors &&
    articleFavorites &&
    articlesDB.map((articleDB) => ({
      slug: articleDB.slug,
      title: articleDB.title,
      description: articleDB.description,
      body: articleDB.body,
      tagList: articleTags.filter((articleTag) => articleTag.slug === articleDB.slug).map(({ tag }) => tag),
      createdAt: new Date(articleDB.createdAt),
      updatedAt: new Date(articleDB.updatedAt),
      favorited:
        user && articleFavorites.articles[articleDB.slug] && articleFavorites.articles[articleDB.slug][user.uid],
      favoritesCount: Object.values(articleFavorites.articles[articleDB.slug] || {}).filter((favorite) => favorite)
        .length,
      author: authors.find((u) => u.uid === articleDB.uid),
    }));

  return articles;
};

// TODO: Deduplicate shared fields in these actions.
interface CreateCommentAction {
  type: 'CreateComment';
  uid: UId;
  body: string;
  slug: string;
  commentId: number;
  createdAt: number;
}

interface DeleteCommentAction {
  type: 'DeleteComment';
  uid: UId;
  slug: string;
  commentId: number;
}

type CommentAction = CreateCommentAction | DeleteCommentAction;

type Slug = string;

interface Comment {
  uid: UId;
  body: string;
  slug: string;
  commentId: number;
  createdAt: number;
  author: User;
}

type CommentDB = { [key: Slug]: [Comment]; };

interface CommentResolve {
  errors?: { unauthorized?: string };
}

export const useArticleCommentsDB = () =>
  useRealtimeReducer({
    name: `conduit-comments-${articlesVersion}`,
    initialValue: getRealtimeState(`conduit-comments-${articlesVersion - 1}`),
    loadingValue: null,
    reducer: (comments: CommentDB, action: CommentAction, resolve) => {
      if (!action.uid) {
        resolve({ errors: { unauthorized: 'to perform this action' } });
        return comments;
      }

      const { slug, uid, commentId } = action;

      if (action.type === 'CreateComment') {
        const { body, createdAt } = action;
        return {
          ...comments,
          [slug]: [...(comments[slug] || []), { uid, commentId, body, createdAt }],
        };
      } else if (action.type === 'DeleteComment') {
        const comment = comments[slug].find((c) => c.commentId === commentId);
        if (comment && comment.uid === action.uid) {
          return {
            ...comments,
            [slug]: [...(comments[slug] || []).filter((c) => c.commentId !== commentId)],
          };
        } else {
          resolve({ errors: { unauthorized: 'to perform this action' } });
          return comments;
        }
      } else {
        return comments;
      }
    },
  });

export const useArticleComments = () => {
  const [comments]:[CommentDB,any] = useArticleCommentsDB();
  const [users] = useUsers();

  return (
    comments &&
    users &&
    Object.fromEntries(
      Object.entries(comments).map(([slug, comments]) => [
        slug,
        comments.map((comment) => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
          author: users.find((u : User) => u.uid === comment.uid),
        })),
      ])
    )
  );
};
