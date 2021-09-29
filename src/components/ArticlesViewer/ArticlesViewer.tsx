import { Fragment } from 'react';
import { useStore } from '../../state/storeHooks';
import { useArticles } from '../../types/article';
import { classObjectToClassName } from '../../types/style';
import { wrap } from '../../types/user';
import { ArticlePreview } from '../ArticlePreview/ArticlePreview';
import { Pagination } from '../Pagination/Pagination';

export function ArticlesViewer({
  toggleClassName,
  tabs,
  selectedTab,
  onPageChange,
  onTabChange,
}: {
  toggleClassName: string;
  tabs: string[];
  selectedTab: string;
  onPageChange?: (index: number) => void;
  onTabChange?: (tab: string) => void;
}) {
  const { currentPage } = useStore(({ articleViewer }) => articleViewer);

  const allArticles = useArticles()

  // TODO - add feed or global article filters
  const articles = allArticles && allArticles.slice((currentPage - 1) * 10, currentPage * 10)
  const articlesCount = allArticles ? allArticles.length : 0

  return (
    <Fragment>
      <ArticlesTabSet {...{ tabs, selectedTab, toggleClassName, onTabChange }} />
      <ArticleList articles={wrap(articles)} />
      <Pagination currentPage={currentPage} count={articlesCount} itemsPerPage={10} onPageChange={onPageChange} />
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