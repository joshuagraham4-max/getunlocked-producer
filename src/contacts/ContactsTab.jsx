// Contacts CRM — list, filters, full detail/edit, loans, linked people, duplicate review.
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabase.js";

const C = {
  bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358", light:"#a89e92", rule:"#e0d8cc",
  green:"#1e6e4a", greenBg:"#e8f4ee", amber:"#b05e0d", amberBg:"#fdf0e0", red:"#9e3020", redBg:"#fbeae7",
  blue:"#1a4f8a", blueBg:"#e6eef9", purple:"#5b3fa6", purpleBg:"#eeebf8", stoneBg:"#f0ece5",
};
const F = { mono:"'DM Mono',monospace", cond:"'Barlow Condensed',sans-serif", body:"'Barlow',sans-serif" };

const TYPES = [["past_client","Past Clients"],["agent","Agents"],["lead","Leads"],["referral_partner","Referral Partners"],["rolodex","Rolodex"],["any","Everyone"]];
const TYPE_LABEL = Object.fromEntries(TYPES);
const RELATIONS = ["co-borrower","spouse","same property","agent","referred by"];
const PAGE = 50;

const digits = (s) => String(s || "").replace(/\D/g, "");
const fmtPhone = (s) => { let d = digits(s); if (d.length === 11 && d[0] === "1") d = d.slice(1); return d.length === 10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : (s || ""); };
const money = (v) => (v || v === 0) && !isNaN(v) ? `$${Math.round(Number(v)).toLocaleString()}` : "";
const fullName = (c) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.company || c.email || "(no name)";
const year = (d) => (d ? String(d).slice(0, 4) : "");
const typeOf = (c) => c.contact_type || "past_client";
const today = () => new Date().toISOString().slice(0, 10);

function Chip({ children, selected, onClick, color = C.green, small }) {
  return <button onClick={onClick} style={{padding: small ? "6px 10px" : "9px 14px", borderRadius:6, border:`1.5px solid ${selected ? color : C.rule}`, background: selected ? color : C.card, color: selected ? "#fff" : C.mid, fontFamily:F.mono, fontSize: small ? 10 : 11, cursor:"pointer"}}>{children}</button>;
}
function Badge({ children, color = C.mid, bg = C.stoneBg }) {
  return <span style={{fontFamily:F.mono, fontSize:9, padding:"2px 6px", borderRadius:3, background:bg, color, whiteSpace:"nowrap"}}>{children}</span>;
}
const box = { background:C.card, border:`1px solid ${C.rule}`, borderRadius:10, padding:"14px 14px", marginBottom:12 };
const lbl = { fontFamily:F.cond, fontSize:11, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:C.light, marginBottom:8 };
const inp = { width:"100%", padding:"8px 10px", borderRadius:6, border:`1px solid ${C.rule}`, background:"#fff", fontFamily:F.body, fontSize:13, color:C.ink, boxSizing:"border-box" };
const ghost = { fontFamily:F.mono, fontSize:10, padding:"6px 10px", borderRadius:5, border:`1px solid ${C.rule}`, background:C.card, color:C.mid, cursor:"pointer" };
const primary = { ...ghost, background:C.green, borderColor:C.green, color:"#fff" };

