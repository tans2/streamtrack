import express from 'express';
import { authenticateToken } from './auth';

const router = express.Router();

router.post('/bug-report', authenticateToken, async (req: any, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Title and description are required' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN is not configured');
    return res.status(500).json({ success: false, error: 'Bug reporting is not configured' });
  }

  const body = `**Reported by:** ${req.user.email}\n\n${description}`;

  try {
    const response = await fetch('https://api.github.com/repos/tans2/streamtrack/issues', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels: ['bug'] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      return res.status(502).json({ success: false, error: 'Failed to file bug report' });
    }

    const issue = await response.json() as { html_url: string; number: number };
    res.json({ success: true, data: { issueUrl: issue.html_url, issueNumber: issue.number } });
  } catch (error) {
    console.error('Error filing bug report:', error);
    res.status(500).json({ success: false, error: 'Failed to file bug report' });
  }
});

export default router;
