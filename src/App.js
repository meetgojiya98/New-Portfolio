import React, { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from "emailjs-com";

const navItems = [
  { label: "Home", id: "hero" },
  { label: "About Me", id: "about" },
  { label: "Skills", id: "skills" },
  { label: "Projects", id: "projects" },
  { label: "Contact", id: "contact" },
];

// Define your theme colors
const themeColors = {
  saffron: {
    primary: "#f59e0b",
    primaryDark: "#d97706",
    primaryLight: "#fbbf24",
    particlesColor1: "#fbbf24",
    particlesColor2: "#d97706",
  },
  blue: {
    primary: "#3b82f6",
    primaryDark: "#2563eb",
    primaryLight: "#60a5fa",
    particlesColor1: "#60a5fa",
    particlesColor2: "#2563eb",
  },
  violet: {
    primary: "#8b5cf6",
    primaryDark: "#7c3aed",
    primaryLight: "#a78bfa",
    particlesColor1: "#a78bfa",
    particlesColor2: "#7c3aed",
  },
};

// Ripple effect helper for buttons
function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
  circle.classList.add("ripple");
  const ripple = button.getElementsByClassName("ripple")[0];
  if (ripple) ripple.remove();
  button.appendChild(circle);
}

// Fade in section component using IntersectionObserver
function FadeInSection({ children }) {
  const ref = useRef();
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-700 ease-in-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </div>
  );
}

