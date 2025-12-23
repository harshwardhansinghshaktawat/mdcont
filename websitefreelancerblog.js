/* global marked */

class MarkdownBlogViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State management
    this.state = {
      markdownContent: '',
      author: '',
      authorAvatar: '',
      authorBio: '',
      isLoading: true
    };

    this.initializeUI();
  }

  // CMS Integration - Observed attributes
  static get observedAttributes() {
    return ['cms-markdown-content', 'cms-author', 'cms-author-avatar', 'cms-author-bio'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;

    if (name === 'cms-markdown-content') {
      this.state.markdownContent = newValue;
      this.updateContent();
    } else if (name === 'cms-author') {
      this.state.author = newValue;
      this.updateAuthorSection();
    } else if (name === 'cms-author-avatar') {
      this.state.authorAvatar = newValue;
      this.updateAuthorSection();
    } else if (name === 'cms-author-bio') {
      this.state.authorBio = newValue;
      this.updateAuthorSection();
    }
  }

  // Initialize the UI components with dark theme design
  initializeUI() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: #1E1E1E;
          color: #ffffff;
        }

        * {
          box-sizing: border-box;
        }

        .blog-post-wrapper {
          background-color: #1E1E1E;
          min-height: 100vh;
          padding: 20px;
        }

        #blog-content-wrapper {
          width: 100%;
        }

        .blog-post-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
          position: relative;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          flex-direction: column;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #2a2a2a;
          border-top: 4px solid #64FFDA;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          color: #64FFDA;
          font-size: 16px;
        }

        /* Table of Contents - Sticky Sidebar */
        .toc-sidebar {
          position: sticky;
          top: 20px;
          height: fit-content;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: linear-gradient(135deg, #252525 0%, #1a1a1a 100%);
          border: 2px solid #64FFDA;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(100, 255, 218, 0.1);
        }

        .toc-sidebar::-webkit-scrollbar {
          width: 8px;
        }

        .toc-sidebar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }

        .toc-sidebar::-webkit-scrollbar-thumb {
          background: #64FFDA;
          border-radius: 4px;
        }

        .toc-sidebar::-webkit-scrollbar-thumb:hover {
          background: #52d4b8;
        }

        .toc-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(100, 255, 218, 0.3);
        }

        .toc-icon {
          font-size: 24px;
          filter: drop-shadow(0 0 8px rgba(100, 255, 218, 0.6));
        }

        .toc-title {
          font-size: 18px;
          font-weight: 700;
          color: #64FFDA;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .toc-list li {
          margin-bottom: 4px;
        }

        .toc-list a {
          color: #b8b8b8;
          text-decoration: none;
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 14px;
          line-height: 1.4;
          position: relative;
          overflow: hidden;
        }

        .toc-list a::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 3px;
          background: #64FFDA;
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }

        .toc-list a:hover {
          color: #64FFDA;
          background: rgba(100, 255, 218, 0.1);
          padding-left: 16px;
        }

        .toc-list a:hover::before {
          transform: scaleY(1);
        }

        .toc-list a.active {
          color: #64FFDA;
          background: rgba(100, 255, 218, 0.15);
          font-weight: 600;
        }

        .toc-list a.active::before {
          transform: scaleY(1);
        }

        .toc-chapter {
          color: #64FFDA;
          font-weight: 700;
          font-size: 12px;
          min-width: 45px;
          font-family: 'Courier New', monospace;
        }

        .toc-text {
          flex: 1;
        }

        /* Indentation for nested chapters */
        .toc-list .toc-level-2 {
          padding-left: 24px;
        }

        .toc-list .toc-level-3 {
          padding-left: 40px;
        }

        .toc-list .toc-level-4 {
          padding-left: 56px;
        }

        .toc-list .toc-level-5,
        .toc-list .toc-level-6 {
          padding-left: 72px;
        }

        /* Main Content Area */
        .content-area {
          min-width: 0;
        }

        /* Author Section */
        .author-section {
          background: linear-gradient(135deg, #252525 0%, #1a1a1a 100%);
          border: 2px solid rgba(100, 255, 218, 0.3);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
          display: flex;
          gap: 24px;
          align-items: start;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .author-avatar-container {
          flex-shrink: 0;
        }

        .author-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #64FFDA;
          box-shadow: 0 4px 16px rgba(100, 255, 218, 0.3);
        }

        .author-avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #64FFDA 0%, #52d4b8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
          color: #1E1E1E;
          border: 3px solid #64FFDA;
          box-shadow: 0 4px 16px rgba(100, 255, 218, 0.3);
        }

        .author-info {
          flex: 1;
        }

        .author-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #64FFDA;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .author-name {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .author-bio {
          font-size: 15px;
          line-height: 1.6;
          color: #b8b8b8;
        }

        /* Blog Content */
        .blog-content {
          font-size: 17px;
          line-height: 1.8;
          color: #ffffff;
        }

        /* Markdown Styling - Dark Theme */
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          font-weight: 700;
          line-height: 1.3;
          margin-top: 48px;
          margin-bottom: 20px;
          color: #64FFDA;
          letter-spacing: -0.02em;
          scroll-margin-top: 20px;
        }

        .blog-content h1 {
          font-size: clamp(36px, 5vw, 48px);
          margin-top: 60px;
          text-shadow: 0 0 20px rgba(100, 255, 218, 0.3);
        }

        .blog-content h2 {
          font-size: clamp(30px, 4vw, 38px);
          margin-top: 52px;
        }

        .blog-content h3 {
          font-size: clamp(24px, 3.5vw, 30px);
        }

        .blog-content h4 {
          font-size: clamp(20px, 3vw, 24px);
        }

        .blog-content h5 {
          font-size: clamp(18px, 2.5vw, 20px);
        }

        .blog-content h6 {
          font-size: clamp(16px, 2vw, 18px);
        }

        .blog-content p {
          margin-bottom: 24px;
          font-size: 17px;
          line-height: 1.8;
          color: #ffffff;
        }

        .blog-content a {
          color: #FFFF05;
          text-decoration: none;
          border-bottom: 2px solid rgba(255, 255, 5, 0.3);
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .blog-content a:hover {
          border-bottom-color: #FFFF05;
          text-shadow: 0 0 8px rgba(255, 255, 5, 0.4);
        }

        .blog-content strong,
        .blog-content b {
          font-weight: 700;
          color: #64FFDA;
        }

        .blog-content em,
        .blog-content i {
          font-style: italic;
          color: #e0e0e0;
        }

        .blog-content ul,
        .blog-content ol {
          margin-bottom: 24px;
          padding-left: 30px;
        }

        .blog-content li {
          margin-bottom: 12px;
          line-height: 1.8;
          color: #ffffff;
        }

        .blog-content ul li {
          list-style-type: none;
          position: relative;
        }

        .blog-content ul li::before {
          content: '▹';
          position: absolute;
          left: -20px;
          color: #64FFDA;
          font-weight: 700;
        }

        .blog-content ol li {
          list-style-type: decimal;
          color: #64FFDA;
        }

        .blog-content ol li::marker {
          color: #64FFDA;
          font-weight: 700;
        }

        .blog-content blockquote {
          margin: 30px 0;
          padding: 20px 30px;
          border-left: 4px solid #FFFF05;
          background: linear-gradient(90deg, rgba(255, 255, 5, 0.1) 0%, transparent 100%);
          font-style: italic;
          color: #FFFF05;
          border-radius: 0 8px 8px 0;
          box-shadow: 0 4px 16px rgba(255, 255, 5, 0.1);
        }

        .blog-content blockquote p {
          margin-bottom: 0;
          color: #FFFF05;
        }

        .blog-content code {
          background-color: #2a2a2a;
          padding: 4px 10px;
          border-radius: 6px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #64FFDA;
          border: 1px solid rgba(100, 255, 218, 0.2);
        }

        .blog-content pre {
          background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
          color: #ffffff;
          padding: 24px;
          border-radius: 12px;
          overflow-x: auto;
          margin: 30px 0;
          border: 2px solid rgba(100, 255, 218, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: #ffffff;
          font-size: 14px;
          border: none;
        }

        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 30px 0;
          border: 2px solid rgba(100, 255, 218, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .blog-content hr {
          border: none;
          border-top: 2px solid rgba(100, 255, 218, 0.3);
          margin: 48px 0;
        }

        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border: 2px solid rgba(100, 255, 218, 0.3);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .blog-content table th,
        .blog-content table td {
          padding: 16px 20px;
          text-align: left;
          border-bottom: 1px solid rgba(100, 255, 218, 0.2);
        }

        .blog-content table th {
          background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
          font-weight: 700;
          color: #64FFDA;
          text-transform: uppercase;
          font-size: 14px;
          letter-spacing: 1px;
        }

        .blog-content table td {
          color: #ffffff;
        }

        .blog-content table tr:last-child td {
          border-bottom: none;
        }

        .blog-content table tr:hover {
          background: rgba(100, 255, 218, 0.05);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .blog-post-container {
            grid-template-columns: 1fr;
          }

          .toc-sidebar {
            position: static;
            max-height: none;
            margin-bottom: 32px;
          }
        }

        @media (max-width: 768px) {
          .blog-post-wrapper {
            padding: 16px;
          }

          .author-section {
            flex-direction: column;
            text-align: center;
            align-items: center;
            padding: 24px;
          }

          .author-info {
            text-align: center;
          }

          .blog-content {
            font-size: 16px;
          }

          .blog-content h1,
          .blog-content h2,
          .blog-content h3 {
            margin-top: 32px;
          }

          .toc-sidebar {
            padding: 20px;
          }

          .blog-content blockquote {
            padding: 16px 20px;
            margin: 20px 0;
          }

          .blog-content pre {
            padding: 16px;
            font-size: 13px;
          }

          .blog-content ul,
          .blog-content ol {
            padding-left: 20px;
          }
        }

        @media (max-width: 480px) {
          .blog-post-wrapper {
            padding: 12px;
          }

          .blog-content {
            font-size: 15px;
          }

          .toc-sidebar {
            padding: 16px;
          }

          .toc-title {
            font-size: 16px;
          }

          .author-section {
            padding: 20px;
          }

          .author-avatar,
          .author-avatar-placeholder {
            width: 64px;
            height: 64px;
            font-size: 28px;
          }

          .author-name {
            font-size: 20px;
          }

          .blog-content table {
            font-size: 13px;
          }

          .blog-content table th,
          .blog-content table td {
            padding: 10px 12px;
          }
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .toc-sidebar,
        .author-section,
        .blog-content {
          animation: fadeInUp 0.6s ease-out both;
        }

        .author-section {
          animation-delay: 0.1s;
        }

        .blog-content {
          animation-delay: 0.2s;
        }

        /* Print Styles */
        @media print {
          .blog-post-wrapper {
            background: white;
            color: black;
          }

          .toc-sidebar {
            display: none;
          }

          .blog-post-container {
            grid-template-columns: 1fr;
          }

          .blog-content h1,
          .blog-content h2,
          .blog-content h3,
          .blog-content h4,
          .blog-content h5,
          .blog-content h6 {
            color: black;
          }

          .blog-content a {
            color: blue;
            border-bottom: 1px solid blue;
          }
        }
      </style>

      <div class="blog-post-wrapper">
        <div class="loading-state" id="loading-state">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading blog post...</p>
        </div>

        <div id="blog-content-wrapper" style="display: none;">
          <div class="blog-post-container">
            <aside class="toc-sidebar" id="toc-sidebar" style="display: none;">
              <div class="toc-header">
                <span class="toc-icon">📚</span>
                <h2 class="toc-title">Contents</h2>
              </div>
              <nav id="table-of-contents"></nav>
            </aside>

            <div class="content-area" id="content-area">
              <div class="author-section" id="author-section" style="display: none;">
                <div class="author-avatar-container" id="author-avatar-container"></div>
                <div class="author-info">
                  <div class="author-label">Written by</div>
                  <h3 class="author-name" id="author-name"></h3>
                  <p class="author-bio" id="author-bio"></p>
                </div>
              </div>

              <article class="blog-content" id="blog-content"></article>
            </div>
          </div>
        </div>
      </div>
    `;

    // Get DOM references
    this.loadingState = this.shadowRoot.getElementById('loading-state');
    this.contentWrapper = this.shadowRoot.getElementById('blog-content-wrapper');
    this.tocSidebar = this.shadowRoot.getElementById('toc-sidebar');
    this.contentArea = this.shadowRoot.getElementById('content-area');
    this.tocElement = this.shadowRoot.getElementById('table-of-contents');
    this.contentElement = this.shadowRoot.getElementById('blog-content');
    this.authorSection = this.shadowRoot.getElementById('author-section');
    this.authorAvatarContainer = this.shadowRoot.getElementById('author-avatar-container');
    this.authorName = this.shadowRoot.getElementById('author-name');
    this.authorBio = this.shadowRoot.getElementById('author-bio');
  }

  // Generate Table of Contents with automatic chapter numbering
  generateTableOfContents(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      return null; // No headings, no TOC
    }
    
    // Chapter numbering system
    const chapterNumbers = [0, 0, 0, 0, 0, 0]; // h1, h2, h3, h4, h5, h6
    const tocItems = [];
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent;
      const id = `heading-${index}`;
      
      // Update chapter numbers
      chapterNumbers[level - 1]++;
      // Reset deeper levels
      for (let i = level; i < 6; i++) {
        chapterNumbers[i] = 0;
      }
      
      // Generate chapter number string (e.g., "1.2.3")
      let chapterNumber = '';
      for (let i = 0; i < level; i++) {
        if (chapterNumbers[i] > 0) {
          chapterNumber += chapterNumbers[i] + '.';
        }
      }
      chapterNumber = chapterNumber.slice(0, -1); // Remove trailing dot
      
      heading.id = id;
      
      tocItems.push({
        level: level,
        text: text,
        id: id,
        chapter: chapterNumber
      });
    });
    
    const updatedContent = tempDiv.innerHTML;
    
    // Build TOC HTML with chapter numbers
    let tocHtml = '<ul class="toc-list">';
    
    tocItems.forEach(item => {
      tocHtml += `
        <li class="toc-level-${item.level}">
          <a href="#${item.id}" data-target="${item.id}">
            <span class="toc-chapter">${item.chapter}</span>
            <span class="toc-text">${item.text}</span>
          </a>
        </li>
      `;
    });
    
    tocHtml += '</ul>';
    
    return {
      toc: tocHtml,
      content: updatedContent
    };
  }

  // Update author section
  updateAuthorSection() {
    if (!this.authorSection) return;

    const hasAuthor = this.state.author || this.state.authorBio;
    
    if (!hasAuthor) {
      this.authorSection.style.display = 'none';
      return;
    }

    // Show author section
    this.authorSection.style.display = 'flex';

    // Update avatar
    this.authorAvatarContainer.innerHTML = '';
    if (this.state.authorAvatar) {
      const img = document.createElement('img');
      img.src = this.state.authorAvatar;
      img.alt = this.state.author || 'Author';
      img.className = 'author-avatar';
      this.authorAvatarContainer.appendChild(img);
    } else if (this.state.author) {
      // Create placeholder with first letter
      const placeholder = document.createElement('div');
      placeholder.className = 'author-avatar-placeholder';
      placeholder.textContent = this.state.author.charAt(0).toUpperCase();
      this.authorAvatarContainer.appendChild(placeholder);
    }

    // Update name
    if (this.authorName) {
      this.authorName.textContent = this.state.author || 'Anonymous';
    }

    // Update bio
    if (this.authorBio) {
      this.authorBio.textContent = this.state.authorBio || '';
      this.authorBio.style.display = this.state.authorBio ? 'block' : 'none';
    }
  }

  // Update content with Markdown rendering and automatic TOC
  updateContent() {
    if (this.contentElement && this.tocElement) {
      // Use marked.js from CDN for Markdown parsing
      if (typeof marked !== 'undefined') {
        const htmlContent = marked.parse(this.state.markdownContent);
        const result = this.generateTableOfContents(htmlContent);
        
        if (result && result.toc) {
          this.tocElement.innerHTML = result.toc;
          this.tocSidebar.style.display = 'block';
          this.contentElement.innerHTML = result.content;
          
          // Add smooth scroll behavior to TOC links
          this.addSmoothScrollToTOC();
          this.setupScrollSpy();
        } else {
          // No headings found, just show content without TOC
          this.tocElement.innerHTML = '';
          this.tocSidebar.style.display = 'none';
          this.contentElement.innerHTML = htmlContent;
        }
      } else {
        // Fallback: Load marked.js dynamically
        this.loadMarkedJS().then(() => {
          const htmlContent = marked.parse(this.state.markdownContent);
          const result = this.generateTableOfContents(htmlContent);
          
          if (result && result.toc) {
            this.tocElement.innerHTML = result.toc;
            this.tocSidebar.style.display = 'block';
            this.contentElement.innerHTML = result.content;
            
            // Add smooth scroll behavior to TOC links
            this.addSmoothScrollToTOC();
            this.setupScrollSpy();
          } else {
            // No headings found, just show content without TOC
            this.tocElement.innerHTML = '';
            this.tocSidebar.style.display = 'none';
            this.contentElement.innerHTML = htmlContent;
          }
        });
      }
    }
    
    this.hideLoading();
  }

  // Add smooth scroll behavior and active state to TOC links
  addSmoothScrollToTOC() {
    const tocLinks = this.tocElement.querySelectorAll('a[href^="#"]');
    
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const targetElement = this.contentElement.querySelector(`#${targetId}`);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Update active state
          tocLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          
          // Highlight effect
          targetElement.style.transition = 'all 0.3s ease';
          targetElement.style.background = 'rgba(100, 255, 218, 0.1)';
          targetElement.style.padding = '8px';
          targetElement.style.marginLeft = '-8px';
          targetElement.style.marginRight = '-8px';
          targetElement.style.borderRadius = '8px';
          
          setTimeout(() => {
            targetElement.style.background = 'transparent';
          }, 1500);
        }
      });
    });
  }

  // Setup scroll spy for TOC
  setupScrollSpy() {
    const headings = this.contentElement.querySelectorAll('[id^="heading-"]');
    const tocLinks = this.tocElement.querySelectorAll('a[data-target]');
    
    if (headings.length === 0 || tocLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach(link => {
            if (link.getAttribute('data-target') === id) {
              tocLinks.forEach(l => l.classList.remove('active'));
              link.classList.add('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-100px 0px -66%',
      threshold: 0
    });

    headings.forEach(heading => observer.observe(heading));
  }

  // Load marked.js library dynamically
  loadMarkedJS() {
    return new Promise((resolve, reject) => {
      if (typeof marked !== 'undefined') {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load marked.js'));
      document.head.appendChild(script);
    });
  }

  // Hide loading state and show content
  hideLoading() {
    if (this.loadingState && this.contentWrapper) {
      this.loadingState.style.display = 'none';
      this.contentWrapper.style.display = 'block';
    }
  }

  // Connected callback
  connectedCallback() {
    // Load marked.js when component is connected
    this.loadMarkedJS().catch(error => {
      console.error('Error loading marked.js:', error);
    });
    
    // If we already have data, update the UI
    if (this.state.markdownContent) {
      this.hideLoading();
    }
  }
}

// Register the custom element
customElements.define('markdown-blog-viewer', MarkdownBlogViewer);

// Wix Custom Element Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownBlogViewer;
}

// Global registration
if (typeof window !== 'undefined' && window.customElements) {
  window.MarkdownBlogViewer = MarkdownBlogViewer;
}
