import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../components/UserContext';  // Import the useUser hook
import '../styles/login.css';  // Import your CSS for styling

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useUser();  // Access the login function from UserContext

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://mmis6299-registration-3fe6af6fc84a.herokuapp.com/api/login', {
        email,
        password,
      });

      setMessage(response.data.message);

      // On successful login, store user data (including major_name) and navigate to the Register page
      if (response.data.user) {
        login(response.data.user);  // Pass the full user object with major_name to login
        navigate('/Register');
      }
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Network Error");
      }
    }
  };


  return (
    <div className="login-container">
        <h3>Test Accounts</h3>
      <table className="test-accounts-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Password</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>rileydenton@email.com</td>
            <td>password1</td>
          </tr>
          <tr>
            <td>amandamoore@email.com</td>
            <td>password2</td>
          </tr>
          <tr>
            <td>tylerjones@email.com</td>
            <td>password3</td>
          </tr>
        </tbody>
      </table>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
