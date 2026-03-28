import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";

/* ============================================================
   FALLBACK DATA
   ============================================================ */
const FALLBACK = {
  role: "Engineer & Developer",
  roles: ["Full Stack Developer", "IoT Engineer", "Researcher", "CAD Designer"],
  tagline: "IPE Student at BUET bridging hardware, software & research.",
  about: `I'm an Industrial & Production Engineering student at BUET with a passion for bridging hardware and software — from IoT systems to web applications.`,
  contact: {
    email: "your@email.com",
    github: "https://github.com/abdullahalmazid",
    linkedin: "https://linkedin.com/in/abdullahalmazid",
    location: "Chattogram, Bangladesh",
  },
  education: [
    {
      institution: "Bangladesh University of Engineering and Technology (BUET)",
      degree: "BSc in Industrial and Production Engineering",
      year: "2021 — Present",
      gpa: null,
      current: true,
    },
    {
      institution: "Chattogram Collegiate School",
      degree: "HSC",
      year: "2020",
      gpa: "GPA 5.00 / 5.00",
      current: false,
    },
    {
      institution: "Baitush Sharaf Adarsha Kamil Madrasah, Chattogram",
      degree: "Dakhil",
      year: "2018",
      gpa: "GPA 5.00 / 5.00",
      current: false,
    },
  ],
  researchFocus: `My research focuses on leveraging computational modeling, machine learning, and advanced simulations to improve material performance, manufacturing processes, and intelligent decision-making systems.`,
};

const PAGES = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "publications", label: "Publications" },
  { id: "personal", label: "Personal" },
  { id: "contact", label: "Contact" },
];

