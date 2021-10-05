import { Action, configureStore } from '@reduxjs/toolkit';
import home from '../components/Pages/Home/Home.slice';
import settings from '../components/Pages/Settings/Settings.slice';
import register from '../components/Pages/Register/Register.slice';
import profile from '../components/Pages/ProfilePage/ProfilePage.slice';
import articlePage from '../components/Pages/ArticlePage/ArticlePage.slice';

const middlewareConfiguration = { serializableCheck: false };

export const store = configureStore({
  reducer: { home, settings, register, profile, articlePage },
  devTools: true,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(middlewareConfiguration),
});
export type State = ReturnType<typeof store.getState>;

export function dispatchOnCall(action: Action) {
  return () => store.dispatch(action);
}