// ── one editable field ──────────────────────────────────────────────────────────
function Field({ label, value, onSave, type = "text", href, options }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(value ?? "");
  useEffect(() => { setV(value ?? ""); }, [value]);
  const save = async () => { await onSave(v === "" ? null : (type === "number" ? Number(v) : v)); setEdit(false); };
  const shown = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div style={{padding:"7px 0", borderBottom:`1px solid ${C.stoneBg}`}}>
      <div style={{fontFamily:F.mono, fontSize:9, color:C.light, marginBottom:2}}>{label}</div>
      {edit ? (
        <div style={{display:"flex", gap:6}}>
          {options ? (
            <select value={v} onChange={(e) => setV(e.target.value)} style={inp}>{options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}</select>
          ) : (
            <input autoFocus type={type === "number" ? "number" : type === "date" ? "date" : "text"} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEdit(false); }} style={inp}/>
          )}
          <button onClick={save} style={primary}>Save</button>
          <button onClick={() => { setV(value ?? ""); setEdit(false); }} style={ghost}>✕</button>
        </div>
      ) : (
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
          <div style={{fontFamily:F.body, fontSize:14, color: shown === "—" ? C.light : C.ink, wordBreak:"break-word", userSelect:"text"}}>
            {href && shown !== "—" ? <a href={href} style={{color:C.blue, textDecoration:"none"}}>{shown}</a> : shown}
          </div>
          <div style={{display:"flex", gap:4, flexShrink:0}}>
            {shown !== "—" && <button title="Copy" onClick={() => navigator.clipboard?.writeText(String(value))} style={{...ghost, padding:"3px 7px"}}>Copy</button>}
            <button onClick={() => setEdit(true)} style={{...ghost, padding:"3px 7px"}}>Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── loans for one contact ───────────────────────────────────────────────────────
function Loans({ contact, userId }) {
  const [loans, setLoans] = useState(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("loans").select("*").eq("contact_id", contact.id).order("funded_date", { ascending:false, nullsFirst:false });
    setLoans(data || []);
  }, [contact.id]);
  useEffect(() => { load(); }, [load]);
  const save = async (id, field, val) => { await supabase.from("loans").update({ [field]: val }).eq("id", id); load(); };
  const setCurrent = async (id) => {
    await supabase.from("loans").update({ is_current:false }).eq("contact_id", contact.id);
    await supabase.from("loans").update({ is_current:true }).eq("id", id); load();
  };
  const add = async () => { await supabase.from("loans").insert({ user_id:userId, contact_id:contact.id, is_current:!(loans||[]).length, source:"manual" }); load(); };
  const del = async (id) => { if (window.confirm("Delete this loan?")) { await supabase.from("loans").delete().eq("id", id); load(); } };
  if (!loans) return null;
  return (
    <div style={box}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={lbl}>Loans ({loans.length})</div>
        <button onClick={add} style={ghost}>+ Add loan</button>
      </div>
      {loans.length === 0 && <div style={{fontFamily:F.mono, fontSize:10, color:C.light}}>No loans on file.</div>}
      {loans.map((l) => (
        <div key={l.id} style={{border:`1px solid ${l.is_current ? C.green : C.rule}`, borderRadius:8, padding:"8px 10px", marginBottom:8}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
            <div style={{fontFamily:F.cond, fontSize:15, fontWeight:700}}>
              {l.note_rate ? `${l.note_rate}%` : "—"} · {l.loan_type || "type?"}{l.loan_type_source && l.loan_type_source !== "verified" ? " (est.)" : ""} · {l.loan_purpose || "purpose?"} · {year(l.funded_date) || "date?"}
            </div>
            <div style={{display:"flex", gap:4}}>
              {l.is_current ? <Badge color={C.green} bg={C.greenBg}>CURRENT</Badge> : <button onClick={() => setCurrent(l.id)} style={{...ghost, padding:"3px 7px"}}>Make current</button>}
              <button onClick={() => del(l.id)} style={{...ghost, padding:"3px 7px", color:C.red}}>Delete</button>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", columnGap:12}}>
            <Field label="Note rate %" type="number" value={l.note_rate} onSave={(v) => save(l.id, "note_rate", v)}/>
            <Field label="Loan amount" type="number" value={l.loan_amount} onSave={(v) => save(l.id, "loan_amount", v)}/>
            <Field label="Loan type" value={l.loan_type} options={["", "Conventional", "FHA", "VA", "USDA", "Jumbo", "DSCR", "Non-QM", "HELOC"]} onSave={async (v) => { await save(l.id, "loan_type", v); await save(l.id, "loan_type_source", "verified"); }}/>
            <Field label="Purpose" value={l.loan_purpose} options={["", "purchase", "refinance", "cash-out"]} onSave={(v) => save(l.id, "loan_purpose", v)}/>
            <Field label="Funded date" type="date" value={l.funded_date} onSave={(v) => save(l.id, "funded_date", v)}/>
            <Field label="Original LTV %" type="number" value={l.ltv_orig} onSave={(v) => save(l.id, "ltv_orig", v)}/>
            <Field label="Appraised / value" type="number" value={l.appraised_value} onSave={(v) => save(l.id, "appraised_value", v)}/>
            <Field label="Loan number" value={l.loan_number} onSave={(v) => save(l.id, "loan_number", v)}/>
            <Field label="Property address" value={l.property_address} onSave={(v) => save(l.id, "property_address", v)}/>
            <Field label="Property city / state / zip" value={[l.property_city, l.property_state, l.property_zip].filter(Boolean).join(", ")} onSave={async (v) => {
              const [city, state, zip] = String(v || "").split(",").map((s) => s.trim());
              await supabase.from("loans").update({ property_city:city || null, property_state:state || null, property_zip:zip || null }).eq("id", l.id); load();
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── linked people ───────────────────────────────────────────────────────────────
function Linked({ contact, contacts, userId, open, onCreate, links, reloadLinks }) {
  const mine = links.filter((l) => l.contact_id === contact.id || l.linked_id === contact.id);
  const byId = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);
  const [q, setQ] = useState(""); const [rel, setRel] = useState("co-borrower");
  const [nf, setNf] = useState(""); const [nl, setNl] = useState(contact.last_name || "");
  const hits = q.length < 2 ? [] : contacts.filter((c) => c.id !== contact.id && (fullName(c).toLowerCase().includes(q.toLowerCase()) || (c.email || "").includes(q.toLowerCase()) || digits(c.phone).includes(digits(q) || "@@"))).slice(0, 8);
  const link = async (other) => { await supabase.from("contact_links").insert({ user_id:userId, contact_id:contact.id, linked_id:other, relation:rel }); setQ(""); reloadLinks(); };
  const unlink = async (id) => { await supabase.from("contact_links").delete().eq("id", id); reloadLinks(); };
  const createNew = async () => {
    if (!nf.trim()) return;
    const c = await onCreate({ first_name:nf.trim(), last_name:nl.trim() || null, contact_type:typeOf(contact), subtype:rel === "co-borrower" || rel === "spouse" ? "co-borrower" : null,
      address:contact.address, city:contact.city, state:contact.state, zip:contact.zip, property_address:contact.property_address, property_city:contact.property_city, property_state:contact.property_state, property_zip:contact.property_zip, tags:["co-borrower"] });
    if (c) { await link(c.id); setNf(""); }
  };
  return (
    <div style={box}>
      <div style={lbl}>Linked people ({mine.length})</div>
      {mine.map((l) => {
        const other = byId[l.contact_id === contact.id ? l.linked_id : l.contact_id];
        if (!other) return null;
        return (
          <div key={l.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${C.stoneBg}`}}>
            <div onClick={() => open(other)} style={{cursor:"pointer"}}>
              <div style={{fontFamily:F.cond, fontSize:15, fontWeight:700, color:C.blue}}>{fullName(other)}</div>
              <div style={{fontFamily:F.mono, fontSize:10, color:C.mid}}>{l.relation} · {TYPE_LABEL[typeOf(other)]}{other.phone ? ` · ${other.phone}` : ""}</div>
            </div>
            <button onClick={() => unlink(l.id)} style={{...ghost, padding:"3px 7px"}}>Unlink</button>
          </div>
        );
      })}
      <div style={{marginTop:10, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center"}}>
        <select value={rel} onChange={(e) => setRel(e.target.value)} style={{...inp, width:"auto"}}>{RELATIONS.map((r) => <option key={r}>{r}</option>)}</select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Link someone already in your contacts…" style={{...inp, flex:1, minWidth:180}}/>
      </div>
      {hits.map((h) => (
        <div key={h.id} onClick={() => link(h.id)} style={{cursor:"pointer", padding:"6px 8px", borderBottom:`1px solid ${C.stoneBg}`, fontFamily:F.body, fontSize:13}}>
          + {fullName(h)} <span style={{color:C.light, fontSize:11}}>{TYPE_LABEL[typeOf(h)]} {h.email || h.phone || ""}</span>
        </div>
      ))}
      <div style={{marginTop:8, display:"flex", gap:6, flexWrap:"wrap"}}>
        <input value={nf} onChange={(e) => setNf(e.target.value)} placeholder="Or add a new person: first name" style={{...inp, flex:1, minWidth:140}}/>
        <input value={nl} onChange={(e) => setNl(e.target.value)} placeholder="last name" style={{...inp, flex:1, minWidth:120}}/>
        <button onClick={createNew} style={primary}>Add as {rel}</button>
      </div>
    </div>
  );
}

// ── duplicate review ────────────────────────────────────────────────────────────
function Dupes({ contacts, setContacts, userId, close, open, reloadLinks }) {
  const [pairs, setPairs] = useState(null); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const byId = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);
  const load = useCallback(async () => { const { data } = await supabase.from("contact_dupe_candidates").select("*").limit(500); setPairs(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  const merge = async (keep, drop) => {
    setBusy(true);
    const { error } = await supabase.rpc("merge_contacts", { keep_id:keep, drop_id:drop });
    if (error) { setMsg("Merge failed: " + error.message); setBusy(false); return; }
    const { data } = await supabase.from("contacts").select("*").eq("id", keep).single();
    setContacts((prev) => prev.filter((c) => c.id !== drop).map((c) => (c.id === keep ? data : c)));
    setMsg(`Merged into ${fullName(data)}.`); reloadLinks(); await load(); setBusy(false);
  };
  const notSame = async (a, b) => { await supabase.from("contact_dupe_dismissed").insert({ user_id:userId, a, b }); setPairs((p) => p.filter((x) => !(x.a_id === a && x.b_id === b))); };
  const linkThem = async (a, b) => { await supabase.from("contact_links").insert({ user_id:userId, contact_id:a, linked_id:b, relation:"co-borrower" }); reloadLinks(); setPairs((p) => p.filter((x) => !(x.a_id === a && x.b_id === b))); };
  const Side = ({ c }) => !c ? null : (
    <div style={{flex:1, minWidth:0, fontFamily:F.body, fontSize:12, color:C.ink}}>
      <div onClick={() => open(c)} style={{fontFamily:F.cond, fontSize:16, fontWeight:700, color:C.blue, cursor:"pointer"}}>{fullName(c)}</div>
      <div>{TYPE_LABEL[typeOf(c)]}{c.subtype ? ` · ${c.subtype}` : ""}</div>
      <div>{c.phone || "no phone"}{c.phone_2 ? ` / ${c.phone_2}` : ""}</div>
      <div style={{wordBreak:"break-all"}}>{c.email || "no email"}</div>
      <div>{c.note_rate ? `${c.note_rate}% ` : ""}{year(c.funded_date)} {c.address || c.property_address || ""}</div>
      <div style={{color:C.light, fontSize:10}}>{c.source_file}</div>
    </div>
  );
  return (
    <div>
      <button onClick={close} style={{...ghost, marginBottom:12}}>← Back to contacts</button>
      <div style={box}>
        <div style={lbl}>Possible duplicates ({pairs ? pairs.length : "…"})</div>
        <div style={{fontFamily:F.body, fontSize:13, color:C.mid, lineHeight:1.5}}>
          For each pair: <b>Keep left</b> or <b>Keep right</b> merges them into one person (phones, emails, loans, links and notes all carry over; the other record is removed). <b>Not the same</b> hides the pair for good. <b>They're co-borrowers</b> links them instead.
        </div>
        {msg && <div style={{fontFamily:F.mono, fontSize:11, color:C.green, marginTop:8}}>{msg}</div>}
      </div>
      {(pairs || []).map((p) => (
        <div key={p.a_id + p.b_id} style={box}>
          <div style={{marginBottom:8}}><Badge color={C.amber} bg={C.amberBg}>{p.reason}</Badge></div>
          <div style={{display:"flex", gap:12}}><Side c={byId[p.a_id]}/><Side c={byId[p.b_id]}/></div>
          <div style={{display:"flex", gap:6, flexWrap:"wrap", marginTop:10}}>
            <button disabled={busy} onClick={() => merge(p.a_id, p.b_id)} style={primary}>← Keep left</button>
            <button disabled={busy} onClick={() => merge(p.b_id, p.a_id)} style={primary}>Keep right →</button>
            <button disabled={busy} onClick={() => linkThem(p.a_id, p.b_id)} style={ghost}>They're co-borrowers</button>
            <button disabled={busy} onClick={() => notSame(p.a_id, p.b_id)} style={ghost}>Not the same</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── detail ─────────────────────────────────────────────────────────────────────
function Detail({ c, contacts, setContacts, userId, profileName, back, open, links, reloadLinks, createContact }) {
  const save = async (fields) => {
    const { data, error } = await supabase.from("contacts").update(fields).eq("id", c.id).select().single();
    if (error) { alert("Save failed: " + error.message); return; }
    setContacts((prev) => prev.map((x) => (x.id === c.id ? data : x)));
  };
  const f = (k) => (v) => save({ [k]: k.startsWith("phone") ? (v ? fmtPhone(v) : null) : k.startsWith("email") ? (v ? String(v).trim().toLowerCase() : null) : v });
  const setType = (t) => save({ contact_type:t, do_not_contact:t === "rolodex" });
  const contactable = !c.do_not_contact && typeOf(c) !== "rolodex";
  const del = async () => {
    if (!window.confirm(`Delete ${fullName(c)} permanently?`)) return;
    await supabase.from("contacts").delete().eq("id", c.id); setContacts((p) => p.filter((x) => x.id !== c.id)); back();
  };
  return (
    <div>
      <button onClick={back} style={{...ghost, marginBottom:12}}>← Back</button>
      <div style={box}>
        <div style={{fontFamily:F.cond, fontSize:26, fontWeight:800, color:C.ink, lineHeight:1.1}}>{fullName(c)}</div>
        <div style={{fontFamily:F.mono, fontSize:10, color:C.mid, margin:"4px 0 10px"}}>{c.company || ""}{c.subtype ? ` · ${c.subtype}` : ""}</div>
        {c.verify_flag && (
          <div style={{background:C.amberBg, color:C.amber, fontFamily:F.mono, fontSize:10, padding:"6px 8px", borderRadius:5, marginBottom:10, display:"flex", justifyContent:"space-between", gap:8}}>
            <span>Needs review: {c.verify_flag}</span><button onClick={() => save({ verify_flag:null })} style={{...ghost, padding:"2px 6px"}}>Resolved</button>
          </div>
        )}
        <div style={lbl}>Category</div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:8}}>
          {TYPES.filter(([t]) => t !== "any").map(([t, l]) => <Chip key={t} small selected={typeOf(c) === t} onClick={() => setType(t)}>{l}</Chip>)}
        </div>
        <Field label="Sub-type (e.g. buyer agent, title, old credit app)" value={c.subtype} onSave={f("subtype")}/>
        {contactable && c.phone && (
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginTop:10}}>
            <a href={`tel:${digits(c.phone)}`} style={{...primary, textAlign:"center", textDecoration:"none", padding:"10px"}}>Call</a>
            <a href={`sms:${digits(c.phone)}?body=${encodeURIComponent(`Hi ${c.first_name || ""}, this is ${profileName || "Joshua"}. Just checking in.`)}`} style={{...primary, textAlign:"center", textDecoration:"none", padding:"10px"}}>Text</a>
            {c.email ? <a href={`mailto:${c.email}?subject=Checking in`} style={{...primary, textAlign:"center", textDecoration:"none", padding:"10px"}}>Email</a> : <span/>}
          </div>
        )}
        {!contactable && <div style={{fontFamily:F.mono, fontSize:10, color:C.light, marginTop:8}}>Rolodex: reference only, never queued or emailed.</div>}
      </div>

      <div style={box}>
        <div style={lbl}>Contact info</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", columnGap:14}}>
          <Field label="First name" value={c.first_name} onSave={f("first_name")}/>
          <Field label="Last name" value={c.last_name} onSave={f("last_name")}/>
          <Field label="Phone" value={c.phone} href={c.phone ? `tel:${digits(c.phone)}` : null} onSave={f("phone")}/>
          <Field label="Phone 2" value={c.phone_2} href={c.phone_2 ? `tel:${digits(c.phone_2)}` : null} onSave={f("phone_2")}/>
          <Field label="Email" value={c.email} href={c.email ? `mailto:${c.email}` : null} onSave={f("email")}/>
          <Field label="Email 2" value={c.email_2} href={c.email_2 ? `mailto:${c.email_2}` : null} onSave={f("email_2")}/>
          <Field label={typeOf(c) === "agent" ? "Brokerage" : "Company"} value={c.company} onSave={f("company")}/>
          {typeOf(c) === "agent" && <Field label="Agent role" value={c.agent_role} options={["", "buyer", "seller", "buyer, seller"]} onSave={f("agent_role")}/>}
          <Field label="Birthday (YYYY-MM-DD or MM-DD)" value={c.birthday} onSave={f("birthday")}/>
          <Field label="Mailing address" value={c.address} onSave={f("address")}/>
          <Field label="City" value={c.city} onSave={f("city")}/>
          <Field label="State" value={c.state} onSave={f("state")}/>
          <Field label="Zip" value={c.zip} onSave={f("zip")}/>
        </div>
        {(c.address || c.property_address) && (
          <button onClick={() => save({ tags:Array.from(new Set([...(c.tags || []), `address confirmed ${today()}`])) })} style={{...ghost, marginTop:8}}>✓ Still at this address (confirm today)</button>
        )}
      </div>

      {["past_client","lead"].includes(typeOf(c)) && <Loans contact={c} userId={userId}/>}
      <Linked contact={c} contacts={contacts} userId={userId} open={open} links={links} reloadLinks={reloadLinks} onCreate={createContact}/>

      <div style={box}>
        <div style={lbl}>Follow-up</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", columnGap:14}}>
          <Field label="Last contacted" type="date" value={c.last_contacted} onSave={f("last_contacted")}/>
          <Field label="Follow-up date" type="date" value={c.follow_up_date} onSave={f("follow_up_date")}/>
          <Field label="Last outcome" value={c.outcome} options={["", "talked", "voicemail", "no answer", "booked", "not interested", "wrong number"]} onSave={f("outcome")}/>
        </div>
        <Field label="Notes" value={c.contact_note} onSave={f("contact_note")}/>
        {contactable && <button onClick={() => save({ last_contacted:today() })} style={{...primary, width:"100%", padding:"11px", marginTop:10}}>Mark contacted today</button>}
      </div>

      <div style={box}>
        <div style={lbl}>Record</div>
        <div style={{fontFamily:F.mono, fontSize:10, color:C.mid, lineHeight:1.7}}>
          Source: {c.source_file || c.source_category || "—"}<br/>
          Tags: {(c.tags || []).join(", ") || "—"}<br/>
          Konnectd ID: {c.external_id || "—"}
        </div>
        <button onClick={del} style={{...ghost, color:C.red, marginTop:10}}>Delete contact</button>
      </div>
    </div>
  );
}

// ── main ───────────────────────────────────────────────────────────────────────
export default function ContactsTab({ userId, contacts, setContacts, profileName, onUpload, openId, onOpened }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("past_client");
  const [sub, setSub] = useState("all");
  const [brokerage, setBrokerage] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [sel, setSel] = useState(null);
  const [view, setView] = useState("list");
  const [links, setLinks] = useState([]);
  const [dupeCount, setDupeCount] = useState(null);

  const reloadLinks = useCallback(async () => {
    const all = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase.from("contact_links").select("*").range(from, from + 999);
      all.push(...(data || [])); if (!data || data.length < 1000) break;
    }
    setLinks(all);
    const { count } = await supabase.from("contact_dupe_candidates").select("*", { count:"exact", head:true });
    setDupeCount(count ?? null);
  }, []);
  useEffect(() => { reloadLinks(); }, [reloadLinks]);
  useEffect(() => { if (openId) { setSel(openId); setView("detail"); onOpened?.(); } }, [openId, onOpened]);
  useEffect(() => { setShown(PAGE); }, [q, type, sub, brokerage]);
  useEffect(() => { setSub("all"); setBrokerage(""); }, [type]);

  const byId = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);
  // names/phones/emails of linked people (co-borrowers) so searching "Vicky" finds the borrower too
  const linkedText = useMemo(() => {
    const m = {};
    for (const l of links) {
      const a = byId[l.contact_id], b = byId[l.linked_id]; if (!a || !b) continue;
      m[a.id] = (m[a.id] || "") + " " + fullName(b) + " " + (b.email || "") + " " + digits(b.phone);
      m[b.id] = (m[b.id] || "") + " " + fullName(a) + " " + (a.email || "") + " " + digits(a.phone);
    }
    return m;
  }, [links, byId]);

  const createContact = async (fields) => {
    const { data, error } = await supabase.from("contacts").insert({ user_id:userId, source_category:"manual", source_file:"manual", ...fields }).select().single();
    if (error) { alert("Could not add: " + error.message); return null; }
    setContacts((p) => [...p, data]); return data;
  };

  const counts = useMemo(() => { const m = { any:contacts.length }; for (const c of contacts) m[typeOf(c)] = (m[typeOf(c)] || 0) + 1; return m; }, [contacts]);
  const inType = useMemo(() => contacts.filter((c) => type === "any" || typeOf(c) === type), [contacts, type]);
  const brokerages = useMemo(() => {
    if (type !== "agent") return [];
    const m = {}; for (const c of inType) if (c.company) m[c.company] = (m[c.company] || 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 60);
  }, [inType, type]);

  const SUBS = {
    past_client: [["all","All"],["rate7","7%+"],["rate65","6.5–7%"],["rate6","6–6.5%"],["conv","Conventional"],["fha","FHA"],["va","VA"],["purchase","Purchase"],["refi","Refinance"],["y2022","2022"],["y2023","2023"],["y2024","2024"],["y2025","2025+"],["addr","Has address"],["noaddr","No address"],["cob","Co-borrowers"]],
    agent: [["all","All"],["closed","Closed deal together"],["active","Active partner"],["buyer","Buyer agents"],["seller","Seller agents"],["phone","Has phone"],["nophone","No phone"]],
    lead: [["all","All"], ...Array.from(new Set(inType.map((c) => c.subtype).filter(Boolean))).map((s) => ["st:" + s, s])],
    referral_partner: [["all","All"], ...Array.from(new Set(inType.map((c) => c.subtype).filter(Boolean))).map((s) => ["st:" + s, s])],
    rolodex: [["all","All"], ...Array.from(new Set(inType.map((c) => c.subtype).filter(Boolean))).map((s) => ["st:" + s, s])],
    any: [["all","All"]],
  };
  const COMMON = [["never","Never contacted"],["cold","90+ days"],["follow","Follow-up due"],["review","Needs review"]];

  const cold = (c) => !c.last_contacted || (Date.now() - new Date(c.last_contacted)) / 864e5 > 90;
  const match = (c) => {
    const r = parseFloat(c.note_rate), t = (c.tags || []);
    switch (sub) {
      case "all": return true;
      case "rate7": return r >= 7; case "rate65": return r >= 6.5 && r < 7; case "rate6": return r >= 6 && r < 6.5;
      case "conv": return c.loan_type === "Conventional"; case "fha": return c.loan_type === "FHA"; case "va": return c.loan_type === "VA";
      case "purchase": return c.loan_purpose === "purchase"; case "refi": return c.loan_purpose === "refinance";
      case "y2022": return year(c.funded_date) === "2022"; case "y2023": return year(c.funded_date) === "2023"; case "y2024": return year(c.funded_date) === "2024"; case "y2025": return year(c.funded_date) >= "2025";
      case "addr": return !!(c.address || c.property_address); case "noaddr": return !(c.address || c.property_address);
      case "cob": return c.subtype === "co-borrower";
      case "closed": return t.includes("closed deal together"); case "active": return c.subtype === "active partner";
      case "buyer": return (c.agent_role || "").includes("buyer"); case "seller": return (c.agent_role || "").includes("seller");
      case "phone": return !!c.phone; case "nophone": return !c.phone;
      case "never": return !c.last_contacted; case "cold": return cold(c);
      case "follow": return c.follow_up_date && c.follow_up_date <= today();
      case "review": return !!c.verify_flag;
      default: return sub.startsWith("st:") ? c.subtype === sub.slice(3) : true;
    }
  };
  const ql = q.trim().toLowerCase(), qd = digits(q);
  const list = useMemo(() => inType.filter((c) => {
    if (brokerage && c.company !== brokerage) return false;
    if (!match(c)) return false;
    if (!ql) return true;
    const hay = `${fullName(c)} ${c.email || ""} ${c.email_2 || ""} ${c.company || ""} ${c.co_borrower_first || ""} ${c.co_borrower_last || ""} ${c.address || ""} ${c.property_address || ""} ${linkedText[c.id] || ""}`.toLowerCase();
    if (hay.includes(ql)) return true;
    if (qd.length >= 4 && (digits(c.phone).includes(qd) || digits(c.phone_2).includes(qd) || (linkedText[c.id] || "").includes(qd))) return true;
    return ql.split(/\s+/).every((w) => hay.includes(w));
  }).sort((a, b) => (a.last_name || "~").localeCompare(b.last_name || "~") || (a.first_name || "").localeCompare(b.first_name || "")),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [inType, sub, brokerage, ql, qd, linkedText]);

  const open = (c) => { setSel(c.id); setView("detail"); window.scrollTo?.(0, 0); };
  const selC = sel ? byId[sel] : null;

  if (view === "dupes") return <Dupes contacts={contacts} setContacts={setContacts} userId={userId} close={() => { setView("list"); reloadLinks(); }} open={open} reloadLinks={reloadLinks}/>;
  if (view === "detail" && selC) return <Detail c={selC} contacts={contacts} setContacts={setContacts} userId={userId} profileName={profileName} back={() => setView("list")} open={open} links={links} reloadLinks={reloadLinks} createContact={createContact}/>;

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email, company, address, co-borrower…"
        style={{...inp, padding:"11px 14px", marginBottom:10}}/>
      <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:8}}>
        {TYPES.map(([t, l]) => <Chip key={t} selected={type === t} onClick={() => setType(t)}>{l} ({(counts[t] || 0).toLocaleString()})</Chip>)}
      </div>
      <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom:6}}>
        {(SUBS[type] || SUBS.any).map(([id, l]) => <Chip key={id} small color={C.blue} selected={sub === id} onClick={() => setSub(id)}>{l}</Chip>)}
      </div>
      <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom:8}}>
        {COMMON.map(([id, l]) => <Chip key={id} small color={C.purple} selected={sub === id} onClick={() => setSub(sub === id ? "all" : id)}>{l}</Chip>)}
        {type === "agent" && (
          <select value={brokerage} onChange={(e) => setBrokerage(e.target.value)} style={{...inp, width:"auto", padding:"5px 8px", fontSize:11}}>
            <option value="">All brokerages</option>{brokerages.map(([b, n]) => <option key={b} value={b}>{b} ({n})</option>)}
          </select>
        )}
      </div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", margin:"10px 0", gap:8, flexWrap:"wrap"}}>
        <span style={{fontFamily:F.mono, fontSize:10, color:C.mid}}>{list.length.toLocaleString()} of {contacts.length.toLocaleString()} contacts</span>
        <div style={{display:"flex", gap:6}}>
          <button onClick={() => setView("dupes")} style={{...ghost, borderColor:C.amber, color:C.amber}}>Possible duplicates{dupeCount != null ? ` (${dupeCount})` : ""}</button>
          <button onClick={async () => { const c = await createContact({ first_name:"New", last_name:"Contact", contact_type:type === "any" ? "past_client" : type }); if (c) open(c); }} style={ghost}>+ New contact</button>
          {onUpload && <button onClick={onUpload} style={ghost}>Import file</button>}
        </div>
      </div>

      {list.slice(0, shown).map((c) => {
        const t = typeOf(c);
        return (
          <div key={c.id} onClick={() => open(c)} style={{background:C.card, border:`1px solid ${C.rule}`, borderRadius:8, padding:"10px 12px", marginBottom:6, cursor:"pointer"}}>
            <div style={{display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start"}}>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:F.cond, fontSize:16, fontWeight:700, color:C.ink}}>{fullName(c)}</div>
                <div style={{fontFamily:F.body, fontSize:13, color:C.ink, marginTop:2, display:"flex", gap:12, flexWrap:"wrap"}}>
                  {c.phone ? <a href={`tel:${digits(c.phone)}`} onClick={(e) => e.stopPropagation()} style={{color:C.blue, textDecoration:"none"}}>{c.phone}</a> : <span style={{color:C.light}}>no phone</span>}
                  {c.email ? <span style={{color:C.mid, wordBreak:"break-all", userSelect:"text"}} onClick={(e) => e.stopPropagation()}>{c.email}</span> : <span style={{color:C.light}}>no email</span>}
                </div>
                <div style={{fontFamily:F.mono, fontSize:10, color:C.mid, marginTop:3}}>
                  {t === "agent" ? [c.company, c.agent_role && `${c.agent_role} agent`].filter(Boolean).join(" · ")
                    : t === "past_client" || t === "lead" ? [c.subtype, c.loan_type && `${c.loan_type}${c.loan_type_source && c.loan_type_source !== "verified" ? " (est.)" : ""}`, year(c.funded_date), c.ltv_orig && `LTV ${Math.round(c.ltv_orig)}%`, c.address || c.property_address].filter(Boolean).join(" · ")
                    : [c.subtype, c.company].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{display:"flex", gap:4, flexWrap:"wrap", justifyContent:"flex-end", flexShrink:0}}>
                {c.note_rate && <Badge color={parseFloat(c.note_rate) >= 6.5 ? C.red : C.mid} bg={parseFloat(c.note_rate) >= 6.5 ? C.redBg : C.stoneBg}>{c.note_rate}%</Badge>}
                {(c.tags || []).includes("closed deal together") && <Badge color={C.green} bg={C.greenBg}>CLOSED DEALS</Badge>}
                {c.subtype === "active partner" && <Badge color={C.purple} bg={C.purpleBg}>ACTIVE</Badge>}
                {c.verify_flag && <Badge color={C.amber} bg={C.amberBg}>REVIEW</Badge>}
                {type === "any" && <Badge>{TYPE_LABEL[t]}</Badge>}
              </div>
            </div>
          </div>
        );
      })}
      {list.length > shown && <button onClick={() => setShown((s) => s + PAGE * 2)} style={{...ghost, width:"100%", padding:"10px"}}>Load more ({(list.length - shown).toLocaleString()} more)</button>}
      {list.length === 0 && <div style={{...box, textAlign:"center", fontFamily:F.mono, fontSize:11, color:C.light}}>No contacts match.</div>}
    </div>
  );
}
