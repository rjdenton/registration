import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/homepage.css';  // Import the CSS
import './Login.js';

function Homepage() {
  return (
    <div className="container">
      <h1>Registration</h1>
      <nav>
        <ul>
          <li>
            <Link to="/Login">Login</Link>
          </li>
        </ul>
      </nav>
      <footer>
        <p>© 2024 Your Website. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default Homepage;


