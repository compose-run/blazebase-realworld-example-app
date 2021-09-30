import { Option } from '@hqoss/monads';
import { format } from 'date-fns';
import React, { Fragment, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { store } from '../../../state/store';
import { useStore } from '../../../state/storeHooks';
import { Article, useArticleComments, useArticleCommentsDB, useArticleFavorites, useArticles, useArticlesDB } from '../../../types/article';
import { Comment } from '../../../types/comment';
import { redirect } from '../../../types/location';
import { classObjectToClassName } from '../../../types/style';
import { sign, useFollowers, User, useUser } from '../../../types/user';
import { TagList } from '../../ArticlePreview/ArticlePreview';
import {
  CommentSectionState,
  updateCommentBody,
} from './ArticlePage.slice';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();

  const articles = useArticles();
  const article = articles && articles.find(a => a.slug === slug)

  if (articles && !article) {
    redirect('');
  }

  const {
    articlePage: { commentSection },
  } = useStore(({ articlePage, app }) => ({
    articlePage,
    app,
  }));

  return article
    ? 
      <div className='article-page'>
        <ArticlePageBanner {...{ article }} />

        <div className='container page'>
          <div className='row article-content'>
            <div className='col-md-12'>{article.body}</div>
            <TagList tagList={article.tagList} />
          </div>

          <hr />

          <div className='article-actions'>
            <ArticleMeta {...{ article }} />
          </div>

          <CommentSection {...{ commentSection, article }} />
        </div>
      </div>
    : <div>Loading article...</div>
}

function ArticlePageBanner(props: { article: Article }) {
  return (
    <div className='banner'>
      <div className='container'>
        <h1>{props.article.title}</h1>

        <ArticleMeta {...props} />
      </div>
    </div>
  );
}

function ArticleMeta({
  article,
}: {
  article: Article;
}) {
  const user = useUser();

  return (
    <div className='article-meta'>
      <ArticleAuthorInfo article={article} />

      {user.isSome() && user.unwrap().username === article.author.username ? (
        <OwnerArticleMetaActions article={article} />
      ) : (
        <NonOwnerArticleMetaActions
          article={article}
        />
      )}
    </div>
  );
}

function ArticleAuthorInfo({
  article: {
    author: { username, image },
    createdAt,
  },
}: {
  article: Article;
}) {
  return (
    <Fragment>
      <Link to={`/profile/${username}`}>
        <img src={image || undefined} />
      </Link>
      <div className='info'>
        <Link className='author' to={`/profile/${username}`}>
          {username}
        </Link>
        <span className='date'>{format(new Date(createdAt), 'PP')}</span>
      </div>
    </Fragment>
  );
}

function NonOwnerArticleMetaActions({
  article: {
    slug,
    favoritesCount,
    favorited,
    author: { username, following, publicKey },
  }
}: {
  article: Article;
}) {
  const [submittingFavorite, setSubmittingFavorite] = useState(false)
  const [submittingFollow, setSubmittingFollow] = useState(false)

  const user = useUser()
  const [, emitFavoriteAction] = useArticleFavorites();
  const [, emitFollowAction] = useFollowers();

  async function onFavorite() {
    if (user.isNone()) {
      redirect('register');
      return;
    }
  
    setSubmittingFavorite(true)

    await emitFavoriteAction({
      type: favorited ? "UnfavoriteAction" : "FavoriteAction",
      slug,
      userId: user.unwrap().publicKey,
      token: "TODO" // TODO AUTHORIZATION
    })
    
    setSubmittingFavorite(false)
  }

  async function onFollow() {
    if (user.isNone()) {
      redirect('register');
      return;
    }
  
    setSubmittingFollow(true)
  
    await emitFollowAction({
      type: following ? "UnfollowAction" : "FollowAction",
      follower: user.unwrap().publicKey,
      leader: publicKey
    })

    setSubmittingFollow(false)
  }

  return (
    <Fragment>
      <button
        className={classObjectToClassName({
          btn: true,
          'btn-sm': true,
          'btn-outline-secondary': !following,
          'btn-secondary': following,
        })}
        disabled={submittingFollow}
        onClick={onFollow}
      >
        <i className='ion-plus-round'></i>
        &nbsp; {(following ? 'Unfollow ' : 'Follow ') + username}
      </button>
      &nbsp;
      <button
        className={classObjectToClassName({
          btn: true,
          'btn-sm': true,
          'btn-outline-primary': !favorited,
          'btn-primary': favorited,
        })}
        disabled={submittingFavorite}
        onClick={onFavorite}
      >
        <i className='ion-heart'></i>
        &nbsp; {(favorited ? 'Unfavorite ' : 'Favorite ') + 'Article'}
        <span className='counter'>({favoritesCount})</span>
      </button>
    </Fragment>
  );
}

