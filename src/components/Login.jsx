import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Ensure this path is correct based on where you made the file

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    // We stick to your custom "employees" table logic for the demo
    const { data: user, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email.trim())
      .eq('password', password.trim())
      .single();

    if (error || !user) {
      alert("Login failed. Please check your credentials.");
      setLoading(false);
    } else {
      // Pass the user data back up to App.jsx
      onLogin(user);
    }
  };

  return (
    <div className="input-card">
      <h1 style={{ color: 'var(--primary)', marginTop: 0 }}>AEDAS PEER REVIEW</h1>
      <p>Please log in to continue.</p>
      
      <input 
        type="text" 
        placeholder="Email (e.g. khadije@aedas.com)" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <input 
        type="password" 
        placeholder="Password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      
      <button className="btn" onClick={handleLogin} disabled={loading}>
        {loading ? 'LOGGING IN...' : 'LOG IN'}
      </button>
    </div>
  );
};

export default Login;