/* ============================================================
   STYLES
   ============================================================ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne+Mono&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{ --serif:'Cormorant Garamond',Georgia,serif; --mono:'Syne Mono',monospace; }
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--text);font-family:var(--mono);font-size:13px;line-height:1.7;overflow-x:hidden;transition:background 0.6s ease,color 0.6s ease}
  ::selection{background:var(--accent);color:#000}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--accent)}

  /* NAV */
  nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;justify-content:space-between;align-items:center;padding:18px 48px;border-bottom:1px solid transparent;transition:background 0.4s,border-color 0.4s}
  nav.scrolled{background:rgba(13,13,13,0.96);backdrop-filter:blur(12px);border-color:var(--line)}
  .nav-logo{font-family:var(--serif);font-size:18px;cursor:pointer;letter-spacing:0.05em}
  .nav-links{display:flex;gap:20px;align-items:center}
  .nav-links button{background:none;border:none;color:var(--muted);font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:color 0.2s;padding:0}
  .nav-links button:hover{color:var(--text)}
  .nav-links button.active{color:var(--accent)}
  .hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px}
  .hamburger span{display:block;width:22px;height:1px;background:var(--text);transition:all 0.3s}
  .hamburger.open span:nth-child(1){transform:translateY(6px) rotate(45deg)}
  .hamburger.open span:nth-child(2){opacity:0}
  .hamburger.open span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
  .mobile-menu{display:none;position:fixed;top:61px;left:0;right:0;bottom:0;background:var(--bg);z-index:190;flex-direction:column;align-items:center;justify-content:center;gap:28px}
  .mobile-menu.open{display:flex}
  .mobile-menu button{background:none;border:none;color:var(--text);font-family:var(--mono);font-size:16px;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;transition:color 0.2s}
  .mobile-menu button:hover,.mobile-menu button.active{color:var(--accent)}

  .page{padding-top:80px;min-height:100vh}
  .container{max-width:1080px;margin:0 auto;padding:80px 48px}
  .section-label{display:flex;align-items:center;gap:12px;margin-bottom:48px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);transition:color 0.6s ease}
  .section-label::after{content:'';flex:1;max-width:48px;height:1px;background:var(--accent);transition:background 0.6s ease}

  /* HERO */
  .hero{min-height:calc(100vh - 80px);display:flex;flex-direction:column;justify-content:center;padding:40px 48px;max-width:1080px;margin:0 auto;position:relative}
  .hero-bg-text{position:fixed;right:-10px;top:50%;transform:translateY(-50%);font-family:var(--serif);font-size:clamp(100px,16vw,220px);color:var(--text);opacity:0.015;line-height:1;pointer-events:none;user-select:none;white-space:nowrap;z-index:0}
  .hero-eyebrow{font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;display:flex;align-items:center;gap:10px;animation:fadeUp 0.6s 0.1s both}
  .hero-eyebrow::before{content:'';display:block;width:28px;height:1px;background:var(--accent)}
  .hero-name{font-family:var(--serif);font-weight:300;font-size:clamp(48px,9vw,120px);line-height:0.92;letter-spacing:-2px;margin-bottom:28px;animation:fadeUp 0.7s 0.2s both}
  .hero-name em{font-style:italic;color:var(--accent)}
  .hero-typewriter{font-size:14px;color:var(--muted);margin-bottom:36px;height:22px;animation:fadeUp 0.7s 0.35s both}
  .hero-typewriter .tw-word{color:var(--accent2)}
  .cursor{display:inline-block;width:2px;height:14px;background:var(--accent);margin-left:2px;animation:blink 1s infinite;vertical-align:middle}
  .hero-sub{max-width:480px;color:var(--muted);line-height:1.9;margin-bottom:44px;animation:fadeUp 0.7s 0.45s both}
  .hero-cta{display:flex;gap:14px;flex-wrap:wrap;animation:fadeUp 0.7s 0.55s both}
  .hero-stats{position:absolute;bottom:40px;right:0;display:flex;gap:40px;animation:fadeUp 0.7s 0.7s both}
  .hero-stat{text-align:right}
  .hero-stat-num{font-family:var(--serif);font-size:36px;color:var(--text);display:block}
  .hero-stat-lbl{font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted)}
  .hero-quick{display:flex;gap:10px;flex-wrap:wrap;margin-top:56px;padding-top:32px;border-top:1px solid var(--line);animation:fadeUp 0.7s 0.75s both}
  .hero-quick-btn{padding:7px 18px;background:none;border:1px solid var(--line);color:var(--muted);font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s}
  .hero-quick-btn:hover{border-color:var(--accent);color:var(--accent)}

  /* BUTTONS */
  .btn{padding:11px 26px;font-family:var(--mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;border:1px solid var(--accent);background:var(--accent);color:#000;transition:all 0.22s;text-decoration:none;display:inline-block}
  .btn:hover{background:transparent;color:var(--accent)}
  .btn.ghost{background:transparent;color:var(--text);border-color:var(--line)}
  .btn.ghost:hover{border-color:var(--accent);color:var(--accent)}
  .btn.sm{padding:7px 16px;font-size:10px}

  /* ABOUT */
  .about-grid{display:grid;grid-template-columns:1fr 1.6fr;gap:80px;align-items:start}
  .about-img-wrap{position:relative}
  .about-img{width:100%;aspect-ratio:3/4;object-fit:cover;filter:grayscale(100%) contrast(1.1);transition:filter 0.6s ease;display:block}
  .about-img-wrap:hover .about-img{filter:grayscale(0%) contrast(1.05)}
  .about-img-border{position:absolute;top:12px;left:12px;right:-12px;bottom:-12px;border:1px solid var(--accent);z-index:-1;pointer-events:none}
  .about-heading{font-family:var(--serif);font-size:clamp(32px,4vw,52px);font-weight:300;line-height:1.05;letter-spacing:-1px;margin-bottom:24px}
  .about-heading em{font-style:italic;color:var(--accent)}
  .about-text{color:var(--muted);line-height:1.95;margin-bottom:28px}
  .hobby-list{list-style:none;display:flex;flex-direction:column;gap:8px}
  .hobby-list li{color:var(--muted);font-size:12px;padding-left:18px;position:relative}
  .hobby-list li::before{content:'—';position:absolute;left:0;color:var(--accent)}

  /* EDUCATION */
  .edu-heading{font-family:var(--serif);font-weight:300;font-size:clamp(36px,5vw,64px);letter-spacing:-1.5px;line-height:1.0;margin-bottom:56px}
  .edu-heading em{font-style:italic;color:var(--accent)}
  .timeline{position:relative;padding-left:28px}
  .timeline::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:1px;background:var(--line)}
  .timeline-item{position:relative;margin-bottom:48px}
  .timeline-item:last-child{margin-bottom:0}
  .timeline-dot{position:absolute;left:-32px;top:8px;width:8px;height:8px;border-radius:50%;border:1px solid var(--muted);background:var(--bg);transition:all 0.3s}
  .timeline-item:hover .timeline-dot,.timeline-item.current .timeline-dot{border-color:var(--accent);background:var(--accent)}
  .tl-year{font-size:10px;letter-spacing:0.1em;color:var(--accent);text-transform:uppercase;margin-bottom:8px}
  .tl-degree{font-family:var(--serif);font-size:24px;margin-bottom:6px;line-height:1.2}
  .tl-inst{color:var(--muted);font-size:12px;margin-bottom:10px;line-height:1.6}
  .tl-gpa{display:inline-block;font-size:10px;color:var(--accent2);border:1px solid rgba(143,184,160,0.3);padding:3px 12px;letter-spacing:0.06em}

  /* SKILLS */
  .skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
  .skill-cat{padding:28px 32px;background:var(--bg2);transition:background 0.6s ease}
  .skill-cat-title{font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);margin-bottom:18px}
  .skill-tags{display:flex;flex-wrap:wrap;gap:8px}
  .skill-tag{padding:4px 12px;border:1px solid var(--line);font-size:12px;color:var(--muted);background:var(--bg);transition:all 0.2s;cursor:default}
  .skill-tag:hover{border-color:var(--accent);color:var(--text)}

  /* PROJECTS */
  .filter-bar{display:flex;gap:8px;margin-bottom:40px;flex-wrap:wrap}
  .filter-btn{padding:6px 18px;background:none;border:1px solid var(--line);color:var(--muted);font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s}
  .filter-btn:hover{border-color:var(--accent);color:var(--text)}
  .filter-btn.active{border-color:var(--accent);background:var(--accent);color:#000}
  .projects-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2px}
  .project-card{background:var(--bg2);overflow:hidden;cursor:pointer;border-left:2px solid transparent;transition:border-color 0.25s,background 0.2s;display:flex;flex-direction:column}
  .project-card:hover{border-color:var(--accent);background:var(--bg3)}
  .project-img-wrap{overflow:hidden;aspect-ratio:16/9;background:var(--bg3)}
  .project-img-wrap img{width:100%;height:100%;object-fit:cover;filter:brightness(0.8);transition:transform 0.4s,filter 0.4s;display:block}
  .project-card:hover .project-img-wrap img{transform:scale(1.04);filter:brightness(0.95)}
  .project-img-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-style:italic;font-size:52px;color:var(--line)}
  .project-body{padding:28px;flex:1;display:flex;flex-direction:column}
  .project-cat{font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
  .project-title{font-family:var(--serif);font-size:22px;margin-bottom:10px}
  .project-desc{color:var(--muted);font-size:12px;line-height:1.8;flex:1;margin-bottom:20px}
  .project-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
  .project-tag{font-size:10px;letter-spacing:0.06em;color:var(--muted);padding:2px 8px;border:1px solid var(--line)}
  .view-more{font-size:11px;color:var(--accent);letter-spacing:0.08em}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:500;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);animation:fadeIn 0.2s ease}
  .modal{background:var(--bg2);max-width:680px;width:100%;max-height:90vh;overflow-y:auto;border:1px solid var(--line);position:relative;animation:slideUp 0.3s ease}
  .modal-img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;filter:brightness(0.85)}
  .modal-body{padding:36px}
  .modal-cat{font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
  .modal-title{font-family:var(--serif);font-size:32px;margin-bottom:20px;line-height:1.1}
  .modal-detail{color:var(--muted);line-height:1.9;font-size:13px;margin-bottom:24px}
  .modal-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}
  .modal-links{display:flex;gap:10px;flex-wrap:wrap}
  .modal-close{position:absolute;top:16px;right:16px;background:none;border:1px solid var(--line);color:var(--muted);width:32px;height:32px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
  .modal-close:hover{border-color:var(--accent);color:var(--accent)}

  /* PUBLICATIONS */
  .pub-layout{display:grid;grid-template-columns:1fr 1.3fr;gap:64px}
  .research-focus{color:var(--muted);line-height:1.95;font-size:13px}
  .pub-list{display:flex;flex-direction:column;gap:2px}
  .pub-item{padding:24px 28px;background:var(--bg2);border-left:2px solid var(--line);transition:border-color 0.2s}
  .pub-item:hover{border-color:var(--accent)}
  .pub-year{font-size:10px;color:var(--accent);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px}
  .pub-title{font-family:var(--serif);font-size:18px;line-height:1.4;margin-bottom:8px}
  .pub-authors{color:var(--muted);font-size:11px;margin-bottom:6px}
  .pub-journal{color:var(--accent2);font-size:11px;letter-spacing:0.06em;margin-bottom:14px}
  .pub-doi{font-size:11px;color:var(--accent);text-decoration:none}
  .pub-doi:hover{text-decoration:underline}

  /* ── PERSONAL PAGE ── */
  /* Masonry gallery */
  .masonry{columns:3;gap:4px;column-gap:4px}
  .masonry-item{break-inside:avoid;margin-bottom:4px;position:relative;overflow:hidden;cursor:pointer;background:var(--bg3)}
  .masonry-item img{width:100%;display:block;filter:brightness(0.85);transition:all 0.4s}
  .masonry-item:hover img{filter:brightness(1.0);transform:scale(1.03)}
  .masonry-caption{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.75));padding:20px 12px 8px;font-size:10px;color:#fff;opacity:0;transition:opacity 0.3s}
  .masonry-item:hover .masonry-caption{opacity:1}

  /* Tours */
  .tours-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2px}
  .tour-card{background:var(--bg2);overflow:hidden;border-left:2px solid transparent;transition:border-color 0.2s}
  .tour-card:hover{border-color:var(--accent)}
  .tour-img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;filter:brightness(0.8);transition:all 0.4s}
  .tour-card:hover .tour-img{filter:brightness(0.95)}
  .tour-img-ph{width:100%;aspect-ratio:16/9;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:32px}
  .tour-body{padding:22px}
  .tour-loc{font-size:10px;color:var(--accent2);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px}
  .tour-title{font-family:var(--serif);font-size:20px;margin-bottom:6px}
  .tour-date{font-size:10px;color:var(--muted);margin-bottom:10px}
  .tour-desc{color:var(--muted);font-size:12px;line-height:1.8}

  /* Hobbies */
  .hobbies-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
  .hobby-card{background:var(--bg2);padding:24px;border-left:2px solid transparent;transition:border-color 0.2s}
  .hobby-card:hover{border-color:var(--accent)}
  .hobby-emoji{font-size:28px;margin-bottom:12px}
  .hobby-title{font-family:var(--serif);font-size:18px;margin-bottom:6px}
  .hobby-desc{color:var(--muted);font-size:11px;line-height:1.7}

  /* Books/Movies */
  .fav-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px}
  .fav-card{background:var(--bg2);padding:20px;border-left:2px solid transparent;transition:border-color 0.2s}
  .fav-card:hover{border-color:var(--accent)}
  .fav-emoji{font-size:22px;margin-bottom:10px}
  .fav-title{font-family:var(--serif);font-size:16px;margin-bottom:4px;line-height:1.3}
  .fav-desc{color:var(--muted);font-size:10px;line-height:1.6}

  /* Lightbox */
  .lightbox{position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:600;display:flex;align-items:center;justify-content:center;padding:24px;cursor:zoom-out}
  .lightbox img{max-width:100%;max-height:90vh;object-fit:contain;display:block;cursor:default}
  .lightbox-caption{position:absolute;bottom:24px;left:0;right:0;text-align:center;color:rgba(255,255,255,0.6);font-size:12px}
  .lightbox-close{position:fixed;top:20px;right:24px;background:none;border:1px solid rgba(255,255,255,0.2);color:#fff;width:36px;height:36px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}

  /* CONTACT */
  .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px}
  .contact-heading{font-family:var(--serif);font-weight:300;font-size:clamp(36px,5vw,60px);line-height:1.0;letter-spacing:-1.5px;margin-bottom:20px}
  .contact-heading em{font-style:italic;color:var(--accent)}
  .contact-sub{color:var(--muted);margin-bottom:36px;line-height:1.9}
  .contact-rows{display:flex;flex-direction:column}
  .contact-row{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid var(--line);text-decoration:none;color:var(--text);transition:color 0.2s}
  .contact-row:hover{color:var(--accent)}
  .contact-row span{font-size:10px;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase}
  .avail-card{padding:36px;background:var(--bg2);border-left:2px solid var(--accent)}
  .avail-title{font-family:var(--serif);font-size:20px;margin-bottom:20px}
  .avail-item{padding:10px 0;border-bottom:1px solid var(--line);color:var(--muted);font-size:12px;display:flex;gap:10px;align-items:center}
  .avail-check{color:var(--accent2);font-size:10px}

  footer{border-top:1px solid var(--line);padding:28px 48px;display:flex;justify-content:space-between;align-items:center}
  footer p{font-size:11px;color:var(--muted)}

  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
  .fade-in{animation:fadeUp 0.6s 0.05s ease both}
  .fade-in-1{animation:fadeUp 0.6s 0.15s ease both}
  .fade-in-2{animation:fadeUp 0.6s 0.25s ease both}
  .page-enter{animation:fadeUp 0.4s ease both}

  @media(max-width:900px){
    nav{padding:16px 24px}
    .nav-links{display:none}
    .hamburger{display:flex}
    .hero{padding:20px 24px 80px}
    .container{padding:60px 24px}
    .hero-stats,.hero-quick{display:none}
    .about-grid,.pub-layout,.contact-grid{grid-template-columns:1fr;gap:40px}
    .skills-grid,.projects-grid,.tours-grid,.hobbies-grid{grid-template-columns:1fr}
    .fav-grid{grid-template-columns:repeat(2,1fr)}
    .masonry{columns:2}
    footer{flex-direction:column;gap:8px;text-align:center;padding:20px 24px}
  }
  @media(max-width:480px){
    .masonry{columns:1}
    .fav-grid{grid-template-columns:1fr}
  }