function OwnerArticleMetaActions({
  article: { slug }
}: {
  article: Article;
}) {
  const [deleting, setDeleting] = useState(false)

  const { keypair } = useStore(({ app }) => app);
  const [, emitArticleAction] = useArticlesDB()

  async function onDeleteArticle() {
    if (keypair.isNone()) { redirect(''); return; }

    setDeleting(true)

    await emitArticleAction(sign(keypair.unwrap().privateKey, {
      type: "DeleteArticleAction",
      slug,
      publicKey: keypair.unwrap().publicKey
    }))
  }

  return (
    <Fragment>
      <button className='btn btn-outline-secondary btn-sm' onClick={() => redirect(`editor/${slug}`)}>
        &nbsp; Edit Article
      </button>
      &nbsp;
      <button
        className='btn btn-outline-danger btn-sm'
        disabled={deleting}
        onClick={onDeleteArticle}
      >
        Delete Article
      </button>
    </Fragment>
  );
}

function CommentSection({
  article,
  commentSection: { commentBody },
}: {
  article: Article;
  commentSection: CommentSectionState;
}) {
  const user = useUser();
  const comments = useArticleComments()
  
  return (
    <div className='row'>
      <div className='col-xs-12 col-md-8 offset-md-2'>
        {user.match({
          none: () => (
            <p style={{ display: 'inherit' }}>
              <Link to='/login'>Sign in</Link> or <Link to='/register'>sign up</Link> to add comments on this article.
            </p>
          ),
          some: (user) => (
            <CommentForm
              user={user}
              slug={article.slug}
              commentBody={commentBody}
            />
          ),
        })}

        {comments 
          ? <Fragment>
              {(comments[article.slug] || []).map((comment, index) => (
                <ArticleComment key={comment.id} comment={comment} slug={article.slug} user={user} index={index} />
              ))}
            </Fragment> 
          : <div>Loading comments...</div>
         }
      </div>
    </div>
  );
}

function CommentForm({
  user: { image, publicKey },
  commentBody,
  slug,
}: {
  user: User;
  commentBody: string;
  slug: string;
}) {

  const [submittingComment, setSubmitting] = useState(false)
  const [ , emitCommentAction] = useArticleCommentsDB()
  

  async function onPostComment(ev) {
    ev.preventDefault();

    setSubmitting(true)

    await emitCommentAction({
      type: "CreateComment",
      userId: publicKey,
      body: commentBody,
      slug,
      commentId: Math.random(),
      createdAt: Date.now()
    })
    
    store.dispatch(updateCommentBody(""))
    setSubmitting(false)
  }

  return (
    <form className='card comment-form' onSubmit={onPostComment}>
      <div className='card-block'>
        <textarea
          className='form-control'
          placeholder='Write a comment...'
          rows={3}
          onChange={onCommentChange}
          value={commentBody}
        ></textarea>
      </div>
      <div className='card-footer'>
        <img src={image || undefined} className='comment-author-img' />
        <button className='btn btn-sm btn-primary' disabled={submittingComment}>
          Post Comment
        </button>
      </div>
    </form>
  );
}

function onCommentChange(ev: React.ChangeEvent<HTMLTextAreaElement>) {
  store.dispatch(updateCommentBody(ev.target.value));
}

function ArticleComment({
  comment: {
    commentId,
    body,
    createdAt,
    author,
  },
  slug,
  index,
  user,
}: {
  comment: Comment;
  slug: string;
  index: number;
  user: Option<User>;
}) {

  const { username, image } = author || {}

  const [ , emitCommentAction] = useArticleCommentsDB()

  return (
    <div className='card'>
      <div className='card-block'>
        <p className='card-text'>{body}</p>
      </div>
      <div className='card-footer'>
        <Link className='comment-author' to={`/profile/${username}`}>
          <img src={image || undefined} className='comment-author-img' />
        </Link>
        &nbsp;
        <Link className='comment-author' to={`/profile/${username}`}>
          {username}
        </Link>
        <span className='date-posted'>{format(createdAt, 'PP')}</span>
        {user.isSome() && user.unwrap().username === username && (
          <span className='mod-options'>
            <i
              className='ion-trash-a'
              aria-label={`Delete comment ${index + 1}`}
              onClick={() => emitCommentAction({
                slug, 
                commentId,
                userId: user.unwrap().publicKey,
                type: "DeleteComment"
              })}
            ></i>
          </span>
        )}
      </div>
    </div>
  );
}
