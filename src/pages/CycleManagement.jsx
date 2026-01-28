import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const CycleManagement = () => {
  const [cycles, setCycles] = useState([]);
  const [newName, setNewName] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  useEffect(() => { loadCycles(); }, []);

  const loadCycles = async () => {
    const { data } = await supabase.from('assessment_cycles').select('*').order('created_at', { ascending: false });
    setCycles(data || []);
  };

  const createCycle = async () => {
    if(!newName) return alert("Name required");
    await supabase.from('assessment_cycles').insert({ name: newName, year: newYear, status: 'Upcoming' });
    setNewName('');
    loadCycles();
  };

  const activateCycle = async (id) => {
    if(!confirm("Start this cycle? Others will be closed.")) return;
    await supabase.from('assessment_cycles').update({ status: 'Closed' }).eq('status', 'Active');
    await supabase.from('assessment_cycles').update({ status: 'Active' }).eq('id', id);
    loadCycles();
  };

  const closeCycle = async (id) => {
    await supabase.from('assessment_cycles').update({ status: 'Closed' }).eq('id', id);
    loadCycles();
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        <div className="input-card">
            <h3>Create New Cycle</h3>
            <input placeholder="Name (e.g. Q4 2026)" value={newName} onChange={e => setNewName(e.target.value)} />
            <input type="number" value={newYear} onChange={e => setNewYear(e.target.value)} />
            <button className="btn" onClick={createCycle}>Create</button>
        </div>

        <h3>Existing Cycles</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ textAlign:'left', borderBottom:'1px solid #555' }}>
                    <th style={{padding:10}}>Name</th>
                    <th style={{padding:10}}>Year</th>
                    <th style={{padding:10}}>Status</th>
                    <th style={{padding:10}}>Action</th>
                </tr>
            </thead>
            <tbody>
                {cycles.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #333', background: c.status === 'Active' ? '#1a2a1a' : 'transparent' }}>
                        <td style={{padding:10}}>{c.name}</td>
                        <td style={{padding:10}}>{c.year}</td>
                        <td style={{padding:10, color: c.status==='Active'?'var(--success)':'#aaa'}}>{c.status}</td>
                        <td style={{padding:10}}>
                            {c.status === 'Upcoming' && <button className="btn" style={{padding:'5px 10px', fontSize:'0.8rem'}} onClick={() => activateCycle(c.id)}>Start</button>}
                            {c.status === 'Active' && <button className="btn secondary" style={{padding:'5px 10px', fontSize:'0.8rem', color:'var(--danger)', borderColor:'var(--danger)'}} onClick={() => closeCycle(c.id)}>Close</button>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

export default CycleManagement;