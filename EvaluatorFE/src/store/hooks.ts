import { useDispatch, useSelector } from "react-redux";
import store, { RootState } from ".";

export const useAppDispatch = useDispatch.withTypes<(typeof store.dispatch)>();
export const useAppSelector = useSelector.withTypes<RootState>();