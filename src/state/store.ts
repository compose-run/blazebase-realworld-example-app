import { Action, configureStore } from '@reduxjs/toolkit';
import home from '../components/Pages/Home/Home.slice';

const middlewareConfiguration = { serializableCheck: false };

export const store = configureStore({
  reducer: { home },
  devTools: true,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(middlewareConfiguration),
});
export type State = ReturnType<typeof store.getState>;

export function dispatchOnCall(action: Action) {
  return () => store.dispatch(action);
}
