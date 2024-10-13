import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/homepage.css';  // Import the CSS

function Homepage() {
  return (
    <div className="container">
      <h1>Welcome to the Homepage</h1>
      <nav>
        <ul>
          <li>
            <Link to="/Register">Register</Link>
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


