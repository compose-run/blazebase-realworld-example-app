import { FormEvent, useEffect } from 'react';
import { store } from '../../../state/store';
import { useStore } from '../../../state/storeHooks';
import { useArticles, useArticlesDB } from '../../../types/article';
import { sign } from '../../../types/user';
import { ArticleEditor } from '../../ArticleEditor/ArticleEditor';
import { initializeEditor, startSubmitting, updateErrors } from '../../ArticleEditor/ArticleEditor.slice';

export function NewArticle() {
  useEffect(() => {
    store.dispatch(initializeEditor());
  }, []);

  const { keypair } = useStore(({ app }) => app);
  const [, emitArticleAction] = useArticlesDB();


  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    store.dispatch(startSubmitting());
    const {errors, slug} = await emitArticleAction(sign(keypair.unwrap().privateKey, {
      type: "CreateArticleAction",
      article: store.getState().editor.article,
      publicKey: keypair.unwrap().publicKey
    }))

    if (errors) {
      store.dispatch(updateErrors(errors))
    } else {  
      location.hash = `#/article/${slug}`;
    }
  }
  

  return <ArticleEditor onSubmit={onSubmit} />;
}

