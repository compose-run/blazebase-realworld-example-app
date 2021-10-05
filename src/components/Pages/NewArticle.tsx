import { useState } from 'react';
import { ArticleForEditor } from './../../types/article';
import { useArticlesDB } from './../../services/article';
import { useUser } from './../../services/user';
import { ArticleEditor } from './../ArticleEditor';

export function NewArticle() {
  const user = useUser()
  const [, emitArticleAction] = useArticlesDB();

  const [ submitting, setSubmitting ] = useState(false)
  const [ errors, setErrors ] = useState({})

  async function onSubmit(newArticle: ArticleForEditor) {
    setSubmitting(true)

    const {errors, slug} = await emitArticleAction({
      type: "CreateArticleAction",
      article: newArticle,
      createdAt: Date.now(),
      uid: user.uid,
      slug: Math.random().toString() // TODO - better slug
    })

    setSubmitting(false)

    if (errors) {
      setErrors(errors)
    } else {  
      location.hash = `#/article/${slug}`;
    }
  }
  

  return <ArticleEditor onSubmit={onSubmit} errors={errors} submitting={submitting} />;
}

