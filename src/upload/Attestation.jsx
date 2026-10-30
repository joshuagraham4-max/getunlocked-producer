// Upload agreement: must be signed (checkbox + typed name) before any contact import.
import { useState } from "react";
import { supabase } from "../supabase.js";

export const ATTEST_VERSION = "2026-10-30";
export const ATTEST_POINTS = [
  "Every contact in the files I upload is my own client, lead or business contact, or I have permission to use their information.",
  "I will follow the TCPA, the National Do Not Call Registry, state calling and texting rules, and CAN-SPAM.",
  "I will not spam, use auto-dialers, or send mass or automated texts to these contacts without their prior written consent.",
  "I will honor every opt-out and do-not-contact request right away.",
  "I will not upload Social Security numbers, account numbers or other sensitive borrower data.",
  "I am responsible for how I use my contacts in this app, and Get Unlocked may remove contacts or my access if these terms are broken.",
];

export async function hasSigned(userId) {
  if (!userId) return false;
  const { data } = await supabase.from("upload_attestations").select("id").eq("user_id", userId).eq("version", ATTEST_VERSION).limit(1);
  return !!(data && data.length);
}

export default function Attestation({ userId, defaultName, onSigned, onCancel }) {
  const [ok, setOk] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const can = ok && name.trim().length >= 3 && !busy;
  const sign = async () => {
    setBusy(true); setErr("");
    const { error } = await supabase.from("upload_attestations").insert({ user_id:userId, signed_name:name.trim(), version:ATTEST_VERSION, agreement:ATTEST_POINTS.join("\n"), user_agent:navigator.userAgent.slice(0, 250) });
    setBusy(false);
    if (error) setErr("Could not save your signature: " + error.message); else onSigned();
  };
  return (
    <div onClick={onCancel} style={{position:"fixed", inset:0, background:"rgba(28,26,23,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16}}>
      <div onClick={(e) => e.stopPropagation()} style={{background:"#faf7f2", borderRadius:12, maxWidth:560, width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"22px 24px", border:"1px solid #e0d8cc"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:24, color:"#1c1a17"}}>Contact upload agreement</div>
        <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, color:"#6b6358", margin:"4px 0 14px"}}>Sign once before your first import. Your contacts stay private to you.</div>
        <ol style={{fontFamily:"'Barlow',sans-serif", fontSize:14, color:"#1c1a17", paddingLeft:20, margin:"0 0 16px", lineHeight:1.5}}>
          {ATTEST_POINTS.map((p) => <li key={p} style={{marginBottom:6}}>{p}</li>)}
        </ol>
        <label style={{display:"flex", gap:10, alignItems:"flex-start", fontFamily:"'Barlow',sans-serif", fontSize:14, marginBottom:12, cursor:"pointer"}}>
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} style={{marginTop:3}}/>
          <span>I have read and agree to all of the above.</span>
        </label>
        <div style={{fontFamily:"'DM Mono',monospace", fontSize:10, color:"#a89e92", marginBottom:4}}>TYPE YOUR FULL NAME TO SIGN{defaultName ? ` (${defaultName})` : ""}</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{width:"100%", padding:"9px 10px", borderRadius:6, border:"1px solid #e0d8cc", fontFamily:"'Barlow',sans-serif", fontSize:15, boxSizing:"border-box"}}/>
        {err && <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, color:"#9e3020", marginTop:8}}>{err}</div>}
        <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:16}}>
          <button onClick={onCancel} style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, padding:"8px 16px", borderRadius:7, border:"1px solid #e0d8cc", background:"#faf7f2", color:"#6b6358", cursor:"pointer"}}>Cancel</button>
          <button disabled={!can} onClick={sign} style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, padding:"8px 16px", borderRadius:7, border:"1px solid #1e6e4a", background:can ? "#1e6e4a" : "#a8c7b8", color:"#fff", cursor:can ? "pointer" : "default"}}>{busy ? "Saving…" : "Sign and choose file"}</button>
        </div>
      </div>
    </div>
  );
}
