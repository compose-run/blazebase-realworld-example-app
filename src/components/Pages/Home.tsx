import { useState } from 'react';
import { useTags } from '../../services/article';
import { firebaseAuth} from '../../services/compose';
import { ArticlesViewer } from '../ArticlesViewer';
import { ContainerPage } from '../ContainerPage';

export function Home() {
  const [ selectedTab, setSelectedTab ] = useState(firebaseAuth.currentUser ? 'Your Feed' : 'Global Feed') // TODO confirm this works

  // TODO - do I need to wrap setSelectedTab to also modify the URL hash? (look at the previous version)

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
          <HomeSidebar setSelectedTab={setSelectedTab} />
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
  return Array.from(new Set([...(firebaseAuth.currentUser ? ['Your Feed'] : []), 'Global Feed'])); // TODO confirm this works
}

function HomeSidebar({setSelectedTab}) {
  const tags = useTags()

  return (
    <div className='sidebar'>
      <p>Popular Tags</p>
      
      {tags 
        ? <div className='tag-list'>
        {' '}
        {tags.map((tag) => (
          <a key={tag} href='#' className='tag-pill tag-default' onClick={() => setSelectedTab(tag)}>
            {tag}
          </a>
        ))}{' '}
      </div> 
      : <span>Loading tags...</span>
      }
    </div>
  );
}
