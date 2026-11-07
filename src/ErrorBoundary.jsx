// Safety net: if one section of the app throws while drawing, show a small notice for that section
// instead of a blank screen. The rest of the app keeps working.
import { Component } from "react";

const box = { background:"#fdf0e0", border:"1px solid #e0d8cc", borderRadius:10, padding:"14px 16px", margin:"12px 0", fontFamily:"'Barlow',sans-serif", color:"#1c1a17" };
const btn = { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, padding:"7px 13px", borderRadius:7, border:"1px solid #1e6e4a", background:"#1e6e4a", color:"#fff", cursor:"pointer", marginTop:10 };

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error:null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error(`[GUP] ${this.props.label || "Section"} crashed:`, error, info?.componentStack); }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={box}>
        <div style={{fontWeight:700, fontSize:16}}>Something went wrong in {this.props.label || "this section"}.</div>
        <div style={{fontSize:13, color:"#6b6358", marginTop:4}}>The rest of the app still works. Try again, or switch tabs and come back.</div>
        <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, color:"#9e3020", marginTop:6}}>{String(error?.message || error)}</div>
        <button style={btn} onClick={() => this.setState({ error:null })}>Try again</button>
      </div>
    );
  }
}
