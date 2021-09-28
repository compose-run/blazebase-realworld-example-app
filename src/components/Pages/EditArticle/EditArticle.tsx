import { Fragment, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { store } from '../../../state/store';
import { useStore } from '../../../state/storeHooks';
import { useArticles, useArticlesDB } from '../../../types/article';
import { sign, useUser } from '../../../types/user';
import { ArticleEditor } from '../../ArticleEditor/ArticleEditor';
import { loadArticle, startSubmitting, updateErrors } from '../../ArticleEditor/ArticleEditor.slice';

export function EditArticle() {
  const { slug } = useParams<{ slug: string }>();
  const user = useUser();
  const { keypair } = useStore(({ app }) => app);

  // doesn't seem to reset to inital state if you edit -> redirect to view -> edit (remove loading from atom and make it a local state thing)

  const [, emitArticlesAction] = useArticlesDB()

  const articles = useArticles()
  const article = articles && articles.find(a => a.slug === slug)

  useEffect(() => {
    if (article && keypair && article.author.publicKey !== keypair.unwrap().publicKey) {
      location.hash = '#/';
      return;
    }
  
    store.dispatch(loadArticle(article));
  }, [article])
  

  async function onSubmit(ev) {
    ev.preventDefault();
    store.dispatch(startSubmitting());

    if (keypair.isNone()) { return }

    // doesn't seem to work
    const { errors } = await emitArticlesAction(sign(keypair.unwrap().privateKey, {
      type: "UpdateArticleAction",
      article: store.getState().editor.article,
      slug,
      publicKey: keypair.unwrap().publicKey
    }))

    if (errors) {
      store.dispatch(updateErrors(errors))
    } else {
      location.hash = `#/article/${slug}`;
    }
  }


  return <Fragment>{article && <ArticleEditor onSubmit={onSubmit} />}</Fragment>;
}

