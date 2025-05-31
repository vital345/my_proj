import { configureStore } from "@reduxjs/toolkit";
import { persistStore } from "redux-persist";
import apiKeySlice from "./apiKeySlice";
import authSlice from "./authSlice";
import audioQuestion from "./questionSlice";

const store = configureStore({
  reducer: {
    auth: authSlice,
    questions: audioQuestion,
    apiKey: apiKeySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);

export default store;
