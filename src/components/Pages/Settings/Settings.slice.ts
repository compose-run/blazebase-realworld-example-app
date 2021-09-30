import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserSettings } from '../../../types/user';
import { GenericErrors } from '../../../types/error';

export interface SettingsState {
  user: UserSettings;
  errors: GenericErrors;
  updating: boolean;
}

const initialState: SettingsState = {
  user: { username: '', email: '', password: null, bio: null, image: null },
  errors: {},
  updating: false,
};

const slice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    initializeSettings: () => initialState,
    updateField: (state, { payload: { name, value } }: PayloadAction<{ name: keyof UserSettings; value: string }>) => {
      state.user[name] = value;
    },
    updateErrors: (state, { payload: errors }: PayloadAction<GenericErrors>) => {
      state.errors = errors;
      state.updating = false;
    },
    startUpdate: (state) => {
      state.updating = true;
    },
  }
});

export const { initializeSettings, updateField, updateErrors, startUpdate } = slice.actions;

export default slice.reducer;
