// ─── FOCUS MODE — standalone floating panel ───────────────────────────────
// Drop this component into App.jsx with:
//   import FocusMode from './FocusMode';
//   <FocusMode onLog={handleFocusLog} />
// To remove: delete the import and the <FocusMode> tag. Nothing else changes.
//
// Props:
//   onLog(sessionData) — called when a task is marked complete
//   sessionData = { name, estimateMins, actualMins, date }

import { useState, useEffect, useRef, useCallback } from "react";

const FC = {
  bg:"#f5f0e8", card:"#faf7f2", ink:"#1c1a17", mid:"#6b6358",
  light:"#a89e92", rule:"#e0d8cc",
  green:"#1e6e4a", greenBg:"#e8f4ee", greenBd:"#b8dece",
  amber:"#b05e0d", amberBg:"#fdf0e0", amberBd:"#ecd4a8",
  red:"#9e3020", redBg:"#fbeae7", redBd:"#ecc4bc",
  purple:"#5b3fa6", purpleBg:"#eeebf8", purpleBd:"#c8c0ec",
};
const FF = {
  mono:"'DM Mono',monospace",
  cond:"'Barlow Condensed',sans-serif",
  body:"'Barlow',sans-serif",
};

function fmt(secs) {
  const neg = secs < 0;
  const abs = Math.abs(secs);
  const m = Math.floor(abs / 60), s = abs % 60;
  return `${neg ? "-" : ""}${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function fmtMins(secs) {
  const m = Math.round(Math.abs(secs) / 60);
  return m < 1 ? "<1 min" : `${m} min`;
}

// Soft bell using Web Audio API
function playBell(loud = false) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(loud ? 0.3 : 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (loud ? 1.2 : 0.9));
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + (loud ? 1.2 : 0.9));
  } catch(e) {}
}

export default function FocusMode({ onLog }) {
  const [open, setOpen] = useState(false);
  const [mini, setMini] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [activeIdx, setActiveIdx] = useState(null);
  const [secsLeft, setSecsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [overtime, setOvertime] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEst, setNewEst] = useState("");
  const [adding, setAdding] = useState(false);
  const [pos, setPos] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const tickRef = useRef(null);
  const bellCountRef = useRef(0);
  const panelRef = useRef(null);

  // Init position bottom-right
  useEffect(() => {
    if (pos.x === null) {
      setPos({
        x: window.innerWidth - 340,
        y: window.innerHeight - 480,
      });
    }
  }, [open]);

  // Timer tick
  useEffect(() => {
    if (!running) { clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => {
      setSecsLeft(prev => {
        const next = prev - 1;
        // Bell every 5 minutes (300 seconds elapsed)
        const task = tasks[activeIdx];
        if (task) {
          const elapsed = task.estimateSecs - next;
          if (elapsed > 0 && elapsed % 300 === 0) {
            playBell(false);
          }
        }
        // End bell
        if (next === 0) {
          playBell(true);
          setOvertime(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, activeIdx, tasks]);

  // Drag handlers
  function onMouseDown(e) {
    if (e.target.closest("button") || e.target.closest("input")) return;
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    e.preventDefault();
  }
  useEffect(() => {
    if (!dragging) return;
    function onMove(e) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 320, clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, clientY - dragOffset.current.y)),
      });
    }
    function onUp() { setDragging(false); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  function addTask() {
    const name = newName.trim();
    const est = parseInt(newEst);
    if (!name || !est || est < 1) return;
    const task = { name, estimateMins: est, estimateSecs: est * 60, done: false, actualSecs: null };
    setTasks(prev => [...prev, task]);
    setNewName(""); setNewEst(""); setAdding(false);
    // Auto-start if nothing running
    setActiveIdx(prev => {
      if (prev === null) {
        setSecsLeft(task.estimateSecs);
        setRunning(true);
        setOvertime(false);
        return tasks.length;
      }
      return prev;
    });
  }

  function startTask(idx) {
    if (running) { clearInterval(tickRef.current); }
    setActiveIdx(idx);
    setSecsLeft(tasks[idx].estimateSecs);
    setRunning(true);
    setOvertime(false);
  }

  function completeTask() {
    if (activeIdx === null) return;
    const task = tasks[activeIdx];
    const actualSecs = task.estimateSecs - secsLeft;
    const actualMins = Math.max(1, Math.round(Math.abs(actualSecs) / 60));
    setRunning(false);
    setTasks(prev => prev.map((t, i) =>
      i === activeIdx ? { ...t, done: true, actualSecs: Math.abs(task.estimateSecs - secsLeft) } : t
    ));
    // Log completion
    if (onLog) {
      onLog({
        name: task.name,
        estimateMins: task.estimateMins,
        actualMins,
        date: new Date().toISOString().slice(0, 10),
      });
    }
    // Auto-advance to next undone task
    const nextIdx = tasks.findIndex((t, i) => i > activeIdx && !t.done);
    if (nextIdx !== -1) {
      setActiveIdx(nextIdx);
      setSecsLeft(tasks[nextIdx].estimateSecs);
      setRunning(true);
      setOvertime(false);
    } else {
      setActiveIdx(null);
      setSecsLeft(0);
      setOvertime(false);
    }
  }

  function extendTask(mins) {
    setSecsLeft(prev => prev + mins * 60);
    setOvertime(false);
    setRunning(true);
  }

  function pauseResume() {
    setRunning(r => !r);
  }

  function clearAll() {
    setTasks([]); setActiveIdx(null); setSecsLeft(0);
    setRunning(false); setOvertime(false);
  }

  const activeTask = activeIdx !== null ? tasks[activeIdx] : null;
  const pct = activeTask
    ? Math.max(0, Math.min(100, (secsLeft / activeTask.estimateSecs) * 100))
    : 0;

  const panelW = 300;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position:"fixed", bottom:24, right:24, zIndex:1000,
          width:52, height:52, borderRadius:"50%",
          background:FC.green, border:"none",
          boxShadow:"0 4px 16px rgba(30,110,74,0.35)",
          cursor:"pointer", display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:22,
          transition:"transform 0.15s",
        }}
        title="Focus Mode"
      >
        FOCUS
      </button>
    );
  }

  if (mini) {
    return (
      <div
        ref={panelRef}
        onMouseDown={onMouseDown}
        style={{
          position:"fixed", left:pos.x, top:pos.y, zIndex:1000,
          background:FC.ink, borderRadius:10,
          boxShadow:"0 4px 20px rgba(0,0,0,0.25)",
          padding:"8px 14px",
          display:"flex", alignItems:"center", gap:10,
          cursor:dragging?"grabbing":"grab",
          userSelect:"none",
        }}
      >
        <div style={{
          fontFamily:FF.mono, fontSize:20, fontWeight:500,
          color: overtime ? FC.amber : secsLeft <= 60 ? FC.red : FC.green,
          minWidth:70, letterSpacing:"0.05em",
        }}>
          {running || overtime ? fmt(secsLeft) : "PAUSED"}
        </div>
        {activeTask && (
          <div style={{fontFamily:FF.cond,fontSize:11,color:"#888",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"0.04em",textTransform:"uppercase"}}>
            {activeTask.name}
          </div>
        )}
        <button onClick={pauseResume} style={{background:"transparent",border:"none",color:"#888",fontSize:14,cursor:"pointer",padding:"0 2px"}}>
          {running ? "II" : ">"}
        </button>
        <button onClick={()=>setMini(false)} style={{background:"transparent",border:"none",color:"#888",fontSize:12,cursor:"pointer",padding:"0 2px"}}>
          ^
        </button>
        <button onClick={()=>{setOpen(false);setRunning(false);}} style={{background:"transparent",border:"none",color:"#666",fontSize:14,cursor:"pointer",padding:"0 2px"}}>
          x
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      onMouseDown={onMouseDown}
      style={{
        position:"fixed", left:pos.x, top:pos.y, zIndex:1000,
        width:panelW,
        background:FC.card,
        border:`1px solid ${FC.rule}`,
        borderRadius:12,
        boxShadow:"0 8px 32px rgba(0,0,0,0.18)",
        fontFamily:FF.body,
        cursor:dragging?"grabbing":"default",
        userSelect:"none",
        overflow:"hidden",
      }}
    >
      {/* Header — drag handle */}
      <div
        style={{
          background:FC.ink, padding:"10px 14px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          cursor:"grab",
        }}
      >
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>FOCUS</span>
          <div>
            <div style={{fontFamily:FF.cond,fontSize:13,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",color:"#fff"}}>Focus Mode</div>
            {tasks.length > 0 && (
              <div style={{fontFamily:FF.mono,fontSize:9,color:"#666",marginTop:1}}>
                {tasks.filter(t=>t.done).length}/{tasks.length} done
              </div>
            )}
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setMini(true)} style={{background:"transparent",border:"none",color:"#888",fontSize:14,cursor:"pointer",padding:"2px 4px"}} title="Minimize">−</button>
          <button onClick={()=>{setOpen(false);setRunning(false);}} style={{background:"transparent",border:"none",color:"#888",fontSize:14,cursor:"pointer",padding:"2px 4px"}} title="Close">x</button>
        </div>
      </div>

      {/* Active timer */}
      {activeTask && (
        <div style={{padding:"14px 14px 10px",borderBottom:`1px solid ${FC.rule}`}}>
          <div style={{fontFamily:FF.cond,fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:FC.mid,marginBottom:4}}>
            Now Focusing
          </div>
          <div style={{fontFamily:FF.cond,fontSize:14,fontWeight:700,color:FC.ink,marginBottom:10,lineHeight:1.3}}>
            {activeTask.name}
          </div>

          {/* Progress bar */}
          <div style={{height:5,borderRadius:3,background:FC.rule,marginBottom:10,overflow:"hidden"}}>
            <div style={{
              height:"100%", borderRadius:3,
              background: overtime ? FC.amber : secsLeft <= 60 ? FC.red : FC.green,
              width:`${overtime ? 100 : pct}%`,
              transition:"width 1s linear",
            }}/>
          </div>

          {/* Timer */}
          <div style={{
            fontFamily:FF.mono, fontSize:36, fontWeight:500, textAlign:"center",
            color: overtime ? FC.amber : secsLeft <= 60 ? FC.red : FC.ink,
            letterSpacing:"0.05em", marginBottom:6,
          }}>
            {fmt(secsLeft)}
          </div>
          {overtime && (
            <div style={{fontFamily:FF.mono,fontSize:9,color:FC.amber,textAlign:"center",marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>
              Over by {fmtMins(secsLeft)}
            </div>
          )}

          {/* Controls */}
          <div style={{display:"flex",gap:6,marginBottom:overtime?8:0}}>
            <button onClick={pauseResume} style={{flex:1,padding:"8px 0",borderRadius:6,border:`1px solid ${FC.rule}`,background:FC.bg,color:FC.mid,fontFamily:FF.cond,fontSize:12,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>
              {running ? "Pause" : "Resume"}
            </button>
            <button onClick={completeTask} style={{flex:2,padding:"8px 0",borderRadius:6,border:"none",background:FC.green,color:"#fff",fontFamily:FF.cond,fontSize:12,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>
              Done done
            </button>
          </div>
          {overtime && (
            <div style={{display:"flex",gap:5}}>
              {[15,30,45].map(m=>(
                <button key={m} onClick={()=>extendTask(m)} style={{flex:1,padding:"6px 0",borderRadius:5,border:`1px solid ${FC.amberBd}`,background:FC.amberBg,color:FC.amber,fontFamily:FF.mono,fontSize:9,cursor:"pointer"}}>
                  +{m}m
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!activeTask && tasks.length === 0 && !adding && (
        <div style={{padding:"20px 14px",textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:8}}>FOCUS</div>
          <div style={{fontFamily:FF.cond,fontSize:14,fontWeight:700,color:FC.ink,marginBottom:4}}>Ready to focus?</div>
          <div style={{fontFamily:FF.mono,fontSize:9,color:FC.light,marginBottom:14,lineHeight:1.6}}>Add your first task to start the timer</div>
        </div>
      )}

      {/* Task list */}
      {tasks.length > 0 && (
        <div style={{maxHeight:180,overflowY:"auto",padding:"10px 14px 0"}}>
          {tasks.map((t, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"7px 10px", borderRadius:6, marginBottom:5,
              background: i === activeIdx ? FC.greenBg : FC.bg,
              border:`1px solid ${i === activeIdx ? FC.greenBd : FC.rule}`,
              cursor: !t.done && i !== activeIdx ? "pointer" : "default",
              opacity: t.done ? 0.6 : 1,
            }}
              onClick={()=>{ if(!t.done && i!==activeIdx) startTask(i); }}
            >
              <div style={{
                fontFamily:FF.body, fontSize:12,
                color: i === activeIdx ? FC.green : FC.ink,
                textDecoration: t.done ? "line-through" : "none",
                flex:1, lineHeight:1.3,
              }}>
                {t.name}
              </div>
              <div style={{fontFamily:FF.mono,fontSize:9,color:FC.light,whiteSpace:"nowrap"}}>
                {t.done
                  ? `done ${fmtMins(-(t.actualSecs||0))}`
                  : i === activeIdx
                    ? fmt(secsLeft)
                    : `${t.estimateMins}m`
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add task */}
      <div style={{padding:"10px 14px 14px"}}>
        {adding ? (
          <div>
            <input
              autoFocus
              placeholder="Task name (e.g. Johnson file)"
              value={newName}
              onChange={e=>setNewName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") document.getElementById("fm-est")?.focus(); }}
              style={{width:"100%",padding:"8px 10px",borderRadius:6,border:`1px solid ${FC.rule}`,background:FC.bg,fontFamily:FF.body,fontSize:12,color:FC.ink,outline:"none",marginBottom:6,boxSizing:"border-box"}}
            />
            <div style={{display:"flex",gap:6}}>
              <div style={{position:"relative",flex:1}}>
                <input
                  id="fm-est"
                  type="number"
                  placeholder="Est. mins"
                  value={newEst}
                  min={1}
                  onChange={e=>setNewEst(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter") addTask(); }}
                  style={{width:"100%",padding:"8px 10px",borderRadius:6,border:`1px solid ${FC.rule}`,background:FC.bg,fontFamily:FF.mono,fontSize:12,color:FC.ink,outline:"none",boxSizing:"border-box"}}
                />
              </div>
              <button onClick={addTask} style={{padding:"8px 14px",borderRadius:6,border:"none",background:FC.green,color:"#fff",fontFamily:FF.cond,fontSize:12,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>
                Add
              </button>
              <button onClick={()=>{setAdding(false);setNewName("");setNewEst("");}} style={{padding:"8px 10px",borderRadius:6,border:`1px solid ${FC.rule}`,background:FC.bg,color:FC.mid,fontFamily:FF.mono,fontSize:11,cursor:"pointer"}}>
                x
              </button>
            </div>
          </div>
        ) : (
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setAdding(true)} style={{flex:1,padding:"9px 0",borderRadius:6,border:`1.5px dashed ${FC.rule}`,background:"transparent",color:FC.mid,fontFamily:FF.cond,fontSize:12,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>
              + Add Task
            </button>
            {tasks.length > 0 && (
              <button onClick={clearAll} style={{padding:"9px 10px",borderRadius:6,border:`1px solid ${FC.rule}`,background:FC.bg,color:FC.light,fontFamily:FF.mono,fontSize:9,cursor:"pointer"}}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
