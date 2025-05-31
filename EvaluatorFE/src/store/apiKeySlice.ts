import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from ".";
import { SETTINGS } from "../conf/settings";

interface ApiKeyType {
  apiKeyList: string[];
  currWorkingIndex: number;
}

const initialState: ApiKeyType = {
  apiKeyList: JSON.parse(SETTINGS.GEMINI_API_KEY) as string[],
  currWorkingIndex: 0,
};

const apiKeySlice = createSlice({
  initialState,
  name: "apiKey",
  reducers: {
    setApiKeyList: (state, action: PayloadAction<string[]>) => {
      state.apiKeyList = action.payload;
    },

    setCurrWorkingIndexByOne: (state) => {
      state.currWorkingIndex = Math.floor(
        Math.random() * state.apiKeyList.length
      );
    },

    setCurrWorkingIndex: (state, action: PayloadAction<number>) => {
      state.currWorkingIndex = action.payload;
    },
  },
});

export default apiKeySlice.reducer;
export const apiKeyActions = apiKeySlice.actions;

export const updateToNextApiKey = () => {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const { apiKeyList, currWorkingIndex } = getState().apiKey;
    const currentApiKeyList = apiKeyList.filter(
      (_, idx) => idx !== currWorkingIndex
    );
    dispatch(apiKeyActions.setApiKeyList(currentApiKeyList));
    dispatch(
      apiKeyActions.setCurrWorkingIndex(
        Math.floor(Math.random() * currentApiKeyList.length)
      )
    );
  };
};
