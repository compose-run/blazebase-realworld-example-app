import { useState } from 'react';
import { useTags } from '../../services/article';
import { getKeyPair, wrap } from '../../services/user';
import { ArticlesViewer } from '../ArticlesViewer';
import { ContainerPage } from '../ContainerPage';

export function Home() {
  const [ selectedTab, setSelectedTab ] = useState(getKeyPair() ? 'Your Feed' : 'Global Feed')

  return (
    <div className='home-page'>
      {renderBanner()}
      <ContainerPage>
        <div className='col-md-9'>
          <ArticlesViewer
            toggleClassName='feed-toggle'
            selectedTab={selectedTab}
            tabs={buildTabsNames(selectedTab)}
            onTabChange={setSelectedTab}
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
