// /a/<slug>: an agent's own buyer lander. The buyer flow is the same qualifying flow as /save, with the agent's name up front.
// The lead goes to Joshua's Contacts and is pushed to the agent right away (see supabase/agent_pages_v1.sql).
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import SaveMyInfo from "./SaveMyInfo.jsx";

export default function AgentPage() {
  const slug = (location.pathname.match(/\/a\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get("a") || "";
  const [agent, setAgent] = useState(undefined);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data } = await supabase.rpc("get_agent_page", { p_slug: slug });
        if (live) setAgent((data && data[0]) || null);
      } catch { if (live) setAgent(null); }
    })();
    return () => { live = false; };
  }, [slug]);
  if (agent === undefined) return <div style={{ minHeight:"100vh", background:"#E4EDF5" }}/>;
  // Unknown or switched-off page: show Joshua's own buyer flow so no visitor hits a dead end.
  return <SaveMyInfo agent={agent} lockWho="buyer"/>;
}