`;

/* ============================================================
   HOOKS
   ============================================================ */
function useTypewriter(words, speed = 80, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIdx];
    let t;
    if (!deleting && charIdx < word.length)
      t = setTimeout(() => setCharIdx((c) => c + 1), speed);
    else if (!deleting && charIdx === word.length)
      t = setTimeout(() => setDeleting(true), pause);
    else if (deleting && charIdx > 0)
      t = setTimeout(() => setCharIdx((c) => c - 1), speed / 2);
    else {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % words.length);
    }
    setDisplay(word.slice(0, charIdx));
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);
  return display;
}

/* ============================================================
   PAGES
   ============================================================ */

/* HOME */
function HomePage({ navigate, data, projects, publications }) {
  const typed = useTypewriter(FALLBACK.roles);
  return (
    <div className="page page-enter">
      <div className="hero-bg-text">Mazid</div>
      <div className="hero">
        <div className="hero-eyebrow">{data.role || FALLBACK.role}</div>
        <h1 className="hero-name">
          Abdullah
          <br />
          Al <em>Mazid</em>
        </h1>
        <div className="hero-typewriter">
          <span className="tw-word">{typed}</span>
          <span className="cursor" />
        </div>
        <p className="hero-sub">{data.tagline || FALLBACK.tagline}</p>
        <div className="hero-cta">
          <button className="btn" onClick={() => navigate("projects")}>
            View Projects
          </button>
          <button className="btn ghost" onClick={() => navigate("contact")}>
            Get In Touch
          </button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-num">{publications.length || 1}</span>
            <span className="hero-stat-lbl">Publications</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">{projects.length || "4"}+</span>
            <span className="hero-stat-lbl">Projects</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">5.0</span>
            <span className="hero-stat-lbl">GPA (HSC)</span>
          </div>
        </div>
        <div className="hero-quick">
          {PAGES.filter((p) => p.id !== "home").map((p) => (
            <button
              key={p.id}
              className="hero-quick-btn"
              onClick={() => navigate(p.id)}
            >
              {p.label} →
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ABOUT */
function AboutPage({ data, skills }) {
  return (
    <div className="page page-enter">
      <div className="container">
        <div className="section-label">About Me</div>
        <div className="about-grid">
          <div className="fade-in">
            <div className="about-img-wrap">
              <img
                className="about-img"
                src="https://abdullahalmazid.github.io/github_profile_pic.jpg"
                alt="Abdullah Al Mazid"
              />
              <div className="about-img-border" />
            </div>
            <p
              style={{
                marginTop: 14,
                fontSize: 11,
                color: "var(--muted)",
                fontStyle: "italic",
              }}
            >
              ↑ Hover to reveal color
            </p>
          </div>
          <div className="fade-in-1">
            <h2 className="about-heading">
              Engineering
              <br />
              meets <em>code.</em>
            </h2>
            <p className="about-text">{data.about || FALLBACK.about}</p>
          </div>
        </div>
        {skills.length > 0 && (
          <div style={{ marginTop: 80 }}>
            <div className="section-label">Skills</div>
            <div className="skills-grid">
              {skills.map(({ id, category, items }) => (
                <div className="skill-cat" key={id}>
                  <div className="skill-cat-title">{category}</div>
                  <div className="skill-tags">
                    {(items || []).map((s) => (
                      <span className="skill-tag" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* EDUCATION */
function EducationPage() {
  return (
    <div className="page page-enter">
      <div className="container">
        <div className="section-label">Education</div>
        <h1 className="edu-heading">
          Academic
          <br />
          <em>Background</em>
        </h1>
        <div className="timeline fade-in">
          {FALLBACK.education.map((e, i) => (
            <div
              className={`timeline-item ${e.current ? "current" : ""}`}
              key={i}
            >
              <div className="timeline-dot" />
              <div className="tl-year">{e.year}</div>
              <div className="tl-degree">{e.degree}</div>
              <div className="tl-inst">{e.institution}</div>
              {e.gpa && <span className="tl-gpa">{e.gpa}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* PROJECTS */
function ProjectsPage({ projects }) {
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const usedCats = [
    "All",
    ...new Set(projects.map((p) => p.category).filter(Boolean)),
  ];
  const filtered =
    filter === "All" ? projects : projects.filter((p) => p.category === filter);
  return (
    <div className="page page-enter">
      <div className="container">
        <div className="section-label">Work</div>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(36px,5vw,64px)",
            fontWeight: 300,
            letterSpacing: "-1.5px",
            marginBottom: 40,
          }}
        >
          Selected{" "}
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>
            Projects
          </em>
        </h1>
        <div className="filter-bar">
          {usedCats.map((c) => (
            <button
              key={c}
              className={`filter-btn ${filter === c ? "active" : ""}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div
            style={{ color: "var(--muted)", padding: "48px 0", fontSize: 12 }}
          >
            No projects found.
          </div>
        ) : (
          <div className="projects-grid">
            {filtered.map((p) => (
              <div
                className="project-card"
                key={p.id}
                onClick={() => setModal(p)}
              >
                <div className="project-img-wrap">
                  {p.image ? (
                    <img src={p.image} alt={p.title} />
                  ) : (
                    <div className="project-img-ph">{p.num || "◈"}</div>
                  )}
                </div>
                <div className="project-body">
                  <div className="project-cat">{p.category}</div>
                  <h3 className="project-title">{p.title}</h3>
                  <p className="project-desc">{p.short}</p>
                  <div className="project-tags">
                    {(p.tags || []).map((t) => (
                      <span className="project-tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="view-more">View Details →</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {modal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) setModal(null);
          }}
        >
          <div className="modal">
            <button className="modal-close" onClick={() => setModal(null)}>
              ✕
            </button>
            {modal.image && (
              <img className="modal-img" src={modal.image} alt={modal.title} />
            )}
            <div className="modal-body">
              <div className="modal-cat">{modal.category}</div>
              <h2 className="modal-title">{modal.title}</h2>
              <p className="modal-detail">{modal.detail}</p>
              <div className="modal-tags">
                {(modal.tags || []).map((t) => (
                  <span className="project-tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              {(modal.links || []).length > 0 && (
                <div className="modal-links">
                  {modal.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url || l}
                      target="_blank"
                      rel="noreferrer"
                      className="btn sm ghost"
                    >
                      {l.label || "Link"} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* PUBLICATIONS */
function PublicationsPage({ publications }) {
  return (
    <div className="page page-enter">
      <div className="container">
        <div className="section-label">Publications</div>
        <div className="pub-layout">
          <div className="fade-in">
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontSize: "clamp(28px,3.5vw,44px)",
                fontWeight: 300,
                letterSpacing: "-1px",
                marginBottom: 24,
              }}
            >
              Research{" "}
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>
                Focus
              </em>
            </h2>
            <p className="research-focus">{FALLBACK.researchFocus}</p>
          </div>
          <div className="fade-in-1">
            <div className="section-label" style={{ marginBottom: 20 }}>
              Selected Publications
            </div>
            <div className="pub-list">
              {publications.length === 0 ? (
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 12,
                    padding: "24px 0",
                  }}
                >
                  No publications yet.
                </div>
              ) : (
                publications.map((p) => (
                  <div className="pub-item" key={p.id}>
                    <div className="pub-year">{p.year}</div>
                    <div className="pub-title">{p.title}</div>
                    <div className="pub-authors">{p.authors}</div>
                    <div className="pub-journal">{p.journal}</div>
                    {p.doi && (
                      <a
                        href={p.doi}
                        target="_blank"
                        rel="noreferrer"
                        className="pub-doi"
                      >
                        DOI ↗
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PERSONAL PAGE ── */
function PersonalPage({ gallery, tours, hobbies }) {
  const [lightbox, setLightbox] = useState(null);

  const hobbyList = hobbies.filter((h) => h.type === "hobby");
  const bookList = hobbies.filter((h) => h.type === "book");
  const movieList = hobbies.filter((h) => h.type === "movie");

  return (
    <div className="page page-enter">
      <div className="container">
        {/* ── PHOTO GALLERY ── */}
        <div className="section-label">Photo Gallery</div>
        {gallery.length === 0 ? (
          <div
            style={{ color: "var(--muted)", fontSize: 12, marginBottom: 80 }}
          >
            No photos yet.
          </div>
        ) : (
          <>
            <div className="masonry fade-in">
              {gallery.map((p) => (
                <div
                  className="masonry-item"
                  key={p.id}
                  onClick={() => setLightbox(p)}
                >
                  <img src={p.url} alt={p.caption || ""} loading="lazy" />
                  {p.caption && (
                    <div className="masonry-caption">{p.caption}</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 80 }} />
          </>
        )}

        {/* ── TOURS ── */}
        <div className="section-label">My Tours</div>
        {tours.length === 0 ? (
          <div
            style={{ color: "var(--muted)", fontSize: 12, marginBottom: 80 }}
          >
            No tour memories yet.
          </div>
        ) : (
          <>
            <div className="tours-grid fade-in-1">
              {tours.map((t) => (
                <div className="tour-card" key={t.id}>
                  {t.image ? (
                    <img src={t.image} alt={t.title} className="tour-img" />
                  ) : (
                    <div className="tour-img-ph">✈️</div>
                  )}
                  <div className="tour-body">
                    <div className="tour-loc">{t.location}</div>
                    <div className="tour-title">{t.title}</div>
                    <div className="tour-date">{t.date}</div>
                    {t.description && (
                      <div className="tour-desc">{t.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 80 }} />
          </>
        )}

        {/* ── HOBBIES ── */}
        {hobbyList.length > 0 && (
          <>
            <div className="section-label">Hobbies</div>
            <div className="hobbies-grid fade-in">
              {hobbyList.map((h) => (
                <div className="hobby-card" key={h.id}>
                  {h.emoji && <div className="hobby-emoji">{h.emoji}</div>}
                  <div className="hobby-title">{h.title}</div>
                  {h.description && (
                    <div className="hobby-desc">{h.description}</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 80 }} />
          </>
        )}

        {/* ── FAVOURITE BOOKS ── */}
        {bookList.length > 0 && (
          <>
            <div className="section-label">Favourite Books</div>
            <div className="fav-grid fade-in">
              {bookList.map((b) => (
                <div className="fav-card" key={b.id}>
                  {b.emoji && <div className="fav-emoji">{b.emoji}</div>}
                  <div className="fav-title">{b.title}</div>
                  {b.description && (
                    <div className="fav-desc">{b.description}</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 80 }} />
          </>
        )}

        {/* ── FAVOURITE MOVIES ── */}
        {movieList.length > 0 && (
          <>
            <div className="section-label">Favourite Movies</div>
            <div className="fav-grid fade-in">
              {movieList.map((m) => (
                <div className="fav-card" key={m.id}>
                  {m.emoji && <div className="fav-emoji">{m.emoji}</div>}
                  <div className="fav-title">{m.title}</div>
                  {m.description && (
                    <div className="fav-desc">{m.description}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {gallery.length === 0 &&
          tours.length === 0 &&
          hobbyList.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                color: "var(--muted)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌟</div>
              <div style={{ fontSize: 14, fontFamily: "var(--serif)" }}>
                Nothing here yet.
              </div>
              <div style={{ fontSize: 11, marginTop: 8 }}>
                Add content from the admin dashboard.
              </div>
            </div>
          )}
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>
            ✕
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.caption || ""}
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.caption && (
            <div className="lightbox-caption">{lightbox.caption}</div>
          )}
        </div>
      )}
    </div>
  );
}

/* CONTACT */
function ContactPage({ data }) {
  const c = {
    email: data.email || FALLBACK.contact.email,
    github: data.github || FALLBACK.contact.github,
    linkedin: data.linkedin || FALLBACK.contact.linkedin,
    location: data.location || FALLBACK.contact.location,
  };
  return (
    <div className="page page-enter">
      <div className="container">
        <div className="section-label">Contact</div>
        <div className="contact-grid">
          <div className="fade-in">
            <h2 className="contact-heading">
              Let's work
              <br />
              <em>together.</em>
            </h2>
            <p className="contact-sub">
              Open to research collaborations, internships, and exciting
              engineering or development projects.
            </p>
            <div className="contact-rows">
              <a className="contact-row" href={`mailto:${c.email}`}>
                {c.email}
                <span>Email</span>
              </a>
              <a
                className="contact-row"
                href={c.github}
                target="_blank"
                rel="noreferrer"
              >
                {c.github.replace("https://", "")}
                <span>GitHub</span>
              </a>
              <a
                className="contact-row"
                href={c.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                {c.linkedin.replace("https://", "")}
                <span>LinkedIn</span>
              </a>
              <div className="contact-row" style={{ cursor: "default" }}>
                {c.location}
                <span>Location</span>
              </div>
            </div>
          </div>
          <div className="fade-in-1">
            <div className="avail-card">
              <div className="avail-title">Currently available for</div>
              {[
                "Research Collaborations",
                "Internship Opportunities",
                "Freelance Projects",
                "Open Source Contributions",
              ].map((item) => (
                <div className="avail-item" key={item}>
                  <span className="avail-check">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN SHELL
   ============================================================ */
export default function Portfolio() {
  const [page, setPage] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [publications, setPublications] = useState([]);
  const [skills, setSkills] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [tours, setTours] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [aboutData, setAboutData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const snaps = await Promise.all([
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "publications")),
          getDocs(collection(db, "skills")),
          getDocs(collection(db, "gallery")),
          getDocs(collection(db, "tours")),
          getDocs(collection(db, "hobbies")),
          getDocs(collection(db, "about")),
        ]);
        setProjects(snaps[0].docs.map((d) => ({ id: d.id, ...d.data() })));
        setPublications(snaps[1].docs.map((d) => ({ id: d.id, ...d.data() })));
        setSkills(snaps[2].docs.map((d) => ({ id: d.id, ...d.data() })));
        setGallery(
          snaps[3].docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
        );
        setTours(
          snaps[4].docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
        );
        setHobbies(snaps[5].docs.map((d) => ({ id: d.id, ...d.data() })));
        if (!snaps[6].empty) setAboutData(snaps[6].docs[0].data());
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navigate = (p) => {
    setPage(p);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{css}</style>
      <nav className={scrolled ? "scrolled" : ""}>
        <div className="nav-logo" onClick={() => navigate("home")}>
          AAM
        </div>
        <div className="nav-links">
          {PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(p.id)}
              className={page === p.id ? "active" : ""}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {PAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(p.id)}
            className={page === p.id ? "active" : ""}
          >
            {p.label}
          </button>
        ))}
      </div>

      {page === "home" && (
        <HomePage
          navigate={navigate}
          data={aboutData}
          projects={projects}
          publications={publications}
        />
      )}
      {page === "about" && <AboutPage data={aboutData} skills={skills} />}
      {page === "education" && <EducationPage />}
      {page === "projects" && <ProjectsPage projects={projects} />}
      {page === "publications" && (
        <PublicationsPage publications={publications} />
      )}
      {page === "personal" && (
        <PersonalPage gallery={gallery} tours={tours} hobbies={hobbies} />
      )}
      {page === "contact" && <ContactPage data={aboutData} />}

      <footer>
        <p>© 2025 Abdullah Al Mazid. All Rights Reserved.</p>
        <p
          style={{
            color: "var(--accent)",
            fontSize: 10,
            letterSpacing: "0.08em",
          }}
        >
          BUET · IPE
        </p>
      </footer>
    </>
  );
}
