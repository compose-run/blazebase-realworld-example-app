import { Fragment, useState } from 'react';
import { useStore } from '../../state/storeHooks';
import { useArticleFavorites, useArticles } from '../../types/article';
import { classObjectToClassName } from '../../types/style';
import { useFollowers, useUser, wrap } from '../../types/user';
import { ArticlePreview } from '../ArticlePreview/ArticlePreview';
import { Pagination } from '../Pagination/Pagination';

export function ArticlesViewer({
  toggleClassName,
  tabs,
  selectedTab,
  onTabChange,
  userId
}: {
  toggleClassName: string;
  tabs: string[];
  selectedTab: string;
  onTabChange?: (tab: string) => void;
  userId?: string // TODO
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const user = useUser()
  const articles = useArticles()
  const [following] = useFollowers()
  const [favorites] = useArticleFavorites()
  
  const feedArticles = articles && articles.filter(article =>
    selectedTab === "Global Feed" || 
    (selectedTab === "Your Feed" && user.isSome() && following[user.unwrap().publicKey] && following[user.unwrap().publicKey][article.author.publicKey]) ||
    (selectedTab === "My Articles" && article.author.publicKey === userId) ||
    (selectedTab === "Favorited Articles" && favorites.users[userId] && favorites.users[userId][article.slug])
  ).sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime())
  
  const pageArticles = feedArticles && feedArticles.slice((currentPage - 1) * 10, currentPage * 10)
  const articlesCount = feedArticles ? feedArticles.length : 0

  return (
    <Fragment>
      <ArticlesTabSet {...{ tabs, selectedTab, toggleClassName, onTabChange }} />
      <ArticleList articles={wrap(pageArticles)} />
      <Pagination currentPage={currentPage} count={articlesCount} itemsPerPage={10} onPageChange={setCurrentPage} />
    </Fragment>
  );
}

function ArticlesTabSet({
  tabs,
  toggleClassName,
  selectedTab,
  onTabChange,
}: {
  tabs: string[];
  toggleClassName: string;
  selectedTab: string;
  onTabChange?: (tab: string) => void;
}) {
  return (
    <div className={toggleClassName}>
      <ul className='nav nav-pills outline-active'>
        {tabs.map((tab) => (
          <Tab key={tab} tab={tab} active={tab === selectedTab} onClick={() => onTabChange && onTabChange(tab)} />
        ))}
      </ul>
    </div>
  );
}

function Tab({ tab, active, onClick }: { tab: string; active: boolean; onClick: () => void }) {
  return (
    <li className='nav-item'>
      <a
        className={classObjectToClassName({ 'nav-link': true, active })}
        href='#'
        onClick={(ev) => {
          ev.preventDefault();
          onClick();
        }}
      >
        {tab}
      </a>
    </li>
  );
}

function ArticleList({ articles }: { articles  }) { // articles: ArticleViewerState['articles']
  return articles.match({
    none: () => (
      <div className='article-preview' key={1}>
        Loading articles...
      </div>
    ),
    some: (articles) => (
      <Fragment>
        {articles.length === 0 && (
          <div className='article-preview' key={1}>
            No articles are here... yet.
          </div>
        )}
        {articles.map((article, index) => (
          <ArticlePreview
            key={article.slug}
            article={article}
          />
        ))}
      </Fragment>
    ),
  });
}