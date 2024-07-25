// Dashboard.jsx
import React, { useEffect, useState } from "react";
import { auth, db, doc, onSnapshot, signOut } from "../firebase";
import { useNavigate } from "react-router-dom";
import { setDoc, Timestamp } from "firebase/firestore";
import UserDashboard from "./UserDashboard";
import data from "../jsonfiles/data.json";

const Dashboard = () => {
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [theme, setTheme] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [lastDayToPlayGame, setLastDayToPlayGame] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [noOfLevels, setNoOfLevels] = useState(0);
  const [levelsEnabled, setLevelsEnabled] = useState([]);
  const [levelsCompleted, setLevelsCompleted] = useState([]); // Ensure levelsCompleted is initialized
  const [levelsDisabled, setLevelsDisabled] = useState([]);
  const [levels, setLevels] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, `Contest/${user.uid}`);
        onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserData(userData);
            setRole(userData.role);
            setTheme(userData.Theme);

            const userDocRef = doc(
              db,
              "Contest-leaderboard",
              `${userData.email}--${userData.username}`
            );
            onSnapshot(userDocRef, async (userDocSnap) => {
              const currentDate = new Date();
              if (!userDocSnap.exists()) {
                // Calculate the UTC time for July 27, 2024, at 9:30:00 AM UTC+5:30
                const lastDayForGame = new Date(Date.UTC(2024, 6, 27, 4, 0, 0));

                const themeData = data.find(
                  (d) => d.Theme === docSnap.data().Theme
                );
                const noOfLevels = themeData
                  ? themeData.Content.Levels.length
                  : 0;
                const levelsEnabled = [0];
                const levelsCompleted = [];
                const levelsDisabled = Array.from(
                  { length: noOfLevels },
                  (_, i) => i
                ).filter((level) => !levelsEnabled.includes(level));

                await setDoc(
                  userDocRef,
                  {
                    finalScore: 0,
                    levelscores: [],
                    firstLoginTime: Timestamp.fromDate(currentDate),
                    lastDayForGame: Timestamp.fromDate(lastDayForGame),
                    noOfLevels: noOfLevels,
                    levelsEnabled: levelsEnabled,
                    levelsCompleted: levelsCompleted,
                    levelsDisabled: levelsDisabled,
                    levels: null,
                  },
                  { merge: true }
                );

                setCurrentDate(currentDate.toString());
                setLastDayToPlayGame(lastDayForGame.toString());
                setNoOfLevels(noOfLevels);
                setLevelsEnabled(levelsEnabled);
                setLevelsCompleted(levelsCompleted);
                setLevelsDisabled(levelsDisabled);
              } else {
                setCurrentDate(currentDate.toString());
                setLastDayToPlayGame(
                  userDocSnap.data().lastDayForGame.toDate().toString()
                );
                setNoOfLevels(userDocSnap.data().noOfLevels || 0);
                setLevelsEnabled(userDocSnap.data().levelsEnabled || []);
                setLevelsCompleted(userDocSnap.data().levelsCompleted || []);
                setLevelsDisabled(userDocSnap.data().levelsDisabled || []);
                setLevels(userDocSnap.data().levels);
              }
            });
          } else {
            console.error("No such document!");
          }
        });
      } else {
        navigate("/login");
      }
    };

    fetchUserRole();
  }, [navigate]);

  const handleLogout = () => {
    signOut(auth);
    navigate("/login");
  };

  if (!role) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {role === "admin" ? (
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-2xl mb-4">Admin Dashboard</h2>
          <p>Welcome, Admin!</p>
          <button
            onClick={handleLogout}
            className="mt-4 bg-red-500 text-white p-2 rounded"
          >
            Logout
          </button>
        </div>
      ) : (
        <UserDashboard
          timeLeft={timeLeft}
          theme={theme}
          handleLogout={handleLogout}
          lastDayToPlayGame={lastDayToPlayGame}
          setTimeLeft={setTimeLeft}
          userData={userData}
          noOfLevels={noOfLevels}
          levelsEnabled={levelsEnabled}
          levelsCompleted={levelsCompleted}
          levelsDisabled={levelsDisabled}
          levelsData={levels}
          setLevels={setLevels}
        />
      )}
    </>
  );
};

export default Dashboard;
