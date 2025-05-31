import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import persistReducer from "redux-persist/es/persistReducer";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { AppDispatch } from ".";
import conf from "../conf/conf";

type AuthStatus = "pending" | "success" | "failure" | "loading";

interface UserDetails {
  id: number;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  status: AuthStatus;
  user: UserDetails | null;
}

const initialState: AuthState = {
  token: null,
  status: "pending",
  user: null,
};

const authSlice = createSlice({
  initialState: initialState,
  name: "authentication",
  reducers: {
    setToken: (
      state: AuthState,
      action: {
        payload: string | null;
        type: string;
      }
    ) => {
      const userData = action.payload;
      state.token = userData;
    },

    setStatus: (
      state: AuthState,
      action: {
        payload: AuthStatus;
        type: string;
      }
    ) => {
      state.status = action.payload;
    },

    setUser: (
      state: AuthState,
      action: {
        payload: UserDetails | null;
        type: string;
      }
    ) => {
      state.user = action.payload;
    },
  },
});

const persistConfig = {
  key: "root",
  storage,
};

export const authActions = authSlice.actions;

export default persistReducer(persistConfig, authSlice.reducer);

export interface AuthInfo {
  username: string;
  password: string;
}

export const logIn = (authInfo: URLSearchParams) => {
  return async (dispatch: AppDispatch) => {
    dispatch(authActions.setStatus("loading"));
    try {
      const response = await axios.post(
        `${conf.backendUrl}/login/token/`,
        authInfo
      );
      const userResponse = await axios.get(
        `${conf.backendUrl}/login/get_current_user/`,
        {
          headers: { Authorization: `Bearer ${response.data.access_token}` },
        }
      );
      dispatch(authActions.setToken(response.data.access_token));
      dispatch(authActions.setStatus("success"));
      dispatch(authActions.setUser(userResponse.data));
    } catch (err) {
      toast.error(`Some error happened while loggin you.${err}`);
      dispatch(authActions.setStatus("failure"));
    }
  };
};

export const logOut = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(authActions.setStatus("pending"));
    dispatch(authActions.setToken(null));
    dispatch(authActions.setUser(null));
  };
};
