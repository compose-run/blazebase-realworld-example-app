import { useState } from 'react';
import { ArticleForEditor } from './../../types/article';
import { useArticlesDB } from './../../services/article';
import { getKeyPair, sign } from './../../services/user';
import { ArticleEditor } from './../ArticleEditor';

export function NewArticle() {
  const keypair = getKeyPair()
  const [, emitArticleAction] = useArticlesDB();

  const [ submitting, setSubmitting ] = useState(false)
  const [ errors, setErrors ] = useState({})

  async function onSubmit(newArticle: ArticleForEditor) {
    setSubmitting(true)

    const {errors, slug} = await emitArticleAction(sign(keypair.unwrap().privateKey, {
      type: "CreateArticleAction",
      article: newArticle,
      publicKey: keypair.unwrap().publicKey,
      createdAt: Date.now(),
      slug: Math.random().toString()
    }))

    setSubmitting(false)

    if (errors) {
      setErrors(errors)
    } else {  
      location.hash = `#/article/${slug}`;
    }
  }
  

  return <ArticleEditor onSubmit={onSubmit} errors={errors} submitting={submitting} />;
}

