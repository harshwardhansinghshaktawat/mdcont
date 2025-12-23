class MarkdownBlogViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State management
    this.state = {
      title: '',
      featuredImage: '',
      markdownContent: '',
      isLoading: true
    };

    this.markedLoaded = false;
    this.initializeUI();
  }

  // CMS Integration - Observed attributes
  static get observedAttributes() {
    return ['cms-markdown-content'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log('Attribute changed:', name, 'Value:', newValue ? newValue.substring(0, 100) : 'empty');
    
    if (!newValue || oldValue === newValue) return;

    if (name === 'cms-markdown-content') {
      this.state.markdownContent = newValue;
      this.updateContent();
    }
  }

  // Initialize the UI components with beautiful, modern design
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
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #1E1E1E;
          min-height: 400px;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          flex-direction: column;
          gap: 20px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #64FFDA;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          color: #ffffff;
          font-size: 16px;
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

        /* Table of Contents */
        .table-of-contents {
          background-color: #2d2d2d;
          border: 2px solid #3d3d3d;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 40px;
          animation: fadeInUp 0.6s ease-out;
        }

        .toc-title {
          font-size: 20px;
          font-weight: 700;
          color: #64FFDA;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toc-icon {
          font-size: 22px;
        }

        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .toc-list li {
          margin-bottom: 8px;
        }

        .toc-list a {
          color: #ffffff;
          text-decoration: none;
          display: block;
          padding: 6px 0;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          padding-left: 12px;
        }

        .toc-list a:hover {
          color: #64FFDA;
          border-left-color: #64FFDA;
          padding-left: 16px;
          background-color: rgba(100, 255, 218, 0.05);
        }

        .toc-list .toc-level-2 {
          padding-left: 12px;
        }

        .toc-list .toc-level-3 {
          padding-left: 32px;
          font-size: 15px;
        }

        .toc-list .toc-level-4 {
          padding-left: 48px;
          font-size: 14px;
        }

        .toc-list .toc-level-5,
        .toc-list .toc-level-6 {
          padding-left: 64px;
          font-size: 13px;
        }

        /* Blog Content */
        .blog-content {
          font-size: 18px;
          line-height: 1.8;
          color: #ffffff;
          animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        /* Markdown Styling */
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
        }

        .blog-content h1 {
          font-size: clamp(32px, 4vw, 42px);
          margin-top: 60px;
        }

        .blog-content h2 {
          font-size: clamp(28px, 3.5vw, 36px);
          margin-top: 50px;
        }

        .blog-content h3 {
          font-size: clamp(24px, 3vw, 30px);
        }

        .blog-content h4 {
          font-size: clamp(20px, 2.5vw, 24px);
        }

        .blog-content h5 {
          font-size: clamp(18px, 2vw, 20px);
        }

        .blog-content h6 {
          font-size: clamp(16px, 1.8vw, 18px);
        }

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

        .blog-content ul li {
          list-style-type: disc;
        }

        .blog-content ol li {
          list-style-type: decimal;
        }

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
          margin: 30px 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: block;
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
        }

        .blog-content table th,
        .blog-content table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #3d3d3d;
        }

        .blog-content table th {
          background-color: #2d2d2d;
          font-weight: 700;
          color: #64FFDA;
        }

        .blog-content table tr:last-child td {
          border-bottom: none;
        }

        .blog-content table tr:hover {
          background-color: #2d2d2d;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .blog-post-container {
            padding: 30px 16px;
          }

          .blog-content {
            font-size: 16px;
          }

          .blog-content h1,
          .blog-content h2,
          .blog-content h3 {
            margin-top: 30px;
          }

          .table-of-contents {
            padding: 20px;
            margin-bottom: 30px;
          }

          .toc-title {
            font-size: 18px;
          }

          .toc-list a {
            font-size: 15px;
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
          .blog-post-container {
            padding: 20px 12px;
          }

          .blog-content {
            font-size: 15px;
          }

          .table-of-contents {
            padding: 16px;
          }

          .toc-title {
            font-size: 16px;
          }

          .toc-list a {
            font-size: 14px;
          }

          .blog-content table {
            font-size: 14px;
          }

          .blog-content table th,
          .blog-content table td {
            padding: 8px 12px;
          }
        }

        /* Print Styles */
        @media print {
          .blog-post-container {
            max-width: 100%;
            padding: 0;
          }

          .featured-image-container {
            box-shadow: none;
          }

          .blog-content a {
            color: #000;
            border-bottom: none;
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

        <div id="blog-content-wrapper" style="display: none;">
          <div id="table-of-contents"></div>
          <div class="blog-content" id="blog-content"></div>
        </div>
      </div>
    `;

    // Get DOM references
    this.loadingState = this.shadowRoot.getElementById('loading-state');
    this.errorState = this.shadowRoot.getElementById('error-state');
    this.contentWrapper = this.shadowRoot.getElementById('blog-content-wrapper');
    this.tocElement = this.shadowRoot.getElementById('table-of-contents');
    this.contentElement = this.shadowRoot.getElementById('blog-content');
  }

  // Generate Table of Contents from headings
  generateTableOfContents(htmlContent) {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find all headings (h1-h6)
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      return {
        toc: '',
        content: htmlContent
      };
    }
    
    // Generate unique IDs for each heading and build TOC
    const tocItems = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent;
      const id = `heading-${index}`;
      
      heading.id = id;
      
      tocItems.push({
        level: level,
        text: text,
        id: id
      });
    });
    
    const updatedContent = tempDiv.innerHTML;
    
    // Build TOC HTML
    let tocHtml = `
      <div class="table-of-contents">
        <div class="toc-title">
          <span class="toc-icon">📑</span>
          Table of Contents
        </div>
        <ul class="toc-list">
    `;
    
    tocItems.forEach(item => {
      tocHtml += `
        <li class="toc-level-${item.level}">
          <a href="#${item.id}">${item.text}</a>
        </li>
      `;
    });
    
    tocHtml += `
        </ul>
      </div>
    `;
    
    return {
      toc: tocHtml,
      content: updatedContent
    };
  }

  // Parse markdown to HTML (simple fallback if marked.js fails)
  simpleMarkdownParse(markdown) {
    let html = markdown;
    
    // Images - Must come before links
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
    
    // Headers (must be on their own line)
    html = html.replace(/^######\s+(.*)$/gim, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.*)$/gim, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.*)$/gim, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.*)$/gim, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.*)$/gim, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.*)$/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*([^\*]+)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/gim, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^\*]+)\*/gim, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/gim, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    
    // Line breaks and paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
  }

  // Update content with Markdown rendering and automatic TOC
  updateContent() {
    console.log('updateContent called, content length:', this.state.markdownContent.length);
    
    if (!this.contentElement || !this.tocElement) {
      console.error('Content elements not found');
      return;
    }

    if (!this.state.markdownContent) {
      console.log('No markdown content available');
      this.showError('No content available');
      return;
    }

    // Wait for marked to be loaded
    this.loadMarkedJS()
      .then(() => {
        console.log('Marked.js loaded, parsing content...');
        let htmlContent;
        
        // Try to use marked, fall back to simple parser
        try {
          if (window.marked && window.marked.parse) {
            // Configure marked options
            if (window.marked.setOptions) {
              window.marked.setOptions({
                breaks: true,
                gfm: true
              });
            }
            // eslint-disable-next-line no-undef
            htmlContent = marked.parse(this.state.markdownContent);
            console.log('Parsed with marked.js');
          } else {
            console.warn('marked.parse not available, using fallback parser');
            htmlContent = this.simpleMarkdownParse(this.state.markdownContent);
          }
        } catch (error) {
          console.error('Error parsing markdown:', error);
          htmlContent = this.simpleMarkdownParse(this.state.markdownContent);
        }
        
        const result = this.generateTableOfContents(htmlContent);
        
        if (result.toc) {
          this.tocElement.innerHTML = result.toc;
          this.contentElement.innerHTML = result.content;
          this.addSmoothScrollToTOC();
        } else {
          this.tocElement.innerHTML = '';
          this.contentElement.innerHTML = result.content;
        }
        
        console.log('Content updated successfully');
        this.hideLoading();
      })
      .catch(error => {
        console.error('Error in updateContent:', error);
        // Use fallback parser
        const htmlContent = this.simpleMarkdownParse(this.state.markdownContent);
        const result = this.generateTableOfContents(htmlContent);
        
        if (result.toc) {
          this.tocElement.innerHTML = result.toc;
          this.contentElement.innerHTML = result.content;
        } else {
          this.tocElement.innerHTML = '';
          this.contentElement.innerHTML = result.content;
        }
        
        this.hideLoading();
      });
  }

  // Add smooth scroll behavior to TOC links
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
          
          targetElement.style.transition = 'background-color 0.3s ease';
          targetElement.style.backgroundColor = 'rgba(100, 255, 218, 0.1)';
          targetElement.style.padding = '8px';
          targetElement.style.marginLeft = '-8px';
          targetElement.style.marginRight = '-8px';
          targetElement.style.borderRadius = '4px';
          
          setTimeout(() => {
            targetElement.style.backgroundColor = 'transparent';
          }, 1500);
        }
      });
    });
  }

  // Load marked.js library dynamically
  loadMarkedJS() {
    return new Promise((resolve, reject) => {
      if (window.marked && window.marked.parse) {
        console.log('marked.js already loaded');
        this.markedLoaded = true;
        resolve();
        return;
      }
      
      console.log('Loading marked.js from CDN...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
      script.async = true;
      script.onload = () => {
        console.log('marked.js loaded successfully');
        this.markedLoaded = true;
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load marked.js:', error);
        reject(new Error('Failed to load marked.js'));
      };
      document.head.appendChild(script);
    });
  }

  // Show error state
  showError(message) {
    if (this.errorState) {
      this.errorState.textContent = message;
      this.errorState.style.display = 'block';
    }
    if (this.loadingState) {
      this.loadingState.style.display = 'none';
    }
  }

  // Hide loading state and show content
  hideLoading() {
    console.log('Hiding loading state');
    if (this.loadingState && this.contentWrapper) {
      this.loadingState.style.display = 'none';
      this.contentWrapper.style.display = 'block';
    }
  }

  // Connected callback
  connectedCallback() {
    console.log('Custom element connected to DOM');
    
    // Load marked.js when component is connected
    this.loadMarkedJS().catch(error => {
      console.error('Error loading marked.js:', error);
    });
    
    // Check if we have content from attributes
    const cmsContent = this.getAttribute('cms-markdown-content');
    console.log('Initial cms-markdown-content:', cmsContent ? cmsContent.substring(0, 100) : 'not set');
    
    if (cmsContent) {
      this.state.markdownContent = cmsContent;
      this.updateContent();
    }
  }
}

// Register the custom element for Wix
customElements.define('markdown-blog-viewer', MarkdownBlogViewer);

// Wix Custom Element Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownBlogViewer;
}

// Global registration for Wix environment
if (typeof window !== 'undefined' && window.customElements) {
  window.MarkdownBlogViewer = MarkdownBlogViewer;
}
