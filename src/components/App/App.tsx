import { Fragment } from 'react';
import { HashRouter, Redirect, Route, RouteProps, Switch } from 'react-router-dom';
import { EditArticle } from '../Pages/EditArticle/EditArticle';
import { Footer } from '../Footer/Footer';
import { Header } from '../Header/Header';
import { Home } from '../Pages/Home/Home';
import { Login } from '../Pages/Login/Login';
import { NewArticle } from '../Pages/NewArticle/NewArticle';
import { Register } from '../Pages/Register/Register';
import { Settings } from '../Pages/Settings/Settings';
import { ProfilePage } from '../Pages/ProfilePage/ProfilePage';
import { ArticlePage } from '../Pages/ArticlePage/ArticlePage';
import { getKeyPair } from '../../types/user';


export function App() {
  const userIsLogged = getKeyPair().isSome()

  return (
    <HashRouter>
        <Fragment>
          <Header />
          <Switch>
            <GuestOnlyRoute exact path='/login' userIsLogged={userIsLogged}>
              <Login />
            </GuestOnlyRoute>
            <GuestOnlyRoute exact path='/register' userIsLogged={userIsLogged}>
              <Register />
            </GuestOnlyRoute>
            <UserOnlyRoute exact path='/settings' userIsLogged={userIsLogged}>
              <Settings />
            </UserOnlyRoute>
            <UserOnlyRoute exact path='/editor' userIsLogged={userIsLogged}>
              <NewArticle />
            </UserOnlyRoute>
            <UserOnlyRoute exact path='/editor/:slug' userIsLogged={userIsLogged}>
              <EditArticle />
            </UserOnlyRoute>
            <Route path='/profile/:username'>
              <ProfilePage />
            </Route>
            <Route path='/article/:slug'>
              <ArticlePage />
            </Route>
            <Route exact path='/'>
              <Home />
            </Route>
            <Route path='*'>
              <Redirect to='/' />
            </Route>
          </Switch>
          <Footer />
        </Fragment>
    </HashRouter>
  );
}

/* istanbul ignore next */
function GuestOnlyRoute({
  children,
  userIsLogged,
  ...rest
}: { children: JSX.Element | JSX.Element[]; userIsLogged: boolean } & RouteProps) {
  return (
    <Route {...rest}>
      {children}
      {userIsLogged && <Redirect to='/' />}
    </Route>
  );
}

/* istanbul ignore next */
function UserOnlyRoute({
  children,
  userIsLogged,
  ...rest
}: { children: JSX.Element | JSX.Element[]; userIsLogged: boolean } & RouteProps) {
  return (
    <Route {...rest}>
      {children}
      {!userIsLogged && <Redirect to='/' />}
    </Route>
  );
}
