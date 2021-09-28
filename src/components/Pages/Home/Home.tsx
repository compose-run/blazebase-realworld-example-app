import { Option } from '@hqoss/monads';
import { getArticles, getFeed } from '../../../services/conduit';
import { store } from '../../../state/store';
import { useStoreWithInitializer } from '../../../state/storeHooks';
import { FeedFilters, useArticles, useTags } from '../../../types/article';
import { wrap } from '../../../types/user';
import { ArticlesViewer } from '../../ArticlesViewer/ArticlesViewer';
import { changePage, loadArticles, startLoadingArticles } from '../../ArticlesViewer/ArticlesViewer.slice';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { changeTab, loadTags, startLoadingTags } from './Home.slice';

export function Home() {
  const { selectedTab } = useStoreWithInitializer(({ home }) => home, load);

  return (
    <div className='home-page'>
      {renderBanner()}
      <ContainerPage>
        <div className='col-md-9'>
          <ArticlesViewer
            toggleClassName='feed-toggle'
            selectedTab={selectedTab}
            tabs={buildTabsNames(selectedTab)}
            onPageChange={onPageChange}
            onTabChange={onTabChange}
          />
        </div>

        <div className='col-md-3'>
          <HomeSidebar />
        </div>
      </ContainerPage>
    </div>
  );
}

async function load() {
  store.dispatch(startLoadingArticles()); // TODO build this into the local check not in the store
  store.dispatch(startLoadingTags()); // TODO build this into the local check not in the store

  if (store.getState().app.user.isSome()) {
    store.dispatch(changeTab('Your Feed'));
  }

  // const multipleArticles = await getFeedOrGlobalArticles();
  // store.dispatch(loadArticles(multipleArticles));
}

function renderBanner() {
  return (
    <div className='banner'>
      <div className='container'>
        <h1 className='logo-font'>conduit</h1>
        <p>A place to share your knowledge.</p>
      </div>
    </div>
  );
}

function buildTabsNames(selectedTab: string) {
  const { user } = store.getState().app;

  return Array.from(new Set([...(user.isSome() ? ['Your Feed'] : []), 'Global Feed', selectedTab]));
}

async function onPageChange(index: number) {
  store.dispatch(changePage(index));
}

async function onTabChange(tab: string) {
  store.dispatch(changeTab(tab));
  store.dispatch(startLoadingArticles());

  const multipleArticles = await getFeedOrGlobalArticles();
  store.dispatch(loadArticles(multipleArticles));
}

async function getFeedOrGlobalArticles(filters: FeedFilters = {}) {
  const { selectedTab } = store.getState().home;
  const finalFilters = {
    ...filters,
    tag: selectedTab.slice(2),
  };

  // TODO this
  return await (selectedTab === 'Your Feed' ? getFeed : getArticles)(
    !selectedTab.startsWith('#') ? filters : finalFilters
  );
}

function HomeSidebar() {
  const tags = useTags()

  return (
    <div className='sidebar'>
      <p>Popular Tags</p>
      
      {wrap(tags).match({
        none: () => <span>Loading tags...</span>,
        some: (tags) => (
          <div className='tag-list'>
            {' '}
            {tags.map((tag) => (
              <a key={tag} href='#' className='tag-pill tag-default' onClick={() => onTabChange(`# ${tag}`)}>
                {tag}
              </a>
            ))}{' '}
          </div>
        ),
      })}
    </div>
  );
}
