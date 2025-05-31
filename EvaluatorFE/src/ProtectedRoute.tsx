import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "./store/hooks";

export const ProtectedRoute = () => {
    const user = useAppSelector((state) => state.auth.user);

    if (!user) {
        return <Navigate to="/" />;
    }

    if (user.role !== 'admin') {
        return <Navigate to="/unauthorized" />;
    }

    return <Outlet />;
};
