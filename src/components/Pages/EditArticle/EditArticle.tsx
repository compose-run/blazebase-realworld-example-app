import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { store } from '../../../state/store';
import { useStore } from '../../../state/storeHooks';
import { useArticles, useArticlesDB } from '../../../types/article';
import { sign } from '../../../types/user';
import { ArticleEditor } from '../../ArticleEditor/ArticleEditor';
import { loadArticle, updateErrors } from '../../ArticleEditor/ArticleEditor.slice';

export function EditArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { keypair } = useStore(({ app }) => app);

  const [, emitArticlesAction] = useArticlesDB()

  const articles = useArticles()
  const article = articles && articles.find(a => a.slug === slug)

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (article && keypair && article.author.publicKey !== keypair.unwrap().publicKey) {
      location.hash = '#/';
      return;
    }
  
    store.dispatch(loadArticle(article));
  }, [article])
  

  async function onSubmit(ev) {
    ev.preventDefault();
    setSubmitting(true)

    if (keypair.isNone()) { return }

    const { errors } = await emitArticlesAction(sign(keypair.unwrap().privateKey, {
      type: "UpdateArticleAction",
      article: store.getState().editor.article,
      slug,
      publicKey: keypair.unwrap().publicKey,
      updatedAt: Date.now()
    }))

    if (errors) {
      store.dispatch(updateErrors(errors))
    } else {
      location.hash = `#/article/${slug}`;
    }
    setSubmitting(false)
  }


  return <Fragment>{article && <ArticleEditor onSubmit={onSubmit} submitting={submitting} />}</Fragment>;
}

