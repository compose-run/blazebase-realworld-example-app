import { Fragment, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArticles, useArticlesDB } from '../../../types/article';
import { getKeyPair, sign } from '../../../types/user';
import { ArticleEditor } from '../../ArticleEditor/ArticleEditor';

export function EditArticle() {
  const { slug } = useParams<{ slug: string }>();
  const keypair = getKeyPair();

  const [, emitArticlesAction] = useArticlesDB()

  const articles = useArticles()
  const article = articles && articles.find(a => a.slug === slug)

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  if (article && keypair && article.author.publicKey !== keypair.unwrap().publicKey) {
    location.hash = '#/';
    return;
  }

  async function onSubmit(newArticle) {
    setSubmitting(true)

    if (keypair.isNone()) { location.hash = '#/'; }

  
    const { errors } = await emitArticlesAction(sign(keypair.unwrap().privateKey, {
      type: "UpdateArticleAction",
      article: newArticle,
      slug,
      publicKey: keypair.unwrap().publicKey,
      updatedAt: Date.now()
    }))

    setSubmitting(false)

    if (errors) {
      // TODO ERRORS
    } else {
      location.hash = `#/article/${slug}`;
    }
    
  }

  return <Fragment>
    {article && 
      <ArticleEditor 
        onSubmit={onSubmit} 
        submitting={submitting} 
        article={article}
        errors={errors}
      />}
    </Fragment>;
}

