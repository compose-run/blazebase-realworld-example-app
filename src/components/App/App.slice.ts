import { None, Option, Some } from '@hqoss/monads';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getKeyPair, KeyPair, setKeyPair, User } from '../../types/user';

export interface AppState {
  user: Option<User>;
  keypair: Option<KeyPair>;
}

const initialState: AppState = {
  user: None,
  keypair: None
};

const slice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    initializeApp: (state) => {
      state = initialState
    },
    loadKeyPair: (state, {payload: keypair}: PayloadAction<KeyPair> ) => {
      state.keypair = Some(keypair)
      setKeyPair(keypair)
    },
    loadUser: (state, { payload: user }: PayloadAction<User>) => {
      // state.user = Some(user);
    },
    logout: (state) => {
      state.keypair = None
    },
  },
});

export const { loadUser, logout, loadKeyPair, initializeApp } = slice.actions;

export default slice.reducer;
