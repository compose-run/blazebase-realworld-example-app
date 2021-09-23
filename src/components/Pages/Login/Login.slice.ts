import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GenericErrors } from '../../../types/error';

export interface LoginState {
  credentials: {
    email: string;
    password: string;
  };
  errors: GenericErrors;
  loginIn: boolean;
}

const initialState: LoginState = {
  credentials: {
    email: '',
    password: '',
  },
  errors: {},
  loginIn: false,
};

const slice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    initializeLogin: () => initialState,
    updateField: (
      state,
      { payload: { name, value } }: PayloadAction<{ name: keyof LoginState['credentials']; value: string }>
    ) => {
      state.credentials[name] = value;
    },
    updateErrors: (state, { payload: errors }: PayloadAction<GenericErrors>) => {
      state.errors = errors;
      state.loginIn = false;
    },
    startLoginIn: (state) => {
      state.loginIn = true;
    },
  },
});

export const { initializeLogin, updateField, updateErrors, startLoginIn } = slice.actions;

export default slice.reducer;
