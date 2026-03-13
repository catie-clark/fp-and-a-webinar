// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import scenarioSlice from './scenarioSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      scenario: scenarioSlice.reducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
