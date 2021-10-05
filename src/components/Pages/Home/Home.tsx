import { store } from '../../../state/store';
import { useStoreWithInitializer } from '../../../state/storeHooks';
import { useTags } from '../../../types/article';
import { getKeyPair, wrap } from '../../../types/user';
import { ArticlesViewer } from '../../ArticlesViewer/ArticlesViewer';
import { changePage } from '../../ArticlesViewer/ArticlesViewer.slice';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { changeTab } from './Home.slice';

export function Home() {
  const { selectedTab } = useStoreWithInitializer(({ home }) => home, load);

  async function load() {
    if (getKeyPair()) {
      store.dispatch(changeTab('Your Feed'));
    }
  }
  return (
    <div className='home-page'>
      {renderBanner()}
      <ContainerPage>
        <div className='col-md-9'>
          <ArticlesViewer
            toggleClassName='feed-toggle'
            selectedTab={selectedTab}
            tabs={buildTabsNames(selectedTab)}
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
  return Array.from(new Set([...(getKeyPair().isSome() ? ['Your Feed'] : []), 'Global Feed']));
}

async function onTabChange(tab: string) {
  store.dispatch(changeTab(tab));
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
