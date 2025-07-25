import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchUserProfile } from "../store/slices/authSlice";
import { Outlet } from "react-router";

export default function AuthProvider() {
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Only fetch user profile if we don't have user data and we're not currently loading
    if (!isAuthenticated && !user && !isLoading) {
      dispatch(fetchUserProfile());
    }
  }, [isAuthenticated, user, dispatch]);

  return <Outlet />;
}
