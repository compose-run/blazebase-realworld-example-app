import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { followUser, unfollowUser } from '../../../services/conduit';
import { store } from '../../../state/store';
import { useStore } from '../../../state/storeHooks';
import { redirect } from '../../../types/location';
import { Profile } from '../../../types/profile';
import { useProfiles, wrap } from '../../../types/user';
import { ArticlesViewer } from '../../ArticlesViewer/ArticlesViewer';
import { changePage } from '../../ArticlesViewer/ArticlesViewer.slice';
import { UserInfo } from '../../UserInfo/UserInfo';
import { loadProfile, startSubmitting } from './ProfilePage.slice';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const favorites = useLocation().pathname.endsWith('favorites');

  const profiles = useProfiles();
  const profile = wrap(profiles.find(u => u.username === username))
  
  const { submitting } = useStore(({ profile }) => profile);

  return (
    <div className='profile-page'>
      {profile.match({
        none: () => (
          <div className='article-preview' key={1}>
            Loading profile...
          </div>
        ),
        some: (profile) => (
          <UserInfo
            user={profile}
            disabled={submitting}
            onFollowToggle={onFollowToggle(profile)}
            onEditSettings={() => redirect('settings')}
          />
        ),
      })}

      <div className='container'>
        <div className='row'>
          <div className='col-xs-12 col-md-10 offset-md-1'>
            <ArticlesViewer
              toggleClassName='articles-toggle'
              tabs={['My Articles', 'Favorited Articles']}
              selectedTab={favorites ? 'Favorited Articles' : 'My Articles'}
              onTabChange={onTabChange(username)}
              onPageChange={onPageChange(username, favorites)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// TODO - put these filters into ArticlesViewer
  // const { currentPage } = store.getState().articleViewer;
  // return await getArticles({ [favorites ? 'favorited' : 'author']: username, offset: (currentPage - 1) * 10 });

function onFollowToggle(profile: Profile): () => void {
  return async () => {
    const { user } = store.getState().app;
    if (user.isNone()) {
      redirect('register');
      return;
    }

    store.dispatch(startSubmitting());

    const newProfile = await (profile.following ? unfollowUser : followUser)(profile.username);
    store.dispatch(loadProfile(newProfile));
  };
}

function onTabChange(username: string): (page: string) => void {
  return async (page) => {
    const favorited = page === 'Favorited Articles';
    location.hash = `#/profile/${username}${!favorited ? '' : '/favorites'}`;
    // TODO filter favorited
  };
}

function onPageChange(username: string, favorited: boolean): (index: number) => void {
  return async (index) => {
    store.dispatch(changePage(index));
  };
}
