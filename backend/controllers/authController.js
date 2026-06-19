import dotenv from 'dotenv';

dotenv.config();

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const expectedUser = process.env.ADMIN_USERNAME || 'admin';
    const expectedPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    if (username.trim() === expectedUser && password === expectedPass) {
      return res.json({
        success: true,
        token: 'mock-session-token-ropita-bonita-' + Date.now(),
        user: {
          username: expectedUser,
          role: 'administrator'
        }
      });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server login error' });
  }
};
