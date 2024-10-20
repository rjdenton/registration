import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the UserContext
const UserContext = createContext();

// Create a custom hook for using the UserContext
export const useUser = () => useContext(UserContext);

// Create a UserProvider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Check local storage for user data on initial load
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    // Store user data in local storage whenever it changes
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
