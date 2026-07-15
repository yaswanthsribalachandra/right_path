import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { fileName, fileBase64, contentType, user_id } = req.body;
    if (!fileName || !fileBase64 || !user_id) return res.status(400).json({ error: 'fileName, fileBase64, user_id required' });

    const buffer = Buffer.from(fileBase64, 'base64');
    const path = `${user_id}/${Date.now()}-${fileName}`;
    const { error } = await supabase.storage.from('resumes').upload(path, buffer, { contentType, upsert: true });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path);
    return res.status(200).json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
