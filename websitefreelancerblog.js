class MarkdownBlogViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      featuredImage: '',
      markdownContent: '',
      title: '',
      isLoading: true
    };

    this.markedLoaded = false;
    this.isMobile = false;
    this.initializeUI();
  }

  static get observedAttributes() {
    return ['cms-markdown-content', 'cms-featured-image', 'cms-title'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;

    if (name === 'cms-markdown-content') {
      this.state.markdownContent = newValue;
      // CRITICAL FIX: Render immediately, no delays
      this.updateContent();
    } else if (name === 'cms-featured-image') {
      this.state.featuredImage = newValue;
      this.updateFeaturedImage();
    } else if (name === 'cms-title') {
      this.state.title = newValue;
    }
  }

  initializeUI() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        * {
          box-sizing: border-box;
        }

        .blog-post-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #1E1E1E;
          min-height: 400px;
          display: flex;
          gap: 40px;
          align-items: flex-start;
        }

        /* Loading State - SIMPLIFIED */
        .loading-state {
          display: none; /* CRITICAL FIX: Don't show loading state to crawlers */
        }

        .error-state {
          display: none;
          padding: 20px;
          background-color: #ff4444;
          color: white;
          border-radius: 8px;
          margin: 20px;
        }

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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Content Wrapper */
        #blog-content-wrapper {
          display: flex;
          gap: 40px;
          width: 100%;
          position: relative;
        }

        /* Main Content Area */
        .main-content {
          flex: 1;
          min-width: 0;
          max-width: 900px;
        }

        /* Featured Image */
        .featured-image-container {
          width: 100%;
          margin-bottom: 40px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        .featured-image {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        /* SIDEBAR TABLE OF CONTENTS */
        .toc-sidebar {
          width: 280px;
          flex-shrink: 0;
          position: sticky;
          top: 20px;
          align-self: flex-start;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          animation: fadeIn 0.6s ease-out 0.4s both;
        }

        .table-of-contents {
          background: linear-gradient(135deg, #2d2d2d 0%, #252525 100%);
          border: 2px solid #3d3d3d;
          border-radius: 12px;
          padding: 28px 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .toc-title {
          font-size: 22px;
          font-weight: 700;
          color: #64FFDA;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: -0.5px;
        }

        .toc-icon {
          font-size: 24px;
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
          color: #b0b0b0;
          text-decoration: none;
          display: block;
          padding: 10px 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-left: 3px solid transparent;
          border-radius: 6px;
          font-size: 15px;
          line-height: 1.4;
        }

        .toc-list a:hover {
          color: #ffffff;
          background-color: rgba(100, 255, 218, 0.1);
          border-left-color: #64FFDA;
          transform: translateX(4px);
        }

        .toc-list a.active {
          color: #64FFDA;
          background-color: rgba(100, 255, 218, 0.15);
          border-left-color: #64FFDA;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(100, 255, 218, 0.2);
        }

        .toc-list .toc-level-1 {
          font-size: 17px;
          font-weight: 600;
        }

        .toc-list .toc-level-2 {
          font-size: 16px;
          padding-left: 12px;
        }

        .toc-list .toc-level-3 {
          font-size: 15px;
          padding-left: 24px;
        }

        .toc-list .toc-level-4 {
          font-size: 14px;
          padding-left: 36px;
        }

        .toc-list .toc-level-5,
        .toc-list .toc-level-6 {
          font-size: 13px;
          padding-left: 48px;
        }

        .toc-sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .toc-sidebar::-webkit-scrollbar-track {
          background: #2d2d2d;
          border-radius: 3px;
        }

        .toc-sidebar::-webkit-scrollbar-thumb {
          background: #64FFDA;
          border-radius: 3px;
        }

        .toc-sidebar::-webkit-scrollbar-thumb:hover {
          background: #52e8c8;
        }

        /* Blog Content */
        .blog-content {
          font-size: 18px;
          line-height: 1.8;
          color: #ffffff;
          animation: fadeInUp 0.8s ease-out 0.6s both;
        }

        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          font-weight: 700;
          line-height: 1.3;
          margin-top: 40px;
          margin-bottom: 20px;
          color: #64FFDA;
          letter-spacing: -0.01em;
          scroll-margin-top: 20px;
        }

        .blog-content h1 { font-size: clamp(32px, 4vw, 42px); margin-top: 60px; }
        .blog-content h2 { font-size: clamp(28px, 3.5vw, 36px); margin-top: 50px; }
        .blog-content h3 { font-size: clamp(24px, 3vw, 30px); }
        .blog-content h4 { font-size: clamp(20px, 2.5vw, 24px); }
        .blog-content h5 { font-size: clamp(18px, 2vw, 20px); }
        .blog-content h6 { font-size: clamp(16px, 1.8vw, 18px); }

        .blog-content p {
          margin-bottom: 24px;
          font-size: 18px;
          line-height: 1.8;
        }

        .blog-content a {
          color: #FFFF05;
          text-decoration: none;
          border-bottom: 1px solid #FFFF05;
          transition: all 0.3s ease;
        }

        .blog-content a:hover {
          color: #FFFF05;
          border-bottom-color: #FFFF05;
        }

        .blog-content strong,
        .blog-content b {
          font-weight: 700;
          color: #64FFDA;
        }

        .blog-content em,
        .blog-content i {
          font-style: italic;
        }

        .blog-content ul,
        .blog-content ol {
          margin-bottom: 24px;
          padding-left: 30px;
        }

        .blog-content li {
          margin-bottom: 12px;
          line-height: 1.8;
        }

        .blog-content ul li { list-style-type: disc; }
        .blog-content ol li { list-style-type: decimal; }

        .blog-content blockquote {
          margin: 30px 0;
          padding: 20px 30px;
          border-left: 4px solid #FFFF05;
          background-color: #2d2d2d;
          font-style: italic;
          color: #FFFF05;
          border-radius: 0 8px 8px 0;
        }

        .blog-content blockquote p {
          margin-bottom: 0;
        }

        .blog-content code {
          background-color: #2d2d2d;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #64FFDA;
        }

        .blog-content pre {
          background-color: #2d2d2d;
          color: #f8f8f2;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 30px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: #f8f8f2;
          font-size: 14px;
        }

        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 30px auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: block;
          background-color: #2d2d2d;
          padding: 4px;
        }

        .blog-content img + em {
          display: block;
          text-align: center;
          font-size: 14px;
          color: #999;
          margin-top: -20px;
          margin-bottom: 20px;
          font-style: italic;
        }

        .blog-content hr {
          border: none;
          border-top: 2px solid #3d3d3d;
          margin: 40px 0;
        }

        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          overflow: hidden;
          background-color: #2d2d2d;
          display: table !important;
        }

        .blog-content table th,
        .blog-content table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #3d3d3d;
          color: #ffffff;
        }

        .blog-content table thead { display: table-header-group !important; }
        .blog-content table tbody { display: table-row-group !important; }
        .blog-content table tr { display: table-row !important; }
        .blog-content table th { display: table-cell !important; }
        .blog-content table td { display: table-cell !important; }

        .blog-content table th {
          background-color: #1a1a1a;
          font-weight: 700;
          color: #64FFDA;
          border-bottom: 2px solid #64FFDA;
        }

        .blog-content table tbody tr {
          background-color: #2d2d2d;
        }

        .blog-content table tbody tr:nth-child(even) {
          background-color: #252525;
        }

        .blog-content table tr:last-child td {
          border-bottom: none;
        }

        .blog-content table tbody tr:hover {
          background-color: #333333;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .blog-post-container {
            flex-direction: column;
          }

          #blog-content-wrapper {
            flex-direction: column;
          }

          .toc-sidebar {
            position: relative;
            top: 0;
            width: 100%;
            max-width: 100%;
            max-height: none;
            margin-bottom: 40px;
            overflow-y: visible;
          }

          .main-content {
            max-width: 100%;
          }

          .table-of-contents {
            max-height: 400px;
            overflow-y: auto;
          }
        }

        @media (max-width: 768px) {
          .blog-post-container {
            padding: 30px 16px;
          }

          .featured-image-container {
            margin-bottom: 30px;
          }

          .blog-content {
            font-size: 16px;
          }

          .blog-content h1, .blog-content h2, .blog-content h3 {
            margin-top: 30px;
          }

          .table-of-contents {
            padding: 20px;
          }

          .toc-title {
            font-size: 20px;
          }

          .toc-list a {
            font-size: 14px;
            padding: 8px 10px;
          }

          .blog-content table {
            font-size: 14px;
            display: block !important;
            overflow-x: auto;
            white-space: nowrap;
          }
        }

        @media (max-width: 480px) {
          .blog-post-container {
            padding: 20px 12px;
          }

          .featured-image-container {
            margin-bottom: 24px;
          }

          .blog-content {
            font-size: 15px;
          }

          .table-of-contents {
            padding: 16px;
          }

          .toc-title {
            font-size: 18px;
          }

          .toc-list a {
            font-size: 13px;
            padding: 7px 8px;
          }

          .blog-content table th,
          .blog-content table td {
            padding: 8px 12px;
            font-size: 13px;
          }
        }
      </style>

      <div class="blog-post-container">
        <div class="loading-state" id="loading-state">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading blog post...</p>
        </div>

        <div class="error-state" id="error-state">
          <p>Error loading content. Please refresh the page.</p>
        </div>

        <div id="blog-content-wrapper">
          <!-- Sidebar TOC -->
          <aside class="toc-sidebar" id="toc-sidebar">
            <div id="table-of-contents"></div>
          </aside>

          <!-- Main Content -->
          <div class="main-content">
            <div class="featured-image-container" id="featured-image-container" style="display: none;">
              <img class="featured-image" id="featured-image" alt="Blog featured image" />
            </div>
            <div class="blog-content" id="blog-content"></div>
          </div>
        </div>
      </div>
    `;

    this.loadingState = this.shadowRoot.getElementById('loading-state');
    this.errorState = this.shadowRoot.getElementById('error-state');
    this.contentWrapper = this.shadowRoot.getElementById('blog-content-wrapper');
    this.featuredImageContainer = this.shadowRoot.getElementById('featured-image-container');
    this.featuredImageElement = this.shadowRoot.getElementById('featured-image');
    this.tocElement = this.shadowRoot.getElementById('table-of-contents');
    this.tocSidebar = this.shadowRoot.getElementById('toc-sidebar');
    this.contentElement = this.shadowRoot.getElementById('blog-content');
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth <= 1200;
    return this.isMobile;
  }

  preprocessMarkdownImages(markdown) {
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    return markdown.replace(imagePattern, (match, alt, url) => {
      return `<img src="${url}" alt="${alt}" loading="lazy" />`;
    });
  }

  fixImages() {
    const images = this.contentElement.querySelectorAll('img');
    
    images.forEach((img) => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      const originalSrc = img.getAttribute('src');
      if (originalSrc && (originalSrc.includes('wixstatic.com') || originalSrc.includes('unsplash.com'))) {
        img.setAttribute('crossorigin', 'anonymous');
      }
    });
  }

  generateTableOfContents(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      return { toc: '', content: htmlContent };
    }
    
    const tocItems = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent;
      const id = `heading-${index}`;
      
      heading.id = id;
      tocItems.push({ level, text, id });
    });
    
    const updatedContent = tempDiv.innerHTML;
    
    let tocHtml = `
      <div class="table-of-contents">
        <div class="toc-title">
          <span class="toc-icon">📑</span>
          Table of Contents
        </div>
        <ul class="toc-list">
    `;
    
    tocItems.forEach(item => {
      tocHtml += `<li class="toc-level-${item.level}"><a href="#${item.id}" data-heading-id="${item.id}">${item.text}</a></li>`;
    });
    
    tocHtml += `</ul></div>`;
    
    return { toc: tocHtml, content: updatedContent };
  }

  simpleMarkdownParse(markdown) {
    let html = markdown;
    
    html = this.parseMarkdownTables(html);
    
    const protectedImages = [];
    html = html.replace(/<img[^>]+>/g, (match) => {
      const placeholder = `___PROTECTED_IMAGE_${protectedImages.length}___`;
      protectedImages.push(match);
      return placeholder;
    });
    
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
    html = html.replace(/^######\s+(.*)$/gim, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.*)$/gim, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.*)$/gim, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.*)$/gim, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.*)$/gim, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.*)$/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*([^\*]+)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*([^\*]+)\*/gim, '<em>$1</em>');
    html = html.replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    
    protectedImages.forEach((img, index) => {
      html = html.replace(`___PROTECTED_IMAGE_${index}___`, img);
    });
    
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
  }

  parseMarkdownTables(markdown) {
    const lines = markdown.split('\n');
    let result = [];
    let inTable = false;
    let tableRows = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('|')) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
        const isSeparator = /^[\s\|:-]+$/.test(nextLine);
        
        if (!inTable && isSeparator) {
          inTable = true;
          const headerCells = cells.map(cell => `<th>${cell}</th>`).join('');
          tableRows.push(`<thead><tr>${headerCells}</tr></thead><tbody>`);
          i++;
        } else if (inTable && cells.length > 0) {
          const dataCells = cells.map(cell => `<td>${cell}</td>`).join('');
          tableRows.push(`<tr>${dataCells}</tr>`);
        } else if (!inTable) {
          result.push(line);
        }
      } else {
        if (inTable) {
          tableRows.push('</tbody>');
          result.push(`<table>${tableRows.join('')}</table>`);
          tableRows = [];
          inTable = false;
        }
        result.push(line);
      }
    }
    
    if (inTable) {
      tableRows.push('</tbody>');
      result.push(`<table>${tableRows.join('')}</table>`);
    }
    
    return result.join('\n');
  }

  updateFeaturedImage() {
    if (this.featuredImageElement && this.featuredImageContainer && this.state.featuredImage) {
      this.featuredImageElement.src = this.state.featuredImage;
      this.featuredImageContainer.style.display = 'block';
    }
  }

  // CRITICAL FIX: Simplified updateContent - renders immediately
  updateContent() {
    if (!this.contentElement || !this.state.markdownContent) {
      return;
    }

    let htmlContent;
    
    try {
      const preprocessed = this.preprocessMarkdownImages(this.state.markdownContent);
      
      // Try marked.js if available, otherwise use fallback
      if (window.marked) {
        if (typeof window.marked === 'function') {
          htmlContent = window.marked(preprocessed);
        } else if (window.marked.parse) {
          marked.use({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
          });
          htmlContent = marked.parse(preprocessed);
        } else {
          htmlContent = this.simpleMarkdownParse(preprocessed);
        }
      } else {
        // Use fallback parser immediately if marked.js not loaded
        htmlContent = this.simpleMarkdownParse(preprocessed);
      }
    } catch (error) {
      console.error('Parse error:', error);
      htmlContent = this.simpleMarkdownParse(this.preprocessMarkdownImages(this.state.markdownContent));
    }
    
    const result = this.generateTableOfContents(htmlContent);
    
    if (result.toc) {
      this.tocElement.innerHTML = result.toc;
      this.contentElement.innerHTML = result.content;
      this.addSmoothScrollToTOC();
      
      this.checkIfMobile();
      if (!this.isMobile) {
        this.initScrollSpy();
      }
    } else {
      this.tocElement.innerHTML = '';
      this.tocSidebar.style.display = 'none';
      this.contentElement.innerHTML = result.content;
    }
    
    // CRITICAL FIX: Apply image fixes synchronously
    this.fixImages();
  }

  initScrollSpy() {
    const headings = this.contentElement.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    const tocLinks = this.tocElement.querySelectorAll('a[data-heading-id]');
    
    if (headings.length === 0 || tocLinks.length === 0) {
      return;
    }
    
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -80% 0px',
      threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const headingId = entry.target.id;
          tocLinks.forEach(link => link.classList.remove('active'));
          const activeLink = this.tocElement.querySelector(`a[data-heading-id="${headingId}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    }, observerOptions);
    
    headings.forEach(heading => observer.observe(heading));
    this.scrollSpyObserver = observer;
  }

  addSmoothScrollToTOC() {
    const tocLinks = this.tocElement.querySelectorAll('a[href^="#"]');
    
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = this.contentElement.querySelector(`#${targetId}`);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          tocLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });
  }

  // CRITICAL FIX: Synchronous marked.js loading attempt
  loadMarkedJS() {
    if (window.marked) {
      this.markedLoaded = true;
      return;
    }
    
    // Try to load marked.js asynchronously, but don't wait for it
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
    script.async = true;
    
    script.onload = () => {
      this.markedLoaded = true;
    };
    
    document.head.appendChild(script);
  }

  connectedCallback() {
    // Start loading marked.js (non-blocking)
    this.loadMarkedJS();
    
    const cmsContent = this.getAttribute('cms-markdown-content');
    const cmsFeaturedImage = this.getAttribute('cms-featured-image');
    const cmsTitle = this.getAttribute('cms-title');
    
    if (cmsContent) {
      this.state.markdownContent = cmsContent;
      // CRITICAL FIX: Render immediately on connect
      this.updateContent();
    }
    
    if (cmsFeaturedImage) {
      this.state.featuredImage = cmsFeaturedImage;
      this.updateFeaturedImage();
    }

    if (cmsTitle) {
      this.state.title = cmsTitle;
    }
  }

  disconnectedCallback() {
    if (this.scrollSpyObserver) {
      this.scrollSpyObserver.disconnect();
    }
  }
}

customElements.define('markdown-blog-viewer', MarkdownBlogViewer);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownBlogViewer;
}

if (typeof window !== 'undefined' && window.customElements) {
  window.MarkdownBlogViewer = MarkdownBlogViewer;
}
