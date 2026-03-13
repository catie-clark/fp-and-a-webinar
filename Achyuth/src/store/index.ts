// src/store/index.ts
// Phase 1 stub — only makeStore factory and type exports.
// Full store (scenario slice, selectors) built in Phase 3.
import { configureStore } from '@reduxjs/toolkit';

export const makeStore = () =>
  configureStore({
    reducer: {
      // Phase 3: add scenarioSlice, uiSlice here
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
