import { Fragment } from 'react';
import { HashRouter, Redirect, Route, RouteProps, Switch } from 'react-router-dom';
import { EditArticle } from './Pages/EditArticle';
import { Footer } from './Footer';
import { Header } from './Header';
import { Home } from './Pages/Home';
import { Login } from './Pages/Login';
import { NewArticle } from './Pages/NewArticle';
import { Register } from './Pages/Register';
import { Settings } from './Pages/Settings';
import { ProfilePage } from './Pages/ProfilePage';
import { ArticlePage } from './Pages/ArticlePage';
import { useUser } from '../services/user';

export function App() {
  const userIsLogged = !!useUser();

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
