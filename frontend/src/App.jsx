import React, { lazy, Suspense, useEffect,useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { UserAuth } from "./store/userAuthStore";

const GlobalRanking = lazy(() => import("./pages/GlobalRanking"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const WeeklyChallenges = lazy(() => import("./pages/WeeklyChallenges"));
const MonthlyChallenge = lazy(() => import("./pages/MonthlyChallenge"));

const DailyChellenges = lazy(() => import("./pages/dailyChellenges"));
const StatsAndRanking = lazy(() => import("./pages/StatsAndRanking"));
import PostEditor from "./pages/PostsEditor";
// import Navbar from "./components/SubComponent/Navbar";
import Navbar from "./components/SubComponent/SimpleNavbar";
import Notification from "./pages/Notification"
const CanvasRevealEffectDemo = lazy(() => import("./components/CanvarCover"));
import { matrixAuthStore } from "./store/matrixStore";
import RivalBuddy from "./pages/RivalBuddy";import ClanHub from "./pages/ClanHub";
import SidebarLayout from "./components/Sidebar";
import Carousel from "./components/QuestSlider";
import CreateClan from "./pages/CreateClan";
const GlobalChat = lazy(() => import("./pages/GlobalChat"));
const App = () => {
  const { authUser } = UserAuth();
  const { fetchMatrices } = matrixAuthStore();
  const [sidebarOpen, setsidebarOpen] = useState(false); 
  // useEffect(() => {
  //   fetchMatrices(authUser._id)

  // }, [])

  return (
    <div className="relative">
      <Navbar setsidebarOpen={setsidebarOpen} sidebarOpen={sidebarOpen} >
        <Suspense
          fallback={<div className="text-center mt-20">Loading...</div>}
        >
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                authUser?.username ? (
                  <Navigate to="/statsAndRanking" />
                ) : (
                  <Login />
                )
              }
            />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}

        x
            <Route element={<SidebarLayout setsidebarOpen={setsidebarOpen}  sidebarOpen={sidebarOpen}/>}>
              <Route
                path="/dailychellenge"
                element={
                  authUser?.username ? (
                    <DailyChellenges />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
                  <Route
              path="/"
              // element={authUser?.username ? <Home /> : <Navigate to="/login" />}
              element={<Home />}
            />
              <Route
                path="/globalChat"
                element={
                  authUser?.username ? <GlobalChat /> : <Navigate to="/login" />
                }
              />
               <Route
                path="/postEditor"
                element={
                  authUser?.username ? <PostEditor /> : <Navigate to="/login" />
                }
              />
                <Route
                path="/slider"
                element={
                  authUser?.username ? <Carousel /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/buddyChat"
                element={
                  authUser?.username ? <RivalBuddy /> : <Navigate to="/login" />
                }
              />
               <Route
                path="/notification"
                element={
                  authUser?.username ? <Notification /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/ClanHub"
                element={
                  authUser?.username ? <ClanHub /> : <Navigate to="/login" />
                }
              />
                <Route
                path="/create-clan"
                element={
                  authUser?.username ? <CreateClan /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/weeklychallenge"
                element={
                  authUser?.username ? (
                    <WeeklyChallenges />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/monthlychallenge"
                element={
                  authUser?.username ? (
                    <MonthlyChallenge />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/statsAndRanking"
                element={
                  authUser?.username ? (
                    <StatsAndRanking />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/globalRanking"
                element={
                  authUser?.username ? (
                    <GlobalRanking />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Canvas Route - no auth */}
              <Route path="/canvas" element={<CanvasRevealEffectDemo />} />

              {/* Optional Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          </Routes>
        </Suspense>
      </Navbar>

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default App;
