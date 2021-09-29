import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { store } from '../../../state/store';
import { redirect } from '../../../types/location';
import { Profile } from '../../../types/profile';
import { useFollowers, useProfiles, useUser, wrap } from '../../../types/user';
import { ArticlesViewer } from '../../ArticlesViewer/ArticlesViewer';
import { changePage } from '../../ArticlesViewer/ArticlesViewer.slice';
import { UserInfo } from '../../UserInfo/UserInfo';

export function ProfilePage() {
  const user = useUser()
  const [, emitFollowAction] = useFollowers();
  const [submittingFollow, setSubmittingFollow] = useState(false)

  const { username } = useParams<{ username: string }>();
  const favorites = useLocation().pathname.endsWith('favorites');

  const profiles = useProfiles();
  const profile = wrap(profiles && profiles.find(u => u.username === username))

  async function onFollowToggle(profile: Profile) {
    if (user.isNone()) {
      redirect('register');
      return;
    }

    setSubmittingFollow(true)
  
    await emitFollowAction({
      type: profile.following ? "UnfollowAction" : "FollowAction",
      follower: user.unwrap().publicKey,
      leader: profile.publicKey
    })

    setSubmittingFollow(false)
  }

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
            disabled={submittingFollow}
            onFollowToggle={() => onFollowToggle(profile)}
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
