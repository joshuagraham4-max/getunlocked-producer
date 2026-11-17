// The intro video on the Save my info page. Paste a link between the quotes and the page shows it; leave it empty and the page hides the video.
// Works with YouTube, Vimeo and Loom share links, or a direct .mp4 link.
export const SAVE_VIDEO = "";
export const SAVE_VIDEO_TITLE = "A quick hello from Joshua";

export function embedFor(url) {
  const u = String(url || "").trim(); if (!u) return null;
  let m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/); if (m) return { kind:"iframe", src:`https://www.youtube.com/embed/${m[1]}?rel=0` };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/); if (m) return { kind:"iframe", src:`https://player.vimeo.com/video/${m[1]}` };
  m = u.match(/loom\.com\/(?:share|embed)\/([\w]+)/); if (m) return { kind:"iframe", src:`https://www.loom.com/embed/${m[1]}` };
  if (/\.(mp4|webm|mov)(\?|$)/i.test(u)) return { kind:"video", src:u };
  return null;
}
