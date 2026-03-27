import { Request, Response } from 'express';
import { supabase } from '../../../lib/supabase.js';

export const createProject = async (req: Request, res: Response) => {
  const { name, description, tech_stack, visibility, owner_id } = req.body;

  // 1. Generate a slug
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  // 2. The Supabase Handshake
  const { data, error } = await supabase
    .from('projects')
    .insert([
      { 
        name, 
        slug, 
        description, 
        tech_stack, 
        visibility, 
        owner_id 
      }
    ])
    .select();

  // 3. Error Handling
  if (error) {
    console.error(`❌ Database insertion failed: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }

  // 4. Success handling
  if (!data || data.length === 0) {
    return res.status(400).json({ error: 'No data returned after insertion' });
  }

  console.log(`✅ New project locked in: ${data[0].name}`);
  return res.status(201).json(data[0]);
};