// 2D Particle Network Background Canvas
function ParticleNetwork({ theme }) {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const colors = themeColors[theme] || themeColors.saffron;
    const color1 = colors.particlesColor1;
    const color2 = colors.particlesColor2;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.phase = Math.random() * 2 * Math.PI; // for pulsing effect
      }
      draw() {
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius * 5
        );
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.shadowColor = color2;
        ctx.shadowBlur = 10;
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += 0.05;
        this.radius = 1.5 + Math.sin(this.phase) * 1.2;

        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;
      }
    }

    // Create particles
    const particlesCount = Math.floor((width * height) / 15000);
    const particles = [];
    for (let i = 0; i < particlesCount; i++) {
      particles.push(new Particle());
    }

    // Track mouse
    const mouse = { x: null, y: null, radius: 100 };
    function onMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function onMouseLeave() {
      mouse.x = null;
      mouse.y = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseLeave);

    // Draw connections with smooth curves
    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 150, 255, ${1 - dist / 150})`;
            ctx.lineWidth = 1;
            // Bezier control points for elegant curved lines
            const cx = (particles[i].x + particles[j].x) / 2 + Math.sin(dist * 0.05) * 20;
            const cy = (particles[i].y + particles[j].y) / 2 + Math.cos(dist * 0.05) * 20;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.quadraticCurveTo(cx, cy, particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Mouse repulsion effect
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const angle = Math.atan2(dy, dx);
            const repulseFactor = (mouse.radius - dist) / mouse.radius;
            p.vx += Math.cos(angle) * repulseFactor * 0.3;
            p.vy += Math.sin(angle) * repulseFactor * 0.3;
          }
        }

        p.update();
        p.draw();
      });

      connectParticles();

      animationFrameId.current = requestAnimationFrame(animate);
    }

    animate();

    function handleResize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseLeave);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1,
        pointerEvents: "none",
        userSelect: "none",
        opacity: 0.75,
        backgroundColor: "transparent",
      }}
    />
  );
}

// 3D Mouse cursor glow effect
function Cursor3DGlow() {
  const cursorRef = useRef(null);

  useEffect(() => {
    function moveCursor(e) {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top = e.clientY + "px";
      }
    }
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        pointerEvents: "none",
        width: "40px",
        height: "40px",
        marginLeft: "-20px",
        marginTop: "-20px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle at center, rgba(59,130,246,0.35), transparent 60%)",
        filter: "blur(8px)",
        transition: "transform 0.15s ease",
        zIndex: 9999,
      }}
    />
  );
}

// Replace these with your EmailJS credentials
const EMAILJS_SERVICE_ID = "service_i6dqi68";
const EMAILJS_TEMPLATE_ID = "template_mrty8sn";
const EMAILJS_USER_ID = "bqXMM_OmpPWcc1AMi";

export default function App() {
  const validThemes = ["saffron", "blue", "violet"];

  // Default theme: blue if no saved value
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return validThemes.includes(saved) ? saved : "blue";
  });

  // DARK MODE ENABLED BY DEFAULT if no saved value
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === null ? true : saved === "true";
  });

  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [contactStatus, setContactStatus] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    const html = document.documentElement;
    if (darkMode) html.classList.add("dark");
    else html.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 30);

      // Determine active section
      const sections = navItems.map(({ id }) => document.getElementById(id));
      let current = "hero";
      const scrollTop = window.scrollY;
      sections.forEach((section) => {
        if (section) {
          const offsetTop = section.offsetTop - 120;
          if (scrollTop >= offsetTop) current = section.id;
        }
      });
      setActiveSection(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const sendEmail = (e) => {
    e.preventDefault();
    setContactStatus(null);

    emailjs
      .sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current,
        EMAILJS_USER_ID
      )
      .then(() => {
        setContactStatus("SUCCESS");
        formRef.current.reset();
      })
      .catch(() => setContactStatus("FAILED"));
  };

  const projects = [
    {
      title: "Stock Market Copilot",
      description:
        "End-to-end React and FastAPI app that delivers stock data, news, and AI insights for smarter investment decisions.",
      link: "https://github.com/meetgojiya98/Stock-Market-Copilot",
      live: "https://stock-market-copilot.vercel.app/",
    },
    {
      title: "Stock Sentiment Dashboard",
      description:
        "The app provides a real-time dashboard displaying stock market sentiment, trending stocks, latest news, and Reddit posts to help users track market mood and insights.",
      link: "https://github.com/meetgojiya98/Stock-Sentiment-Dashboard",
      live: "https://meetgojiya98.github.io/stock-sentiment-frontend/",
    },
    {
      title: "StockVision",
      description:
        "StockVision is a responsive web app that predicts future stock prices using real market data. It features interactive charts, multiple ticker support, dark mode, and lets users save favorite stocks for easy access.",
      link: "https://github.com/meetgojiya98/StockVision",
      live: "https://stock-vision-five.vercel.app/",
    },
  ];

  const skills = [
    "JavaScript (ES6+)",
    "React.js & Next.js",
    "Node.js & Express",
    "MongoDB & SQL",
    "Python & FastAPI",
    "HTML5 & CSS3",
    "Git & CI/CD",
    "Pandas & NumPy",
    "REST APIs",
    "Postman & Jira",
    "TypeScript",
    "Java",
    "AWS",
    "OpenAI & AI Integration",
    "Selenium",
  ];

  const [currentProject, setCurrentProject] = useState(0);
  const projectTimeout = useRef();

  useEffect(() => {
    projectTimeout.current = setTimeout(() => {
      setCurrentProject((prev) => (prev + 1) % projects.length);
    }, 6000);
    return () => clearTimeout(projectTimeout.current);
  }, [currentProject]);

  // Cycle theme colors on button press
  const cycleTheme = () => {
    const currentIndex = validThemes.indexOf(theme);
    setTheme(validThemes[(currentIndex + 1) % validThemes.length]);
  };

  const colors = themeColors[theme] || themeColors.saffron;

  return (
    <>
      {/* Background particle network */}
      <ParticleNetwork theme={theme} />

      {/* 3D Mouse cursor glow */}
      <Cursor3DGlow />

      <div
        className={`relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-700 font-sans`}
        style={{ paddingBottom: "90px" }}
      >
        {/* Navbar */}
        <nav
          className={`fixed top-0 w-full z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 transition-shadow ${
            scrolled ? "shadow-lg" : ""
          }`}
        >
          <div className="container mx-auto flex justify-between items-center px-6 py-3">
            <div
              role="button"
              tabIndex={0}
              aria-label="Go to top"
              onClick={() => scrollTo("hero")}
              onKeyDown={(e) => e.key === "Enter" && scrollTo("hero")}
              className="text-2xl font-bold cursor-pointer select-none"
            >
              Meet Gojiya
            </div>
            <ul className="hidden md:flex space-x-10 font-medium text-lg">
              {navItems.map(({ label, id }) => (
                <li
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`cursor-pointer hover:text-[${colors.primary}] transition ${
                    activeSection === id
                      ? `text-[${colors.primary}] font-semibold`
                      : ""
                  }`}
                  style={{ color: activeSection === id ? colors.primary : undefined }}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => e.key === "Enter" && scrollTo(id)}
                >
                  {label}
                </li>
              ))}
            </ul>
            <div className="flex items-center space-x-4">
              <button
                aria-label="Toggle Dark Mode"
                onClick={(e) => {
                  createRipple(e);
                  setDarkMode(!darkMode);
                }}
                className={`relative overflow-hidden p-2 rounded-full text-white transition`}
                style={{ backgroundColor: colors.primary }}
              >
                {darkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 3v1m0 16v1m8.66-11.66l-.707.707M5.05 18.95l-.707.707m15.192 2.121l-.707-.707M5.05 5.05l-.707-.707M21 12h-1M4 12H3" />
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={2} />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    stroke="none"
                  >
                    <path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 1 0-18z" />
                  </svg>
                )}
              </button>
              <button
                aria-label="Cycle Color Theme"
                onClick={(e) => {
                  createRipple(e);
                  cycleTheme();
                }}
                className="relative overflow-hidden p-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                title="Cycle Color Theme"
              >
                🎨
              </button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6 pt-24 space-y-48 max-w-6xl scroll-smooth">
          {/* Hero */}
          <FadeInSection>
            <section
              id="hero"
              className="min-h-screen flex flex-col justify-center items-center text-center space-y-8 relative z-10"
            >
              <motion.h1
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.2 }}
                className="text-6xl font-extrabold tracking-tight"
                style={{ color: colors.primary }}
              >
                Meet Gojiya
              </motion.h1>
              <motion.p
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="max-w-xl text-lg md:text-xl"
              >
                Full-stack Developer & AI Enthusiast — Building beautiful, scalable web
                experiences.
              </motion.p>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo("projects")}
                className="px-8 py-3 text-white rounded-lg shadow-lg transition z-10 relative overflow-hidden"
                style={{ backgroundColor: colors.primary }}
                onMouseDown={createRipple}
              >
                See My Work
              </motion.button>
            </section>
          </FadeInSection>

          {/* About Me Section */}
          <FadeInSection>
            <section
              id="about"
              className="max-w-4xl mx-auto px-4 space-y-8 text-center relative z-10"
            >
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-4xl font-bold"
                style={{ color: colors.primary }}
              >
                About Me
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg max-w-3xl mx-auto leading-relaxed text-justify"
              >
                <p>
                  Meet Gojiya is a Solution Analyst on the Product Engineering and
                  Development team, within the Engineering, AI, and Data offering at
                  Deloitte Canada. Meet has the ability to link business with technology
                  to extract insights from complex data and build data-driven solutions.
                </p>
                <br />
                <p>
                  Meet is a graduate of the University of New Brunswick, where he earned
                  a Master of Computer Science degree. He also holds a Bachelor’s degree
                  in Computer Engineering from Gujarat Technological University. Meet is
                  driven by technology innovation, advanced analytics, adaptability,
                  collaboration, and creativity, ultimately furthering his career as well
                  as those around him. He possesses a strong entrepreneurial spirit, which
                  fuels his passion for creating impactful solutions and driving positive
                  change within the industry and the world.
                </p>
                <br />
                <p>
                  An avid learner and active listener, Meet thrives on absorbing knowledge
                  from as many people as possible, recognizing that every interaction is
                  an opportunity to gain new insights and perspectives. His extremely
                  curious personality propels him to explore new ideas, question existing
                  paradigms, and continuously seek out opportunities for learning and
                  growth.
                </p>
              </motion.p>
            </section>
          </FadeInSection>

          {/* Skills */}
          <FadeInSection>
            <section
              id="skills"
              className="max-w-4xl mx-auto px-4 space-y-8 text-center relative z-10"
            >
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-4xl font-bold"
                style={{ color: colors.primary }}
              >
                Skills
              </motion.h2>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex flex-wrap justify-center gap-4"
              >
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-5 py-2 rounded-full text-white font-semibold shadow-lg cursor-default select-none transition transform hover:scale-110 hover:shadow-2xl"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {skill}
                  </span>
                ))}
              </motion.div>
            </section>
          </FadeInSection>

          {/* Projects Carousel */}
          <FadeInSection>
            <section
              id="projects"
              className="max-w-5xl mx-auto px-4 space-y-8 text-center relative z-10"
            >
              <motion.h2
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="text-4xl font-bold"
                style={{ color: colors.primary }}
              >
                Projects
              </motion.h2>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={projects[currentProject].title}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.8 }}
                  className="block mx-auto max-w-3xl p-8 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg cursor-default select-none relative overflow-hidden"
                  onMouseDown={createRipple}
                  style={{
                    border: `1px solid ${colors.primaryLight}`,
                    boxShadow: `0 0 15px ${colors.primaryLight}`,
                  }}
                >
                  <h3
                    className="text-2xl font-semibold mb-4"
                    style={{ color: colors.primary }}
                  >
                    {projects[currentProject].title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                    {projects[currentProject].description}
                  </p>

                  <div className="flex justify-center gap-6">
                    <a
                      href={projects[currentProject].live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-semibold"
                      style={{ color: colors.primary }}
                    >
                      Live Demo
                    </a>
                    <a
                      href={projects[currentProject].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-semibold"
                      style={{ color: colors.primary }}
                    >
                      GitHub
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-4 mt-4">
                {projects.map((_, idx) => (
                  <button
                    key={idx}
                    aria-label={`Go to project ${idx + 1}`}
                    className={`w-4 h-4 rounded-full ${
                      idx === currentProject ? `bg-[${colors.primary}]` : "bg-gray-400"
                    } transition`}
                    onClick={() => setCurrentProject(idx)}
                    style={{
                      backgroundColor: idx === currentProject ? colors.primary : undefined,
                    }}
                  />
                ))}
              </div>
            </section>
          </FadeInSection>

          {/* Contact */}
          <FadeInSection>
            <section
              id="contact"
              className="max-w-xl mx-auto px-4 text-center space-y-6 relative z-10"
              style={{ paddingBottom: "120px" }}
            >
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-4xl font-bold"
                style={{ color: colors.primary }}
              >
                Contact Me
              </motion.h2>

              <form ref={formRef} onSubmit={sendEmail} className="space-y-6 text-left">
                <input
                  type="text"
                  name="user_name"
                  placeholder="Your Name"
                  required
                  className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition"
                  style={{ borderColor: colors.primary }}
                />
                <input
                  type="email"
                  name="user_email"
                  placeholder="Your Email"
                  required
                  className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition"
                  style={{ borderColor: colors.primary }}
                />
                <textarea
                  name="message"
                  placeholder="Your Message"
                  rows={6}
                  required
                  className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition resize-none"
                  style={{ borderColor: colors.primary }}
                />
                <button
                  type="submit"
                  className="w-full py-3 text-white rounded-lg transition relative overflow-hidden"
                  style={{ backgroundColor: colors.primary }}
                  onMouseDown={createRipple}
                >
                  Send Message
                </button>
              </form>

              {contactStatus === "SUCCESS" && (
                <p className="mt-4 text-green-500 font-semibold">
                  Message sent successfully!
                </p>
              )}
              {contactStatus === "FAILED" && (
                <p className="mt-4 text-red-500 font-semibold">
                  Oops! Something went wrong. Please try again.
                </p>
              )}
            </section>
          </FadeInSection>
        </main>

        {/* Tailbar Footer */}
        <footer className="fixed bottom-0 left-0 w-full bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex justify-between items-center px-6 py-2 text-sm text-gray-700 dark:text-gray-300 select-none z-40">
          <div>© {new Date().getFullYear()} Meet Gojiya. All rights reserved.</div>
          <div className="flex space-x-6">
            <a
              href="https://github.com/meetgojiya98"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:text-current transition"
              style={{ color: colors.primary }}
            >
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.373 0 12a12 12 0 008.207 11.385c.6.11.82-.26.82-.577v-2.022c-3.338.725-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.09-.744.083-.729.083-.729 1.205.086 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.996.108-.775.42-1.305.763-1.605-2.665-.3-5.466-1.333-5.466-5.933 0-1.312.467-2.38 1.235-3.22-.123-.303-.535-1.522.117-3.176 0 0 1.008-.323 3.3 1.23a11.5 11.5 0 016.003 0c2.29-1.553 3.296-1.23 3.296-1.23.654 1.654.243 2.873.12 3.176.77.84 1.232 1.91 1.232 3.22 0 4.61-2.807 5.63-5.48 5.922.43.37.815 1.102.815 2.222v3.293c0 .32.22.694.825.576A12 12 0 0024 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/meet-gojiya/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-current transition"
              style={{ color: colors.primary }}
            >
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.028-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.942v5.664H9.354V9h3.415v1.561h.047c.476-.9 1.637-1.848 3.372-1.848 3.604 0 4.27 2.372 4.27 5.455v6.284zM5.337 7.433c-1.145 0-2.073-.928-2.073-2.073 0-1.146.928-2.073 2.073-2.073s2.073.927 2.073 2.073c0 1.145-.928 2.073-2.073 2.073zm1.777 13.019H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.224.792 24 1.771 24h20.451c.98 0 1.778-.776 1.778-1.729V1.729C24 .774 23.205 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </footer>

        {/* Floating Resume Download Button */}
        <a
          href="https://drive.google.com/file/d/1d8C33RiAOEV_1q_QDPrWC0uk-i8J4kqO/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-6 z-50 text-white px-5 py-3 rounded-full shadow-lg transition flex items-center space-x-2 select-none relative overflow-hidden"
          title="Download Resume"
          download
          style={{ backgroundColor: colors.primary }}
          onMouseDown={createRipple}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.primaryDark)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M12 4v8"
            />
          </svg>
          <span>Resume</span>
        </a>
      </div>

      {/* Ripple effect styles */}
      <style>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 600ms linear;
          background-color: rgba(255, 255, 255, 0.7);
          pointer-events: none;
          z-index: 9999;
        }
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
